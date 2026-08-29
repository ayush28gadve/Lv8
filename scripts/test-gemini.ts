import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

// Load .env.local manually
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        if (key && !key.startsWith('#')) {
          process.env[key] = val;
        }
      }
    });
  }
} catch (e) {
  console.error('Error loading .env.local:', e);
}

const MODEL_NAME = 'gemini-3.6-flash';

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('ERROR: GEMINI_API_KEY is not set in the environment.');
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });
  const start = Date.now();

  try {
    console.log(`[Smoke Test] Sending minimal prompt to ${MODEL_NAME}...`);
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: 'Reply with exactly: GEMINI_OK',
    });

    const duration = Date.now() - start;
    const reply = response.text?.trim();

    if (reply === 'GEMINI_OK') {
      console.log(`[Smoke Test] SUCCESS: Received correct response in ${duration}ms.`);
      process.exit(0);
    } else {
      console.log(`[Smoke Test] PARTIAL SUCCESS: Received response in ${duration}ms, but content was: "${reply}"`);
      process.exit(0);
    }
  } catch (err) {
    const duration = Date.now() - start;
    console.error(`[Smoke Test] FAILURE after ${duration}ms:`);
    if (err instanceof Error) {
      console.error(`Message: ${err.message}`);
      const errObj = err as unknown as { status?: unknown; code?: unknown };
      const details = errObj.status || errObj.code;
      if (details) {
        console.error(`Details: ${details}`);
      }
    } else {
      console.error(String(err));
    }
    process.exit(1);
  }
}

run();
