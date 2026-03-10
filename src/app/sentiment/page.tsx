import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export default async function SentimentPage() {
  const supabase = getSupabase();

  const { count: articleCount } = await supabase
    .from("content_items")
    .select("id", { count: "exact", head: true });

  const { count: scoredCount } = await supabase
    .from("sentiment_scores")
    .select("id", { count: "exact", head: true });

  // Count how many were scored by Claude vs AFINN
  const { count: claudeCount } = await supabase
    .from("sentiment_scores")
    .select("id", { count: "exact", head: true })
    .eq("model_version", "claude-haiku-1");

  const { data: parties } = await supabase
    .from("parties")
    .select("short_name, name, colour")
    .neq("short_name", "OTH")
    .order("sort_order");

  // Fetch actual per-party sentiment scores
  const { data: sentimentRows } = await supabase
    .from("sentiment_scores")
    .select("score, party_id, parties(short_name)")
    .not("party_id", "is", null);

  const partyScores: Record<string, { total: number; count: number }> = {};
  for (const row of (sentimentRows ?? []) as { score: number; parties: { short_name: string } | null }[]) {
    if (!row.parties) continue;
    const key = row.parties.short_name;
    if (!partyScores[key]) partyScores[key] = { total: 0, count: 0 };
    partyScores[key].total += row.score;
    partyScores[key].count += 1;
  }

  const partyList = (parties ?? []) as { short_name: string; name: string; colour: string }[];
  const scored = scoredCount ?? 0;
  const articles = articleCount ?? 0;
  const claudeScored = claudeCount ?? 0;
  const afinnScored = scored - claudeScored;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Sentiment Analysis</h1>
        <p className="mt-1 text-sm text-zinc-400">
          AI-powered media sentiment tracking per party and topic, scored using Claude API.
        </p>
      </div>

      {/* Status overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Articles ingested</div>
          <div className="mt-2 text-3xl font-bold text-white">{articles}</div>
          <div className="mt-1 text-xs text-zinc-500">from RSS + Bluesky</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Items scored</div>
          <div className="mt-2 text-3xl font-bold text-white">{scored}</div>
          <div className="mt-1 text-xs text-zinc-500">{articles ? `${Math.round((scored / articles) * 100)}% coverage` : "awaiting scoring"}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Model</div>
          <div className="mt-2 text-lg font-bold text-white">AFINN-165 + Claude</div>
          <div className="mt-1 text-xs text-zinc-500">
            {claudeScored > 0
              ? `AFINN: ${afinnScored} · Claude Haiku: ${claudeScored}`
              : "AFINN only — Claude not yet triggered"}
          </div>
        </div>
      </div>

      {/* Party sentiment grid */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">
          Sentiment by party (7-day rolling average)
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {partyList.map((party) => {
            const ps = partyScores[party.short_name];
            const avg = ps ? Math.round((ps.total / ps.count) * 100) / 100 : null;
            return (
              <div
                key={party.short_name}
                className="flex items-center gap-3 rounded-lg border border-zinc-800 p-3"
              >
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: party.colour }}
                >
                  {party.short_name}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-zinc-200">{party.name}</div>
                  <div className="text-xs text-zinc-500">
                    {ps ? `${ps.count} scores` : "No data yet"}
                  </div>
                </div>
                <div className={`text-sm font-bold ${avg === null ? "text-zinc-600" : avg > 0.05 ? "text-green-400" : avg < -0.05 ? "text-red-400" : "text-zinc-400"}`}>
                  {avg === null ? "—" : `${avg > 0 ? "+" : ""}${avg.toFixed(2)}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scoring pipeline */}
      <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 p-6">
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">Sentiment scoring pipeline</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 rounded-full bg-green-600/20 flex items-center justify-center text-green-400 text-lg">✓</div>
            <div className="mt-2 text-xs font-medium text-zinc-300">Content Ingestion</div>
            <div className="mt-0.5 text-[10px] text-zinc-500">{articles} items</div>
          </div>
          <div className="text-center">
            <div className={`mx-auto h-10 w-10 rounded-full flex items-center justify-center text-lg ${scored > 0 ? "bg-green-600/20 text-green-400" : "bg-zinc-700/50 text-zinc-400"}`}>{scored > 0 ? "✓" : "○"}</div>
            <div className="mt-2 text-xs font-medium text-zinc-300">AFINN / VADER scoring</div>
            <div className="mt-0.5 text-[10px] text-zinc-500">{scored} scored</div>
          </div>
          <div className="text-center">
            <div className={`mx-auto h-10 w-10 rounded-full flex items-center justify-center text-lg ${Object.keys(partyScores).length > 0 ? "bg-green-600/20 text-green-400" : "bg-zinc-700/50 text-zinc-400"}`}>{Object.keys(partyScores).length > 0 ? "✓" : "○"}</div>
            <div className="mt-2 text-xs font-medium text-zinc-300">Party attribution</div>
            <div className="mt-0.5 text-[10px] text-zinc-500">{Object.keys(partyScores).length} parties</div>
          </div>
          <div className="text-center">
            <div className="mx-auto h-10 w-10 rounded-full bg-zinc-700/50 flex items-center justify-center text-zinc-400 text-lg">○</div>
            <div className="mt-2 text-xs font-medium text-zinc-300">Rolling averages</div>
            <div className="mt-0.5 text-[10px] text-zinc-500">7-day window</div>
          </div>
        </div>
      </div>
    </div>
  );
}
