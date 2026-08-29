/**
 * Prompt Library — ConceptTwin
 *
 * All LLM prompts are centralised here for easy iteration.
 * Each exported function accepts runtime data and returns a complete
 * prompt string ready to pass to the Gemini client.
 *
 * Convention:
 *   build<AgentName>Prompt(args) → { system: string; user: string }
 */

import type { LearningState } from '../schemas';

// ============================================================================
// Evaluator Prompts
// ============================================================================

export interface EvaluatorPromptArgs {
  question: string;
  correctAnswer: number | string;
  unit: string;
  correctReasoning: string;
  studentWorking: string;
  studentFinalAnswer: number | string;
}

export function buildEvaluatorPrompt(args: EvaluatorPromptArgs): {
  system: string;
  user: string;
} {
  const system = `You are an expert Class 11-12 Physics evaluator specialising in Newton's Laws of Motion and Friction.
Your job is to assess a student's solution against a known-correct answer and step-by-step reasoning.

EVALUATION RULES:
- Evaluate BOTH the final numerical answer AND the conceptual reasoning.
- A correct answer reached by wrong reasoning indicates surface pattern-matching.
- A wrong answer with partially correct reasoning may still deserve partial credit.
- Identify every physics or mathematical mistake concisely.
- Respond ONLY with a valid JSON object matching the EvaluationResult schema. No markdown, no prose.

EVALUATIONRESULT SCHEMA:
{
  "isCorrect": boolean,
  "hasCorrectReasoning": boolean,
  "studentAnswer": number | string,
  "expectedAnswer": number | string,
  "identifiedMistakes": string[],
  "score": number (0-100),
  "summary": string
}`;

  const user = `QUESTION:
${args.question}

EXPECTED ANSWER: ${args.correctAnswer} ${args.unit}

CORRECT STEP-BY-STEP REASONING:
${args.correctReasoning}

STUDENT'S WORKING:
${args.studentWorking}

STUDENT'S FINAL ANSWER: ${args.studentFinalAnswer} ${args.unit}

Evaluate and respond with the JSON object only.`;

  return { system, user };
}

// ============================================================================
// Diagnostician Prompts
// ============================================================================

export interface DiagnosticianPromptArgs {
  question: string;
  conceptName: string;
  deepPrinciple: string;
  commonMisconceptions: string[];
  studentWorking: string;
  evaluationSummary: string;
  identifiedMistakes: string[];
}

export function buildDiagnosticianPrompt(args: DiagnosticianPromptArgs): {
  system: string;
  user: string;
} {
  const system = `You are a physics learning diagnostician for Class 11-12 students.
Your task is to identify the ROOT CAUSE of a student's physics error — not just the symptom.

DIAGNOSIS RULES:
- Distinguish between surface errors (arithmetic, unit) and deep conceptual failures (wrong physics model).
- Identify whether the student is surface pattern-matching (uses correct formula by memory but lacks understanding).
- Reference the known list of common misconceptions to categorise the gap.
- Your output directly feeds the twin-problem generator, so be specific about the remediationStrategy.
- Respond ONLY with a valid JSON object matching the DiagnosisResult schema. No markdown, no prose.

DIAGNOSISRESULT SCHEMA:
{
  "misconceptionType": string,
  "conceptualGap": string,
  "deepStructureFailure": string,
  "isSurfacePatternMatcher": boolean,
  "remediationStrategy": string,
  "confidence": number (0-1)
}`;

  const user = `CONCEPT: ${args.conceptName}

DEEP PRINCIPLE: ${args.deepPrinciple}

KNOWN MISCONCEPTIONS FOR THIS CONCEPT:
${args.commonMisconceptions.map((m, i) => `${i + 1}. ${m}`).join('\n')}

QUESTION:
${args.question}

STUDENT'S WORKING:
${args.studentWorking}

EVALUATOR SUMMARY: ${args.evaluationSummary}
IDENTIFIED MISTAKES: ${args.identifiedMistakes.join('; ')}

Diagnose the root cause and respond with the JSON object only.`;

  return { system, user };
}

// ============================================================================
// TwinGenerator Prompts
// ============================================================================

