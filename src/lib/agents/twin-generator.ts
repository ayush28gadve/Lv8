/**
 * TwinGenerator Agent Node — ConceptTwin (Phase 2B: Live Gemini)
 *
 * Responsibility:
 *   Generate a "Conceptual Twin" problem that:
 *     (a) preserves the deep structural invariants of the concept,
 *     (b) changes surface features (context, numbers, scenario),
 *     (c) is specifically designed to expose the diagnosed misconception,
 *     (d) provides its own ground-truth answer and step-by-step reasoning
 *         for the verifier to check against.
 *
 * Input consumed from graph state:
 *   - currentProblem   (original seed problem for reference)
 *   - diagnosis        (root cause and remediation strategy)
 *   - conceptId        (to retrieve concept metadata)
 *
 * Output written to graph state:
 *   - generatedTwin    (TwinProblem with embedded ground-truth answer)
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
    return {
      lastError:
        'twinGeneratorNode: diagnosis is missing. Run diagnosticianNode first.',
    };
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
    // Progressively increase difficulty with each twin cycle so the student
    // is challenged incrementally rather than thrown into hard problems immediately.
    const difficulty: 'easy' | 'medium' | 'hard' =
      state.twinCycleCount >= 2
        ? 'hard'
        : state.twinCycleCount === 1
          ? 'medium'
          : 'easy';

    // ── Build prompt ──────────────────────────────────────────────────────
    const { system, user } = buildTwinGeneratorPrompt({
      conceptId: concept.conceptId,
      conceptName: concept.name,
      deepPrinciple: concept.deepPrinciple,
      surfaceFeatures: concept.surfaceFeatures,
      twinGenerationConstraints: {
        invariableElements: concept.twinGenerationConstraints.invariableElements,
        variableSurfaceFeatures:
          concept.twinGenerationConstraints.variableSurfaceFeatures,
      },
      originalQuestion: state.currentProblem.question,
      originalAnswer: state.currentProblem.correctAnswer,
      originalUnit: state.currentProblem.unit,
      remediationStrategy: state.diagnosis.remediationStrategy,
      difficulty,
    });

    // ── Call Gemini ───────────────────────────────────────────────────────
    // Slightly higher temperature for creativity in surface-feature variation,
    // while staying deterministic enough to produce valid physics.
    const rawResult = await generateJSON<TwinProblem>(user, {
      systemInstruction: system,
      temperature: 0.6,
      maxOutputTokens: 2048,
    });

    // ── Validate via Zod ──────────────────────────────────────────────────
    const generatedTwin = TwinProblemSchema.parse(rawResult);

    return {
      generatedTwin,
      // twinCycleCount increments by 1 via the increment reducer in state.ts.
      twinCycleCount: 1,
      lastError: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { lastError: `twinGeneratorNode error: ${message}` };
  }
}
