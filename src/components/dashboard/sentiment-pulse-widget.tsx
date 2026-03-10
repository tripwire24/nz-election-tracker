import { DashboardCard } from "./card";

interface SentimentData {
  party: string;
  score: number;
  volume: number;
  colour: string;
}

const trendColour = (score: number) =>
  score > 0.05 ? "text-green-400" : score < -0.05 ? "text-red-400" : "text-slate-500";

const trendArrow = (score: number) =>
  score > 0.05 ? "↑" : score < -0.05 ? "↓" : "→";

/** 7-day sentiment pulse per party — wired to Supabase */
export function SentimentPulseWidget({ data }: { data: SentimentData[] }) {
  if (data.length === 0) {
    return (
      <DashboardCard title="Sentiment Pulse" badge="Awaiting data">
        <p className="text-sm text-slate-500">
          No sentiment scores yet. Run ingestion + scoring to populate.
        </p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Sentiment Pulse" badge={`${data.reduce((s, d) => s + d.volume, 0)} scores`}>
      <div className="grid grid-cols-3 gap-3">
        {data.map((p) => (
          <div
            key={p.party}
            className="flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2"
          >
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: p.colour }} />
            <span className="text-xs font-medium text-slate-300">{p.party}</span>
            <span className="ml-auto text-sm font-bold text-slate-200">
              {p.score > 0 ? "+" : ""}
              {p.score.toFixed(2)}
            </span>
            <span className={`text-sm ${trendColour(p.score)}`}>
              {trendArrow(p.score)}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-600">
        Average sentiment score per party from VADER + Claude analysis.
      </p>
    </DashboardCard>
  );
}
