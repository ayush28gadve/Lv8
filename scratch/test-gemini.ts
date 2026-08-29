import fs from 'fs';
import path from 'path';
import { genai } from '../src/lib/ai/gemini';

// Load .env.local manually
try {
  const envPath = path.resolve(__dirname, '../.env.local');
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
} catch (e) {
  console.log('No .env.local found');
}

async function run() {
  const models = ['gemini-3.7-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
  for (const model of models) {
    const start = Date.now();
    try {
      console.log(`Calling ${model}...`);
      const r = await genai.client.models.generateContent({
        model,
        contents: 'List 3 fruits',
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'ARRAY',
            items: { type: 'STRING' }
          }
        }
      });
      console.log(`Success ${model} in ${Date.now() - start}ms:`, r.text);
    } catch (err) {
      console.log(`Fail ${model} in ${Date.now() - start}ms:`, err instanceof Error ? err.message : err);
    }
  }
}

run();
