import { NextRequest, NextResponse } from 'next/server';
import { callWithRetry, HANDWRITING_ANALYSIS_RESPONSE_SCHEMA } from '@/lib/ai/gemini';
import {
  HandwritingAnalysisRequestSchema,
  HandwritingAnalysisResultSchema,
  type HandwritingAnalysisResult,
} from '@/lib/api/types';

// System prompt for Gemini Vision transcription & analysis
const HANDWRITING_ANALYSIS_SYSTEM_PROMPT = `You are an expert Physics handwriting analysis AI.
Your task is to analyze an image of a student's handwritten solution to a physics problem and transcribe the steps, mathematical working, and final answer into a structured JSON format.

Below is the physics problem context that the student is solving:
---
[PROBLEM STATEMENT]
{{question}}
---

Guidelines:
1. Examine the image carefully. Identify all equations, step-by-step calculations, and final numeric answers written by the student.
2. Transcribe the step-by-step working into "extractedWorking" in clean, readable plain text/markdown.
3. Transcribe the student's final numerical or textual answer into "extractedFinalAnswer". It must match what is written in the handwriting.
4. Compile a list of the physical formulas or equations identified in the image and return it in "detectedEquations".
5. Break down the logical flow of the student's solution into a list of strings in "reasoningSteps".
6. Estimate your confidence in the transcription accuracy as a value from 0.0 to 1.0 in "confidence".
7. Describe any unreadable, blurry, dark, cut-off, or smudged regions in "unclearRegions".
8. CRITICAL: If the image quality is too poor, extremely blurry, unreadable, or does not contain a relevant physics solution, set "isImageUnclear" to true. In this case, do NOT guess the student's working or answer. Leave "extractedWorking" and "extractedFinalAnswer" empty, and explain the issue in "unclearRegions".
`;

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = HandwritingAnalysisRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      const detail = parsed.error.issues
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      return NextResponse.json(
        { ok: false, error: `Invalid payload: ${detail}` },
        { status: 400 }
      );
    }

    const { image, mimeType, question } = parsed.data;

    // Normalize base64 data by stripping data URL headers if present
    const base64Match = image.match(/^data:([^;]+);base64,(.*)$/);
    const normalizedBase64 = base64Match ? base64Match[2] : image;
    const normalizedMimeType = base64Match ? base64Match[1] : mimeType;

    // Inject question statement into system instruction
    const systemPrompt = HANDWRITING_ANALYSIS_SYSTEM_PROMPT.replace('{{question}}', question);

    console.log('[Handwriting API] Invoking Gemini Vision model...');
    const result = await callWithRetry<HandwritingAnalysisResult>(
      'Analyze the attached handwritten physics solution image and extract the step-by-step working and final answer according to the schema instructions.',
      systemPrompt,
      2, // Retries
      {
        maxOutputTokens: 2048,
        responseSchema: HANDWRITING_ANALYSIS_RESPONSE_SCHEMA,
        thinkingLevel: 'LOW',
        label: 'Handwriting Analysis',
        image: {
          inlineData: {
            data: normalizedBase64,
            mimeType: normalizedMimeType,
          },
        },
      }
    );

    // Validate the result using Zod
    const validatedResult = HandwritingAnalysisResultSchema.parse(result);

    return NextResponse.json({ ok: true, data: validatedResult });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Handwriting API] Error:', message);
    return NextResponse.json(
      { ok: false, error: `Failed to analyze image: ${message}` },
      { status: 500 }
    );
  }
}
