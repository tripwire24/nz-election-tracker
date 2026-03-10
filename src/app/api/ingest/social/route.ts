import { NextResponse } from "next/server";
import { ingestBluesky } from "@/lib/ingestion/bluesky";

/**
 * POST /api/ingest/social
 * Trigger social media ingestion (Bluesky + Reddit when available).
 * Protected by bearer token (service role key).
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;

  if (auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  // Bluesky — always available (no auth needed)
  try {
    results.bluesky = await ingestBluesky();
  } catch (err) {
    results.bluesky = { error: String(err) };
  }

  // Reddit — only if credentials are configured
  if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_ID !== "your-client-id") {
    results.reddit = { status: "configured but not yet implemented in TypeScript" };
    // TODO: Add Reddit ingestion when API access is approved
  } else {
    results.reddit = { status: "not configured — awaiting API approval" };
  }

  return NextResponse.json({ ok: true, results });
}

/**
 * GET /api/ingest/social
 * Convenience endpoint for testing in browser.
 * Only works in development mode.
 */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "GET only available in development" }, { status: 403 });
  }

  const results: Record<string, unknown> = {};

  try {
    results.bluesky = await ingestBluesky();
  } catch (err) {
    results.bluesky = { error: String(err) };
  }

  return NextResponse.json({ ok: true, results });
}
