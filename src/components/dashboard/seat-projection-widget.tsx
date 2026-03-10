import { DashboardCard } from "./card";

const TOTAL_SEATS = 120;
const MAJORITY = 61;

interface SeatData {
  name: string;
  short: string;
  seats: number;
  colour: string;
}

/** Parliament seat projection bar — wired to Supabase poll data */
export function SeatProjectionWidget({ seats }: { seats: SeatData[] }) {
  const coalitionRight = seats
    .filter((p) => ["NAT", "ACT", "NZF"].includes(p.short))
    .reduce((sum, p) => sum + p.seats, 0);
  const coalitionLeft = seats
    .filter((p) => ["LAB", "GRN", "TPM"].includes(p.short))
    .reduce((sum, p) => sum + p.seats, 0);
  const totalAllocated = seats.reduce((s, p) => s + p.seats, 0);

  if (totalAllocated === 0) {
    return (
      <DashboardCard title="Seat Projection" badge="Awaiting data" accent="#6366f1">
        <div className="space-y-3">
          <div className="h-10 rounded-lg bg-stone-100 animate-shimmer" />
          <div className="h-3 w-1/2 rounded bg-stone-100 animate-shimmer" />
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Seat Projection" badge="Sainte-Laguë" accent="#6366f1">
      {/* Seat bar */}
      <div className="flex h-10 overflow-hidden rounded-lg shadow-inner">
        {seats.map((p) => (
          <div
            key={p.short}
            title={`${p.name}: ${p.seats} seats`}
            className="relative flex items-center justify-center text-[10px] font-bold text-stone-900/90 transition-all hover:brightness-110"
            style={{
              width: `${(p.seats / TOTAL_SEATS) * 100}%`,
              backgroundColor: p.colour,
            }}
          >
            {p.seats >= 8 && <span className="drop-shadow-sm">{p.short}</span>}
          </div>
        ))}
      </div>

      {/* Majority line indicator */}
      <div className="relative mt-1 h-5">
        <div
          className="absolute top-0 h-5 border-l-2 border-dashed border-stone-400"
          style={{ left: `${(MAJORITY / TOTAL_SEATS) * 100}%` }}
        />
        <span
          className="absolute top-0.5 text-[9px] font-medium text-stone-500"
          style={{ left: `${(MAJORITY / TOTAL_SEATS) * 100}%`, transform: "translateX(-50%)" }}
        >
          {MAJORITY} majority
        </span>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {seats.map((p) => (
          <div key={p.short} className="flex items-center gap-1.5 text-xs text-stone-400">
            <div className="h-2.5 w-2.5 rounded-sm shadow-sm" style={{ backgroundColor: p.colour }} />
            <span className="font-medium">{p.short}</span>
            <span className="text-stone-500">{p.seats}</span>
          </div>
        ))}
      </div>

      {/* Coalition summary */}
      <div className="mt-3 flex gap-4 text-xs">
        <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-blue-400 ring-1 ring-blue-500/20">
          Right bloc: {coalitionRight}
        </span>
        <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-red-400 ring-1 ring-red-500/20">
          Left bloc: {coalitionLeft}
        </span>
        <span className="text-stone-400 py-1">{totalAllocated} seats allocated</span>
      </div>
    </DashboardCard>
  );
}
