import { NextResponse } from "next/server";
import { scoreSentiment } from "@/lib/ingestion/sentiment-scorer";

/**
 * POST /api/ingest/sentiment
 * Run sentiment scoring on unscored content_items.
 * Protected by bearer token (service role key).
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;

  if (auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const result = await scoreSentiment({ limit: 200, useClaude: true });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    return NextResponse.json({
      ok: true,
      elapsed: `${elapsed}s`,
      ...result,
    });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 },
    );
  }
}

/**
 * GET /api/ingest/sentiment
 * Convenience endpoint for testing in browser (dev only).
 */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "GET only available in development" },
      { status: 403 },
    );
  }

  const startTime = Date.now();

  try {
    const result = await scoreSentiment({ limit: 50, useClaude: false });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    return NextResponse.json({
      ok: true,
      elapsed: `${elapsed}s`,
      ...result,
    });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 },
    );
  }
}
