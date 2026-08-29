/**
 * Verifier Agent Node — ConceptTwin
 *
 * Responsibility:
 *   Verify that a generated twin problem is:
 *     (a) physically and mathematically valid (answer follows from reasoning),
 *     (b) preserving the deep structural invariants of the concept,
 *     (c) sufficiently different at the surface level from the original problem.
 *
 *   The verification result drives a conditional routing decision:
 *     - 'accept'     → serve the twin to the student
 *     - 'regenerate' → loop back to twinGeneratorNode
 *     - 'remediate'  → flag for human / simplified follow-up
 *
 * Input consumed from graph state:
 *   - currentProblem  (original problem for comparison)
 *   - generatedTwin   (the twin to verify)
 *   - conceptId       (to retrieve concept invariants)
 *
 * Output written to graph state:
 *   - verification    (VerificationResult)
 */

import { generateJSON } from '@/lib/ai/gemini';
import {
  VerificationResultSchema,
  type VerificationResult,
} from '@/lib/ai/schemas';
import { buildVerifierPrompt } from '@/lib/ai/prompts';
import { getConceptById } from '@/data/concepts';
import type { ConceptId } from '@/types/physics';
import type { GraphStateType } from '@/lib/orchestration/state';

// ---------------------------------------------------------------------------
// Max retry guard
// ---------------------------------------------------------------------------

/** Maximum twin regeneration cycles before escalating to 'remediate'. */
export const MAX_TWIN_CYCLES = 3;

// ---------------------------------------------------------------------------
// Node implementation
// ---------------------------------------------------------------------------

/**
 * LangGraph node function: verifierNode
 */
export async function verifierNode(
  state: GraphStateType
): Promise<Partial<GraphStateType>> {
  // ── Guards ────────────────────────────────────────────────────────────────
  if (!state.generatedTwin) {
    return { lastError: 'verifierNode: generatedTwin is null. Run twinGeneratorNode first.' };
  }
  if (!state.currentProblem) {
    return { lastError: 'verifierNode: currentProblem is null.' };
  }
  if (!state.conceptId) {
    return { lastError: 'verifierNode: conceptId is null.' };
  }

  const concept = getConceptById(state.conceptId as ConceptId);
  if (!concept) {
    return {
      lastError: `verifierNode: concept '${state.conceptId}' not found in knowledge base.`,
    };
  }

  try {
    // ── Build prompt ─────────────────────────────────────────────────────────
    const { system, user } = buildVerifierPrompt({
      twinQuestion: state.generatedTwin.question,
      twinAnswer: state.generatedTwin.correctAnswer,
      twinUnit: state.generatedTwin.unit,
      twinReasoning: state.generatedTwin.reasoning,
      originalQuestion: state.currentProblem.question,
      invariableElements: concept.twinGenerationConstraints.invariableElements,
    });

    // TODO (Phase 2B): Replace stub with Gemini API call.
    // TODO (Phase 2B): Consider a secondary deterministic physics solver for numerical validation.
    //
    // const rawResult = await generateJSON<VerificationResult>(user, {
    //   systemInstruction: system,
    //   temperature: 0.2,  // Low temperature for critical validation tasks.
    // });

    // ── Stub for Phase 2A ─────────────────────────────────────────────────
    // Stub always accepts so the graph can complete a full cycle in testing.
    const rawResult: VerificationResult = {
      isValid: true,
      preservesDeepStructure: true,
      hasDifferentSurface: true,
      issues: [],
      nextAction: 'accept',
    };

    // Reference prompt builder to prevent unused import lint errors.
    void system;
    void user;
    void generateJSON;

    // ── Safety: escalate if max cycles exceeded ───────────────────────────
    if (state.twinCycleCount >= MAX_TWIN_CYCLES && !rawResult.isValid) {
      rawResult.nextAction = 'remediate';
      rawResult.issues.push(
        `Max twin cycles (${MAX_TWIN_CYCLES}) reached. Escalating to remediation.`
      );
    }

    // ── Validate via Zod ──────────────────────────────────────────────────
    const verification = VerificationResultSchema.parse(rawResult);

    return {
      verification,
      lastError: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { lastError: `verifierNode error: ${message}` };
  }
}
