import { DashboardCard } from "./card";

interface SentimentData {
  party: string;
  score: number;
  volume: number;
  colour: string;
}

const trendColour = (score: number) =>
  score > 0.05 ? "text-emerald-400" : score < -0.05 ? "text-red-400" : "text-zinc-500";

const trendArrow = (score: number) =>
  score > 0.05 ? "↑" : score < -0.05 ? "↓" : "→";

const bgTrend = (score: number) =>
  score > 0.05 ? "bg-emerald-500/10 ring-emerald-500/20" : score < -0.05 ? "bg-red-500/10 ring-red-500/20" : "bg-zinc-800/50 ring-zinc-700/30";

/** 7-day sentiment pulse per party — wired to Supabase */
export function SentimentPulseWidget({ data }: { data: SentimentData[] }) {
  if (data.length === 0) {
    return (
      <DashboardCard title="Sentiment Pulse" badge="Awaiting data" accent="linear-gradient(90deg, #10b981, #06b6d4)">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-zinc-800/50 animate-shimmer" />
          ))}
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Sentiment Pulse" badge={`${data.reduce((s, d) => s + d.volume, 0)} scores`} accent="linear-gradient(90deg, #10b981, #06b6d4)">
      <div className="grid grid-cols-3 gap-2.5">
        {data.map((p) => (
          <div
            key={p.party}
            className={`flex items-center gap-2 rounded-lg px-3 py-2.5 ring-1 transition-colors ${bgTrend(p.score)}`}
          >
            <div className="h-3 w-3 rounded-sm shadow-sm" style={{ backgroundColor: p.colour }} />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-zinc-200">{p.party}</span>
            </div>
            <span className="text-sm font-bold tabular-nums text-zinc-100">
              {p.score > 0 ? "+" : ""}
              {p.score.toFixed(2)}
            </span>
            <span className={`text-sm font-bold ${trendColour(p.score)}`}>
              {trendArrow(p.score)}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-zinc-600">
        Average sentiment from AFINN-165 + Claude Haiku analysis.
      </p>
    </DashboardCard>
  );
}
