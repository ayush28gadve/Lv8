/**
 * Zod Schemas — ConceptTwin AI Layer
 *
 * These schemas define the contract for all structured data flowing between
 * LangGraph agent nodes. Zod is used instead of raw TypeScript interfaces
 * so that runtime validation can catch malformed LLM output at the agent
 * boundary rather than propagating errors silently.
 */

import { z } from 'zod';

// ============================================================================
// EvaluationResult — output of the Evaluator agent
// ============================================================================

export const EvaluationResultSchema = z.object({
  /** Whether the student's final answer is mathematically correct. */
  isCorrect: z.boolean(),
  /** Whether the student's reasoning / working approach is conceptually valid. */
  hasCorrectReasoning: z.boolean(),
  /** Student's answer as parsed by the evaluator (numeric or string). */
  studentAnswer: z.union([z.number(), z.string()]),
  /** The expected correct answer for reference. */
  expectedAnswer: z.union([z.number(), z.string()]),
  /** Specific mistakes identified in the student's working. */
  identifiedMistakes: z.array(z.string()),
  /** Overall quality score from 0–100. */
  score: z.number().min(0).max(100),
  /** One-sentence evaluator verdict to surface in the UI. */
  summary: z.string(),
});

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

// ============================================================================
// DiagnosisResult — output of the Diagnostician agent
// ============================================================================

export const DiagnosisResultSchema = z.object({
  /** Root-cause label for the identified conceptual gap. */
  misconceptionType: z.string(),
  /** Full natural-language description of the conceptual gap. */
  conceptualGap: z.string(),
  /** Underlying deep-structure principle the student has not grasped. */
  deepStructureFailure: z.string(),
  /**
   * Whether the student is exhibiting surface-level pattern matching
   * (solved correctly by formula lookup but lacks deep understanding).
   */
  isSurfacePatternMatcher: z.boolean(),
  /** Recommended remediation strategy for the twin-generator to use. */
  remediationStrategy: z.string(),
  /** Confidence level of the diagnosis (0–1). */
  confidence: z.number().min(0).max(1),
});

export type DiagnosisResult = z.infer<typeof DiagnosisResultSchema>;

// ============================================================================
// TwinProblem — output of the TwinGenerator agent
// ============================================================================

export const TwinProblemSchema = z.object({
  /** Unique identifier for the generated twin. */
  twinId: z.string(),
  /** The conceptId from the physics knowledge layer this twin targets. */
  conceptId: z.string(),
  /** Full question text of the twin problem. */
  question: z.string(),
  /** Expected correct final answer (numeric or string). */
  correctAnswer: z.union([z.number(), z.string()]),
  /** SI unit of the answer. */
  unit: z.string(),
  /** Full step-by-step reasoning for the verifier to check against. */
  reasoning: z.string(),
  /**
   * Explanation of which surface features were changed from the seed problem
   * and which deep structural invariants were preserved.
   */
  twinRationale: z.string(),
  /** Difficulty of the generated twin. */
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

export type TwinProblem = z.infer<typeof TwinProblemSchema>;

// ============================================================================
// VerificationResult — output of the Verifier agent
// ============================================================================

export const VerificationResultSchema = z.object({
  /** Whether the twin problem's answer is physically and mathematically valid. */
  isValid: z.boolean(),
  /** Whether the twin preserves the deep structural invariants of the concept. */
  preservesDeepStructure: z.boolean(),
  /** Whether the twin's surface features are sufficiently different from the seed. */
  hasDifferentSurface: z.boolean(),
  /** Issues found in the twin problem, if any. */
  issues: z.array(z.string()),
  /** Recommended next action based on verification outcome. */
  nextAction: z.enum(['accept', 'regenerate', 'remediate']),

  // ---- Student twin-attempt fields (populated when twinAttempt is present) ----
  /** Whether the student demonstrated conceptual transfer on the twin problem. */
  studentTransferred: z.boolean().optional(),
  /** Score for the student's twin attempt (0–100). */
  twinAttemptScore: z.number().min(0).max(100).optional(),
  /** Feedback on the student's twin attempt for display in the UI. */
  transferFeedback: z.string().optional(),
});

export type VerificationResult = z.infer<typeof VerificationResultSchema>;

// ============================================================================
// MasteryLevel — tracks conceptual understanding depth
// ============================================================================

export const MasteryLevelSchema = z.enum([
  'unknown',         // Student has not yet attempted this concept.
  'surface',         // Can pattern-match but fails on structural variations.
  'developing',      // Shows partial deep understanding.
  'mastered',        // Demonstrates correct deep understanding consistently.
  'needs_remediation', // Multiple failures; requires targeted re-teaching.
]);

export type MasteryLevel = z.infer<typeof MasteryLevelSchema>;

// ============================================================================
// LearningState — full persistent state object for the LangGraph graph
// ============================================================================

export const LearningStateSchema = z.object({
  /** Session identifier. */
  sessionId: z.string(),

  // ---- Input problem ----
  /** The seed problem currently being worked on. */
  currentProblem: z.object({
    problemId: z.string(),
    conceptId: z.string(),
    question: z.string(),
    correctAnswer: z.union([z.number(), z.string()]),
    unit: z.string(),
    reasoning: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
  }).nullable(),

  // ---- Student input ----
  /** The raw working / solution steps the student submitted. */
  studentWorking: z.string().nullable(),
  /** The student's final stated answer. */
  studentFinalAnswer: z.union([z.number(), z.string()]).nullable(),

  // ---- Agent outputs ----
  /** Output from the Evaluator agent. */
  evaluation: EvaluationResultSchema.nullable(),
  /** Output from the Diagnostician agent. */
  diagnosis: DiagnosisResultSchema.nullable(),
  /** Twin problem generated by the TwinGenerator agent. */
  generatedTwin: TwinProblemSchema.nullable(),
  /** Student's attempt at the generated twin. */
  twinAttempt: z.string().nullable(),
  /** Output from the Verifier agent (verifies twin quality, not student answer). */
  verification: VerificationResultSchema.nullable(),

  // ---- Concept / mastery tracking ----
  /** The concept cluster this session is targeting. */
  conceptId: z.string().nullable(),
  /** Current mastery assessment for the concept. */
  masteryLevel: MasteryLevelSchema,
  /** Number of twin cycles attempted this session. */
  twinCycleCount: z.number().int().min(0),

  // ---- Workflow control ----
  /** The last error that occurred in any node (used for debugging). */
  lastError: z.string().nullable(),
});

export type LearningState = z.infer<typeof LearningStateSchema>;

// ============================================================================
// Initial state factory
// ============================================================================

export function createInitialLearningState(sessionId: string): LearningState {
  return {
    sessionId,
    currentProblem: null,
    studentWorking: null,
    studentFinalAnswer: null,
    evaluation: null,
    diagnosis: null,
    generatedTwin: null,
    twinAttempt: null,
    verification: null,
    conceptId: null,
    masteryLevel: 'unknown',
    twinCycleCount: 0,
    lastError: null,
  };
}
