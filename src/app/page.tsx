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

  // Simple probability proxy from seat share (will be replaced by Monte Carlo)
  const rightPct = totalSeats > 0 ? Math.round((rightSeats / totalSeats) * 100) : 50;
  const leftPct = totalSeats > 0 ? Math.round((leftSeats / totalSeats) * 100) : 43;
  const hungPct = Math.max(0, 100 - rightPct - leftPct);

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-200/70 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 md:p-8 shadow-[0_12px_32px_rgba(14,116,144,0.1)]">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-cyan-300/35 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-blue-300/30 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-700">NZ Election Tracker</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
            {rightSeats >= 61
              ? `Centre-right leads with ${rightSeats} seats`
              : leftSeats >= 61
                ? `Centre-left leads with ${leftSeats} seats`
                : "No clear majority — too close to call"}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-600">
            Live forecast based on {pollInputs.length > 1 ? `weighted average of ${pollInputs.length} polls` : "latest polling data"}, Sainte-Laguë MMP seat allocation, and sentiment analysis.
          </p>
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
