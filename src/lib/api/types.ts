/**
 * API Layer Types — ConceptTwin
 *
 * Typed Zod schemas for the POST /api/session request payload and
 * the clean JSON response returned to the browser.
 *
 * SECURITY PRINCIPLE:
 *   The response types deliberately omit internal fields that must
 *   never reach the browser:
 *     - ground-truth answers for the current or twin problem
 *     - internal reasoning/prompts
 *     - GEMINI_API_KEY or any other credential
 *     - raw LangGraph state internals (e.g. twinCycleCount reducer details)
 */

import { z } from 'zod';

// ============================================================================
// Inbound: POST /api/session — request body
// ============================================================================

/**
 * Stage A — student is attempting a seed problem for the first time.
 */
export const SeedAttemptPayloadSchema = z.object({
  stage: z.literal('seed'),
  /** problemId from the physics knowledge layer (e.g. "prob-fbd-01") */
  problemId: z.string().min(1),
  /** Raw step-by-step working the student wrote out */
  working: z.string().min(1, 'Working cannot be empty'),
  /** Student's stated final answer (number or numeric string) */
  finalAnswer: z.union([
    z.number(),
    z.string().min(1, 'Final answer cannot be empty'),
  ]),
  /**
   * Optional session ID for correlating logs across requests.
   * If omitted the server generates one.
   */
  sessionId: z.string().optional(),
});

export type SeedAttemptPayload = z.infer<typeof SeedAttemptPayloadSchema>;

/**
 * Stage B — student is attempting the AI-generated twin problem.
 * The client must echo the twinId so the server can locate the twin's
 * ground-truth answer from the graph result stored server-side.
 * We do NOT trust the client to supply the correct answer.
 */
export const TwinAttemptPayloadSchema = z.object({
  stage: z.literal('twin'),
  /** The twinId returned by the stage-A response */
  twinId: z.string().min(1),
  /** The original problemId — used to reload the concept context */
  problemId: z.string().min(1),
  /** Student's working on the twin problem */
  working: z.string().min(1, 'Working cannot be empty'),
  /** Student's stated final answer for the twin */
  finalAnswer: z.union([
    z.number(),
    z.string().min(1, 'Final answer cannot be empty'),
  ]),
  /** Session ID from stage-A response */
  sessionId: z.string().optional(),
  /**
   * The full twin problem object returned from stage A.
   * The server validates this against the twinId to prevent tampering.
   * The client holds this in memory but cannot modify the ground truth.
   */
  twinProblem: z.object({
    twinId: z.string(),
    conceptId: z.string(),
    question: z.string(),
    correctAnswer: z.union([z.number(), z.string()]).optional(),
    unit: z.string(),
    reasoning: z.string().optional(),
    twinRationale: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
  }),
});

export type TwinAttemptPayload = z.infer<typeof TwinAttemptPayloadSchema>;

/** Union of both valid request payloads */
export const SessionPayloadSchema = z.discriminatedUnion('stage', [
  SeedAttemptPayloadSchema,
  TwinAttemptPayloadSchema,
]);

export type SessionPayload = z.infer<typeof SessionPayloadSchema>;

// ============================================================================
// Outbound: POST /api/session — response body (browser-safe)
// ============================================================================

/**
 * Browser-safe evaluation result.
 * The expectedAnswer is INCLUDED here — it is intentionally revealed
 * after the student has submitted their attempt.
 */
export interface ApiEvaluationResult {
  isCorrect: boolean;
  hasCorrectReasoning: boolean;
  studentAnswer: number | string;
  expectedAnswer: number | string;
  identifiedMistakes: string[];
  score: number;
  summary: string;
}

/**
 * Browser-safe diagnosis result.
 * The full remediationStrategy is omitted — it is an internal prompt directive.
 */
export interface ApiDiagnosisResult {
  misconceptionType: string;
  conceptualGap: string;
  deepStructureFailure: string;
  isSurfacePatternMatcher: boolean;
  confidence: number;
}

/**
 * Browser-safe twin problem.
 * correctAnswer and reasoning are OMITTED — they are ground truth and
 * must not be exposed before the student attempts the twin.
 */
export interface ApiTwinProblem {
  twinId: string;
  conceptId: string;
  question: string;
  unit: string;
  twinRationale: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * Browser-safe verification / transfer result.
 */
export interface ApiVerificationResult {
  studentTransferred?: boolean;
  twinAttemptScore?: number;
  transferFeedback?: string;
  issues: string[];
}

/**
 * Unified response sent to the browser.
 * All fields are optional — only the fields relevant to the current stage
 * will be populated.
 */
export interface SessionApiResponse {
  ok: true;
  sessionId: string;
  stage: 'seed' | 'twin';
  masteryLevel: 'unknown' | 'surface' | 'developing' | 'mastered' | 'needs_remediation';
  nextAction: 'mastered' | 'show_twin' | 'twin_accepted' | 'remediation' | 'error';

  /** Present for both stage A and B */
  evaluation?: ApiEvaluationResult;

  /** Present when stage = 'seed' and student did not achieve mastery */
  diagnosis?: ApiDiagnosisResult;

  /**
   * Present when a twin was generated (stage = 'seed', non-mastery path).
   * Ground-truth answer and reasoning are STRIPPED before sending.
   */
  twin?: ApiTwinProblem;

  /**
   * Present when stage = 'twin' — the transfer assessment result.
   */
  verification?: ApiVerificationResult;
}

/**
 * Error response sent to the browser on any failure.
 * NEVER exposes stack traces, GEMINI_API_KEY, or other internals.
 */
export interface SessionApiError {
  ok: false;
  error: string;
  code: 'BAD_REQUEST' | 'NOT_FOUND' | 'INTERNAL_ERROR' | 'TIMEOUT';
}

export type SessionApiResult = SessionApiResponse | SessionApiError;
