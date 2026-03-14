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
import { PageHero, PagePanel, PagePill } from "@/components/page-primitives";

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
      <PageHero
        eyebrow="Forecast"
        title="What the current polling picture would mean for Parliament"
        description={`This page converts ${pollCount > 1 ? `a weighted average of ${pollCount} polls` : "the latest poll"} into estimated seats and coalition outcomes. It is designed to explain the current picture, not oversell certainty.`}
        pills={[
          <PagePill key="polls">{pollCount || 0} poll{pollCount === 1 ? "" : "s"} in model</PagePill>,
          <PagePill key="majority">61 seats for a majority</PagePill>,
          <PagePill key="mc">{hasMC ? `${mcSimCount.toLocaleString()} simulations live` : "Polling-only view active"}</PagePill>,
        ]}
        aside={
          <div className="space-y-3 text-sm text-neutral-300">
            <p className="font-medium text-neutral-100">Read this as the best current combined estimate, not a promise of the final result.</p>
            <p>Use the polls page for individual releases and the sentiment page for tone and media volume.</p>
          </div>
        }
      />

      <PagePanel className="p-6">
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
      </PagePanel>

      <div className="grid gap-6 xl:grid-cols-12">
        {seatProjection.length > 0 ? (
          <PagePanel className="p-6 xl:col-span-8">
            <div className="mb-4 flex items-center justify-between gap-3">
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
                      <div className="mb-1 flex items-center justify-between gap-3">
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
                      <div className="mt-0.5 flex items-center justify-between gap-3">
                        <span className="text-[10px] text-neutral-500">{p.votePct}% party vote</span>
                        {prev > 0 && <span className="text-[10px] text-neutral-500">2023: {prev} seats</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </PagePanel>
        ) : null}

        <div className={`space-y-6 ${seatProjection.length > 0 ? "xl:col-span-4" : "xl:col-span-12"}`}>
          <PagePanel className="p-6">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              How this forecast works
            </h2>
            <div className="space-y-3">
              <div className="rounded-[1rem] border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${hasPollData ? "bg-white/10 text-neutral-200" : "bg-blue-600/20 text-blue-400"}`}>{hasPollData ? "✓" : "1"}</div>
                  <h3 className="text-sm font-medium text-neutral-200">Polling average</h3>
                </div>
                <p className="text-sm leading-6 text-neutral-400">
                  {hasPollData
                    ? `Weighted average of ${pollCount} poll${pollCount > 1 ? "s" : ""} with 14-day half-life decay, then converted into MMP seats with the 5% threshold.`
                    : "Weighted average of recent polls with recency decay and per-pollster adjustment."}
                </p>
              </div>
              <div className="rounded-[1rem] border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-sm font-bold text-neutral-500">2</div>
                  <h3 className="text-sm font-medium text-neutral-200">Sentiment index</h3>
                </div>
                <p className="text-sm leading-6 text-neutral-400">
                  AI-scored media and social sentiment provides extra context around party coverage. It is visible here, but not yet feeding directly into the seat model.
                </p>
              </div>
              <div className="rounded-[1rem] border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${hasMC ? "bg-white/10 text-neutral-200" : "bg-white/5 text-neutral-500"}`}>{hasMC ? "✓" : "3"}</div>
                  <h3 className="text-sm font-medium text-neutral-200">Simulation layer</h3>
                </div>
                <p className="text-sm leading-6 text-neutral-400">
                  {hasMC
                    ? `${mcSimCount.toLocaleString()} simulations add random variation to the polling baseline and re-allocate seats each run.`
                    : "The simulation layer is not populated yet. Once live, it will show seat ranges and coalition probabilities instead of a single fixed snapshot."}
                </p>
              </div>
            </div>
          </PagePanel>

          <PagePanel className="p-6">
            <h2 className="mb-3 text-sm font-semibold text-neutral-200">Model roadmap</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
                <span className="font-bold text-neutral-200">✓</span>
                <div>
                  <div className="text-xs font-semibold text-neutral-200">Polling data</div>
                  <div className="text-[10px] text-neutral-500">Wikipedia scraper live</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
                <span className="font-bold text-neutral-200">✓</span>
                <div>
                  <div className="text-xs font-semibold text-neutral-200">Historical results</div>
                  <div className="text-[10px] text-neutral-500">2017–2023 seeded</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
                <span className="font-bold text-neutral-200">✓</span>
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
          </PagePanel>
        </div>
        </div>

      {hasMC && mcSeats && (
        <PagePanel className="p-6">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Seat range by party (90% confidence interval)
          </h2>
          <div className="space-y-4">
            {Object.entries(mcSeats)
              .sort(([, a], [, b]) => b.median - a.median)
              .map(([party, q]) => {
                const colour = seatProjection.find((p) => p.short === party)?.colour ?? "#888";

                return (
                  <div key={party} className="grid gap-2 md:grid-cols-[56px_minmax(0,1fr)_220px] md:items-center md:gap-4">
                    <span className="text-xs font-bold text-neutral-500">{party}</span>
                    <div>
                      <div className="mb-1 text-sm text-neutral-300">
                        {seatProjection.find((p) => p.short === party)?.name ?? party}
                      </div>
                      <div className="relative h-3 w-full rounded bg-white/5">
                        <div
                          className="absolute top-0 h-3 rounded opacity-30"
                          style={{
                            left: `${(q.p5 / 120) * 100}%`,
                            width: `${((q.p95 - q.p5) / 120) * 100}%`,
                            backgroundColor: colour,
                          }}
                        />
                        <div
                          className="absolute top-0 h-3 rounded"
                          style={{
                            left: `${(Math.max(0, q.median - 0.5) / 120) * 100}%`,
                            width: `${(1 / 120) * 100}%`,
                            backgroundColor: colour,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-neutral-400 md:text-right">
                      {q.p5}–{q.p95} seats (median {q.median})
                    </span>
                  </div>
                );
              })}
          </div>
          <p className="mt-4 text-[10px] text-neutral-500">
            Shaded range shows 5th–95th percentile from {mcSimCount.toLocaleString()} simulations. Solid bar marks the median.
          </p>
        </PagePanel>
      )}
      </div>
    </div>
  );
}

