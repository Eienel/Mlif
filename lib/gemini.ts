// The reasoning layer. Server only. Gemini identifies films and TV series from
// vague descriptions and returns strict JSON.
//
// Identify mode always grounds with Google Search (free on Gemini) so confidently
// wrong guesses get corrected against the real web. Recommend mode uses fast
// structured output. We call the REST API directly with fetch, no SDK.

import type { IdentifyMode, LlmCandidate, MediaType } from "@/lib/types";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// The free model. Fast, on the free tier, and plenty good for identification.
export const MODEL = "gemini-2.5-flash-lite";

// Support multiple free keys (different Google projects) to multiply the daily
// quota. Set GEMINI_API_KEY plus GEMINI_API_KEY_2/_3, or a comma-separated
// GEMINI_API_KEYS. We round-robin across them and fall back on rate limits.
function apiKeys(): string[] {
  const raw = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    ...(process.env.GEMINI_API_KEYS?.split(",") ?? []),
  ];
  return [...new Set(raw.map((k) => (k ?? "").trim()).filter(Boolean))];
}

let rrIndex = 0;

const SHAPE = `Each item: { "title": string, "year": number, "type": "movie" | "tv", "confidence": number, "reasoning": string }.
"type" is "tv" for a television series and "movie" for a film. Max 6 items, best match first. confidence is 0 to 1. reasoning is one short sentence.`;

function systemPrompt(mode: IdentifyMode): string {
  if (mode === "recommend") {
    return `You recommend films or TV series similar to what the user describes.
Return ONLY a JSON array, no prose, no code fences.
${SHAPE}`;
  }
  return `You identify films or TV series from vague descriptions. The user may be remembering a movie OR a television show, so consider both.
Return ONLY a JSON array, no prose, no code fences.
${SHAPE}`;
}

// Response schema for the structured (non-grounded) path.
const RESPONSE_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      title: { type: "STRING" },
      year: { type: "INTEGER" },
      type: { type: "STRING", enum: ["movie", "tv"] },
      confidence: { type: "NUMBER" },
      reasoning: { type: "STRING" },
    },
    required: ["title", "year", "type", "confidence", "reasoning"],
  },
} as const;

// Strip stray markdown fences and parse the JSON array defensively.
function parseCandidates(text: string): LlmCandidate[] {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();

  // Isolate the first JSON array if the model wrapped it in any stray prose.
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((c) => c && typeof c.title === "string")
      .slice(0, 6)
      .map((c) => ({
        title: String(c.title),
        year: Number(c.year) || 0,
        mediaType: (c.type === "tv" ? "tv" : "movie") as MediaType,
        confidence: Math.max(0, Math.min(1, Number(c.confidence) || 0)),
        reasoning: typeof c.reasoning === "string" ? c.reasoning : "",
      }));
  } catch {
    return [];
  }
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

function textFrom(json: GeminiResponse): string {
  return (json.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("\n");
}

async function callGemini(model: string, body: Record<string, unknown>): Promise<string> {
  const keys = apiKeys();
  if (keys.length === 0) throw new Error("Gemini 401: no API key configured");

  // Round-robin the starting key to spread load, then fall through to the next
  // key only when one is rate-limited (429).
  const start = rrIndex++ % keys.length;
  let lastStatus = 0;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[(start + i) % keys.length];
    const res = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return textFrom((await res.json()) as GeminiResponse);
    lastStatus = res.status;
    if (res.status !== 429) break; // non-quota error: stop trying other keys
  }
  throw new Error(`Gemini ${lastStatus}`);
}

export interface IdentifyEngineResult {
  candidates: LlmCandidate[];
  grounded: boolean;
}

// Structured pass: fast, no web search. Used for recommendations and as a
// fallback if grounding fails.
async function structuredPass(description: string, mode: IdentifyMode): Promise<LlmCandidate[]> {
  const text = await callGemini(MODEL, {
    system_instruction: { parts: [{ text: systemPrompt(mode) }] },
    contents: [{ role: "user", parts: [{ text: description }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      maxOutputTokens: 1024,
      temperature: 0.4,
    },
  });
  return parseCandidates(text);
}

// Grounded pass: searches the web to confirm the title exists and fix the year,
// which catches confidently-wrong guesses. Structured output is not allowed
// alongside tools, so we parse text defensively.
async function groundedPass(description: string, mode: IdentifyMode): Promise<LlmCandidate[]> {
  const text = await callGemini(MODEL, {
    system_instruction: {
      parts: [
        {
          text:
            systemPrompt(mode) +
            `\nUse Google Search to confirm the title actually exists and to get the correct title, year, and whether it is a movie or TV series. Search the user's description. Then return the JSON array only.`,
        },
      ],
    },
    contents: [{ role: "user", parts: [{ text: description }] }],
    tools: [{ google_search: {} }],
    generationConfig: { maxOutputTokens: 2048, temperature: 0.3 },
  });
  return parseCandidates(text);
}

export async function runIdentify(
  description: string,
  mode: IdentifyMode,
): Promise<IdentifyEngineResult> {
  // Recommendations do not need the web; structured output is faster.
  if (mode === "recommend") {
    return { candidates: await structuredPass(description, mode), grounded: false };
  }

  // Identification grounds first: plot-recall queries fool the model into
  // confident wrong guesses, and a Google Search pass corrects them. With
  // several rotating keys the grounding quota holds up. Fall back to the plain
  // structured pass only if grounding is unavailable (rate-limited).
  try {
    const grounded = await groundedPass(description, mode);
    if (grounded.length) return { candidates: grounded, grounded: true };
  } catch {
    // Grounding unavailable; fall through.
  }
  return { candidates: await structuredPass(description, mode), grounded: false };
}
