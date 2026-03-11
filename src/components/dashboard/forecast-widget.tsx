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
          <div className="h-16 rounded-lg bg-stone-100 animate-shimmer" />
          <div className="h-4 w-2/3 rounded bg-stone-100 animate-shimmer" />
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Forecast" badge="Poll-derived" accent="linear-gradient(90deg, #3b82f6, #6366f1)">
      <p className="mb-4 text-xs text-stone-400 leading-relaxed">
        Seat share percentages for each coalition bloc, derived from the latest poll using NZ&apos;s Sainte-Laguë MMP allocation. 61 of 120 seats needed for a majority.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="text-xs font-medium text-stone-400">Centre-right</div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black tabular-nums text-blue-600">{rightPct}%</span>
            <span className="text-sm text-stone-400">{rightSeats} seats</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-stone-100 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 animate-bar-fill" style={{ width: `${rightPct}%` }} />
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="text-xs font-medium text-stone-400">Centre-left</div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black tabular-nums text-red-500">{leftPct}%</span>
            <span className="text-sm text-stone-400">{leftSeats} seats</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-stone-100 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-400 animate-bar-fill" style={{ width: `${leftPct}%` }} />
          </div>
        </div>
        <div className="w-full sm:w-24 flex-none text-left sm:text-center space-y-1">
          <div className="text-xs font-medium text-stone-400">Hung</div>
          <div className="text-2xl sm:text-3xl font-black tabular-nums text-amber-500">{hungPct}%</div>
          <div className="h-2.5 w-full rounded-full bg-stone-100 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 animate-bar-fill" style={{ width: `${hungPct}%` }} />
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-stone-400">
        Based on latest polling via Sainte-Laguë seat allocation. Improves as sentiment + economic data feeds in.
      </p>
    </DashboardCard>
  );
}
