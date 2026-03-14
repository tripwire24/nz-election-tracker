import { createClient } from "@supabase/supabase-js";
import { ForecastWidget } from "@/components/dashboard/forecast-widget";
import { PollSnapshotWidget } from "@/components/dashboard/poll-snapshot-widget";
import { SeatProjectionWidget } from "@/components/dashboard/seat-projection-widget";
import { SentimentPulseWidget } from "@/components/dashboard/sentiment-pulse-widget";
import { ContentFeedWidget } from "@/components/dashboard/content-feed-widget";
import { ElectionCountdownWidget } from "@/components/dashboard/election-countdown-widget";
import {
  allocateSeats,
  weightedPollingAverage,
  coalitionSeats,
  RIGHT_BLOC,
  LEFT_BLOC,
  type PollResult,
  type WeightedPollInput,
} from "@/lib/election";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export default async function Home() {
  const supabase = getSupabase();

  // Fetch latest 8 content items
  const { data: contentItems } = await supabase
    .from("content_items")
    .select("id, title, source_name, source_type, source_url, published_at, topics")
    .order("published_at", { ascending: false })
    .limit(8);

  // Fetch recent polls (up to 90 days) for weighted average
  const { data: recentPolls } = await supabase
    .from("polls")
    .select("id, pollster, published_date, sample_size, margin_of_error, poll_type")
    .eq("poll_type", "party_vote")
    .order("published_date", { ascending: false })
    .limit(50);

  const latestPoll = recentPolls?.[0] ?? null;
  const pollInputs: WeightedPollInput[] = [];
  let latestPollResults: PollResult[] = [];

  if (recentPolls && recentPolls.length > 0) {
    // Fetch all poll_results for these polls in one query
    const pollIds = recentPolls.map((p) => p.id);
    const { data: allResults } = await supabase
      .from("poll_results")
      .select("poll_id, value, parties(short_name, name, colour)")
      .in("poll_id", pollIds)
      .order("value", { ascending: false });

    if (allResults) {
      // Group results by poll_id
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

      // Keep latest poll results for the snapshot widget
      latestPollResults = byPoll[recentPolls[0].id] ?? [];
    }
  }

  // Compute weighted polling average (exponential decay, 14-day half-life)
  const pollResults = pollInputs.length > 1
    ? weightedPollingAverage(pollInputs)
    : latestPollResults;

  // Content stats
  const { count: totalArticles } = await supabase
    .from("content_items")
    .select("id", { count: "exact", head: true });

  // Sentiment: average score per party from sentiment_scores joined with parties
  const { data: sentimentRows } = await supabase
    .from("sentiment_scores")
    .select("score, party_id, parties(short_name, colour)")
    .not("party_id", "is", null);

  const sentimentByParty: Record<string, { total: number; count: number; colour: string }> = {};
  for (const row of (sentimentRows || []) as { score: number; parties: { short_name: string; colour: string } | null }[]) {
    if (!row.parties) continue;
    const key = row.parties.short_name;
    if (!sentimentByParty[key]) {
      sentimentByParty[key] = { total: 0, count: 0, colour: row.parties.colour };
    }
    sentimentByParty[key].total += row.score;
    sentimentByParty[key].count += 1;
  }

  const sentimentData = Object.entries(sentimentByParty)
    .map(([party, s]) => ({
      party,
      score: Math.round((s.total / s.count) * 100) / 100,
      volume: s.count,
      colour: s.colour,
    }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 6);

  // Seat projection from weighted average
  const seatProjection = allocateSeats(pollResults);

  // Forecast: derive coalition seat counts
  const rightSeats = coalitionSeats(seatProjection, RIGHT_BLOC);
  const leftSeats = coalitionSeats(seatProjection, LEFT_BLOC);
  const totalSeats = seatProjection.reduce((s, p) => s + p.seats, 0) || 120;
  const latestPollDateLabel = latestPoll?.published_date
    ? new Date(latestPoll.published_date).toLocaleDateString("en-NZ", {
        day: "numeric",
        month: "short",
      })
    : null;

  // Simple probability proxy from seat share (will be replaced by Monte Carlo)
  const rightPct = totalSeats > 0 ? Math.round((rightSeats / totalSeats) * 100) : 50;
  const leftPct = totalSeats > 0 ? Math.round((leftSeats / totalSeats) * 100) : 43;
  const hungPct = Math.max(0, 100 - rightPct - leftPct);
  const headline = rightSeats >= 61
    ? `Centre-right is ahead with an estimated ${rightSeats} seats`
    : leftSeats >= 61
      ? `Centre-left is ahead with an estimated ${leftSeats} seats`
      : "The current numbers point to a close election";

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(28,28,28,0.98),rgba(18,18,18,0.98))] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.32)] md:p-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.9fr)]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c0c0c0]" />
              NZ Election Tracker
            </div>
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-neutral-500">2026 general election</p>
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-neutral-100 md:text-4xl">
                {headline}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-neutral-400 md:text-[15px]">
                This dashboard shows where things stand now and what the current polling picture would mean for seats in Parliament if an election were held today.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 text-sm">
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-neutral-300">
                {latestPoll && latestPollDateLabel
                  ? `Latest poll: ${latestPoll.pollster} · ${latestPollDateLabel}`
                  : "Latest poll: Waiting for published data"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-neutral-300">
                Polls in model: {pollInputs.length || 0}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-neutral-300">
                Majority line: 61 seats
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-neutral-300">
                Stories tracked: {(totalArticles ?? 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-500">What this page does</p>
            <div className="mt-4 space-y-3 text-sm text-neutral-300">
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-neutral-300" />
                <p>Shows the latest published polling picture.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-neutral-300" />
                <p>Turns party vote into estimated seats in Parliament.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-neutral-300" />
                <p>Tracks political coverage and party sentiment alongside the numbers.</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-6 text-neutral-500">
              Forecast numbers are estimates, not promises. They can move as more polling arrives.
            </p>
          </div>
        </div>
      </div>

      {/* Top row: Forecast + Countdown */}
      <div className="grid items-stretch gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 h-full min-w-0">
          <ForecastWidget
            rightPct={rightPct}
            leftPct={leftPct}
            hungPct={hungPct}
            rightSeats={rightSeats}
            leftSeats={leftSeats}
          />
        </div>
        <div className="h-full min-w-0">
          <ElectionCountdownWidget />
        </div>
      </div>

      {/* Middle row: Seat projection (full width) */}
      <SeatProjectionWidget seats={seatProjection} />

      {/* Bottom row: Poll snapshot + Sentiment + Content feed */}
      <div className="grid gap-6 lg:grid-cols-3">
        <PollSnapshotWidget
          poll={latestPoll}
          results={latestPollResults}
        />
        <SentimentPulseWidget data={sentimentData} />
        <ContentFeedWidget
          items={contentItems ?? []}
          totalArticles={totalArticles ?? 0}
        />
      </div>
    </div>
  );
}
