/**
 * Gemini AI Client
 * Central module for interacting with the Google Gemini API via @google/genai SDK.
 *
 * Design principle: This module is the only place in the codebase that imports
 * and configures the Gemini SDK. All agents depend on this module, so swapping
 * the LLM provider only requires changes here.
 */

import { GoogleGenAI } from '@google/genai';

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

/**
 * Primary reasoning model – used for evaluation and diagnosis.
 * Flash models are preferred for latency-sensitive demo workloads.
 */
export const PRIMARY_MODEL = 'gemini-2.0-flash';

/**
 * Structured output model – used when strict JSON schema compliance is required
 * (twin generation, verification output parsing).
 */
export const STRUCTURED_MODEL = 'gemini-2.0-flash';

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
  /** Temperature (0–2). Lower = more deterministic. */
  temperature?: number;
}

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
    temperature = 0.4,
  } = options;

  const response = await genai.client.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    ...(systemInstruction
      ? { systemInstruction: { parts: [{ text: systemInstruction }] } }
      : {}),
    config: {
      maxOutputTokens,
      temperature,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('[ConceptTwin] Gemini returned an empty response.');
  }
  return text;
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
 * On each retry the temperature is raised slightly to break repetition loops.
 *
 * @param userPrompt   The user-turn content.
 * @param systemPrompt System instruction prepended by Gemini.
 * @param maxAttempts  Maximum attempts before rethrowing the last error.
 */
export async function callWithRetry<T>(
  userPrompt: string,
  systemPrompt: string,
  maxAttempts = 3,
  baseOptions: Omit<GenerateOptions, 'systemInstruction'> = {}
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await generateJSON<T>(userPrompt, {
        ...baseOptions,
        systemInstruction: systemPrompt,
        temperature: (baseOptions.temperature ?? 0.2) + attempt * 0.1,
      });
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

