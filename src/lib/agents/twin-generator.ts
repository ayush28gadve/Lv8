/**
 * TwinGenerator Agent Node — ConceptTwin
 *
 * Responsibility:
 *   Generate a "Conceptual Twin" problem that:
 *     (a) preserves the deep structural invariants of the concept,
 *     (b) changes surface features (context, numbers, scenario),
 *     (c) is specifically designed to expose the diagnosed misconception.
 *
 * Input consumed from graph state:
 *   - currentProblem   (original seed problem for reference)
 *   - diagnosis        (root cause and remediation strategy)
 *   - conceptId        (to retrieve concept metadata)
 *
 * Output written to graph state:
 *   - generatedTwin    (TwinProblem)
 *   - twinCycleCount   (+1 via increment reducer)
 */

import { generateJSON } from '@/lib/ai/gemini';
import {
  TwinProblemSchema,
  type TwinProblem,
} from '@/lib/ai/schemas';
import { buildTwinGeneratorPrompt } from '@/lib/ai/prompts';
import { getConceptById } from '@/data/concepts';
import type { ConceptId } from '@/types/physics';
import type { GraphStateType } from '@/lib/orchestration/state';

// ---------------------------------------------------------------------------
// Node implementation
// ---------------------------------------------------------------------------

/**
 * LangGraph node function: twinGeneratorNode
 */
export async function twinGeneratorNode(
  state: GraphStateType
): Promise<Partial<GraphStateType>> {
  // ── Guards ────────────────────────────────────────────────────────────────
  if (!state.currentProblem) {
    return { lastError: 'twinGeneratorNode: currentProblem is null.' };
  }
  if (!state.diagnosis) {
    return { lastError: 'twinGeneratorNode: diagnosis is missing. Run diagnosticianNode first.' };
  }
  if (!state.conceptId) {
    return { lastError: 'twinGeneratorNode: conceptId is null.' };
  }

  const concept = getConceptById(state.conceptId as ConceptId);
  if (!concept) {
    return {
      lastError: `twinGeneratorNode: concept '${state.conceptId}' not found in knowledge base.`,
    };
  }

  try {
    // ── Derive difficulty ─────────────────────────────────────────────────
    // Progressively increase difficulty with each twin cycle.
    const difficulty: 'easy' | 'medium' | 'hard' =
      state.twinCycleCount >= 2
        ? 'hard'
        : state.twinCycleCount === 1
          ? 'medium'
          : 'easy';

    // ── Build prompt ─────────────────────────────────────────────────────────
    const { system, user } = buildTwinGeneratorPrompt({
      conceptId: concept.conceptId,
      conceptName: concept.name,
      deepPrinciple: concept.deepPrinciple,
      surfaceFeatures: concept.surfaceFeatures,
      twinGenerationConstraints: {
        invariableElements: concept.twinGenerationConstraints.invariableElements,
        variableSurfaceFeatures: concept.twinGenerationConstraints.variableSurfaceFeatures,
      },
      originalQuestion: state.currentProblem.question,
      originalAnswer: state.currentProblem.correctAnswer,
      originalUnit: state.currentProblem.unit,
      remediationStrategy: state.diagnosis.remediationStrategy,
      difficulty,
    });

    // TODO (Phase 2B): Replace stub with Gemini API call.
    // TODO (Phase 2B): Add physics constraint validator to catch impossible numerical values.
    // TODO (Phase 2B): Implement twin uniqueness check against problem history.
    //
    // const rawResult = await generateJSON<TwinProblem>(user, {
    //   systemInstruction: system,
    //   temperature: 0.7,  // Slightly higher for creativity in surface variation.
    // });

    // ── Stub for Phase 2A ─────────────────────────────────────────────────
    const rawResult: TwinProblem = {
      twinId: `twin-stub-${state.twinCycleCount + 1}`,
      conceptId: state.conceptId,
      question: 'TODO: Generated twin question — replace with Gemini response.',
      correctAnswer: 0,
      unit: 'TODO',
      reasoning: 'TODO: Full step-by-step reasoning from Gemini.',
      twinRationale:
        'TODO: Explanation of what surface features changed and what deep structure was preserved.',
      difficulty,
    };

    // Reference prompt builder to prevent unused import lint errors.
    void system;
    void user;
    void generateJSON;

    // ── Validate via Zod ──────────────────────────────────────────────────
    const generatedTwin = TwinProblemSchema.parse(rawResult);

    return {
      generatedTwin,
      // twinCycleCount increments by 1 via the increment reducer.
      twinCycleCount: 1,
      lastError: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { lastError: `twinGeneratorNode error: ${message}` };
  }
}
