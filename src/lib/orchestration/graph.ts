/**
 * LangGraph Workflow Graph — ConceptTwin
 *
 * Wires the four agent nodes (evaluator → diagnostician → twin-generator → verifier)
 * into a directed StateGraph with conditional routing.
 *
 * ─── Routing Logic ───────────────────────────────────────────────────────────
 *
 *                     ┌──────────────┐
 *                     │   Evaluator  │
 *                     └──────┬───────┘
 *                            │
 *                   ┌────────▼────────┐
 *              ┌────┤  routeAfterEval ├────┐
 *      correct +    └─────────────────┘   + incorrect
 *    reasoning |                           |
 *              ▼                           ▼
 *           MASTERY                  Diagnostician
 *            (END)                        │
 *                                  ┌──────▼──────┐
 *                                  │TwinGenerator│
 *                                  └──────┬──────┘
 *                                         │
 *                                  ┌──────▼──────┐
 *                              ┌───┤   Verifier  ├───┐
 *                       accept +   └─────────────┘  + regenerate
 *                              |                     |
 *                              ▼                     ▼
 *                           TWIN_READY          TwinGenerator
 *                             (END)              (loop back)
 *                              |
 *                       remediate (max cycles)
 *                              |
 *                              ▼
 *                          REMEDIATION
 *                             (END)
 */

import { StateGraph, END } from '@langchain/langgraph';
import { GraphState } from './state';
import { evaluatorNode } from '@/lib/agents/evaluator';
import { diagnosticianNode } from '@/lib/agents/diagnostician';
import { twinGeneratorNode } from '@/lib/agents/twin-generator';
import { verifierNode, MAX_TWIN_CYCLES } from '@/lib/agents/verifier';
import type { GraphStateType } from './state';

// ---------------------------------------------------------------------------
// Node names (constants to avoid magic strings)
// ---------------------------------------------------------------------------

const NODE_EVALUATOR = 'evaluator' as const;
const NODE_DIAGNOSTICIAN = 'diagnostician' as const;
const NODE_TWIN_GENERATOR = 'twin_generator' as const;
const NODE_VERIFIER = 'verifier' as const;

// ---------------------------------------------------------------------------
// Terminal state labels
// ---------------------------------------------------------------------------

/** Student demonstrated correct deep understanding → session complete */
const ROUTE_MASTERY = 'mastery_achieved';
/** Twin is valid and ready to be served to the student */
const ROUTE_TWIN_READY = 'twin_ready';
/** Max cycles exceeded or unresolvable — escalate to human remediation */
const ROUTE_REMEDIATION = 'remediation_required';

// ---------------------------------------------------------------------------
// Conditional routing functions
// ---------------------------------------------------------------------------

/**
 * After evaluation: route to mastery end-state or diagnostician.
 */
function routeAfterEval(state: GraphStateType): string {
  if (!state.evaluation) {
    // Safety: if evaluation is missing, bail to remediation.
    return ROUTE_REMEDIATION;
  }

  if (state.evaluation.isCorrect && state.evaluation.hasCorrectReasoning) {
    // Student got it right AND understood the concept deeply.
    return ROUTE_MASTERY;
  }

  // Answer wrong, or correct answer via wrong reasoning → need diagnosis.
  return NODE_DIAGNOSTICIAN;
}

/**
 * After verification: accept the twin, regenerate, or escalate to remediation.
 */
function routeAfterVerification(state: GraphStateType): string {
  if (!state.verification) {
    return ROUTE_REMEDIATION;
  }

  switch (state.verification.nextAction) {
    case 'accept':
      return ROUTE_TWIN_READY;
    case 'regenerate':
      // Guard against infinite loops.
      if (state.twinCycleCount >= MAX_TWIN_CYCLES) {
        return ROUTE_REMEDIATION;
      }
      return NODE_TWIN_GENERATOR;
    case 'remediate':
    default:
      return ROUTE_REMEDIATION;
  }
}

// ---------------------------------------------------------------------------
// Graph construction
// ---------------------------------------------------------------------------

/**
 * Build and compile the ConceptTwin LangGraph workflow.
 *
 * The graph is compiled once at module load time and reused across requests
 * (graph.invoke() is stateless with respect to the compiled structure —
 * each call gets its own state snapshot).
 */
function buildConceptTwinGraph() {
  const graph = new StateGraph(GraphState)
    // ── Add nodes ─────────────────────────────────────────────────────────
    .addNode(NODE_EVALUATOR, evaluatorNode)
    .addNode(NODE_DIAGNOSTICIAN, diagnosticianNode)
    .addNode(NODE_TWIN_GENERATOR, twinGeneratorNode)
    .addNode(NODE_VERIFIER, verifierNode)

    // ── Entry point ──────────────────────────────────────────────────────
    .addEdge('__start__', NODE_EVALUATOR)

    // ── Conditional: after evaluation ────────────────────────────────────
    .addConditionalEdges(NODE_EVALUATOR, routeAfterEval, {
      [ROUTE_MASTERY]: END,
      [NODE_DIAGNOSTICIAN]: NODE_DIAGNOSTICIAN,
      [ROUTE_REMEDIATION]: END,
    })

    // ── Linear: diagnostician → twin generator ────────────────────────────
    .addEdge(NODE_DIAGNOSTICIAN, NODE_TWIN_GENERATOR)

    // ── Linear: twin generator → verifier ────────────────────────────────
    .addEdge(NODE_TWIN_GENERATOR, NODE_VERIFIER)

    // ── Conditional: after verification ──────────────────────────────────
    .addConditionalEdges(NODE_VERIFIER, routeAfterVerification, {
      [ROUTE_TWIN_READY]: END,
      [NODE_TWIN_GENERATOR]: NODE_TWIN_GENERATOR,
      [ROUTE_REMEDIATION]: END,
    });

  return graph.compile();
}

/**
 * Compiled ConceptTwin workflow graph.
 *
 * Usage example (server-side only, e.g. from a Next.js Route Handler):
 *
 * ```ts
 * import { conceptTwinGraph } from '@/lib/orchestration/graph';
 * import { createInitialLearningState } from '@/lib/ai/schemas';
 *
 * const result = await conceptTwinGraph.invoke({
 *   ...createInitialLearningState('session-xyz'),
 *   currentProblem: { ... },
 *   studentWorking: '...',
 *   studentFinalAnswer: 24,
 *   conceptId: 'fbd-force-identification',
 * });
 * ```
 */
export const conceptTwinGraph = buildConceptTwinGraph();
