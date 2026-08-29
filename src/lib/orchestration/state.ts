/**
 * LangGraph Shared State Definition — ConceptTwin
 *
 * Defines the state "channels" (channels = reducers + initial values) for the
 * LangGraph StateGraph. Each channel describes how values are merged when
 * multiple parallel branches write to the same key.
 *
 * State shape is derived from the Zod LearningStateSchema so both runtime
 * validation (Zod) and compile-time types (TypeScript) stay in sync.
 */

import { Annotation } from '@langchain/langgraph';
import type {
  EvaluationResult,
  DiagnosisResult,
  TwinProblem,
  VerificationResult,
  MasteryLevel,
  LearningState,
} from '@/lib/ai/schemas';

// ---------------------------------------------------------------------------
// Channel Reducers
// ---------------------------------------------------------------------------

/**
 * Reducer that always replaces the previous value with the incoming one.
 * Used for all agent output fields — only the latest agent output matters.
 */
function replace<T>(existing: T, incoming: T): T {
  // Suppress unused-variable lint: `existing` is intentionally ignored.
  void existing;
  return incoming;
}

/**
 * Reducer that increments a counter.
 * Used for twinCycleCount so each twin cycle adds 1.
 */
function increment(existing: number, incoming: number): number {
  return existing + incoming;
}

// ---------------------------------------------------------------------------
// StateGraph Annotation
// ---------------------------------------------------------------------------

/**
 * GraphState is the authoritative type flowing through every LangGraph node.
 * Every field corresponds 1-to-1 with LearningState from the Zod schema.
 *
 * IMPORTANT: Update this Annotation AND the Zod schema together whenever
 * adding or removing fields.
 */
export const GraphState = Annotation.Root({
  // -- Session --
  sessionId: Annotation<string>({
    reducer: replace<string>,
    default: () => '',
  }),

  // -- Current problem --
  currentProblem: Annotation<LearningState['currentProblem']>({
    reducer: replace<LearningState['currentProblem']>,
    default: () => null,
  }),

  // -- Student inputs --
  studentWorking: Annotation<string | null>({
    reducer: replace<string | null>,
    default: () => null,
  }),
  studentFinalAnswer: Annotation<number | string | null>({
    reducer: replace<number | string | null>,
    default: () => null,
  }),

  // -- Agent outputs --
  evaluation: Annotation<EvaluationResult | null>({
    reducer: replace<EvaluationResult | null>,
    default: () => null,
  }),
  diagnosis: Annotation<DiagnosisResult | null>({
    reducer: replace<DiagnosisResult | null>,
    default: () => null,
  }),
  generatedTwin: Annotation<TwinProblem | null>({
    reducer: replace<TwinProblem | null>,
    default: () => null,
  }),
  twinAttempt: Annotation<string | null>({
    reducer: replace<string | null>,
    default: () => null,
  }),
  verification: Annotation<VerificationResult | null>({
    reducer: replace<VerificationResult | null>,
    default: () => null,
  }),

  // -- Concept / mastery --
  conceptId: Annotation<string | null>({
    reducer: replace<string | null>,
    default: () => null,
  }),
  masteryLevel: Annotation<MasteryLevel>({
    reducer: replace<MasteryLevel>,
    default: () => 'unknown' as MasteryLevel,
  }),
  twinCycleCount: Annotation<number>({
    reducer: increment,
    default: () => 0,
  }),

  // -- Error tracking --
  lastError: Annotation<string | null>({
    reducer: replace<string | null>,
    default: () => null,
  }),
});

/** Convenience type alias used by all agent node functions. */
export type GraphStateType = typeof GraphState.State;
