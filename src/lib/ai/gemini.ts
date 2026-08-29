/**
 * Gemini AI Client
 * Central module for interacting with the Google Gemini API via @google/genai SDK.
 *
 * Design principle: This module is the only place in the codebase that imports
 * and configures the Gemini SDK. All agents depend on this module, so swapping
 * the LLM provider only requires changes here.
 */

import { GoogleGenAI, ThinkingLevel } from '@google/genai';

// ---------------------------------------------------------------------------
// Lazy client factory
// ---------------------------------------------------------------------------

/** Cached singleton — created on first use, not at import time. */
let _genai: GoogleGenAI | null = null;

/**
 * Returns the shared GoogleGenAI client instance, validated lazily.
 * Throws a clear error if GEMINI_API_KEY is missing at call time,
 * avoiding build failures in environments without the variable set.
 */
function getGenAI(): GoogleGenAI {
  if (_genai) return _genai;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      '[ConceptTwin] GEMINI_API_KEY is not set in the environment. ' +
      'Copy .env.example to .env.local and add your key before calling AI functions.'
    );
  }

  _genai = new GoogleGenAI({ apiKey });
  return _genai;
}

/**
 * Singleton Gemini AI client accessor.
 * All agents should use this accessor rather than constructing their own
 * clients, ensuring shared configuration and easy provider swapping.
 */
export const genai = { get client() { return getGenAI(); } };

// ---------------------------------------------------------------------------
// Model constants
// ---------------------------------------------------------------------------

export const GEMINI_MODEL = 'gemini-3.6-flash';
export const PRIMARY_MODEL = GEMINI_MODEL;
export const STRUCTURED_MODEL = GEMINI_MODEL;

// ---------------------------------------------------------------------------
// Helper types & utilities
// ---------------------------------------------------------------------------

export interface GenerateOptions {
  /** Gemini model identifier. Defaults to PRIMARY_MODEL */
  model?: string;
  /** System instruction injected before user content */
  systemInstruction?: string;
  /** Max output tokens. Defaults to 2048 */
  maxOutputTokens?: number;
  /** Optional structured JSON schema */
  responseSchema?: Record<string, unknown>;
  /** Optional thinking configuration level (Gemini 3.x) */
  thinkingLevel?: 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH';
  /** Descriptive name for logging timing/errors */
  label?: string;
  /** Optional base64 image details for vision tasks */
  image?: {
    inlineData: {
      data: string; // Base64 data (without metadata header)
      mimeType: string;
    };
  };
}

// ---------------------------------------------------------------------------
// OpenAPI Schemas for Strict JSON compliance
// ---------------------------------------------------------------------------

export const EVALUATION_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    isCorrect: { type: 'BOOLEAN' },
    hasCorrectReasoning: { type: 'BOOLEAN' },
    studentAnswer: { type: 'STRING' },
    expectedAnswer: { type: 'STRING' },
    identifiedMistakes: { type: 'ARRAY', items: { type: 'STRING' } },
    score: { type: 'INTEGER' },
    summary: { type: 'STRING' }
  },
  required: [
    'isCorrect',
    'hasCorrectReasoning',
    'studentAnswer',
    'expectedAnswer',
    'identifiedMistakes',
    'score',
    'summary'
  ]
};

export const DIAGNOSIS_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    misconceptionType: { type: 'STRING' },
    conceptualGap: { type: 'STRING' },
    deepStructureFailure: { type: 'STRING' },
    isSurfacePatternMatcher: { type: 'BOOLEAN' },
    remediationStrategy: { type: 'STRING' },
    confidence: { type: 'NUMBER' }
  },
  required: [
    'misconceptionType',
    'conceptualGap',
    'deepStructureFailure',
    'isSurfacePatternMatcher',
    'remediationStrategy',
    'confidence'
  ]
};

export const TWIN_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    twinId: { type: 'STRING' },
    conceptId: { type: 'STRING' },
    question: { type: 'STRING' },
    correctAnswer: { type: 'STRING' },
    unit: { type: 'STRING' },
    reasoning: { type: 'STRING' },
    twinRationale: { type: 'STRING' },
    difficulty: { type: 'STRING', enum: ['easy', 'medium', 'hard'] }
  },
  required: [
    'twinId',
    'conceptId',
    'question',
    'correctAnswer',
    'unit',
    'reasoning',
    'twinRationale',
    'difficulty'
  ]
};

export const VERIFICATION_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    isValid: { type: 'BOOLEAN' },
    preservesDeepStructure: { type: 'BOOLEAN' },
    hasDifferentSurface: { type: 'BOOLEAN' },
    issues: { type: 'ARRAY', items: { type: 'STRING' } },
    nextAction: { type: 'STRING', enum: ['accept', 'regenerate', 'remediate'] },
    studentTransferred: { type: 'BOOLEAN' },
    twinAttemptScore: { type: 'INTEGER' },
    transferFeedback: { type: 'STRING' }
  },
  required: [
    'isValid',
    'preservesDeepStructure',
    'hasDifferentSurface',
    'issues',
    'nextAction'
  ]
};

