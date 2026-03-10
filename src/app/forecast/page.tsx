import { createClient } from "@supabase/supabase-js";

export const revalidate = 300;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/** Sainte-Laguë MMP seat allocation from party vote percentages */
function allocateSeats(
  results: { short_name: string; name: string; colour: string; value: number }[],
  totalSeats: number = 120,
) {
  const eligible = results.filter((p) => p.value >= 5);
  if (eligible.length === 0) return [];

  const totalVote = eligible.reduce((s, p) => s + p.value, 0);
  const quotients: { party: string; q: number }[] = [];
  for (const p of eligible) {
    const normalisedVote = (p.value / totalVote) * 100;
    for (let d = 1; d <= totalSeats * 2; d += 2) {
      quotients.push({ party: p.short_name, q: normalisedVote / d });
    }
  }
  quotients.sort((a, b) => b.q - a.q);

  const seatCount: Record<string, number> = {};
  for (let i = 0; i < totalSeats; i++) {
    const p = quotients[i].party;
    seatCount[p] = (seatCount[p] || 0) + 1;
  }

  return eligible.map((p) => ({
    name: p.name.replace(/^New Zealand /, "").replace(/ Party.*$/, "").replace("of Aotearoa NZ", ""),
    short: p.short_name,
    seats: seatCount[p.short_name] || 0,
    colour: p.colour,
    votePct: p.value,
  }));
}

