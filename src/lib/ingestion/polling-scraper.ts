/**
 * NZ Polling Data Scraper — extracts polling data from Wikipedia's
 * "Opinion polling for the 2026 New Zealand general election" tables.
 * Designed to run server-side.
 */

import { createAdminClient } from "@/lib/supabase/server";

const WIKI_URL =
  "https://en.wikipedia.org/w/api.php?action=parse&page=Opinion_polling_for_the_2026_New_Zealand_general_election&prop=wikitext&format=json&origin=*";

interface RawPollRow {
  pollster: string;
  surveyEnd: string;
  sampleSize: number | null;
  results: Record<string, number>; // party short_name → percentage
  sourceUrl: string | null;
}

/** Known pollster name normalisations */
const POLLSTER_MAP: Record<string, string> = {
  "curia": "Curia",
  "taxpayers' union–curia": "Curia",
  "reid research": "Reid Research",
  "rnz–reid research": "Reid Research",
  "verian": "Verian",
  "1 news–verian": "Verian",
  "roy morgan": "Roy Morgan",
  "freshwater strategy": "Freshwater Strategy",
  "kantar public": "Verian",
  "colmar brunton": "Verian",
};

/** NZ party name → short_name mapping for wiki table headers */
const PARTY_HEADER_MAP: Record<string, string> = {
  "national": "NAT",
  "nat": "NAT",
  "labour": "LAB",
  "lab": "LAB",
  "green": "GRN",
  "greens": "GRN",
  "grn": "GRN",
  "act": "ACT",
  "nz first": "NZF",
  "new zealand first": "NZF",
  "nzf": "NZF",
  "te pāti māori": "TPM",
  "māori": "TPM",
  "tpm": "TPM",
  "top": "TOP",
};

function normalisePollster(raw: string): string {
  const lower = raw.toLowerCase().trim();
  return POLLSTER_MAP[lower] || raw.trim();
}

function parsePercentage(val: string): number | null {
  const cleaned = val.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseDate(val: string): string | null {
  // Try common Wikipedia date formats
  const dateStr = val.trim().replace(/\u2013/g, "-"); // en-dash to hyphen
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Fetch the wikitext and extract polling table data.
 * Falls back to empty array on failure.
 */
export async function fetchWikiPollingData(): Promise<RawPollRow[]> {
  try {
    const res = await fetch(WIKI_URL);
    const json = await res.json();
    const wikitext: string = json?.parse?.wikitext?.["*"] || "";

    if (!wikitext) {
      console.error("[Polling] No wikitext returned from Wikipedia API");
      return [];
    }

    return parseWikiPollTables(wikitext);
  } catch (err) {
    console.error(`[Polling] Failed to fetch Wikipedia data: ${err}`);
    return [];
  }
}

/**
 * Parse MediaWiki table markup to extract poll rows.
 * This is a simplified parser — Wikipedia table format can vary.
 */
function parseWikiPollTables(wikitext: string): RawPollRow[] {
  const rows: RawPollRow[] = [];

  // Find wikitable blocks
  const tableRegex = /\{\|[^}]*class="wikitable"[^]*?\|\}/g;
  const tables = wikitext.match(tableRegex) || [];

  for (const table of tables) {
    const lines = table.split("\n");
    let headers: string[] = [];
    let partyColumns: Record<number, string> = {};

    for (const line of lines) {
      // Header row: extract party column positions
      if (line.startsWith("!")) {
        const cells = line.split("!!").map((c) => c.replace(/^!/, "").replace(/\[\[.*?\|?(.*?)\]\]/g, "$1").trim());
        if (cells.length > 3) {
          headers = cells;
          cells.forEach((cell, idx) => {
            const lower = cell.toLowerCase();
            if (PARTY_HEADER_MAP[lower]) {
              partyColumns[idx] = PARTY_HEADER_MAP[lower];
            }
          });
        }
        continue;
      }

      // Data row
      if (line.startsWith("|-") || line.startsWith("|}")) continue;
      if (!line.startsWith("|")) continue;

      const cells = line.split("||").map((c) =>
        c.replace(/^\|/, "").replace(/\[\[.*?\|?(.*?)\]\]/g, "$1").replace(/'''?/g, "").trim()
      );

      if (cells.length < 4 || Object.keys(partyColumns).length === 0) continue;

      const pollster = normalisePollster(cells[0] || "");
      if (!pollster || pollster === "Polling firm") continue;

      const dateStr = cells[1] || cells[2] || "";
      const surveyEnd = parseDate(dateStr);
      if (!surveyEnd) continue;

      const sampleCell = cells.find((c) => /^\d{3,5}$/.test(c.replace(/,/g, "")));
      const sampleSize = sampleCell ? parseInt(sampleCell.replace(/,/g, ""), 10) : null;

      const results: Record<string, number> = {};
      for (const [idxStr, partyCode] of Object.entries(partyColumns)) {
        const idx = parseInt(idxStr, 10);
        if (cells[idx]) {
          const pct = parsePercentage(cells[idx]);
          if (pct !== null && pct > 0 && pct < 100) {
            results[partyCode] = pct;
          }
        }
      }

      if (Object.keys(results).length >= 2) {
        rows.push({ pollster, surveyEnd, sampleSize, results, sourceUrl: null });
      }
    }
  }

  return rows;
}

/**
 * Store parsed polling data into Supabase.
 * Looks up party UUIDs, inserts poll + poll_results.
 */
export async function storePollingData(polls: RawPollRow[]): Promise<number> {
  const supabase = createAdminClient();

  // Fetch party ID map
  const { data: parties } = await supabase
    .from("parties")
    .select("id, short_name");

  if (!parties) return 0;

  const partyMap = new Map(parties.map((p: { id: string; short_name: string }) => [p.short_name, p.id]));
  let insertedCount = 0;

  for (const poll of polls) {
    // Check for duplicate (same pollster + date)
    const { data: existing } = await supabase
      .from("polls")
      .select("id")
      .eq("pollster", poll.pollster)
      .eq("survey_end", poll.surveyEnd)
      .limit(1);

    if (existing && existing.length > 0) continue;

    // Insert poll
    const { data: newPoll, error: pollError } = await supabase
      .from("polls")
      .insert({
        pollster: poll.pollster,
        survey_end: poll.surveyEnd,
        published_date: poll.surveyEnd,
        sample_size: poll.sampleSize,
        source_url: poll.sourceUrl,
        poll_type: "party_vote",
        raw_data: poll.results,
      })
      .select("id")
      .single();

    if (pollError || !newPoll) {
      console.error(`[Polling] Failed to insert poll: ${pollError?.message}`);
      continue;
    }

    // Insert results
    const resultRows = Object.entries(poll.results)
      .filter(([partyCode]) => partyMap.has(partyCode))
      .map(([partyCode, pct]) => ({
        poll_id: newPoll.id,
        party_id: partyMap.get(partyCode),
        value: pct,
      }));

    if (resultRows.length > 0) {
      const { error: resultError } = await supabase
        .from("poll_results")
        .insert(resultRows);

      if (resultError) {
        console.error(`[Polling] Failed to insert results: ${resultError.message}`);
      }
    }

    insertedCount++;
  }

  console.log(`[Polling] Stored ${insertedCount} new polls`);
  return insertedCount;
}

/** Full pipeline: fetch from Wikipedia → store to Supabase */
export async function ingestPollingData(): Promise<number> {
  const polls = await fetchWikiPollingData();
  if (polls.length === 0) return 0;
  return storePollingData(polls);
}
