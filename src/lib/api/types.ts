/**
 * API Layer Types — ConceptTwin
 *
 * Typed Zod schemas for the POST /api/session request payload and
 * the clean JSON response returned to the browser.
 *
 * SECURITY PRINCIPLE:
 *   The response types deliberately omit internal fields that must
 *   never reach the browser:
 *     - ground-truth answers for the current or twin problem
 *     - internal reasoning/prompts
 *     - GEMINI_API_KEY or any other credential
 *     - raw LangGraph state internals (e.g. twinCycleCount reducer details)
 */

import { z } from 'zod';

// ============================================================================
// Inbound: POST /api/session — request body
// ============================================================================

/**
 * Stage A — student is attempting a seed problem for the first time.
 */
export const SeedAttemptPayloadSchema = z.object({
  stage: z.literal('seed'),
  /** problemId from the physics knowledge layer (e.g. "prob-fbd-01") */
  problemId: z.string().min(1),
  /** Raw step-by-step working the student wrote out (optional if image is provided) */
  working: z.string().optional(),
  /** Student's stated final answer (number or numeric string, optional) */
  finalAnswer: z.union([z.number(), z.string()]).optional(),
  /** Base64-encoded handwritten solution image (optional if working is provided) */
  image: z.string().optional(),
  /**
   * Optional session ID for correlating logs across requests.
   * If omitted the server generates one.
   */
  sessionId: z.string().optional(),
}).refine((data) => {
  return (data.working && data.working.trim().length > 0) || (data.image && data.image.trim().length > 0);
}, {
  message: "Either typed working or handwritten solution image must be provided.",
  path: ["working"]
});

export type SeedAttemptPayload = z.infer<typeof SeedAttemptPayloadSchema>;

/**
 * Stage B — student is attempting the AI-generated twin problem.
 */
export const TwinAttemptPayloadSchema = z.object({
  stage: z.literal('twin'),
  /** The twinId returned by the stage-A response */
  twinId: z.string().min(1),
  /** The original problemId — used to reload the concept context */
  problemId: z.string().min(1),
  /** Student's working on the twin problem (optional if image is provided) */
  working: z.string().optional(),
  /** Student's stated final answer for the twin (optional) */
  finalAnswer: z.union([z.number(), z.string()]).optional(),
  /** Base64-encoded handwritten solution image (optional if working is provided) */
  image: z.string().optional(),
  /** Session ID from stage-A response */
  sessionId: z.string().optional(),
  /**
   * The full twin problem object returned from stage A.
   * The server validates this against the twinId to prevent tampering.
   * The client holds this in memory but cannot modify the ground truth.
   */
  twinProblem: z.object({
    twinId: z.string(),
    conceptId: z.string(),
    question: z.string(),
    correctAnswer: z.union([z.number(), z.string()]).optional(),
    unit: z.string(),
    reasoning: z.string().optional(),
    twinRationale: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
  }),
}).refine((data) => {
  return (data.working && data.working.trim().length > 0) || (data.image && data.image.trim().length > 0);
}, {
  message: "Either typed working or handwritten solution image must be provided.",
  path: ["working"]
});

export type TwinAttemptPayload = z.infer<typeof TwinAttemptPayloadSchema>;

/** Union of both valid request payloads */
export const SessionPayloadSchema = z.discriminatedUnion('stage', [
  SeedAttemptPayloadSchema,
  TwinAttemptPayloadSchema,
]);

export type SessionPayload = z.infer<typeof SessionPayloadSchema>;

// ============================================================================
// Outbound: POST /api/session — response body (browser-safe)
// ============================================================================

/**
 * Browser-safe evaluation result.
 * The expectedAnswer is INCLUDED here — it is intentionally revealed
 * after the student has submitted their attempt.
 */
export interface ApiEvaluationResult {
  isCorrect: boolean;
  hasCorrectReasoning: boolean;
  studentAnswer: number | string;
  expectedAnswer: number | string;
  identifiedMistakes: string[];
  score: number;
  summary: string;
}

