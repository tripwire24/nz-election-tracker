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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Forecast</h1>
        <p className="mt-1 text-sm text-stone-400">
          Seat projection via Sainte-Laguë MMP allocation{pollCount > 1 ? ` from weighted average of ${pollCount} polls` : " from latest poll"}.
          {!hasPollData && " Awaiting poll data — run the polling ingestion pipeline."}
        </p>
      </div>

      {/* Coalition probabilities */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-4">
          Coalition seat projection
        </h2>
        {hasPollData ? (
          <>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{rightSeats}</div>
                <div className="mt-1 text-sm text-stone-400">Centre-right seats</div>
                <div className="mt-0.5 text-[10px] text-stone-400">NAT + ACT + NZF ({rightPct}%)</div>
                <div className="mt-2 text-xs text-stone-500">{rightSeats >= 61 ? "✓ Majority" : `${61 - rightSeats} short of majority`}</div>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                <div className="text-3xl font-bold text-red-500">{leftSeats}</div>
                <div className="mt-1 text-sm text-stone-400">Centre-left seats</div>
                <div className="mt-0.5 text-[10px] text-stone-400">LAB + GRN + TPM ({leftPct}%)</div>
                <div className="mt-2 text-xs text-stone-500">{leftSeats >= 61 ? "✓ Majority" : `${61 - leftSeats} short of majority`}</div>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
                <div className="text-3xl font-bold text-amber-600">{120 - rightSeats - leftSeats}</div>
                <div className="mt-1 text-sm text-stone-400">Other / crossbench</div>
                <div className="mt-0.5 text-[10px] text-stone-400">{hungPct}% of seats</div>
              </div>
            </div>
            <p className="mt-4 text-xs text-stone-400">
              Based on {pollCount > 1 ? `weighted average of ${pollCount} polls (14-day half-life)` : `${latestPoll?.pollster} poll`} as of {new Date(latestPoll!.published_date).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" })}.
              61 seats needed for a majority.
            </p>
          </>
        ) : (
          <p className="text-sm text-stone-500">
            No polling data available yet. Run the polling ingestion pipeline (/api/ingest/polls) to populate.
          </p>
        )}
      </div>

      {/* Party seat breakdown */}
      {seatProjection.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-4">
            Party seat allocation (Sainte-Laguë)
          </h2>
          <div className="space-y-3">
            {seatProjection.sort((a, b) => b.seats - a.seats).map((p) => (
              <div key={p.short} className="flex items-center gap-3">
                <span className="w-10 text-xs font-bold text-stone-400">{p.short}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-stone-600">{p.name}</span>
                    <span className="text-sm font-semibold text-stone-700">{p.seats} seats</span>
                  </div>
                  <div className="h-3 w-full rounded bg-stone-100">
                    <div
                      className="h-3 rounded transition-all"
                      style={{ width: `${(p.seats / 120) * 100}%`, backgroundColor: p.colour }}
                    />
                  </div>
                  <div className="mt-0.5 text-[10px] text-stone-400">{p.votePct}% party vote</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model methodology */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-4">
          Model methodology
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-stone-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold ${hasPollData ? "bg-emerald-50 text-emerald-600" : "bg-blue-600/20 text-blue-600"}`}>{hasPollData ? "✓" : "1"}</div>
              <h3 className="text-sm font-medium text-stone-700">Polling average</h3>
            </div>
            <p className="text-xs text-stone-500">
              {hasPollData
                ? `Weighted average of ${pollCount} poll${pollCount > 1 ? "s" : ""} with 14-day exponential decay half-life. Sainte-Laguë seat allocation with 5% threshold.`
                : "Weighted average of recent polls with recency decay and house-effect adjustment per pollster."}
            </p>
          </div>
          <div className="rounded-lg border border-stone-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400 text-sm font-bold">2</div>
              <h3 className="text-sm font-medium text-stone-700">Sentiment index</h3>
            </div>
            <p className="text-xs text-stone-500">
              AI-scored media + social sentiment per party, contributing a ±2pp adjustment to polling estimates. Not yet integrated into forecast.
            </p>
          </div>
          <div className="rounded-lg border border-stone-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400 text-sm font-bold">3</div>
              <h3 className="text-sm font-medium text-stone-700">Monte Carlo</h3>
            </div>
            <p className="text-xs text-stone-500">
              10K+ iteration Monte Carlo simulation on logit-scale with economic fundamentals. Coming in Phase 3.
            </p>
          </div>
        </div>
      </div>

      {/* Roadmap */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-stone-700 mb-3">Model roadmap</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="flex items-center gap-3 rounded-lg bg-emerald-50 px-3 py-2.5 ring-1 ring-emerald-200">
            <span className="text-emerald-600 font-bold">✓</span>
            <div>
              <div className="text-xs font-semibold text-stone-700">Polling data</div>
              <div className="text-[10px] text-stone-400">Wikipedia scraper live</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-emerald-50 px-3 py-2.5 ring-1 ring-emerald-200">
            <span className="text-emerald-600 font-bold">✓</span>
            <div>
              <div className="text-xs font-semibold text-stone-700">Historical results</div>
              <div className="text-[10px] text-stone-400">2017–2023 seeded</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-emerald-50 px-3 py-2.5 ring-1 ring-emerald-200">
            <span className="text-emerald-600 font-bold">✓</span>
            <div>
              <div className="text-xs font-semibold text-stone-700">Weighted average</div>
              <div className="text-[10px] text-stone-400">14-day half-life decay</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-stone-50 px-3 py-2.5 ring-1 ring-stone-200">
            <span className="text-stone-400 font-bold">○</span>
            <div>
              <div className="text-xs font-semibold text-stone-700">Monte Carlo</div>
              <div className="text-[10px] text-stone-400">10K sims + economic data</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
