import { NextResponse } from "next/server";
import { ingestAllFeeds } from "@/lib/ingestion/rss";
import { ingestPollingData } from "@/lib/ingestion/polling-scraper";
import { ingestBluesky } from "@/lib/ingestion/bluesky";
import { scoreSentiment } from "@/lib/ingestion/sentiment-scorer";

/**
 * GET /api/ingest/all
 * Trigger ALL ingestion pipelines at once. Dev mode only.
 * In production, use POST with bearer token auth.
 */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "GET only available in development" }, { status: 403 });
  }

  const results: Record<string, unknown> = {};
  const startTime = Date.now();

  // 1. RSS feeds
  try {
    results.rss = await ingestAllFeeds();
  } catch (err) {
    results.rss = { error: String(err) };
  }

  // 2. Wikipedia polling data
  try {
    results.polls = { pollsInserted: await ingestPollingData() };
  } catch (err) {
    results.polls = { error: String(err) };
  }

  // 3. Bluesky social posts
  try {
    results.bluesky = await ingestBluesky();
  } catch (err) {
    results.bluesky = { error: String(err) };
  }

  // 4. Sentiment scoring on all new content
  try {
    results.sentiment = await scoreSentiment({ limit: 200, useClaude: false });
  } catch (err) {
    results.sentiment = { error: String(err) };
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  return NextResponse.json({
    ok: true,
    elapsed: `${elapsed}s`,
    results,
  });
}

/**
 * POST /api/ingest/all
 * Production-safe endpoint with bearer token auth.
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;

  if (auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};
  const startTime = Date.now();

  try {
    results.rss = await ingestAllFeeds();
  } catch (err) {
    results.rss = { error: String(err) };
  }

  try {
    results.polls = { pollsInserted: await ingestPollingData() };
  } catch (err) {
    results.polls = { error: String(err) };
  }

  try {
    results.bluesky = await ingestBluesky();
  } catch (err) {
    results.bluesky = { error: String(err) };
  }

  try {
    results.sentiment = await scoreSentiment({ limit: 200, useClaude: true });
  } catch (err) {
    results.sentiment = { error: String(err) };
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  return NextResponse.json({
    ok: true,
    elapsed: `${elapsed}s`,
    results,
  });
}
