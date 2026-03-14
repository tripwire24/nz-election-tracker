import { DashboardCard } from "./card";

interface ForecastProps {
  rightPct: number;
  leftPct: number;
  hungPct: number;
  rightSeats: number;
  leftSeats: number;
}

/** Headline coalition win probability — derived from proportional MMP seat projection */
export function ForecastWidget({ rightPct, leftPct, hungPct, rightSeats, leftSeats }: ForecastProps) {
  const hasData = rightSeats + leftSeats > 0;

  if (!hasData) {
    return (
      <DashboardCard title="Current Outlook" badge="Awaiting data" tooltip="Turns the current polling picture into an estimated seat split in Parliament." accent="linear-gradient(90deg, #5e6468, #c2c7cb)">
        <div className="space-y-3">
          <div className="h-16 rounded-lg bg-white/5 animate-shimmer" />
          <div className="h-4 w-2/3 rounded bg-white/5 animate-shimmer" />
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Current Outlook" badge="Polling only" tooltip="Turns the current polling picture into an estimated seat split in Parliament. This is an early model, not a fixed election-day prediction." accent="linear-gradient(90deg, #5e6468, #c2c7cb)">
      <p className="mb-4 text-xs leading-relaxed text-neutral-500">
        If voting happened today, this is the bloc split implied by current polling. A bloc needs 61 of 120 seats for a majority.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="text-xs font-medium text-neutral-500">Right bloc</div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black tabular-nums text-blue-400">{rightPct}%</span>
            <span className="text-sm text-neutral-500">{rightSeats} seats</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 animate-bar-fill" style={{ width: `${rightPct}%` }} />
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="text-xs font-medium text-neutral-500">Left bloc</div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black tabular-nums text-red-400">{leftPct}%</span>
            <span className="text-sm text-neutral-500">{leftSeats} seats</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-400 animate-bar-fill" style={{ width: `${leftPct}%` }} />
          </div>
        </div>
        <div className="w-full sm:w-24 flex-none text-left sm:text-center space-y-1">
          <div className="text-xs font-medium text-neutral-500">No majority</div>
          <div className="text-2xl sm:text-3xl font-black tabular-nums text-amber-400">{hungPct}%</div>
          <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 animate-bar-fill" style={{ width: `${hungPct}%` }} />
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-neutral-500">
        This uses polling only for now. Sentiment and economic signals will be layered in later.
      </p>
    </DashboardCard>
  );
}
