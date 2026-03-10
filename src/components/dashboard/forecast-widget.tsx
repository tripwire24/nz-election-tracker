import { DashboardCard } from "./card";

interface ForecastProps {
  rightPct: number;
  leftPct: number;
  hungPct: number;
  rightSeats: number;
  leftSeats: number;
}

/** Headline coalition win probability — derived from Sainte-Laguë seat projection */
export function ForecastWidget({ rightPct, leftPct, hungPct, rightSeats, leftSeats }: ForecastProps) {
  const hasData = rightSeats + leftSeats > 0;

  if (!hasData) {
    return (
      <DashboardCard title="Forecast" badge="Awaiting data" accent="linear-gradient(90deg, #3b82f6, #6366f1)">
        <div className="space-y-3">
          <div className="h-16 rounded-lg bg-zinc-700/30 animate-shimmer" />
          <div className="h-4 w-2/3 rounded bg-zinc-700/30 animate-shimmer" />
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Forecast" badge="Poll-derived" accent="linear-gradient(90deg, #3b82f6, #6366f1)">
      <p className="mb-4 text-xs text-zinc-500 leading-relaxed">
        Seat share percentages for each coalition bloc, derived from the latest poll using NZ&apos;s Sainte-Laguë MMP allocation. 61 of 120 seats needed for a majority.
      </p>
      <div className="flex items-end gap-6">
        <div className="flex-1 space-y-1">
          <div className="text-xs font-medium text-zinc-500">Centre-right</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black tabular-nums text-blue-400">{rightPct}%</span>
            <span className="text-sm text-zinc-500">{rightSeats} seats</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-zinc-700/40 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 animate-bar-fill" style={{ width: `${rightPct}%` }} />
          </div>
        </div>
        <div className="flex-1 space-y-1">
          <div className="text-xs font-medium text-zinc-500">Centre-left</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black tabular-nums text-red-400">{leftPct}%</span>
            <span className="text-sm text-zinc-500">{leftSeats} seats</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-zinc-700/40 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-400 animate-bar-fill" style={{ width: `${leftPct}%` }} />
          </div>
        </div>
        <div className="flex-none text-center space-y-1 w-24">
          <div className="text-xs font-medium text-zinc-500">Hung</div>
          <div className="text-3xl font-black tabular-nums text-amber-400">{hungPct}%</div>
          <div className="h-2.5 w-full rounded-full bg-zinc-700/40 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 animate-bar-fill" style={{ width: `${hungPct}%` }} />
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-zinc-600">
        Based on latest polling via Sainte-Laguë seat allocation. Improves as sentiment + economic data feeds in.
      </p>
    </DashboardCard>
  );
}
