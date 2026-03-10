/**
 * NZ Election Tracker — Server-side Sentiment Scoring
 *
 * Hybrid approach:
 *   1. AFINN-165 (free, instant) via `sentiment` npm package — handles ~80%
 *   2. Claude Haiku (optional, paid) — handles ambiguous/low-confidence items
 *
 * Runs as a Next.js API route on Vercel — no laptop required.
 */

import Sentiment from "sentiment";
import { createAdminClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContentItem {
  id: string;
  title: string;
  content_text: string | null;
  source_name: string;
  source_type: string;
  published_at: string;
}

interface SentimentResult {
  score: number; // -1.0 to +1.0
  label: "positive" | "negative" | "neutral" | "mixed";
  intensity: number; // 0.0 to 1.0
  confidence: number; // 0.0 to 1.0
  model_version: string;
}

interface ScoredRow {
  content_item_id: string;
  party_id: string | null;
  topic: string | null;
  score: number;
  label: "positive" | "negative" | "neutral" | "mixed";
  intensity: number;
  model_version: string;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Raw AFINN score above this (absolute) → trust it directly */
const HIGH_CONFIDENCE_THRESHOLD = 3;
/** Raw AFINN score below this (absolute) → escalate to Claude if available */
const LOW_CONFIDENCE_THRESHOLD = 1;

/** NZ political party keywords for attribution */
const PARTY_KEYWORDS: Record<string, string[]> = {
  NAT: ["national", "luxon", "christopher luxon", "nicola willis", "national party"],
  LAB: ["labour", "hipkins", "chris hipkins", "labour party"],
  GRN: ["green", "greens", "swarbrick", "chlöe", "chloe swarbrick", "green party"],
  ACT: ["act party", "seymour", "david seymour"],
  NZF: ["nz first", "new zealand first", "winston", "winston peters", "peters"],
  TPM: ["te pāti māori", "te pati maori", "māori party", "maori party", "rawiri waititi"],
  TOP: ["opportunities party"],
  NZL: ["new zealand loyal", "nz loyal"],
};

// ---------------------------------------------------------------------------
// AFINN-165 Sentiment (free, local)
// ---------------------------------------------------------------------------

const analyzer = new Sentiment();

function scoreWithAFINN(text: string): SentimentResult {
  const result = analyzer.analyze(text);

  // Normalize the comparative score (-5 to +5 range, typically -1 to +1)
  const normalized = Math.max(-1, Math.min(1, result.comparative * 2));
  const absScore = Math.abs(result.score);

  let label: SentimentResult["label"];
  if (normalized >= 0.05) label = "positive";
  else if (normalized <= -0.05) label = "negative";
  else label = "neutral";

  // Confidence based on raw score magnitude and word count
  const confidence = Math.min(1, absScore / 10);

  return {
    score: Math.round(normalized * 1000) / 1000,
    label,
    intensity: Math.round(Math.min(Math.abs(normalized), 1) * 100) / 100,
    confidence,
    model_version: "afinn-165-v1",
  };
}

// ---------------------------------------------------------------------------
// Claude Haiku Scoring (optional, paid)
// ---------------------------------------------------------------------------

async function scoreWithClaude(text: string): Promise<SentimentResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "sk-ant-your-key") return null;

  const systemPrompt = `You are a New Zealand political sentiment analyser.
Score the following text on a scale from -1.0 (very negative) to +1.0 (very positive).

Consider NZ-specific context:
- NZ English idioms and slang (e.g. "she'll be right" = neutral/positive)
- Te Reo Māori terms
- Sarcasm and irony common in NZ political discourse
- Kiwi understatement (mild language may carry strong sentiment)

Respond with ONLY a JSON object, no markdown:
{"score": <float>, "label": "<positive|negative|neutral|mixed>", "intensity": <float 0-1>}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 150,
        system: systemPrompt,
        messages: [{ role: "user", content: text.slice(0, 2000) }],
      }),
    });

    if (!response.ok) {
      console.warn(`[Sentiment] Claude API returned ${response.status}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const resultText = data.content?.[0]?.text?.trim();
    if (!resultText) {
      console.warn("[Sentiment] Claude returned empty content");
      return null;
    }

    const parsed = JSON.parse(resultText);
    console.log(`[Sentiment] Claude scored: ${parsed.score} (${parsed.label})`);
    return {
      score: Math.round(parseFloat(parsed.score) * 1000) / 1000,
      label: parsed.label || "neutral",
      intensity: Math.round(parseFloat(parsed.intensity || "0.5") * 100) / 100,
      confidence: 0.9,
      model_version: "claude-haiku-1",
    };
  } catch (err) {
    console.error(`[Sentiment] Claude error: ${err}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Party Attribution
// ---------------------------------------------------------------------------

function detectParties(text: string): string[] {
  const lower = text.toLowerCase();
  const mentioned: string[] = [];
  for (const [code, keywords] of Object.entries(PARTY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      mentioned.push(code);
    }
  }
  return mentioned;
}

// ---------------------------------------------------------------------------
// Main Pipeline
// ---------------------------------------------------------------------------

export async function scoreSentiment(options?: {
  limit?: number;
  useClaude?: boolean;
}): Promise<{
  scored: number;
  afinnCount: number;
  claudeCount: number;
  errors: number;
}> {
  const limit = options?.limit ?? 100;
  const useClaude = options?.useClaude ?? true;
  const supabase = createAdminClient();

  // 1. Load party map (short_name → UUID)
  const { data: parties } = await supabase
    .from("parties")
    .select("id, short_name");
  const partyMap: Record<string, string> = {};
  for (const p of parties || []) {
    partyMap[p.short_name] = p.id;
  }

  // 2. Fetch unscored content items
  //    Left-anti-join: content_items without matching sentiment_scores
  const { data: scoredIds } = await supabase
    .from("sentiment_scores")
    .select("content_item_id");
  const scoredSet = new Set((scoredIds || []).map((r: { content_item_id: string }) => r.content_item_id));

  const { data: items } = await supabase
    .from("content_items")
    .select("id, title, content_text, source_name, source_type, published_at")
    .order("published_at", { ascending: false })
    .limit(limit + scoredSet.size);

  const unscored = (items || []).filter(
    (item: ContentItem) => !scoredSet.has(item.id)
  ).slice(0, limit);

  if (unscored.length === 0) {
    return { scored: 0, afinnCount: 0, claudeCount: 0, errors: 0 };
  }

  // 3. Score each item
  let afinnCount = 0;
  let claudeCount = 0;
  let errors = 0;
  const allRows: ScoredRow[] = [];

  for (const item of unscored as ContentItem[]) {
    try {
      const text = `${item.title || ""} ${item.content_text || ""}`.trim();
      if (!text) continue;

      // Step A: AFINN score (always free & instant)
      const afinnResult = scoreWithAFINN(text);
      let finalResult: SentimentResult = afinnResult;

      // Step B: Escalate to Claude if low confidence and Claude enabled
      // Threshold: AFINN confidence < 0.3 (raw score < 3) → ambiguous, let Claude decide
      if (
        useClaude &&
        afinnResult.confidence < 0.3
      ) {
        const claudeResult = await scoreWithClaude(text);
        if (claudeResult) {
          finalResult = claudeResult;
          claudeCount++;
        } else {
          afinnCount++;
        }
      } else {
        afinnCount++;
      }

      // Step C: Party attribution
      const parties = detectParties(text);

      if (parties.length > 0) {
        for (const code of parties) {
          allRows.push({
            content_item_id: item.id,
            party_id: partyMap[code] || null,
            topic: null,
            score: finalResult.score,
            label: finalResult.label,
            intensity: finalResult.intensity,
            model_version: finalResult.model_version,
          });
        }
      } else {
        allRows.push({
          content_item_id: item.id,
          party_id: null,
          topic: null,
          score: finalResult.score,
          label: finalResult.label,
          intensity: finalResult.intensity,
          model_version: finalResult.model_version,
        });
      }
    } catch {
      errors++;
    }
  }

  // 4. Insert in batches of 50
  const batchSize = 50;
  let inserted = 0;
  for (let i = 0; i < allRows.length; i += batchSize) {
    const batch = allRows.slice(i, i + batchSize);
    const { data } = await supabase
      .from("sentiment_scores")
      .insert(batch);
    // Supabase returns data on success even if null (for inserts without .select())
    inserted += batch.length;
    if (data === null && i === 0) {
      // First batch — verify it actually worked
      const { count } = await supabase
        .from("sentiment_scores")
        .select("id", { count: "exact", head: true })
        .eq("content_item_id", batch[0].content_item_id);
      if (!count) {
        errors += batch.length;
        inserted -= batch.length;
      }
    }
  }

  console.log(`[Sentiment] Pipeline complete: ${inserted} scored (AFINN: ${afinnCount}, Claude: ${claudeCount}, errors: ${errors})`);

  return {
    scored: inserted,
    afinnCount,
    claudeCount,
    errors,
  };
}
