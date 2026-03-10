/**
 * Bluesky Social Ingestion — fetches NZ political posts from Bluesky.
 * Uses authenticated access (app password) when credentials are configured,
 * otherwise falls back to the public API.
 * Designed to run server-side (API route or cron job).
 */

import { createAdminClient } from "@/lib/supabase/server";

/** Bluesky API base URLs */
const BSKY_PUBLIC_API = "https://public.api.bsky.app";
const BSKY_AUTH_API = "https://bsky.social";

/** Cached auth session for the lifetime of a single invocation */
let cachedAuthToken: string | null = null;

/** Search terms for NZ political content */
const SEARCH_QUERIES = [
  "nzpol",
  "nzpolitics",
  "New Zealand election",
  "New Zealand politics",
  "Christopher Luxon",
  "Chris Hipkins",
  "Chlöe Swarbrick",
  "David Seymour",
  "Winston Peters",
  "Te Pāti Māori",
  "NZ Labour",
  "NZ National",
  "NZ Greens",
  "ACT Party NZ",
  "NZ First",
];

interface BlueskyPost {
  uri: string;
  cid: string;
  author: {
    did: string;
    handle: string;
    displayName?: string;
  };
  record: {
    text: string;
    createdAt: string;
    langs?: string[];
  };
  likeCount?: number;
  repostCount?: number;
  replyCount?: number;
  indexedAt: string;
}

interface BlueskySearchResponse {
  posts: BlueskyPost[];
  cursor?: string;
}

/**
 * Create an authenticated session with Bluesky using app password.
 * Returns an access token, or null if credentials aren't configured.
 */
async function getAuthToken(): Promise<string | null> {
  if (cachedAuthToken) return cachedAuthToken;

  const handle = process.env.BLUESKY_HANDLE;
  const appPassword = process.env.BLUESKY_APP_PASSWORD;

  if (!handle || !appPassword) return null;

  try {
    const res = await fetch(`${BSKY_AUTH_API}/xrpc/com.atproto.server.createSession`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: handle, password: appPassword }),
    });

    if (!res.ok) {
      console.error(`[Bluesky] Auth failed: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    cachedAuthToken = data.accessJwt;
    console.log(`[Bluesky] Authenticated as ${handle}`);
    return cachedAuthToken;
  } catch (err) {
    console.error(`[Bluesky] Auth error: ${err}`);
    return null;
  }
}

/**
 * Search Bluesky for posts matching a query.
 * Uses authenticated API if credentials are available, otherwise public API.
 */
async function searchBluesky(
  query: string,
  limit: number = 25,
  cursor?: string,
): Promise<BlueskySearchResponse> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    sort: "latest",
  });
  if (cursor) params.set("cursor", cursor);

  const token = await getAuthToken();
  const baseUrl = token ? BSKY_AUTH_API : BSKY_PUBLIC_API;
  const url = `${baseUrl}/xrpc/app.bsky.feed.searchPosts?${params}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": "NZElectionTracker/1.0",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, { headers });

    if (!res.ok) {
      console.error(`[Bluesky] Search failed for "${query}": ${res.status} ${res.statusText}`);
      return { posts: [] };
    }

    return await res.json();
  } catch (err) {
    console.error(`[Bluesky] Network error searching "${query}": ${err}`);
    return { posts: [] };
  }
}

/** Convert a Bluesky post URI to a web URL */
function postUriToUrl(uri: string, handle: string): string {
  // URI format: at://did:plc:xxx/app.bsky.feed.post/rkey
  const parts = uri.split("/");
  const rkey = parts[parts.length - 1];
  return `https://bsky.app/profile/${handle}/post/${rkey}`;
}

/** Simple keyword-based topic detection (shared logic with RSS) */
function detectTopics(text: string): string[] {
  const lower = text.toLowerCase();
  const topics: string[] = [];

  const topicKeywords: Record<string, string[]> = {
    housing:        ["housing", "house prices", "rent", "landlord", "tenant", "reinz", "property"],
    cost_of_living: ["cost of living", "inflation", "grocery", "petrol", "food prices", "cpi"],
    crime:          ["crime", "police", "gang", "ram raid", "burglary", "assault", "prison"],
    health:         ["health", "hospital", "nurse", "doctor", "pharmac", "mental health"],
    education:      ["education", "school", "teacher", "university", "student", "ncea"],
    climate:        ["climate", "emissions", "carbon", "environment", "ets", "renewable"],
    treaty:         ["treaty", "te tiriti", "waitangi", "co-governance", "māori rights"],
    immigration:    ["immigration", "migrant", "visa", "refugee"],
    economy:        ["economy", "gdp", "recession", "growth", "unemployment", "ocr"],
    tax:            ["tax", "gst", "income tax", "capital gains"],
    transport:      ["transport", "road", "rail", "bus", "cycling", "infrastructure"],
    defence:        ["defence", "defense", "military", "nzdf", "aukus"],
  };

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      topics.push(topic);
    }
  }

  return topics;
}

/** Normalise a Bluesky post into our content_items shape */
function normalisePost(post: BlueskyPost) {
  const webUrl = postUriToUrl(post.uri, post.author.handle);
  const text = post.record.text || "";

  // Sanitise engagement numbers — guard against NaN / undefined / Infinity
  const safeLikes = Number.isFinite(post.likeCount) ? post.likeCount : 0;
  const safeReposts = Number.isFinite(post.repostCount) ? post.repostCount : 0;
  const safeReplies = Number.isFinite(post.replyCount) ? post.replyCount : 0;

  const topics = detectTopics(text);

  return {
    title: text.slice(0, 120) + (text.length > 120 ? "…" : ""),
    excerpt: text.slice(0, 500),
    content_text: text.slice(0, 10000),
    source_url: webUrl,
    source_name: "Bluesky",
    source_type: "social" as const,
    author: (post.author.displayName || post.author.handle || "").slice(0, 500),
    published_at: post.record.createdAt || post.indexedAt,
    topics: topics.length > 0 ? topics : null,
    engagement_metrics: JSON.parse(JSON.stringify({
      likes: safeLikes,
      reposts: safeReposts,
      replies: safeReplies,
    })),
  };
}

/**
 * Ingest Bluesky posts for all configured search queries.
 * Returns count of new items inserted.
 */
export async function ingestBluesky(): Promise<{ total: number; byQuery: Record<string, number> }> {
  const supabase = createAdminClient();
  const byQuery: Record<string, number> = {};
  let total = 0;

  for (const query of SEARCH_QUERIES) {
    const { posts } = await searchBluesky(query, 25);

    if (posts.length === 0) {
      byQuery[query] = 0;
      continue;
    }

    // Filter to English/unspecified language posts (skip non-English)
    const filtered = posts.filter((p) => {
      const langs = p.record.langs;
      if (!langs || langs.length === 0) return true;
      return langs.some((l) => l.startsWith("en"));
    });

    const items = filtered.map(normalisePost);

    if (items.length === 0) {
      byQuery[query] = 0;
      continue;
    }

    // Upsert — source_url is our dedupe key
    const { data, error } = await supabase
      .from("content_items")
      .upsert(items, { onConflict: "source_url", ignoreDuplicates: true })
      .select("id");

    if (error) {
      console.error(`[Bluesky] DB error for query "${query}": ${error.message}`);
      byQuery[query] = 0;
      continue;
    }

    const count = data?.length || 0;
    byQuery[query] = count;
    total += count;

    // Rate limiting: small delay between queries to be polite
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log(`[Bluesky] Ingestion complete: ${total} new posts`, byQuery);
  return { total, byQuery };
}