export interface TwinGeneratorPromptArgs {
  conceptId: string;
  conceptName: string;
  deepPrinciple: string;
  surfaceFeatures: string[];
  twinGenerationConstraints: {
    invariableElements: string[];
    variableSurfaceFeatures: string[];
  };
  originalQuestion: string;
  originalAnswer: number | string;
  originalUnit: string;
  remediationStrategy: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export function buildTwinGeneratorPrompt(args: TwinGeneratorPromptArgs): {
  system: string;
  user: string;
} {
  const system = `You are a physics problem generator for Class 11-12 students.
Your task is to generate a "Conceptual Twin" of an existing problem.

A Conceptual Twin:
- Changes surface features (context, numbers, object type)
- PRESERVES deep structural invariants (same physics laws, same reasoning steps required)
- Targets the specific conceptual gap identified by the diagnostician
- Uses clean, verifiable numerical values (g = 10 m/s²; standard sin/cos values)

CONSTRAINTS:
- Do NOT invent new physics. Use only standard Newton's Laws / Friction mechanics.
- Use only the allowed variable ranges in the generation constraints.
- The twin must be solvable by a Class 11-12 student in under 5 minutes.
- Respond ONLY with a valid JSON object matching the TwinProblem schema. No markdown, no prose.

TWINPROBLEM SCHEMA:
{
  "twinId": string (e.g. "twin-<uuid>"),
  "conceptId": string,
  "question": string,
  "correctAnswer": number | string,
  "unit": string,
  "reasoning": string (full step-by-step),
  "twinRationale": string (what changed vs what was preserved),
  "difficulty": "easy" | "medium" | "hard"
}`;

  const user = `CONCEPT: ${args.conceptName} (${args.conceptId})

DEEP PRINCIPLE: ${args.deepPrinciple}

INVARIABLE ELEMENTS (must be preserved):
${args.twinGenerationConstraints.invariableElements.map((e, i) => `${i + 1}. ${e}`).join('\n')}

VARIABLE SURFACE FEATURES (change these):
${args.twinGenerationConstraints.variableSurfaceFeatures.map((f, i) => `${i + 1}. ${f}`).join('\n')}

ORIGINAL PROBLEM:
${args.originalQuestion}
Answer: ${args.originalAnswer} ${args.originalUnit}

REMEDIATION STRATEGY (design the twin to address this gap):
${args.remediationStrategy}

TARGET DIFFICULTY: ${args.difficulty}

Generate the twin problem and respond with the JSON object only.`;

  return { system, user };
}

// ============================================================================
// Verifier Prompts
// ============================================================================

export interface VerifierPromptArgs {
  twinQuestion: string;
  twinAnswer: number | string;
  twinUnit: string;
  twinReasoning: string;
  originalQuestion: string;
  invariableElements: string[];
}

export function buildVerifierPrompt(args: VerifierPromptArgs): {
  system: string;
  user: string;
} {
  const system = `You are a physics problem verifier for Class 11-12 mechanics.
Your task is to verify that a generated twin problem is physically valid and serves its pedagogical purpose.

VERIFICATION RULES:
1. Confirm the answer follows from the reasoning using correct physics.
2. Confirm the twin preserves the stated invariable elements (deep structure).
3. Confirm the twin has meaningfully different surface features from the original.
4. Flag any physically impossible values (e.g. μ_k > μ_s, negative mass, angle ≥ 90°).
- Respond ONLY with a valid JSON object matching the VerificationResult schema.

VERIFICATIONRESULT SCHEMA:
{
  "isValid": boolean,
  "preservesDeepStructure": boolean,
  "hasDifferentSurface": boolean,
  "issues": string[],
  "nextAction": "accept" | "regenerate" | "remediate"
}`;

  const user = `ORIGINAL PROBLEM:
${args.originalQuestion}

INVARIABLE ELEMENTS TO PRESERVE:
${args.invariableElements.map((e, i) => `${i + 1}. ${e}`).join('\n')}

TWIN PROBLEM:
${args.twinQuestion}

TWIN ANSWER: ${args.twinAnswer} ${args.twinUnit}

TWIN REASONING:
${args.twinReasoning}

Verify and respond with the JSON object only.`;

  return { system, user };
}

// ============================================================================
// Utility: extract the concept section most relevant to current state
// ============================================================================

export function buildSessionContext(state: LearningState): string {
  return [
    `Session ID: ${state.sessionId}`,
    `Concept ID: ${state.conceptId ?? 'unknown'}`,
    `Mastery Level: ${state.masteryLevel}`,
    `Twin Cycle: ${state.twinCycleCount}`,
  ].join('\n');
}