export default async function ForecastPage() {
  const supabase = getSupabase();

  // Fetch latest poll with results + party info
  const { data: latestPoll } = await supabase
    .from("polls")
    .select("id, pollster, published_date, sample_size, margin_of_error, poll_type")
    .eq("poll_type", "party_vote")
    .order("published_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  let pollResults: { short_name: string; name: string; colour: string; value: number }[] = [];
  if (latestPoll) {
    const { data } = await supabase
      .from("poll_results")
      .select("value, party_id, parties(short_name, name, colour)")
      .eq("poll_id", latestPoll.id)
      .order("value", { ascending: false });
    if (data) {
      pollResults = data
        .filter((r: Record<string, unknown>) => r.parties)
        .map((r: Record<string, unknown>) => {
          const party = r.parties as { short_name: string; name: string; colour: string };
          return { short_name: party.short_name, name: party.name, colour: party.colour, value: r.value as number };
        });
    }
  }

  // Seat projection via Sainte-Laguë
  const seatProjection = allocateSeats(pollResults);
  const rightBloc = ["NAT", "ACT", "NZF"];
  const leftBloc = ["LAB", "GRN", "TPM"];
  const rightSeats = seatProjection.filter((p) => rightBloc.includes(p.short)).reduce((s, p) => s + p.seats, 0);
  const leftSeats = seatProjection.filter((p) => leftBloc.includes(p.short)).reduce((s, p) => s + p.seats, 0);
  const totalSeats = seatProjection.reduce((s, p) => s + p.seats, 0) || 120;
  const rightPct = totalSeats > 0 ? Math.round((rightSeats / totalSeats) * 100) : 0;
  const leftPct = totalSeats > 0 ? Math.round((leftSeats / totalSeats) * 100) : 0;
  const hungPct = Math.max(0, 100 - rightPct - leftPct);

  const hasPollData = pollResults.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Forecast</h1>
        <p className="mt-1 text-sm text-slate-400">
          Seat projection via Sainte-Laguë MMP allocation from latest polling data.
          {!hasPollData && " Awaiting poll data — run the polling ingestion pipeline."}
        </p>
      </div>

      {/* Coalition probabilities */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
          Coalition seat projection
        </h2>
        {hasPollData ? (
          <>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-lg border border-blue-900/50 bg-blue-950/30 p-4 text-center">
                <div className="text-3xl font-bold text-blue-400">{rightSeats}</div>
                <div className="mt-1 text-sm text-slate-400">Centre-right seats</div>
                <div className="mt-0.5 text-[10px] text-slate-600">NAT + ACT + NZF ({rightPct}%)</div>
                <div className="mt-2 text-xs text-slate-500">{rightSeats >= 61 ? "✓ Majority" : `${61 - rightSeats} short of majority`}</div>
              </div>
              <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-center">
                <div className="text-3xl font-bold text-red-400">{leftSeats}</div>
                <div className="mt-1 text-sm text-slate-400">Centre-left seats</div>
                <div className="mt-0.5 text-[10px] text-slate-600">LAB + GRN + TPM ({leftPct}%)</div>
                <div className="mt-2 text-xs text-slate-500">{leftSeats >= 61 ? "✓ Majority" : `${61 - leftSeats} short of majority`}</div>
              </div>
              <div className="rounded-lg border border-amber-900/50 bg-amber-950/30 p-4 text-center">
                <div className="text-3xl font-bold text-amber-400">{120 - rightSeats - leftSeats}</div>
                <div className="mt-1 text-sm text-slate-400">Other / crossbench</div>
                <div className="mt-0.5 text-[10px] text-slate-600">{hungPct}% of seats</div>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-600">
              Based on {latestPoll?.pollster} poll ({new Date(latestPoll!.published_date).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" })}).
              61 seats needed for a majority.
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-500">
            No polling data available yet. Run the polling ingestion pipeline (/api/ingest/polls) to populate.
          </p>
        )}
      </div>

      {/* Party seat breakdown */}
      {seatProjection.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
            Party seat allocation (Sainte-Laguë)
          </h2>
          <div className="space-y-3">
            {seatProjection.sort((a, b) => b.seats - a.seats).map((p) => (
              <div key={p.short} className="flex items-center gap-3">
                <span className="w-10 text-xs font-bold text-slate-400">{p.short}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-300">{p.name}</span>
                    <span className="text-sm font-semibold text-slate-200">{p.seats} seats</span>
                  </div>
                  <div className="h-3 w-full rounded bg-slate-800">
                    <div
                      className="h-3 rounded transition-all"
                      style={{ width: `${(p.seats / 120) * 100}%`, backgroundColor: p.colour }}
                    />
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-600">{p.votePct}% party vote</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model methodology */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
          Model methodology
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold ${hasPollData ? "bg-green-600/20 text-green-400" : "bg-blue-600/20 text-blue-400"}`}>{hasPollData ? "✓" : "1"}</div>
              <h3 className="text-sm font-medium text-slate-200">Polling average</h3>
            </div>
            <p className="text-xs text-slate-500">
              {hasPollData
                ? `Latest poll: ${latestPoll?.pollster}. Sainte-Laguë seat allocation with 5% threshold.`
                : "Weighted average of recent polls with recency decay and house-effect adjustment per pollster."}
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-400 text-sm font-bold">2</div>
              <h3 className="text-sm font-medium text-slate-200">Sentiment index</h3>
            </div>
            <p className="text-xs text-slate-500">
              AI-scored media + social sentiment per party, contributing a ±2pp adjustment to polling estimates. Not yet integrated into forecast.
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-400 text-sm font-bold">3</div>
              <h3 className="text-sm font-medium text-slate-200">Monte Carlo</h3>
            </div>
            <p className="text-xs text-slate-500">
              10K+ iteration Monte Carlo simulation on logit-scale with economic fundamentals. Coming in Phase 3.
            </p>
          </div>
        </div>
      </div>

      {/* Roadmap */}
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Coming next:</h2>
        <ul className="space-y-2 text-sm text-slate-400">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-green-500">{hasPollData ? "✓" : "○"}</span>
            <span>Polling data ingested via Wikipedia scraper</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-slate-600">○</span>
            <span>Historical election results seeded (2017, 2020, 2023) for model backtesting</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-slate-600">○</span>
            <span>Weighted polling average (recency decay + house effects)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-slate-600">○</span>
            <span>Monte Carlo simulation with sentiment + economic fundamentals</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
