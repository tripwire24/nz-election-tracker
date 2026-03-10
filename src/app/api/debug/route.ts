import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/debug
 *
 * Diagnostic endpoint — checks Supabase connectivity, table existence,
 * row counts, env vars, and RSS/Bluesky reachability.
 *
 * TODO: Remove or lock down before going live.
 */
export async function GET() {
  const checks: Record<string, unknown> = {};

  // 1. Check env vars are set (without revealing values)
  checks.env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "sk-ant-your-key",
    BLUESKY_HANDLE: !!process.env.BLUESKY_HANDLE,
    BLUESKY_APP_PASSWORD: !!process.env.BLUESKY_APP_PASSWORD,
    CRON_SECRET: !!process.env.CRON_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  };

  // 2. Test Supabase connection — try raw fetch first, then JS client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  // Show the actual URL being used (safe — it's public anyway)
  checks.supabase_url = supabaseUrl;
  checks.anon_key_length = anonKey?.length;
  checks.service_key_length = serviceKey?.length;

  // 2a. Raw fetch to Supabase REST API (bypasses JS client to isolate the issue)
  try {
    const rawRes = await fetch(`${supabaseUrl}/rest/v1/parties?select=id,short_name&limit=3`, {
      headers: {
        "apikey": anonKey!,
        "Authorization": `Bearer ${anonKey}`,
      },
      signal: AbortSignal.timeout(10000),
    });
    const rawText = await rawRes.text();
    checks.raw_fetch = {
      status: rawRes.status,
      ok: rawRes.ok,
      body: rawText.slice(0, 500),
    };
  } catch (err: any) {
    checks.raw_fetch = {
      error: String(err),
      cause: err?.cause ? String(err.cause) : undefined,
    };
  }

  // 2b. JS client test (with service role key)
  if (supabaseUrl && serviceKey) {
    const supabase = createClient(supabaseUrl, serviceKey);
    try {
      const { data, error } = await supabase
        .from("parties")
        .select("id, short_name")
        .limit(3);
      checks.js_client = {
        data: data,
        error: error ? { message: error.message, code: error.code, details: error.details } : null,
      };
    } catch (err: any) {
      checks.js_client = {
        error: String(err),
        cause: err?.cause ? String(err.cause) : undefined,
      };
    }
  }

  // 3. Test RSS feed reachability (just one to check)
  try {
    const rssRes = await fetch("https://www.rnz.co.nz/rss/political.xml", {
      headers: { "User-Agent": "NZElectionTracker/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    checks.rss_test = {
      url: "rnz.co.nz/rss/political.xml",
      status: rssRes.status,
      ok: rssRes.ok,
      contentType: rssRes.headers.get("content-type"),
    };
  } catch (err) {
    checks.rss_test = { error: String(err) };
  }

  // 4. Test Bluesky auth
  try {
    const bskyHandle = process.env.BLUESKY_HANDLE;
    const bskyPassword = process.env.BLUESKY_APP_PASSWORD;

    if (!bskyHandle || !bskyPassword) {
      checks.bluesky_auth = { error: "Missing BLUESKY_HANDLE or BLUESKY_APP_PASSWORD" };
    } else {
      const bskyRes = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: bskyHandle, password: bskyPassword }),
        signal: AbortSignal.timeout(10000),
      });
      const bskyData = await bskyRes.json();
      checks.bluesky_auth = {
        status: bskyRes.status,
        ok: bskyRes.ok,
        handle: bskyData.handle || null,
        error: bskyData.error || null,
        message: bskyData.message || null,
      };
    }
  } catch (err) {
    checks.bluesky_auth = { error: String(err) };
  }

  // 5. Test Wikipedia API
  try {
    const wikiRes = await fetch(
      "https://en.wikipedia.org/w/api.php?action=parse&page=Opinion_polling_for_the_2026_New_Zealand_general_election&prop=wikitext&format=json",
      {
        headers: { "User-Agent": "NZElectionTracker/1.0" },
        signal: AbortSignal.timeout(10000),
      }
    );
    const wikiJson = await wikiRes.json();
    const wikitext = wikiJson?.parse?.wikitext?.["*"] || "";
    checks.wikipedia = {
      status: wikiRes.status,
      ok: wikiRes.ok,
      wikitextLength: wikitext.length,
      hasPollingTables: wikitext.includes("National") && wikitext.includes("Labour"),
    };
  } catch (err) {
    checks.wikipedia = { error: String(err) };
  }

  return NextResponse.json(checks, { status: 200 });
}
