import { DashboardCard } from "./card";

/** Countdown to election day */
export function ElectionCountdownWidget() {
  const electionDate = new Date("2026-11-07T00:00:00+13:00");
  const now = new Date();
  const diffMs = electionDate.getTime() - now.getTime();
  const daysUntil = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const weeksUntil = Math.floor(daysUntil / 7);
  const months = Math.floor(daysUntil / 30);

  return (
    <DashboardCard title="Election Day" badge="7 Nov 2026" accent="linear-gradient(90deg, #f59e0b, #ef4444)">
      <div className="flex flex-col items-center text-center py-2">
        <span className="text-6xl font-black tabular-nums text-white leading-none">{daysUntil}</span>
        <span className="mt-1 text-sm font-medium text-zinc-400">days to go</span>
        <div className="mt-3 flex gap-3 text-xs text-zinc-500">
          <span className="rounded-full bg-zinc-800/80 px-2.5 py-1 ring-1 ring-zinc-700/50">{weeksUntil} weeks</span>
          <span className="rounded-full bg-zinc-800/80 px-2.5 py-1 ring-1 ring-zinc-700/50">{months} months</span>
        </div>
      </div>
    </DashboardCard>
  );
}