export const HANDWRITING_ANALYSIS_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    extractedWorking: { type: 'STRING' },
    extractedFinalAnswer: { type: 'STRING' },
    detectedEquations: { type: 'ARRAY', items: { type: 'STRING' } },
    reasoningSteps: { type: 'ARRAY', items: { type: 'STRING' } },
    confidence: { type: 'NUMBER' },
    unclearRegions: { type: 'ARRAY', items: { type: 'STRING' } },
    isImageUnclear: { type: 'BOOLEAN' }
  },
  required: [
    'extractedWorking',
    'extractedFinalAnswer',
    'detectedEquations',
    'reasoningSteps',
    'confidence',
    'unclearRegions',
    'isImageUnclear'
  ]
};

/**
 * Lightweight wrapper around the Gemini generateContent API.
 * Returns the raw text of the first candidate's first text part.
 */
export async function generateText(
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const {
    model = PRIMARY_MODEL,
    systemInstruction,
    maxOutputTokens = 2048,
    responseSchema,
    thinkingLevel,
    label = 'Gemini Call',
  } = options;

  console.log(`[Gemini] ${label} START`);
  const start = Date.now();
  try {
    const response = await genai.client.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: options.image
            ? [
                { text: prompt },
                {
                  inlineData: {
                    data: options.image.inlineData.data,
                    mimeType: options.image.inlineData.mimeType,
                  },
                },
              ]
            : [{ text: prompt }],
        },
      ],
      config: {
        maxOutputTokens,
        ...(systemInstruction ? { systemInstruction } : {}),
        ...(thinkingLevel
          ? {
              thinkingConfig: model.includes('3.7') || model.includes('3.6')
                ? { thinkingLevel: thinkingLevel as unknown as ThinkingLevel }
                : { thinkingBudget: thinkingLevel === 'MINIMAL' || thinkingLevel === 'LOW' ? 1024 : 2048 }
            }
          : {}),
        ...(responseSchema
          ? {
              responseMimeType: 'application/json',
              responseSchema,
            }
          : {}),
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('[ConceptTwin] Gemini returned an empty response.');
    }
    console.log(`[Gemini] ${label} END ${Date.now() - start}ms`);
    return text;
  } catch (err) {
    const duration = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    const errObj = err as unknown as { status?: unknown; code?: unknown };
    const status = errObj.status || errObj.code || 'N/A';
    console.error(`[Gemini] ${label} ERROR after ${duration}ms\nstatus=${status}\nmessage=${message}`);
    throw err;
  }
}

/**
 * Generate and attempt to parse a JSON response from Gemini.
 * Strips markdown code fences if the model wraps the output.
 */
export async function generateJSON<T>(
  prompt: string,
  options: GenerateOptions = {}
): Promise<T> {
  const raw = await generateText(prompt, {
    ...options,
    model: options.model ?? STRUCTURED_MODEL,
  });

  // Strip markdown code fences that some models add despite instructions.
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  return JSON.parse(cleaned) as T;
}

/**
 * Call Gemini with automatic retries on JSON parse failures.
 *
 * @param userPrompt   The user-turn content.
 * @param systemPrompt System instruction prepended by Gemini.
 * @param maxAttempts  Maximum attempts before rethrowing the last error.
 */
export async function callWithRetry<T>(
  userPrompt: string,
  systemPrompt: string,
  maxAttempts = 2,
  baseOptions: Omit<GenerateOptions, 'systemInstruction'> = {}
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await generateJSON<T>(userPrompt, {
        ...baseOptions,
        systemInstruction: systemPrompt,
      });
    } catch (err) {
      lastError = err;
      
      const message = err instanceof Error ? err.message : String(err);
      const errObj = err as unknown as { status?: unknown; code?: unknown };
      const errStatus = (errObj.status as number) || (errObj.code as number) || 0;
      
      // Do NOT retry permanent errors (400, 401, 403, 404)
      const isPermanent = 
        errStatus === 400 || 
        errStatus === 401 || 
        errStatus === 403 || 
        errStatus === 404 ||
        message.includes('400') ||
        message.includes('401') ||
        message.includes('403') ||
        message.includes('404') ||
        message.includes('INVALID_ARGUMENT') ||
        message.includes('API key');
        
      if (isPermanent) {
        console.error(`[Gemini Retry] Permanent error encountered (status=${errStatus}). Aborting retry. Error: ${message}`);
        throw err;
      }
      
      if (attempt < maxAttempts - 1) {
        const delay = 500 * Math.pow(2, attempt);
        console.warn(`[Gemini Retry] Transient error on attempt ${attempt + 1} (status=${errStatus}): ${message}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error(`[Gemini Retry] Max attempts (${maxAttempts}) exhausted. Final error: ${message}`);
      }
    }
  }
  throw lastError;
}

