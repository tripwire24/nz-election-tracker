import { DashboardCard } from "./card";

interface SentimentData {
  party: string;
  score: number;
  volume: number;
  colour: string;
}

const trendColour = (score: number) =>
  score > 0.05 ? "text-emerald-600" : score < -0.05 ? "text-red-500" : "text-stone-400";

const trendArrow = (score: number) =>
  score > 0.05 ? "↑" : score < -0.05 ? "↓" : "→";

const bgTrend = (score: number) =>
  score > 0.05 ? "bg-emerald-50 ring-emerald-200" : score < -0.05 ? "bg-red-50 ring-red-200" : "bg-stone-50 ring-stone-200";

/** 7-day sentiment pulse per party — wired to Supabase */
export function SentimentPulseWidget({ data }: { data: SentimentData[] }) {
  if (data.length === 0) {
    return (
      <DashboardCard title="Sentiment Pulse" badge="Awaiting data" accent="linear-gradient(90deg, #10b981, #06b6d4)">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-stone-100 animate-shimmer" />
          ))}
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Sentiment Pulse" badge={`${data.reduce((s, d) => s + d.volume, 0)} scores`} accent="linear-gradient(90deg, #10b981, #06b6d4)">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {data.map((p) => (
          <div
            key={p.party}
            className={`flex flex-col gap-1 rounded-lg px-3 py-2.5 ring-1 transition-colors ${bgTrend(p.score)}`}
          >
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm shrink-0 shadow-sm" style={{ backgroundColor: p.colour }} />
              <span className="text-sm font-semibold text-stone-700 truncate">{p.party}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-bold tabular-nums text-stone-800">
                {p.score > 0 ? "+" : ""}{p.score.toFixed(2)}
              </span>
              <span className={`text-base font-bold ${trendColour(p.score)}`}>
                {trendArrow(p.score)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[11px] text-stone-400">
        <span className="flex items-center gap-1"><span className="text-emerald-600">↑</span> Positive (&gt;0.05)</span>
        <span className="flex items-center gap-1"><span className="text-stone-400">→</span> Neutral</span>
        <span className="flex items-center gap-1"><span className="text-red-500">↓</span> Negative (&lt;−0.05)</span>
      </div>
      <p className="mt-1.5 text-[11px] text-stone-400">
        Scale: −1 (very negative) to +1 (very positive). Scored via AFINN-165 + Claude Haiku.
      </p>
    </DashboardCard>
  );
}

