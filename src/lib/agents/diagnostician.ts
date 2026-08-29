/**
 * Diagnostician Agent Node — ConceptTwin (Phase 2B: Live Gemini)
 *
 * Responsibility:
 *   Perform deep root-cause analysis of the student's conceptual error.
 *   Goes beyond identifying the wrong answer to pinpointing WHICH part of
 *   the deep structure the student has misunderstood.
 *
 *   Three distinct error categories are distinguished:
 *     1. Conceptual misunderstanding: Wrong physics model applied.
 *     2. Procedural/calculation error: Correct model but arithmetic mistake.
 *     3. Surface pattern-matching: Got the answer right but by rote formula,
 *        not genuine understanding (caught by evaluator's hasCorrectReasoning=false).
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

import { generateJSON, DIAGNOSIS_RESPONSE_SCHEMA } from '@/lib/ai/gemini';
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
    return {
      lastError:
        'diagnosticianNode: evaluation is missing. Run evaluatorNode first.',
    };
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
    // ── Build prompt ──────────────────────────────────────────────────────
    const { system, user } = buildDiagnosticianPrompt({
      question: state.currentProblem.question,
      conceptName: concept.name,
      deepPrinciple: concept.deepPrinciple,
      commonMisconceptions: concept.commonMisconceptions,
      studentWorking: state.studentWorking ?? '(no working provided)',
      evaluationSummary: state.evaluation.summary,
      identifiedMistakes: state.evaluation.identifiedMistakes,
    });

    // ── Call Gemini ───────────────────────────────────────────────────────
    // Use lower temperature for diagnosis — we want precise, deterministic output.
    const rawResult = await generateJSON<DiagnosisResult>(user, {
      systemInstruction: system,
      temperature: 0.3,
      maxOutputTokens: 1024,
      responseSchema: DIAGNOSIS_RESPONSE_SCHEMA,
    });

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
