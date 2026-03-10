import { NextResponse } from "next/server";
import { ingestAllFeeds } from "@/lib/ingestion/rss";
import { ingestPollingData } from "@/lib/ingestion/polling-scraper";
import { ingestBluesky } from "@/lib/ingestion/bluesky";
import { scoreSentiment } from "@/lib/ingestion/sentiment-scorer";

/**
 * GET /api/cron/ingest
 *
 * Automated ingestion + sentiment scoring endpoint.
 * Called by Vercel Cron Jobs on a schedule — no laptop required.
 *
 * Vercel Cron passes CRON_SECRET as Authorization header automatically.
 * See: https://vercel.com/docs/cron-jobs
 */
export async function GET(request: Request) {
  // Verify Vercel Cron secret (set CRON_SECRET in Vercel env vars)
  const auth = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};
  const startTime = Date.now();

  // 1. RSS feeds — NZ news and political blogs
  try {
    results.rss = await ingestAllFeeds();
  } catch (err) {
    results.rss = { error: String(err) };
  }

  // 2. Wikipedia polling data — NZ election polls
  try {
    results.polls = { pollsInserted: await ingestPollingData() };
  } catch (err) {
    results.polls = { error: String(err) };
  }

  // 3. Bluesky — NZ political social posts (no auth needed)
  try {
    results.bluesky = await ingestBluesky();
  } catch (err) {
    results.bluesky = { error: String(err) };
  }

  // 4. Sentiment scoring — score any new unscored content
  try {
    results.sentiment = await scoreSentiment({ limit: 200, useClaude: true });
  } catch (err) {
    results.sentiment = { error: String(err) };
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  return NextResponse.json({
    ok: true,
    elapsed: `${elapsed}s`,
    timestamp: new Date().toISOString(),
    results,
  });
}
