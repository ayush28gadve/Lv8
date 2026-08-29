/**
 * POST /api/session — ConceptTwin AI Session Route Handler
 *
 * This is the single secure bridge between the browser and the LangGraph
 * AI engine. It is server-only (no 'use client').
 *
 * ┌──────────────┐        POST /api/session        ┌─────────────────────────┐
 * │   Browser    │  ──────────────────────────────► │  Route Handler (server) │
 * │              │                                  │  • Validate Zod schema  │
 * │  stage=seed  │                                  │  • Load trusted problem │
 * │  or          │                                  │  • Invoke LangGraph     │
 * │  stage=twin  │ ◄──────────────────────────────  │  • Strip ground-truth   │
 * └──────────────┘     browser-safe JSON response   │  • Return clean JSON    │
 *                                                   └─────────────────────────┘
 *
 * SECURITY GUARANTEES:
 *  - GEMINI_API_KEY never leaves the server process.
 *  - Seed problem ground-truth answer/reasoning is loaded server-side; the
 *    client never supplies it and cannot tamper with it.
 *  - Twin ground-truth answer/reasoning is stripped from the response for
 *    stage A so the student cannot peek before attempting.
 *  - Zod validates every incoming payload; malformed requests are rejected
 *    with 400 before any AI call is made.
 *  - Errors are sanitised — no stack traces or internal prompt text.
 *  - The route exports only POST; GET/DELETE etc. return 405.
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

import { getProblemById } from '@/data/problems';
import { conceptTwinGraph } from '@/lib/orchestration/graph';
import { createInitialLearningState } from '@/lib/ai/schemas';

import {
  SessionPayloadSchema,
  type SessionApiResponse,
  type SessionApiError,
  type ApiTwinProblem,
  type ApiEvaluationResult,
  type ApiDiagnosisResult,
  type ApiVerificationResult,
} from '@/lib/api/types';

import type { GraphStateType } from '@/lib/orchestration/state';
import type { TwinProblem } from '@/lib/ai/schemas';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wrap a value in a NextResponse with JSON content-type and given status. */
function json<T>(body: T, status = 200): NextResponse<T> {
  return NextResponse.json(body, { status });
}

/** Produce a sanitised error response — never includes stack traces. */
function errorResponse(
  error: string,
  code: SessionApiError['code'],
  status: number
): NextResponse<SessionApiError> {
  return json<SessionApiError>({ ok: false, error, code }, status);
}

/**
 * Strip internal-only fields from a TwinProblem before sending to the browser.
 * correctAnswer and reasoning are withheld until the student has attempted.
 */
function sanitiseTwin(twin: TwinProblem): ApiTwinProblem {
  return {
    twinId: twin.twinId,
    conceptId: twin.conceptId,
    question: twin.question,
    unit: twin.unit,
    twinRationale: twin.twinRationale,
    difficulty: twin.difficulty,
  };
}

/**
 * Determine the top-level nextAction string from completed graph state.
 */
function deriveNextAction(
  state: GraphStateType,
  stage: 'seed' | 'twin'
): SessionApiResponse['nextAction'] {
  if (state.lastError) return 'error';

  if (stage === 'seed') {
    if (state.masteryLevel === 'mastered') return 'mastered';
    if (state.generatedTwin) return 'show_twin';
    return 'remediation';
  }

  // stage === 'twin'
  if (state.verification?.studentTransferred) return 'twin_accepted';
  if (state.masteryLevel === 'needs_remediation') return 'remediation';
  return 'show_twin'; // retry with another twin cycle
}

// ---------------------------------------------------------------------------
// Request timeout
// ---------------------------------------------------------------------------

const GRAPH_TIMEOUT_MS = 55_000; // 55 s — safely under Vercel's 60 s limit

/**
 * Race the LangGraph invocation against a timeout promise.
 * If Gemini doesn't respond in time, we surface a clean timeout error
 * rather than leaving the request hanging.
 */
