import { NextResponse } from "next/server";
import { ingestPollingData } from "@/lib/ingestion/polling-scraper";

/**
 * POST /api/ingest/polls
 * Trigger polling data ingestion from Wikipedia. Protected by bearer token.
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;

  if (auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await ingestPollingData();
  return NextResponse.json({ ok: true, pollsInserted: count });
}

/**
 * GET /api/ingest/polls
 * Convenience endpoint for testing in browser (dev mode only).
 */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "GET only available in development" }, { status: 403 });
  }

  const count = await ingestPollingData();
  return NextResponse.json({ ok: true, pollsInserted: count });
}
