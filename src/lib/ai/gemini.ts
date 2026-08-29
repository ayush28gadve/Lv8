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
  /** Optional unique request transaction ID */
  requestId?: string;
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
 * Global task queue to execute Gemini requests sequentially with a minimum spacing
 * of 1.5 seconds, avoiding simultaneous concurrent connection bursts.
 */
class GeminiRequestQueue {
  private queue: {
    task: () => Promise<unknown>;
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
  }[] = [];
  private processing = false;
  private lastRequestTime = 0;
  private minSpacingMs = 1500;

  enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        task: fn,
        resolve: resolve as (value: unknown) => void,
        reject: reject as (reason?: unknown) => void,
      });
      this.processNext();
    });
  }

  private async processNext() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const next = this.queue.shift();
      if (!next) continue;

      const now = Date.now();
      const timeSinceLast = now - this.lastRequestTime;
      const waitTime = Math.max(0, this.minSpacingMs - timeSinceLast);

      if (waitTime > 0) {
        console.log(`[Gemini Queue] Delaying next request by ${waitTime}ms to throttle burst limits...`);
        await new Promise((res) => setTimeout(res, waitTime));
      }

      this.lastRequestTime = Date.now();

      try {
        const result = await next.task();
        next.resolve(result);
      } catch (err) {
        next.reject(err);
      }
    }

    this.processing = false;
  }
}

export const globalGeminiQueue = new GeminiRequestQueue();

interface ErrantResponse {
  headers?: Record<string, string> | { get?: (name: string) => string | null };
  response?: {
    headers?: Record<string, string> | { get?: (name: string) => string | null };
  };
  statusText?: {
    headers?: Record<string, string> | { get?: (name: string) => string | null };
  };
}

/**
 * Checks for any retry-after headers or parameters in Google GenAI SDK errors.
 * Returns duration in milliseconds if found, otherwise null.
 */
function getRetryAfterMs(err: unknown): number | null {
  if (!err || typeof err !== 'object') return null;
  const errWithHeaders = err as ErrantResponse;
  const headers = errWithHeaders.headers || errWithHeaders.response?.headers || errWithHeaders.statusText?.headers;
  if (!headers) return null;

  try {
    let retryAfter: string | null = null;
    if ('get' in headers && typeof headers.get === 'function') {
      retryAfter = headers.get('retry-after') || headers.get('Retry-After');
    } else {
      const headersRecord = headers as Record<string, string>;
      retryAfter = headersRecord['retry-after'] || headersRecord['Retry-After'];
    }

    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      if (!isNaN(seconds) && seconds > 0) {
        return seconds * 1000;
      }
    }
  } catch {
    // Suppress header checking exceptions
  }
  return null;
}

/**
 * Centralized wrapper around the Gemini generateContent API.
 * Detects rate limits (429/RESOURCE_EXHAUSTED) and performs up to 2 retries (with 2s and 5s delays).
 * Staggered through a global queue to prevent simultaneous burst calls.
 * Writes detailed server-side logs for auditing.
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
    requestId = Math.random().toString(36).substring(2, 10),
  } = options;

  const maxAttempts = 3; // 1 initial + 2 retries
  let lastError: unknown;

  // Enqueue the request to run sequentially with space throttling
  return globalGeminiQueue.enqueue(async () => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const start = Date.now();
      const startTimestamp = new Date().toISOString();
      console.log(`[Gemini Request Log] [${requestId}] [${label}] Attempt ${attempt}/${maxAttempts} START | Model=${model} | Time=${startTimestamp}`);

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

        const duration = Date.now() - start;
        console.log(`[Gemini Request Log] [${requestId}] [${label}] Attempt ${attempt} SUCCESS | Duration=${duration}ms`);
        return text;
      } catch (err) {
        lastError = err;
        const duration = Date.now() - start;
        const message = err instanceof Error ? err.message : String(err);
        const errObj = err as unknown as { status?: unknown; code?: unknown };
        const errStatus = (errObj.status as number) || (errObj.code as number) || 0;

        const isRateLimit =
          errStatus === 429 ||
          message.includes('429') ||
          message.toUpperCase().includes('RESOURCE_EXHAUSTED') ||
          message.toUpperCase().includes('RATE_LIMIT') ||
          message.toUpperCase().includes('QUOTA');

        console.error(
          `[Gemini Request Log] [${requestId}] [${label}] Attempt ${attempt} FAILURE | ` +
          `Duration=${duration}ms | HTTP Code=${errStatus || 'N/A'} | Is429=${isRateLimit} | Error="${message}"`
        );

        if (isRateLimit && attempt < maxAttempts) {
          // Check for header-provided delay first, otherwise back off 2s / 5s
          const headerDelay = getRetryAfterMs(err);
          const delayMs = headerDelay ?? (attempt === 1 ? 2000 : 5000);
          
          console.warn(
            `[Gemini Rate Limit] [${requestId}] [${label}] model="${model}" received rate limit/quota warning. ` +
            `Retrying in ${delayMs}ms (retry-after source: ${headerDelay ? 'Header' : 'Exponential Backoff'})...`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          throw err;
        }
      }
    }
    throw lastError;
  });
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
      
      // Do NOT retry permanent errors (400, 401, 403, 404) or rate limit errors (429) inside JSON parse retry
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
        
      const isRateLimit =
        errStatus === 429 ||
        message.includes('429') ||
        message.toUpperCase().includes('RESOURCE_EXHAUSTED') ||
        message.toUpperCase().includes('RATE_LIMIT') ||
        message.toUpperCase().includes('QUOTA');
        
      if (isPermanent || isRateLimit) {
        console.error(`[Gemini Retry] Error requires immediate abort (status=${errStatus}, rateLimit=${isRateLimit}). Aborting retry. Error: ${message}`);
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

