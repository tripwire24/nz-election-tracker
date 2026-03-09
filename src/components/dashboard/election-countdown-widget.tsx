import { DashboardCard } from "./card";

/** Countdown to election day */
export function ElectionCountdownWidget() {
  const electionDate = new Date("2026-11-07T00:00:00+13:00");
  const now = new Date();
  const diffMs = electionDate.getTime() - now.getTime();
  const daysUntil = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const weeksUntil = Math.floor(daysUntil / 7);

  return (
    <DashboardCard title="Election Day" badge="7 Nov 2026">
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold text-white">{daysUntil}</span>
        <span className="text-sm text-slate-400">days to go</span>
      </div>
      <p className="mt-1 text-xs text-slate-500">{weeksUntil} weeks remaining</p>
    </DashboardCard>
  );
}
