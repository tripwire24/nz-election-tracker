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
      <DashboardCard title="Forecast" badge="Awaiting data">
        <p className="text-sm text-slate-500">No poll data yet to generate a forecast.</p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Forecast" badge="Poll-derived">
      <div className="flex items-end gap-6">
        <div className="flex-1">
          <div className="mb-1 text-xs text-slate-500">Centre-right ({rightSeats} seats)</div>
          <div className="text-3xl font-bold text-blue-400">{rightPct}%</div>
          <div className="mt-1 h-2 w-full rounded-full bg-slate-800">
            <div className="h-2 rounded-full bg-blue-500" style={{ width: `${rightPct}%` }} />
          </div>
        </div>
        <div className="flex-1">
          <div className="mb-1 text-xs text-slate-500">Centre-left ({leftSeats} seats)</div>
          <div className="text-3xl font-bold text-red-400">{leftPct}%</div>
          <div className="mt-1 h-2 w-full rounded-full bg-slate-800">
            <div className="h-2 rounded-full bg-red-500" style={{ width: `${leftPct}%` }} />
          </div>
        </div>
        <div className="flex-none text-center">
          <div className="mb-1 text-xs text-slate-500">Hung</div>
          <div className="text-3xl font-bold text-amber-400">{hungPct}%</div>
          <div className="mt-1 h-2 w-20 rounded-full bg-slate-800">
            <div className="h-2 rounded-full bg-amber-500" style={{ width: `${hungPct}%` }} />
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-600">
        Derived from latest polling via Sainte-Laguë seat allocation. Will improve with sentiment + economic data.
      </p>
    </DashboardCard>
  );
}