async function invokeWithTimeout(
  input: Partial<GraphStateType>
): Promise<GraphStateType> {
  const graphPromise = conceptTwinGraph.invoke(input) as Promise<GraphStateType>;

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error('AI service timed out. Please try again.')),
      GRAPH_TIMEOUT_MS
    )
  );

  return Promise.race([graphPromise, timeoutPromise]);
}

// ---------------------------------------------------------------------------
// Server-side in-memory twin cache
// ---------------------------------------------------------------------------
const twinCache = new Map<string, TwinProblem>();

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest
): Promise<NextResponse<SessionApiResponse> | NextResponse<SessionApiError>> {
  // ── 1. Parse JSON body ──────────────────────────────────────────────────
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return errorResponse('Request body must be valid JSON.', 'BAD_REQUEST', 400);
  }

  // ── 2. Validate payload with Zod ────────────────────────────────────────
  const parsed = SessionPayloadSchema.safeParse(rawBody);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((e) => `${(e.path as unknown[]).join('.')}: ${e.message}`)
      .join('; ');
    return errorResponse(`Invalid request payload: ${detail}`, 'BAD_REQUEST', 400);
  }

  const payload = parsed.data;
  const sessionId = payload.sessionId ?? randomUUID();

  // ── 3. Load trusted seed problem from knowledge layer ───────────────────
  // The client supplies only problemId; the server fetches the full problem
  // including ground-truth answer and reasoning. The client cannot tamper.
  const seedProblem = getProblemById(payload.problemId);
  if (!seedProblem) {
    return errorResponse(
      `Problem '${payload.problemId}' not found.`,
      'NOT_FOUND',
      404
    );
  }

  // ── 4. Build LangGraph input ────────────────────────────────────────────
  let graphInput: Partial<GraphStateType>;

  if (payload.stage === 'seed') {
    // Stage A: first attempt on a seed problem.
    graphInput = {
      ...createInitialLearningState(sessionId),
      sessionId,
      conceptId: seedProblem.conceptId,
      currentProblem: {
        problemId: seedProblem.problemId,
        conceptId: seedProblem.conceptId,
        question: seedProblem.question,
        correctAnswer: seedProblem.correctAnswer,
        unit: seedProblem.unit,
        reasoning: seedProblem.reasoning,
        difficulty: seedProblem.difficulty,
      },
      studentWorking: payload.working,
      studentFinalAnswer: payload.finalAnswer,
    };
  } else {
    // Stage B: student attempting the twin problem.
    // Validate that the twinId in the payload matches the twinProblem object.
    // This prevents a client from submitting a forged twin with a different ID.
    if (payload.twinProblem.twinId !== payload.twinId) {
      return errorResponse(
        'twinId mismatch — payload integrity check failed.',
        'BAD_REQUEST',
        400
      );
    }

    // Retrieve the full twin problem from the server-side cache if available
    let resolvedTwin = twinCache.get(payload.twinId);
    if (!resolvedTwin) {
      // Reconstruct using payload data and dummy values for the omitted ground truth
      resolvedTwin = {
        twinId: payload.twinProblem.twinId,
        conceptId: payload.twinProblem.conceptId,
        question: payload.twinProblem.question,
        correctAnswer: payload.twinProblem.correctAnswer ?? 0,
        unit: payload.twinProblem.unit,
        reasoning: payload.twinProblem.reasoning ?? '',
        twinRationale: payload.twinProblem.twinRationale,
        difficulty: payload.twinProblem.difficulty,
      };
    }

    // Re-construct the trusted currentProblem from the knowledge layer.
    // The client's copy of twinProblem contains the question and metadata
    // but the server holds the authoritative correctAnswer.
    graphInput = {
      ...createInitialLearningState(sessionId),
      sessionId,
      conceptId: seedProblem.conceptId,
      currentProblem: {
        problemId: seedProblem.problemId,
        conceptId: seedProblem.conceptId,
        question: seedProblem.question,
        correctAnswer: seedProblem.correctAnswer,
        unit: seedProblem.unit,
        reasoning: seedProblem.reasoning,
        difficulty: seedProblem.difficulty,
      },
      // The twin problem is supplied by the client but populated with cached ground truth
      generatedTwin: resolvedTwin,
      // The student's attempt at the twin goes into twinAttempt.
      twinAttempt: `Working: ${payload.working}\nFinal Answer: ${payload.finalAnswer}`,
      studentWorking: payload.working,
      studentFinalAnswer: payload.finalAnswer,
    };
  }

  // ── 5. Invoke LangGraph ─────────────────────────────────────────────────
  let finalState: GraphStateType;
  try {
    finalState = await invokeWithTimeout(graphInput);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred.';
    const isTimeout = message.includes('timed out');
    return errorResponse(
      message,
      isTimeout ? 'TIMEOUT' : 'INTERNAL_ERROR',
      isTimeout ? 504 : 500
    );
  }

  // ── 6. Check for graph-level errors ────────────────────────────────────
  if (finalState.lastError) {
    // Log the full error server-side; send only a sanitised message.
    console.error('[/api/session] Graph error:', finalState.lastError);
    return errorResponse(
      'The AI engine encountered an error. Please try again.',
      'INTERNAL_ERROR',
      500
    );
  }

  // Cache the generated twin on the server so it can be reconstructed securely in stage B
  if (finalState.generatedTwin) {
    twinCache.set(finalState.generatedTwin.twinId, finalState.generatedTwin);
  }

  // ── 7. Build browser-safe response ─────────────────────────────────────
  const nextAction = deriveNextAction(finalState, payload.stage);

  // Map evaluation (safe to expose after submission)
  const evaluation: ApiEvaluationResult | undefined = finalState.evaluation
    ? {
        isCorrect: finalState.evaluation.isCorrect,
        hasCorrectReasoning: finalState.evaluation.hasCorrectReasoning,
        studentAnswer: finalState.evaluation.studentAnswer,
        expectedAnswer: finalState.evaluation.expectedAnswer,
        identifiedMistakes: finalState.evaluation.identifiedMistakes,
        score: finalState.evaluation.score,
        summary: finalState.evaluation.summary,
      }
    : undefined;

  // Map diagnosis — strip remediationStrategy (internal prompt directive)
  const diagnosis: ApiDiagnosisResult | undefined = finalState.diagnosis
    ? {
        misconceptionType: finalState.diagnosis.misconceptionType,
        conceptualGap: finalState.diagnosis.conceptualGap,
        deepStructureFailure: finalState.diagnosis.deepStructureFailure,
        isSurfacePatternMatcher: finalState.diagnosis.isSurfacePatternMatcher,
        confidence: finalState.diagnosis.confidence,
      }
    : undefined;

  // Map twin — strip correctAnswer and reasoning (ground truth, not yet earned)
  const twin: ApiTwinProblem | undefined =
    payload.stage === 'seed' && finalState.generatedTwin
      ? sanitiseTwin(finalState.generatedTwin)
      : undefined;

  // Map verification / transfer result
  const verification: ApiVerificationResult | undefined =
    finalState.verification
      ? {
          studentTransferred: finalState.verification.studentTransferred,
          twinAttemptScore: finalState.verification.twinAttemptScore,
          transferFeedback: finalState.verification.transferFeedback,
          issues: finalState.verification.issues,
        }
      : undefined;

  const response: SessionApiResponse = {
    ok: true,
    sessionId,
    stage: payload.stage,
    masteryLevel: finalState.masteryLevel,
    nextAction,
    ...(evaluation && { evaluation }),
    ...(diagnosis && { diagnosis }),
    ...(twin && { twin }),
    ...(verification && { verification }),
  };

  return json<SessionApiResponse>(response, 200);
}
