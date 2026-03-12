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
    .select("score, party_id, scored_at, parties(short_name)")
    .not("party_id", "is", null);

  const partyScores: Record<string, { total: number; count: number }> = {};
  // Also compute composite index: recency-weighted sentiment with volume factor
  const now = Date.now();
  const SEVEN_DAYS = 7 * 86_400_000;
  const compositeAccum: Record<string, { weightedSum: number; totalWeight: number; count7d: number }> = {};

  for (const row of (sentimentRows ?? []) as { score: number; scored_at: string; parties: { short_name: string } | null }[]) {
    if (!row.parties) continue;
    const key = row.parties.short_name;
    if (!partyScores[key]) partyScores[key] = { total: 0, count: 0 };
    partyScores[key].total += row.score;
    partyScores[key].count += 1;

    // Composite: exponential decay over 7 days
    if (!compositeAccum[key]) compositeAccum[key] = { weightedSum: 0, totalWeight: 0, count7d: 0 };
    const ageMs = now - new Date(row.scored_at).getTime();
    if (ageMs >= 0 && ageMs <= SEVEN_DAYS) {
      const w = Math.exp(-Math.LN2 * (ageMs / SEVEN_DAYS)); // half-life = 7 days
      compositeAccum[key].weightedSum += row.score * w;
      compositeAccum[key].totalWeight += w;
      compositeAccum[key].count7d += 1;
    }
  }

  // Build composite index: score from -100 to +100
  // Formula: weighted_avg_sentiment * volume_multiplier * 100
  // Volume multiplier: log2(count+1) / log2(50) capped at 1 (50+ mentions = full weight)
  const compositeIndex: Record<string, { score: number; volume: number; raw: number }> = {};
  for (const [key, acc] of Object.entries(compositeAccum)) {
    const rawAvg = acc.totalWeight > 0 ? acc.weightedSum / acc.totalWeight : 0;
    const volMult = Math.min(1, Math.log2(acc.count7d + 1) / Math.log2(50));
    const composite = Math.round(rawAvg * volMult * 100);
    compositeIndex[key] = { score: composite, volume: acc.count7d, raw: Math.round(rawAvg * 1000) / 1000 };
  }

  const partyList = (parties ?? []) as { short_name: string; name: string; colour: string }[];
  const scored = scoredCount ?? 0;
  const articles = articleCount ?? 0;
  const claudeScored = claudeCount ?? 0;
  const afinnScored = scored - claudeScored;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">Sentiment Analysis</h1>
        <p className="mt-1 text-sm text-neutral-500">
          AI-powered media sentiment tracking per party and topic, scored using Claude API.
        </p>
      </div>

      {/* Status overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-[#242424] p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Articles ingested</div>
          <div className="mt-2 text-3xl font-bold text-neutral-100">{articles}</div>
          <div className="mt-1 text-xs text-neutral-400">from RSS + Bluesky</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#242424] p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Items scored</div>
          <div className="mt-2 text-3xl font-bold text-neutral-100">{scored}</div>
          <div className="mt-1 text-xs text-neutral-400">{articles ? `${Math.round((scored / articles) * 100)}% coverage` : "awaiting scoring"}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#242424] p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Model</div>
          <div className="mt-2 text-lg font-bold text-neutral-100">AFINN-165 + Claude</div>
          <div className="mt-1 text-xs text-neutral-400">
            {claudeScored > 0
              ? `AFINN: ${afinnScored} · Claude Haiku: ${claudeScored}`
              : "AFINN only — Claude not yet triggered"}
          </div>
        </div>
      </div>

      {/* How to read sentiment scores */}
      <div className="rounded-xl border border-white/10 bg-[#2a2a2a] p-5">
        <h2 className="text-sm font-semibold text-neutral-200 mb-3">How to read sentiment scores</h2>
        <p className="text-xs text-neutral-500 leading-relaxed mb-4">
          Each article or social post mentioning a party is scored on a scale from <strong className="text-red-500">−1</strong> (very negative) to <strong className="text-emerald-400">+1</strong> (very positive). Zero means neutral. We average all scores per party over a rolling 7-day window.
        </p>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-1.5 ring-1 ring-red-500/20">
            <span className="text-red-500 font-bold text-sm">−1.0 → −0.05</span>
            <span className="text-xs text-neutral-400">Negative coverage</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
            <span className="text-neutral-500 font-bold text-sm">−0.05 → +0.05</span>
            <span className="text-xs text-neutral-500">Neutral</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1.5 ring-1 ring-emerald-500/20">
            <span className="text-emerald-400 font-bold text-sm">+0.05 → +1.0</span>
            <span className="text-xs text-neutral-400">Positive coverage</span>
          </div>
        </div>
      </div>

      {/* Party sentiment grid */}
      <div className="rounded-xl border border-white/10 bg-[#242424] p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">
          Sentiment by party (7-day rolling average)
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {partyList.map((party) => {
            const ps = partyScores[party.short_name];
            const avg = ps ? Math.round((ps.total / ps.count) * 100) / 100 : null;
            return (
              <div
                key={party.short_name}
                className="flex items-center gap-3 rounded-lg border border-white/10 p-3"
              >
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-neutral-100"
                  style={{ backgroundColor: party.colour }}
                >
                  {party.short_name}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-neutral-200">{party.name}</div>
                  <div className="text-xs text-neutral-400">
                    {ps ? `${ps.count} scores` : "No data yet"}
                  </div>
                </div>
                <div className={`text-sm font-bold ${avg === null ? "text-neutral-500" : avg > 0.05 ? "text-emerald-400" : avg < -0.05 ? "text-red-500" : "text-neutral-500"}`}>
                  {avg === null ? "—" : `${avg > 0 ? "+" : ""}${avg.toFixed(2)}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Composite Sentiment Index */}
      {Object.keys(compositeIndex).length > 0 && (
        <div className="rounded-xl border border-white/10 bg-[#242424] p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
            Composite Sentiment Index
          </h2>
          <p className="text-[11px] text-neutral-500 mb-4">
            Single score (−100 to +100) combining recency-weighted sentiment and media volume over the past 7 days.
          </p>
          <div className="space-y-3">
            {partyList
              .filter((p) => compositeIndex[p.short_name])
              .sort((a, b) => (compositeIndex[b.short_name]?.score ?? 0) - (compositeIndex[a.short_name]?.score ?? 0))
              .map((party) => {
                const ci = compositeIndex[party.short_name];
                const pct = Math.abs(ci.score);
                const isPos = ci.score > 0;
                const isNeg = ci.score < 0;
                return (
                  <div key={party.short_name} className="flex items-center gap-3">
                    <div
                      className="h-7 w-7 rounded-md flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                      style={{ backgroundColor: party.colour }}
                    >
                      {party.short_name}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-neutral-200 truncate">{party.name}</span>
                        <span className={`text-sm font-bold tabular-nums ${isPos ? "text-emerald-400" : isNeg ? "text-red-500" : "text-neutral-500"}`}>
                          {ci.score > 0 ? "+" : ""}{ci.score}
                        </span>
                      </div>
                      <div className="relative h-2.5 w-full rounded-full bg-white/5">
                        {/* Centre line */}
                        <div className="absolute left-1/2 top-0 h-full w-px bg-white/15" />
                        {/* Bar from centre */}
                        {ci.score !== 0 && (
                          <div
                            className={`absolute top-0 h-full rounded-full ${isPos ? "bg-emerald-400" : "bg-red-400"}`}
                            style={{
                              left: isPos ? "50%" : `${50 - pct / 2}%`,
                              width: `${pct / 2}%`,
                            }}
                          />
                        )}
                      </div>
                      <div className="mt-0.5 text-[10px] text-neutral-500">
                        {ci.volume} mentions · avg {ci.raw > 0 ? "+" : ""}{ci.raw.toFixed(3)}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="mt-4 text-[10px] text-neutral-500 leading-relaxed">
            Formula: weighted_avg × volume_factor × 100. Volume factor scales with log₂(mentions) up to 50 mentions for full weight. Recency uses 7-day exponential decay.
          </div>
        </div>
      )}

      {/* Scoring pipeline */}
      <div className="rounded-xl border border-dashed border-white/10 bg-[#2a2a2a] p-6">
        <h2 className="text-sm font-semibold text-neutral-300 mb-3">Sentiment scoring pipeline</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-lg">✓</div>
            <div className="mt-2 text-xs font-medium text-neutral-300">Content Ingestion</div>
            <div className="mt-0.5 text-[10px] text-neutral-400">{articles} items</div>
          </div>
          <div className="text-center">
            <div className={`mx-auto h-10 w-10 rounded-full flex items-center justify-center text-lg ${scored > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-neutral-500"}`}>{scored > 0 ? "✓" : "○"}</div>
            <div className="mt-2 text-xs font-medium text-neutral-300">AFINN / VADER scoring</div>
            <div className="mt-0.5 text-[10px] text-neutral-400">{scored} scored</div>
          </div>
          <div className="text-center">
            <div className={`mx-auto h-10 w-10 rounded-full flex items-center justify-center text-lg ${Object.keys(partyScores).length > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-neutral-500"}`}>{Object.keys(partyScores).length > 0 ? "✓" : "○"}</div>
            <div className="mt-2 text-xs font-medium text-neutral-300">Party attribution</div>
            <div className="mt-0.5 text-[10px] text-neutral-400">{Object.keys(partyScores).length} parties</div>
          </div>
          <div className="text-center">
            <div className="mx-auto h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-500 text-lg">○</div>
            <div className="mt-2 text-xs font-medium text-neutral-300">Rolling averages</div>
            <div className="mt-0.5 text-[10px] text-neutral-400">7-day window</div>
          </div>
        </div>
      </div>
    </div>
  );
}

