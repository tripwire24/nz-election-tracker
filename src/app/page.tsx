import { createClient } from "@/lib/supabase/server";
import { ForecastWidget } from "@/components/dashboard/forecast-widget";
import { PollSnapshotWidget } from "@/components/dashboard/poll-snapshot-widget";
import { SeatProjectionWidget } from "@/components/dashboard/seat-projection-widget";
import { SentimentPulseWidget } from "@/components/dashboard/sentiment-pulse-widget";
import { ContentFeedWidget } from "@/components/dashboard/content-feed-widget";
import { ElectionCountdownWidget } from "@/components/dashboard/election-countdown-widget";

export const revalidate = 300; // ISR: refresh every 5 min

export default async function Home() {
  const supabase = await createClient();

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

  return (
    <div className="space-y-6">
      {/* Top row: Forecast + Countdown */}
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <ForecastWidget />
        </div>
        <div>
          <ElectionCountdownWidget />
        </div>
      </div>

      {/* Middle row: Seat projection (full width) */}
      <SeatProjectionWidget />

      {/* Bottom row: Poll snapshot + Sentiment + Content feed */}
      <div className="grid gap-6 lg:grid-cols-3">
        <PollSnapshotWidget
          poll={latestPoll}
          results={pollResults}
        />
        <SentimentPulseWidget />
        <ContentFeedWidget
          items={contentItems ?? []}
          totalArticles={totalArticles ?? 0}
        />
      </div>
    </div>
  );
}
