import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/ingest/cleanup
 * Remove non-NZ Bluesky posts from the database.
 * Protected by bearer token (service role key).
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;

  if (auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return await runCleanup();
}

/**
 * GET /api/ingest/cleanup — dev-only convenience endpoint
 */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "GET only available in development" }, { status: 403 });
  }
  return await runCleanup();
}

async function runCleanup() {
  const supabase = createAdminClient();

  // Fetch all Bluesky content items
  const { data: items, error: fetchError } = await supabase
    .from("content_items")
    .select("id, title, content_text, source_url")
    .eq("source_name", "Bluesky");

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!items || items.length === 0) {
    return NextResponse.json({ ok: true, checked: 0, removed: 0 });
  }

  // NZ relevance signals
  const nzSignals = [
    "nzpol", "nzpolitics", "new zealand", "aotearoa",
    "luxon", "hipkins", "swarbrick", "seymour", "winston peters",
    "te pāti", "te pati", "māori party", "maori party",
    "nz labour", "nz national", "nz greens", "act party nz", "nz first",
    "beehive", "parliament nz", "wellington", "auckland",
    "christchurch", "dunedin", "hamilton", "tauranga", "rotorua",
    "palmerston north", "napier", "hastings", "queenstown",
    "electorate", "mmp", "rnz", "stuff.co.nz", "newshub", "1news",
    "ardern", "clark", "kiwi", "kiwis", "#nzpol",
  ];

  // Find items that don't contain ANY NZ signal
  const toRemove: string[] = [];
  for (const item of items) {
    const text = `${item.title || ""} ${item.content_text || ""}`.toLowerCase();
    const hasNZContext = nzSignals.some((s) => text.includes(s));
    if (!hasNZContext) {
      toRemove.push(item.id);
    }
  }

  if (toRemove.length === 0) {
    return NextResponse.json({ ok: true, checked: items.length, removed: 0 });
  }

  // Delete sentiment scores first (foreign key), then content items
  const { error: sentErr } = await supabase
    .from("sentiment_scores")
    .delete()
    .in("content_item_id", toRemove);

  if (sentErr) {
    console.error(`[Cleanup] Sentiment delete error: ${sentErr.message}`);
  }

  const { error: delErr } = await supabase
    .from("content_items")
    .delete()
    .in("id", toRemove);

  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    checked: items.length,
    removed: toRemove.length,
    remaining: items.length - toRemove.length,
  });
}
