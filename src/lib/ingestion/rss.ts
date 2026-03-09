/**
 * RSS Feed Ingestion — fetches and normalises NZ political content from RSS sources.
 * Designed to run server-side (Edge Function, API route, or cron job).
 */

import Parser from "rss-parser";
import { createAdminClient } from "@/lib/supabase/server";

const parser = new Parser({
  timeout: 10000,
  headers: { "User-Agent": "NZElectionTracker/1.0 (RSS Aggregator)" },
});

export interface RSSFeedConfig {
  name: string;
  url: string;
  sourceType: "official" | "media" | "blog";
}

/** NZ political RSS feeds to ingest */
export const RSS_FEEDS: RSSFeedConfig[] = [
  // Official government
  { name: "Beehive",            url: "https://www.beehive.govt.nz/rss.xml",                    sourceType: "official" },

  // Media
  { name: "RNZ - Political",    url: "https://www.rnz.co.nz/rss/political.xml",                sourceType: "media" },
  { name: "RNZ - News",         url: "https://www.rnz.co.nz/rss/national.xml",                 sourceType: "media" },
  { name: "Stuff - Politics",   url: "https://www.stuff.co.nz/rss/politics",                   sourceType: "media" },
  { name: "Newsroom",           url: "https://newsroom.co.nz/rss",                             sourceType: "media" },
  { name: "The Spinoff",        url: "https://thespinoff.co.nz/feed",                          sourceType: "media" },
  { name: "Interest.co.nz",     url: "https://www.interest.co.nz/rss.xml",                     sourceType: "media" },
  { name: "Scoop - Parliament", url: "https://www.scoop.co.nz/rss/parliament.rss",             sourceType: "media" },

  // Political blogs
  { name: "Kiwiblog",           url: "https://www.kiwiblog.co.nz/feed",                        sourceType: "blog" },
  { name: "The Standard",       url: "https://thestandard.org.nz/feed/",                       sourceType: "blog" },
  { name: "The Daily Blog",     url: "https://thedailyblog.co.nz/feed/",                       sourceType: "blog" },
  { name: "Pundit",             url: "https://www.pundit.co.nz/rss",                           sourceType: "blog" },
];

/** Normalise an RSS item into our content_items shape */
function normaliseItem(item: Parser.Item, feed: RSSFeedConfig) {
  const publishedAt = item.pubDate
    ? new Date(item.pubDate).toISOString()
    : new Date().toISOString();

  // Strip HTML from content for plain-text sentiment analysis
  const rawContent = (item as Record<string, unknown>)["content:encoded"] as string || item.content || item.contentSnippet || "";
  const plainText = rawContent.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  return {
    title: (item.title || "Untitled").slice(0, 500),
    excerpt: (item.contentSnippet || plainText).slice(0, 500),
    content_text: plainText.slice(0, 10000),
    source_url: item.link || "",
    source_name: feed.name,
    source_type: feed.sourceType,
    author: (item as Record<string, unknown>)["dc:creator"] as string || item.creator || null,
    published_at: publishedAt,
    topics: detectTopics(item.title || "", plainText),
  };
}

/** Simple keyword-based topic detection (will be replaced with NLP later) */
function detectTopics(title: string, text: string): string[] {
  const combined = `${title} ${text}`.toLowerCase();
  const topics: string[] = [];

  const topicKeywords: Record<string, string[]> = {
    housing:          ["housing", "house prices", "rent", "landlord", "tenant", "reinz", "property"],
    cost_of_living:   ["cost of living", "inflation", "grocery", "petrol", "food prices", "cpi"],
    crime:            ["crime", "police", "gang", "ram raid", "burglary", "assault", "prison"],
    health:           ["health", "hospital", "nurse", "doctor", "pharmac", "mental health", "covid"],
    education:        ["education", "school", "teacher", "university", "student", "ncea"],
    climate:          ["climate", "emissions", "carbon", "environment", "ets", "renewable"],
    treaty:           ["treaty", "te tiriti", "waitangi", "co-governance", "māori rights"],
    immigration:      ["immigration", "migrant", "visa", "refugee", "deportation"],
    economy:          ["economy", "gdp", "recession", "growth", "employment", "unemployment", "ocr"],
    tax:              ["tax", "gst", "income tax", "capital gains"],
    transport:        ["transport", "road", "rail", "bus", "cycling", "infrastructure"],
    defence:          ["defence", "defense", "military", "nzdf", "aukus"],
  };

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some((kw) => combined.includes(kw))) {
      topics.push(topic);
    }
  }

  return topics;
}

/** Ingest a single RSS feed — returns count of new items inserted */
export async function ingestFeed(feed: RSSFeedConfig): Promise<number> {
  const supabase = createAdminClient();

  let parsed;
  try {
    parsed = await parser.parseURL(feed.url);
  } catch (err) {
    console.error(`[RSS] Failed to fetch ${feed.name}: ${err}`);
    return 0;
  }

  const items = (parsed.items || [])
    .filter((item) => item.link)
    .map((item) => normaliseItem(item, feed));

  if (items.length === 0) return 0;

  // Upsert — source_url is our dedupe key
  const { data, error } = await supabase
    .from("content_items")
    .upsert(items, { onConflict: "source_url", ignoreDuplicates: true })
    .select("id");

  if (error) {
    console.error(`[RSS] DB error for ${feed.name}: ${error.message}`);
    return 0;
  }

  return data?.length || 0;
}

/** Ingest all configured RSS feeds */
export async function ingestAllFeeds(): Promise<Record<string, number>> {
  const results: Record<string, number> = {};

  for (const feed of RSS_FEEDS) {
    results[feed.name] = await ingestFeed(feed);
  }

  console.log("[RSS] Ingestion complete:", results);
  return results;
}
