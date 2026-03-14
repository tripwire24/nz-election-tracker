import { DashboardCard } from "./card";

interface SentimentData {
  party: string;
  score: number;
  volume: number;
  colour: string;
}

const trendColour = (score: number) =>
  score > 0.05 ? "text-emerald-400" : score < -0.05 ? "text-red-400" : "text-neutral-500";

const trendArrow = (score: number) =>
  score > 0.05 ? "↑" : score < -0.05 ? "↓" : "→";

const bgTrend = (score: number) =>
  score > 0.05 ? "bg-emerald-500/10 ring-emerald-500/20" : score < -0.05 ? "bg-red-500/10 ring-red-500/20" : "bg-white/5 ring-white/10";

/** 7-day sentiment pulse per party — wired to Supabase */
export function SentimentPulseWidget({ data }: { data: SentimentData[] }) {
  if (data.length === 0) {
    return (
      <DashboardCard title="Sentiment Pulse" badge="Awaiting data" tooltip="Average tone in political coverage and social discussion over the last 7 days, scored from negative to positive." accent="linear-gradient(90deg, #597169, #a8bcb5)">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-white/5 animate-shimmer" />
          ))}
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Sentiment Pulse" badge={`${data.reduce((s, d) => s + d.volume, 0)} items scored`} tooltip="Average tone in political coverage and social discussion over the last 7 days, scored from negative to positive." accent="linear-gradient(90deg, #597169, #a8bcb5)">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {data.map((p) => (
          <div
            key={p.party}
            className={`flex flex-col gap-1 rounded-lg px-3 py-2.5 ring-1 transition-colors ${bgTrend(p.score)}`}
          >
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm shrink-0 shadow-sm" style={{ backgroundColor: p.colour }} />
              <span className="text-sm font-semibold text-neutral-200 truncate">{p.party}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-bold tabular-nums text-neutral-100">
                {p.score > 0 ? "+" : ""}{p.score.toFixed(2)}
              </span>
              <span className={`text-base font-bold ${trendColour(p.score)}`}>
                {trendArrow(p.score)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[11px] text-neutral-500">
        <span className="flex items-center gap-1"><span className="text-emerald-400">↑</span> Positive (&gt;0.05)</span>
        <span className="flex items-center gap-1"><span className="text-neutral-500">→</span> Neutral</span>
        <span className="flex items-center gap-1"><span className="text-red-400">↓</span> Negative (&lt;−0.05)</span>
      </div>
      <p className="mt-1.5 text-[11px] text-neutral-500">
        Scale: −1 is very negative and +1 is very positive. Scored with AFINN-165 and Claude Haiku.
      </p>
    </DashboardCard>
  );
}

