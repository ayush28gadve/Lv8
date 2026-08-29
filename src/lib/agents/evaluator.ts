/**
 * Evaluator Agent Node — ConceptTwin (Phase 2B: Live Gemini)
 *
 * Responsibility:
 *   Assess whether the student's final answer AND reasoning are correct for
 *   the current problem. The result determines the routing decision at the
 *   first conditional edge: mastery vs. diagnosis path.
 *
 * Input consumed from graph state:
 *   - currentProblem     (the seed problem)
 *   - studentWorking     (raw step-by-step working text)
 *   - studentFinalAnswer (student's stated answer)
 *
 * Output written to graph state:
 *   - evaluation         (EvaluationResult)
 *   - masteryLevel       (updated based on evaluation)
 */

import { generateJSON } from '@/lib/ai/gemini';
import {
  EvaluationResultSchema,
  type EvaluationResult,
} from '@/lib/ai/schemas';
import { buildEvaluatorPrompt } from '@/lib/ai/prompts';
import type { GraphStateType } from '@/lib/orchestration/state';

// ---------------------------------------------------------------------------
// Safe JSON extraction with retry
// ---------------------------------------------------------------------------

/**
 * Attempt to call Gemini and parse structured JSON with up to `maxAttempts`.
 * On parse failure, retries with slightly higher temperature to break repetition.
 */
async function callGeminiWithRetry<T>(
  userPrompt: string,
  systemPrompt: string,
  maxAttempts = 3
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await generateJSON<T>(userPrompt, {
        systemInstruction: systemPrompt,
        temperature: 0.2 + attempt * 0.1,
        maxOutputTokens: 1024,
      });
    } catch (err) {
      lastError = err;
      // Continue to retry
    }
  }
  throw lastError;
}

// ---------------------------------------------------------------------------
// Node implementation
// ---------------------------------------------------------------------------

/**
 * LangGraph node function: evaluatorNode
 *
 * Returns a partial state update. LangGraph merges this with the current state
 * using the channel reducers defined in state.ts.
 */
export async function evaluatorNode(
  state: GraphStateType
): Promise<Partial<GraphStateType>> {
  // ── Guards ────────────────────────────────────────────────────────────────
  if (!state.currentProblem) {
    return {
      lastError: 'evaluatorNode: currentProblem is null. Cannot evaluate.',
    };
  }
  if (state.studentWorking === null || state.studentFinalAnswer === null) {
    return {
      lastError:
        'evaluatorNode: studentWorking or studentFinalAnswer is missing.',
    };
  }

  try {
    // ── Build prompt ──────────────────────────────────────────────────────
    const { system, user } = buildEvaluatorPrompt({
      question: state.currentProblem.question,
      correctAnswer: state.currentProblem.correctAnswer,
      unit: state.currentProblem.unit,
      correctReasoning: state.currentProblem.reasoning,
      studentWorking: state.studentWorking,
      studentFinalAnswer: state.studentFinalAnswer,
    });

    // ── Call Gemini ───────────────────────────────────────────────────────
    const rawResult = await callGeminiWithRetry<EvaluationResult>(
      user,
      system
    );

    // ── Validate via Zod ──────────────────────────────────────────────────
    const evaluation = EvaluationResultSchema.parse(rawResult);

    // ── Derive mastery level from evaluation ──────────────────────────────
    // Three cases:
    //   1. Correct answer + correct reasoning → mastered
    //   2. Correct answer but flawed reasoning → surface pattern-matcher
    //   3. Wrong answer → developing or needs remediation
    const masteryLevel =
      evaluation.isCorrect && evaluation.hasCorrectReasoning
        ? 'mastered'
        : evaluation.isCorrect && !evaluation.hasCorrectReasoning
          ? 'surface'
          : 'developing';

    return {
      evaluation,
      masteryLevel,
      lastError: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { lastError: `evaluatorNode error: ${message}` };
  }
}
