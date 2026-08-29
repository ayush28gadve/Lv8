/**
 * Verifier Agent Node — ConceptTwin (Phase 2B: Live Gemini)
 *
 * Responsibility:
 *   Two-phase verification:
 *
 *   Phase A — Twin quality check (always runs):
 *     Verify the generated twin problem is:
 *       (a) physically and mathematically valid,
 *       (b) preserving deep structural invariants,
 *       (c) sufficiently different at the surface level.
 *
 *   Phase B — Conceptual transfer check (runs when twinAttempt is in state):
 *     Evaluate whether the student demonstrated genuine conceptual transfer
 *     when attempting the twin problem — not just surface pattern-matching.
 *
 *   The verification result drives a conditional routing decision:
 *     - 'accept'     → serve/accept the twin; update mastery if student transferred
 *     - 'regenerate' → loop back to twinGeneratorNode
 *     - 'remediate'  → max cycles exceeded or unresolvable physics
 *
 * Input consumed from graph state:
 *   - currentProblem  (original problem for comparison)
 *   - generatedTwin   (the twin to verify)
 *   - twinAttempt     (optional: student's working on the twin)
 *   - conceptId       (to retrieve concept invariants)
 *
 * Output written to graph state:
 *   - verification    (VerificationResult, including transfer assessment if applicable)
 *   - masteryLevel    (updated to 'mastered' if student transferred successfully)
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
    return {
      lastError:
        'verifierNode: generatedTwin is null. Run twinGeneratorNode first.',
    };
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
    // ── Build prompt ──────────────────────────────────────────────────────
    const { system, user } = buildVerifierPrompt({
      twinQuestion: state.generatedTwin.question,
      twinAnswer: state.generatedTwin.correctAnswer,
      twinUnit: state.generatedTwin.unit,
      twinReasoning: state.generatedTwin.reasoning,
      originalQuestion: state.currentProblem.question,
      invariableElements: concept.twinGenerationConstraints.invariableElements,
      // Pass the student's twin attempt if available (Phase B transfer check).
      twinAttempt: state.twinAttempt,
    });

    // ── Call Gemini ───────────────────────────────────────────────────────
    // Low temperature: this is a critical validation pass — we want determinism.
    const rawResult = await generateJSON<VerificationResult>(user, {
      systemInstruction: system,
      temperature: 0.2,
      maxOutputTokens: 1024,
    });

    // ── Safety: force 'remediate' if max cycles exceeded ──────────────────
    if (state.twinCycleCount >= MAX_TWIN_CYCLES && !rawResult.isValid) {
      rawResult.nextAction = 'remediate';
      (rawResult.issues as string[]).push(
        `Max twin cycles (${MAX_TWIN_CYCLES}) reached. Escalating to remediation.`
      );
    }

    // ── Validate via Zod ──────────────────────────────────────────────────
    const verification = VerificationResultSchema.parse(rawResult);

    // ── Update mastery based on transfer result ───────────────────────────
    // Only update masteryLevel when the student has actually attempted the twin.
    const stateUpdate: Partial<GraphStateType> = {
      verification,
      lastError: null,
    };

    if (verification.studentTransferred === true) {
      stateUpdate.masteryLevel = 'mastered';
    } else if (
      verification.studentTransferred === false &&
      state.twinAttempt !== null
    ) {
      // Student attempted but did not transfer — needs more remediation.
      stateUpdate.masteryLevel =
        state.twinCycleCount >= MAX_TWIN_CYCLES - 1
          ? 'needs_remediation'
          : 'developing';
    }

    return stateUpdate;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { lastError: `verifierNode error: ${message}` };
  }
}
