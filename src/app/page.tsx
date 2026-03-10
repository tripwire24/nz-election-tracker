import { createClient } from "@supabase/supabase-js";
import { ForecastWidget } from "@/components/dashboard/forecast-widget";
import { PollSnapshotWidget } from "@/components/dashboard/poll-snapshot-widget";
import { SeatProjectionWidget } from "@/components/dashboard/seat-projection-widget";
import { SentimentPulseWidget } from "@/components/dashboard/sentiment-pulse-widget";
import { ContentFeedWidget } from "@/components/dashboard/content-feed-widget";
import { ElectionCountdownWidget } from "@/components/dashboard/election-countdown-widget";

export const dynamic = "force-dynamic";

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
  // Filter parties above 5% threshold (or with an electorate seat — simplified here as 5%)
  const eligible = results.filter((p) => p.value >= 5);
  if (eligible.length === 0) return [];

  // Normalise vote shares to 100% among eligible parties
  const totalVote = eligible.reduce((s, p) => s + p.value, 0);

  // Sainte-Laguë: allocate seats using odd divisors (1, 3, 5, 7, ...)
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
  }));
}

export default async function Home() {
  const supabase = getSupabase();

  // Fetch latest 8 content items
  const { data: contentItems } = await supabase
    .from("content_items")
    .select("id, title, source_name, source_type, source_url, published_at, topics")
    .order("published_at", { ascending: false })
    .limit(8);

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
          return {
            short_name: party.short_name,
            name: party.name,
            colour: party.colour,
            value: r.value as number,
          };
        });
    }
  }

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

  // Seat projection from latest poll
  const seatProjection = allocateSeats(pollResults);

  // Forecast: derive coalition probabilities from latest poll
  const rightBloc = ["NAT", "ACT", "NZF"];
  const leftBloc = ["LAB", "GRN", "TPM"];
  const rightSeats = seatProjection.filter((p) => rightBloc.includes(p.short)).reduce((s, p) => s + p.seats, 0);
  const leftSeats = seatProjection.filter((p) => leftBloc.includes(p.short)).reduce((s, p) => s + p.seats, 0);
  const totalSeats = seatProjection.reduce((s, p) => s + p.seats, 0) || 120;

  // Simple probability proxy from seat share (will be replaced by Monte Carlo)
  const rightPct = totalSeats > 0 ? Math.round((rightSeats / totalSeats) * 100) : 50;
  const leftPct = totalSeats > 0 ? Math.round((leftSeats / totalSeats) * 100) : 43;
  const hungPct = Math.max(0, 100 - rightPct - leftPct);

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-700/30 bg-gradient-to-br from-zinc-800/60 via-zinc-800/40 to-zinc-700/20 backdrop-blur-sm p-6 md:p-8">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">NZ Election Tracker</p>
          <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">
            {rightSeats >= 61
              ? `Centre-right leads with ${rightSeats} seats`
              : leftSeats >= 61
                ? `Centre-left leads with ${leftSeats} seats`
                : "No clear majority — too close to call"}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-400">
            Live forecast based on Sainte-Laguë MMP seat allocation from the latest polling data, sentiment analysis, and electorate modelling.
          </p>
        </div>
      </div>

      {/* Top row: Forecast + Countdown */}
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <ForecastWidget
            rightPct={rightPct}
            leftPct={leftPct}
            hungPct={hungPct}
            rightSeats={rightSeats}
            leftSeats={leftSeats}
          />
        </div>
        <div>
          <ElectionCountdownWidget />
        </div>
      </div>

      {/* Middle row: Seat projection (full width) */}
      <SeatProjectionWidget seats={seatProjection} />

      {/* Bottom row: Poll snapshot + Sentiment + Content feed */}
      <div className="grid gap-6 lg:grid-cols-3">
        <PollSnapshotWidget
          poll={latestPoll}
          results={pollResults}
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
