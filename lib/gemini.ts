// The reasoning layer. Server only. Gemini identifies films from vague
// descriptions and returns strict JSON. Google Search grounding is a
// confidence-gated fallback, never the default path.
//
// We call the REST API directly with fetch, so there is no extra SDK.

import type { IdentifyMode, LlmCandidate } from "@/lib/types";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// The free model. Fast, on the free tier, and plenty good for film identification.
export const MODEL = "gemini-2.5-flash-lite";

function apiKey(): string {
  return process.env.GEMINI_API_KEY ?? "";
}

function systemPrompt(mode: IdentifyMode): string {
  if (mode === "recommend") {
    return `You recommend films similar to what the user describes.
Return ONLY a JSON array, no prose, no code fences.
Each item: { "title": string, "year": number, "confidence": number, "reasoning": string }.
Max 6 items, best match first. confidence is 0 to 1. reasoning is one short sentence on why this pick fits the request.`;
  }
  return `You identify films from vague descriptions.
Return ONLY a JSON array, no prose, no code fences.
Each item: { "title": string, "year": number, "confidence": number, "reasoning": string }.
Max 6 items, best match first. confidence is 0 to 1. reasoning is one short sentence on why it fits.`;
}

// Response schema for the first pass, so Gemini returns clean structured JSON.
const RESPONSE_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      title: { type: "STRING" },
      year: { type: "INTEGER" },
      confidence: { type: "NUMBER" },
      reasoning: { type: "STRING" },
    },
    required: ["title", "year", "confidence", "reasoning"],
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
  const res = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${apiKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  return textFrom((await res.json()) as GeminiResponse);
}

export interface IdentifyEngineResult {
  candidates: LlmCandidate[];
  grounded: boolean;
}

// First pass: pure model reasoning with structured JSON, no extra calls.
async function firstPass(
  description: string,
  mode: IdentifyMode,
  model: string,
): Promise<LlmCandidate[]> {
  const text = await callGemini(model, {
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

// Fallback pass: ground with Google Search, then re-rank. Confirms the film
// exists and gets the correct title and year. Never sources watch links.
// Structured output is not allowed alongside tools, so we parse text defensively.
async function groundedPass(
  description: string,
  mode: IdentifyMode,
  model: string,
): Promise<LlmCandidate[]> {
  const text = await callGemini(model, {
    system_instruction: {
      parts: [
        {
          text:
            systemPrompt(mode) +
            `\nUse Google Search to confirm the film exists, searching the user description plus the word "movie". Then return the JSON array only.`,
        },
      ],
    },
    contents: [{ role: "user", parts: [{ text: description }] }],
    tools: [{ google_search: {} }],
    generationConfig: { maxOutputTokens: 1536, temperature: 0.4 },
  });
  return parseCandidates(text);
}

const CONFIDENCE_FLOOR = 0.6;

export async function runIdentify(
  description: string,
  mode: IdentifyMode,
): Promise<IdentifyEngineResult> {
  const model = MODEL;
  const first = await firstPass(description, mode, model);

  const top = first[0]?.confidence ?? 0;
  const needsGrounding = first.length === 0 || top < CONFIDENCE_FLOOR;

  // Recommendations do not need grounding, only identification does.
  if (mode === "identify" && needsGrounding) {
    try {
      const grounded = await groundedPass(description, mode, model);
      if (grounded.length) return { candidates: grounded, grounded: true };
    } catch {
      // If grounding fails, fall back to the first-pass results.
    }
  }

  return { candidates: first, grounded: false };
}