/**
 * Browser-safe diagnosis result.
 * The full remediationStrategy is omitted — it is an internal prompt directive.
 */
export interface ApiDiagnosisResult {
  misconceptionType: string;
  conceptualGap: string;
  deepStructureFailure: string;
  isSurfacePatternMatcher: boolean;
  confidence: number;
}

/**
 * Browser-safe twin problem.
 * correctAnswer and reasoning are OMITTED — they are ground truth and
 * must not be exposed before the student attempts the twin.
 */
export interface ApiTwinProblem {
  twinId: string;
  conceptId: string;
  question: string;
  unit: string;
  twinRationale: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * Browser-safe verification / transfer result.
 */
export interface ApiVerificationResult {
  studentTransferred?: boolean;
  twinAttemptScore?: number;
  transferFeedback?: string;
  issues: string[];
}

/**
 * Unified response sent to the browser.
 * All fields are optional — only the fields relevant to the current stage
 * will be populated.
 */
export interface SessionApiResponse {
  ok: true;
  sessionId: string;
  stage: 'seed' | 'twin';
  masteryLevel: 'unknown' | 'surface' | 'developing' | 'mastered' | 'needs_remediation';
  nextAction: 'mastered' | 'show_twin' | 'twin_accepted' | 'remediation' | 'error';

  /** Present for both stage A and B */
  evaluation?: ApiEvaluationResult;

  /** Present when stage = 'seed' and student did not achieve mastery */
  diagnosis?: ApiDiagnosisResult;

  /**
   * Present when a twin was generated (stage = 'seed', non-mastery path).
   * Ground-truth answer and reasoning are STRIPPED before sending.
   */
  twin?: ApiTwinProblem;

  /**
   * Present when stage = 'twin' — the transfer assessment result.
   */
  verification?: ApiVerificationResult;
}

/**
 * Error response sent to the browser on any failure.
 * NEVER exposes stack traces, GEMINI_API_KEY, or other internals.
 */
export interface SessionApiError {
  ok: false;
  error: string;
  code:
    | 'BAD_REQUEST'
    | 'NOT_FOUND'
    | 'INTERNAL_ERROR'
    | 'TIMEOUT'
    | 'GEMINI_AUTH_ERROR'
    | 'GEMINI_MODEL_NOT_FOUND'
    | 'GEMINI_RATE_LIMIT'
    | 'GEMINI_UNAVAILABLE'
    | 'GEMINI_TIMEOUT'
    | 'GRAPH_ERROR'
    | 'VALIDATION_ERROR';
}

export type SessionApiResult = SessionApiResponse | SessionApiError;

// ============================================================================
// Handwriting Analysis — API Request/Response
// ============================================================================

export const HandwritingAnalysisRequestSchema = z.object({
  /** Base64-encoded handwritten solution image (with or without data URL prefix) */
  image: z.string().min(1),
  /** Mime type of the image, e.g. "image/png" or "image/jpeg" */
  mimeType: z.string().min(1),
  /** The physics question statement for context */
  question: z.string().min(1),
});

export type HandwritingAnalysisRequest = z.infer<typeof HandwritingAnalysisRequestSchema>;

export const HandwritingAnalysisResultSchema = z.object({
  /** Step-by-step working transcribed/extracted from handwriting */
  extractedWorking: z.string(),
  /** Final answer extracted from handwriting (number or string representation) */
  extractedFinalAnswer: z.union([z.number(), z.string()]),
  /** Physics formulas or equations detected in the solution */
  detectedEquations: z.array(z.string()),
  /** List of logical steps found in the solution */
  reasoningSteps: z.array(z.string()),
  /** Confidence in transcription accuracy (0.0 to 1.0) */
  confidence: z.number().min(0).max(1),
  /** Descriptions of blurry or hard-to-read parts, if any */
  unclearRegions: z.array(z.string()),
  /** Whether the image is unclear/unreadable, requiring a re-upload */
  isImageUnclear: z.boolean(),
});

export type HandwritingAnalysisResult = z.infer<typeof HandwritingAnalysisResultSchema>;

