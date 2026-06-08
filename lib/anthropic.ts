// The reasoning layer. Server only. Anthropic identifies films from vague
// descriptions and returns strict JSON. Web grounding is a confidence-gated
// fallback, never the default path.

import Anthropic from "@anthropic-ai/sdk";
import type { IdentifyMode, LlmCandidate } from "@/lib/types";

// Quality default for identification. The free tier can run the faster model.
export const MODEL_PRO = "claude-sonnet-4-6";
export const MODEL_FREE = "claude-haiku-4-5-20251001";

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
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

function textFromMessage(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

export interface IdentifyEngineResult {
  candidates: LlmCandidate[];
  grounded: boolean;
}

// First pass: pure trained reasoning, no extra calls. Handles well-known films.
async function firstPass(
  description: string,
  mode: IdentifyMode,
  model: string,
): Promise<LlmCandidate[]> {
  const message = await anthropic().messages.create({
    model,
    max_tokens: 1024,
    system: systemPrompt(mode),
    messages: [{ role: "user", content: description }],
  });
  return parseCandidates(textFromMessage(message));
}

// Fallback pass: ground with Anthropic's built-in web search, then re-rank.
// Used only to confirm the film exists, never to source watch links.
async function groundedPass(
  description: string,
  mode: IdentifyMode,
  model: string,
): Promise<LlmCandidate[]> {
  const message = await anthropic().messages.create({
    model,
    max_tokens: 1536,
    system:
      systemPrompt(mode) +
      `\nYou may use web search to confirm the film exists and get the correct title and year. Use the search query: the user description plus the word "movie". After searching, return the JSON array only.`,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 3,
      } as unknown as Anthropic.Tool,
    ],
    messages: [{ role: "user", content: description }],
  });
  return parseCandidates(textFromMessage(message));
}

const CONFIDENCE_FLOOR = 0.6;

export async function runIdentify(
  description: string,
  mode: IdentifyMode,
  isPro: boolean,
): Promise<IdentifyEngineResult> {
  const model = isPro ? MODEL_PRO : MODEL_FREE;
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
