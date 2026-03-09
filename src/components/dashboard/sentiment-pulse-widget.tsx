import { DashboardCard } from "./card";

const PLACEHOLDER_SENTIMENT = [
  { party: "NAT", score: 0.12, trend: "up",   colour: "#00529F" },
  { party: "LAB", score: -0.08, trend: "down", colour: "#D82A20" },
  { party: "GRN", score: 0.22, trend: "up",   colour: "#098137" },
  { party: "ACT", score: -0.15, trend: "down", colour: "#FDE401" },
  { party: "NZF", score: 0.03, trend: "flat", colour: "#555555" },
  { party: "TPM", score: 0.18, trend: "up",   colour: "#B2001A" },
];

const trendArrow = (t: string) =>
  t === "up" ? "↑" : t === "down" ? "↓" : "→";
const trendColour = (t: string) =>
  t === "up" ? "text-green-400" : t === "down" ? "text-red-400" : "text-slate-500";

/** 7-day sentiment pulse per party */
export function SentimentPulseWidget() {
  return (
    <DashboardCard title="Sentiment Pulse" badge="Awaiting data">
      <div className="grid grid-cols-3 gap-3">
        {PLACEHOLDER_SENTIMENT.map((p) => (
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
            <span className={`text-sm ${trendColour(p.trend)}`}>
              {trendArrow(p.trend)}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-600">
        Awaiting sentiment engine — will process articles via Claude API.
      </p>
    </DashboardCard>
  );
}
