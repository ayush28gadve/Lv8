/**
 * Evaluator Agent Node — ConceptTwin
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
  // ── Guard ─────────────────────────────────────────────────────────────────
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
    // Build prompt (not used in stub; will be passed to Gemini in Phase 2B).
    // Prefixed with void to satisfy ESLint no-unused-vars in stub mode.
    void buildEvaluatorPrompt({
      question: state.currentProblem.question,
      correctAnswer: state.currentProblem.correctAnswer,
      unit: state.currentProblem.unit,
      correctReasoning: state.currentProblem.reasoning,
      studentWorking: state.studentWorking,
      studentFinalAnswer: state.studentFinalAnswer,
    });

    // TODO (Phase 2B): Replace with actual Gemini call once API key is configured.
    // TODO (Phase 2B): Add retry logic with exponential backoff for transient failures.
    //
    // const rawResult = await generateJSON<EvaluationResult>(
    //   `${system}\n\n${user}`,
    //   { systemInstruction: system }
    // );

    // ── Stub output for Phase 2A build verification ───────────────────────
    // This stub simulates a realistic evaluator response so the rest of the
    // graph can be wired and tested end-to-end without a live API key.
    const rawResult: EvaluationResult = {
      isCorrect: false,
      hasCorrectReasoning: false,
      studentAnswer: state.studentFinalAnswer,
      expectedAnswer: state.currentProblem.correctAnswer,
      identifiedMistakes: [
        'TODO: Populate via Gemini API call in Phase 2B.',
      ],
      score: 0,
      summary: 'TODO: Evaluator stub — replace with Gemini response.',
    };

    // Reference generateJSON to prevent "unused import" lint warnings.
    void generateJSON;

    // ── Validate via Zod ──────────────────────────────────────────────────
    const evaluation = EvaluationResultSchema.parse(rawResult);

    // ── Derive mastery level from evaluation ──────────────────────────────
    const masteryLevel = evaluation.isCorrect && evaluation.hasCorrectReasoning
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
