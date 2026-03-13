import { createClient } from "@supabase/supabase-js";
import {
  allocateSeats,
  weightedPollingAverage,
  coalitionSeats,
  RIGHT_BLOC,
  LEFT_BLOC,
  type PollResult,
  type WeightedPollInput,
} from "@/lib/election";

export const revalidate = 300;

// 2023 actual election results (current parliament)
const PARLIAMENT_2023: Record<string, number> = {
  NAT: 48, LAB: 34, GRN: 15, ACT: 11, NZF: 8, TPM: 6,
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export default async function ForecastPage() {
  const supabase = getSupabase();

  // Fetch recent polls (up to 90 days) for weighted average
  const { data: recentPolls } = await supabase
    .from("polls")
    .select("id, pollster, published_date, sample_size, margin_of_error, poll_type")
    .eq("poll_type", "party_vote")
    .order("published_date", { ascending: false })
    .limit(50);

  const latestPoll = recentPolls?.[0] ?? null;
  const pollInputs: WeightedPollInput[] = [];

  if (recentPolls && recentPolls.length > 0) {
    const pollIds = recentPolls.map((p) => p.id);
    const { data: allResults } = await supabase
      .from("poll_results")
      .select("poll_id, value, parties(short_name, name, colour)")
      .in("poll_id", pollIds)
      .order("value", { ascending: false });

    if (allResults) {
      const byPoll: Record<string, PollResult[]> = {};
      for (const r of allResults as { poll_id: string; value: number; parties: { short_name: string; name: string; colour: string } | null }[]) {
        if (!r.parties) continue;
        if (!byPoll[r.poll_id]) byPoll[r.poll_id] = [];
        byPoll[r.poll_id].push({
          short_name: r.parties.short_name,
          name: r.parties.name,
          colour: r.parties.colour,
          value: r.value,
        });
      }

      for (const poll of recentPolls) {
        if (byPoll[poll.id]) {
          pollInputs.push({
            poll_id: poll.id,
            pollster: poll.pollster,
            published_date: poll.published_date,
            results: byPoll[poll.id],
          });
        }
      }
    }
  }

  // Compute weighted polling average (exponential decay, 14-day half-life)
  const pollResults = pollInputs.length > 1
    ? weightedPollingAverage(pollInputs)
    : (pollInputs[0]?.results ?? []);

  const seatProjection = allocateSeats(pollResults);
  const rightSeats = coalitionSeats(seatProjection, RIGHT_BLOC);
  const leftSeats = coalitionSeats(seatProjection, LEFT_BLOC);
  const totalSeats = seatProjection.reduce((s, p) => s + p.seats, 0) || 120;
  const rightPct = totalSeats > 0 ? Math.round((rightSeats / totalSeats) * 100) : 0;
  const leftPct = totalSeats > 0 ? Math.round((leftSeats / totalSeats) * 100) : 0;
  const hungPct = Math.max(0, 100 - rightPct - leftPct);
  const pollCount = pollInputs.length;

  const hasPollData = pollResults.length > 0;

  // Fetch latest Monte Carlo snapshot
  const { data: mcSnapshots } = await supabase
    .from("forecast_snapshots")
    .select("*")
    .order("snapshot_date", { ascending: false })
    .limit(1);

  const mcSnapshot = mcSnapshots?.[0] ?? null;
  const mcSeats = mcSnapshot?.seat_projection
    ? (typeof mcSnapshot.seat_projection === "string"
      ? JSON.parse(mcSnapshot.seat_projection)
      : mcSnapshot.seat_projection) as Record<string, { p5: number; median: number; p95: number; mean: number }>
    : null;
  const mcCoalition = mcSnapshot?.coalition_probabilities
    ? (typeof mcSnapshot.coalition_probabilities === "string"
      ? JSON.parse(mcSnapshot.coalition_probabilities)
      : mcSnapshot.coalition_probabilities) as { centre_right: number; centre_left: number; hung: number }
    : null;
  const hasMC = !!mcSeats && !!mcCoalition;
  const mcDate = mcSnapshot?.snapshot_date
    ? new Date(mcSnapshot.snapshot_date).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" })
    : null;
  const mcSimCount = mcSnapshot?.simulation_count ?? 10_000;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">Forecast</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Seat projection via proportional MMP allocation{pollCount > 1 ? ` from weighted average of ${pollCount} polls` : " from latest poll"}.
          {!hasPollData && " Awaiting poll data — run the polling ingestion pipeline."}
        </p>
      </div>

      {/* Coalition probabilities */}
      <div className="rounded-xl border border-white/10 bg-[#242424] p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">
          {hasMC ? "Simulated coalition probabilities" : "Coalition seat projection"}
        </h2>
        {hasPollData ? (
          <>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 text-center">
                {hasMC ? (
                  <>
                    <div className="text-3xl font-bold text-blue-400">{(mcCoalition.centre_right * 100).toFixed(0)}%</div>
                    <div className="mt-1 text-sm text-neutral-500">Centre-right majority</div>
                    <div className="mt-0.5 text-[10px] text-neutral-500">NAT + ACT + NZF ≥ 61 seats</div>
                    <div className="mt-2 text-xs text-neutral-400">{rightSeats} seats (current avg)</div>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-blue-400">{rightSeats}</div>
                    <div className="mt-1 text-sm text-neutral-500">Centre-right seats</div>
                    <div className="mt-0.5 text-[10px] text-neutral-500">NAT + ACT + NZF ({rightPct}%)</div>
                    <div className="mt-2 text-xs text-neutral-400">{rightSeats >= 61 ? "✓ Majority" : `${61 - rightSeats} short of majority`}</div>
                  </>
                )}
              </div>
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-center">
                {hasMC ? (
                  <>
                    <div className="text-3xl font-bold text-red-500">{(mcCoalition.centre_left * 100).toFixed(0)}%</div>
                    <div className="mt-1 text-sm text-neutral-500">Centre-left majority</div>
                    <div className="mt-0.5 text-[10px] text-neutral-500">LAB + GRN + TPM ≥ 61 seats</div>
                    <div className="mt-2 text-xs text-neutral-400">{leftSeats} seats (current avg)</div>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-red-500">{leftSeats}</div>
                    <div className="mt-1 text-sm text-neutral-500">Centre-left seats</div>
                    <div className="mt-0.5 text-[10px] text-neutral-500">LAB + GRN + TPM ({leftPct}%)</div>
                    <div className="mt-2 text-xs text-neutral-400">{leftSeats >= 61 ? "✓ Majority" : `${61 - leftSeats} short of majority`}</div>
                  </>
                )}
              </div>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-center">
                {hasMC ? (
                  <>
                    <div className="text-3xl font-bold text-amber-600">{(mcCoalition.hung * 100).toFixed(0)}%</div>
                    <div className="mt-1 text-sm text-neutral-500">No clear majority</div>
                    <div className="mt-0.5 text-[10px] text-neutral-500">Neither bloc reaches 61</div>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-amber-600">{120 - rightSeats - leftSeats}</div>
                    <div className="mt-1 text-sm text-neutral-500">Other / crossbench</div>
                    <div className="mt-0.5 text-[10px] text-neutral-500">{hungPct}% of seats</div>
                  </>
                )}
              </div>
            </div>
            <p className="mt-4 text-xs text-neutral-500">
              {hasMC
                ? `Based on ${mcSimCount.toLocaleString()} simulations as of ${mcDate}. Each run adds random variation to polling and re-allocates seats proportionally.`
                : `Based on ${pollCount > 1 ? `weighted average of ${pollCount} polls (14-day half-life)` : `${latestPoll?.pollster} poll`} as of ${new Date(latestPoll!.published_date).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" })}. 61 seats needed for a majority.`}
            </p>
          </>
        ) : (
          <p className="text-sm text-neutral-400">
            No polling data available yet. Run the polling ingestion pipeline (/api/ingest/polls) to populate.
          </p>
        )}
      </div>

      {/* Party seat breakdown */}
      {seatProjection.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-[#242424] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Party seat allocation (proportional MMP)
            </h2>
            <span className="text-[10px] text-neutral-500">vs 2023 election result</span>
          </div>
          <div className="space-y-3">
            {seatProjection.sort((a, b) => b.seats - a.seats).map((p) => {
              const prev = PARLIAMENT_2023[p.short] ?? 0;
              const diff = p.seats - prev;
              return (
              <div key={p.short} className="flex items-center gap-3">
                <span className="w-10 text-xs font-bold text-neutral-500">{p.short}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-neutral-300">{p.name}</span>
                    <span className="text-sm font-semibold text-neutral-200">
                      {p.seats} seats
                      {prev > 0 && (
                        <span className={`ml-2 text-xs font-medium ${diff > 0 ? "text-emerald-400" : diff < 0 ? "text-red-400" : "text-neutral-500"}`}>
                          {diff > 0 ? `+${diff}` : diff === 0 ? "±0" : diff}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="relative h-3 w-full rounded bg-white/5">
                    {prev > 0 && (
                      <div
                        className="absolute top-0 h-3 border-r-2 border-dashed border-white/20"
                        style={{ left: 0, width: `${(prev / 120) * 100}%` }}
                        title={`2023: ${prev} seats`}
                      />
                    )}
                    <div
                      className="h-3 rounded transition-all"
                      style={{ width: `${(p.seats / 120) * 100}%`, backgroundColor: p.colour }}
                    />
                  </div>
                  <div className="mt-0.5 flex items-center justify-between">
                    <span className="text-[10px] text-neutral-500">{p.votePct}% party vote</span>
                    {prev > 0 && <span className="text-[10px] text-neutral-500">2023: {prev} seats</span>}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Monte Carlo seat ranges */}
      {hasMC && mcSeats && (
        <div className="rounded-xl border border-white/10 bg-[#242424] p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">
            Seat range by party (90% confidence interval)
          </h2>
          <div className="space-y-3">
            {Object.entries(mcSeats)
              .sort(([, a], [, b]) => b.median - a.median)
              .map(([party, q]) => {
                const colour = seatProjection.find((p) => p.short === party)?.colour ?? "#888";
                return (
                  <div key={party} className="flex items-center gap-3">
                    <span className="w-10 text-xs font-bold text-neutral-500">{party}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-neutral-300">
                          {seatProjection.find((p) => p.short === party)?.name ?? party}
                        </span>
                        <span className="text-xs font-medium text-neutral-400">
                          {q.p5}–{q.p95} seats (median {q.median})
                        </span>
                      </div>
                      <div className="relative h-3 w-full rounded bg-white/5">
                        {/* p5–p95 range bar */}
                        <div
                          className="absolute top-0 h-3 rounded opacity-30"
                          style={{
                            left: `${(q.p5 / 120) * 100}%`,
                            width: `${((q.p95 - q.p5) / 120) * 100}%`,
                            backgroundColor: colour,
                          }}
                        />
                        {/* median marker */}
                        <div
                          className="absolute top-0 h-3 rounded"
                          style={{
                            left: `${(Math.max(0, q.median - 0.5) / 120) * 100}%`,
                            width: `${(Math.max(1, 1) / 120) * 100}%`,
                            backgroundColor: colour,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
          <p className="mt-4 text-[10px] text-neutral-500">
            Shaded range shows 5th–95th percentile from {mcSimCount.toLocaleString()} simulations. Solid bar marks the median.
          </p>
        </div>
      )}

      {/* Model methodology */}
      <div className="rounded-xl border border-white/10 bg-[#242424] p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">
          Model methodology
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold ${hasPollData ? "bg-white/10 text-neutral-200" : "bg-blue-600/20 text-blue-400"}`}>{hasPollData ? "✓" : "1"}</div>
              <h3 className="text-sm font-medium text-neutral-200">Polling average</h3>
            </div>
            <p className="text-xs text-neutral-400">
              {hasPollData
                ? `Weighted average of ${pollCount} poll${pollCount > 1 ? "s" : ""} with 14-day exponential decay half-life. Proportional seat allocation with 5% threshold.`
                : "Weighted average of recent polls with recency decay and per-pollster adjustment."}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-neutral-500 text-sm font-bold">2</div>
              <h3 className="text-sm font-medium text-neutral-200">Sentiment index</h3>
            </div>
            <p className="text-xs text-neutral-400">
              AI-scored media + social sentiment per party, contributing a ±2pp adjustment to polling estimates. Not yet integrated into forecast.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold ${hasMC ? "bg-white/10 text-neutral-200" : "bg-white/5 text-neutral-500"}`}>{hasMC ? "✓" : "3"}</div>
              <h3 className="text-sm font-medium text-neutral-200">Simulation</h3>
            </div>
            <p className="text-xs text-neutral-400">
              {hasMC
                ? `${mcSimCount.toLocaleString()} iterations — adds random variation to polling averages and re-allocates seats proportionally each time.`
                : "10K+ statistical simulations with economic fundamentals. Run the simulation script to populate."}
            </p>
          </div>
        </div>
      </div>

      {/* Roadmap */}
      <div className="rounded-xl border border-white/10 bg-[#242424] p-6">
        <h2 className="text-sm font-semibold text-neutral-200 mb-3">Model roadmap</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
            <span className="text-neutral-200 font-bold">✓</span>
            <div>
              <div className="text-xs font-semibold text-neutral-200">Polling data</div>
              <div className="text-[10px] text-neutral-500">Wikipedia scraper live</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
            <span className="text-neutral-200 font-bold">✓</span>
            <div>
              <div className="text-xs font-semibold text-neutral-200">Historical results</div>
              <div className="text-[10px] text-neutral-500">2017–2023 seeded</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
            <span className="text-neutral-200 font-bold">✓</span>
            <div>
              <div className="text-xs font-semibold text-neutral-200">Weighted average</div>
              <div className="text-[10px] text-neutral-500">14-day half-life decay</div>
            </div>
          </div>
          <div className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ring-1 ${hasMC ? "bg-white/10 ring-white/10" : "bg-[#2a2a2a] ring-white/10"}`}>
            <span className={`font-bold ${hasMC ? "text-neutral-200" : "text-neutral-500"}`}>{hasMC ? "✓" : "○"}</span>
            <div>
              <div className="text-xs font-semibold text-neutral-200">Monte Carlo</div>
              <div className="text-[10px] text-neutral-500">{hasMC ? `${mcSimCount.toLocaleString()} sims live` : "10K sims + economic data"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

