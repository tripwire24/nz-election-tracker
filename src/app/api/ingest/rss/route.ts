import { NextResponse } from "next/server";
import { ingestAllFeeds } from "@/lib/ingestion/rss";

/**
 * POST /api/ingest/rss
 * Trigger RSS feed ingestion. Protected by a simple bearer token.
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;

  if (auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await ingestAllFeeds();
  return NextResponse.json({ ok: true, results });
}
