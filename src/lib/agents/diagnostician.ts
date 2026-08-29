/**
 * Diagnostician Agent Node — ConceptTwin
 *
 * Responsibility:
 *   Perform deep root-cause analysis of the student's conceptual error.
 *   Goes beyond identifying the wrong answer to pinpointing WHICH part of
 *   the deep structure the student has misunderstood.
 *
 * Input consumed from graph state:
 *   - currentProblem  (for question context)
 *   - evaluation      (evaluator output: mistakes & summary)
 *   - studentWorking  (student's raw reasoning steps)
 *   - conceptId       (to retrieve concept metadata for context)
 *
 * Output written to graph state:
 *   - diagnosis       (DiagnosisResult)
 */

import { generateJSON } from '@/lib/ai/gemini';
import {
  DiagnosisResultSchema,
  type DiagnosisResult,
} from '@/lib/ai/schemas';
import { buildDiagnosticianPrompt } from '@/lib/ai/prompts';
import { getConceptById } from '@/data/concepts';
import type { ConceptId } from '@/types/physics';
import type { GraphStateType } from '@/lib/orchestration/state';

// ---------------------------------------------------------------------------
// Node implementation
// ---------------------------------------------------------------------------

/**
 * LangGraph node function: diagnosticianNode
 */
export async function diagnosticianNode(
  state: GraphStateType
): Promise<Partial<GraphStateType>> {
  // ── Guards ────────────────────────────────────────────────────────────────
  if (!state.currentProblem) {
    return { lastError: 'diagnosticianNode: currentProblem is null.' };
  }
  if (!state.evaluation) {
    return { lastError: 'diagnosticianNode: evaluation is missing. Run evaluatorNode first.' };
  }
  if (!state.conceptId) {
    return { lastError: 'diagnosticianNode: conceptId is null.' };
  }

  const concept = getConceptById(state.conceptId as ConceptId);
  if (!concept) {
    return {
      lastError: `diagnosticianNode: concept '${state.conceptId}' not found in knowledge base.`,
    };
  }

  try {
    // ── Build prompt ─────────────────────────────────────────────────────────
    const { system, user } = buildDiagnosticianPrompt({
      question: state.currentProblem.question,
      conceptName: concept.name,
      deepPrinciple: concept.deepPrinciple,
      commonMisconceptions: concept.commonMisconceptions,
      studentWorking: state.studentWorking ?? '(no working provided)',
      evaluationSummary: state.evaluation.summary,
      identifiedMistakes: state.evaluation.identifiedMistakes,
    });

    // TODO (Phase 2B): Replace stub with Gemini API call.
    // TODO (Phase 2B): Experiment with chain-of-thought prompting for better diagnosis accuracy.
    //
    // const rawResult = await generateJSON<DiagnosisResult>(user, {
    //   systemInstruction: system,
    // });

    // ── Stub for Phase 2A ─────────────────────────────────────────────────
    const rawResult: DiagnosisResult = {
      misconceptionType: 'TODO: Populate via Gemini',
      conceptualGap: 'TODO: Diagnostician stub — replace with Gemini response.',
      deepStructureFailure: 'TODO: Identify specific deep structure failure.',
      isSurfacePatternMatcher: false,
      remediationStrategy: 'TODO: Define remediation strategy for twin generator.',
      confidence: 0,
    };

    // Reference prompt builder to prevent unused import lint errors.
    void system;
    void user;
    void generateJSON;

    // ── Validate via Zod ──────────────────────────────────────────────────
    const diagnosis = DiagnosisResultSchema.parse(rawResult);

    return {
      diagnosis,
      lastError: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { lastError: `diagnosticianNode error: ${message}` };
  }
}
