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
      <DashboardCard title="Seat Projection" badge="Awaiting data">
        <p className="text-sm text-slate-500">No poll data to project seats from yet.</p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Seat Projection" badge="Sainte-Laguë">
      {/* Seat bar */}
      <div className="flex h-8 overflow-hidden rounded-lg">
        {seats.map((p) => (
          <div
            key={p.short}
            title={`${p.name}: ${p.seats} seats`}
            className="relative flex items-center justify-center text-[10px] font-bold text-white transition-all"
            style={{
              width: `${(p.seats / TOTAL_SEATS) * 100}%`,
              backgroundColor: p.colour,
            }}
          >
            {p.seats >= 8 && p.short}
          </div>
        ))}
      </div>

      {/* Majority line indicator */}
      <div className="relative mt-1 h-4">
        <div
          className="absolute top-0 h-4 border-l-2 border-dashed border-slate-500"
          style={{ left: `${(MAJORITY / TOTAL_SEATS) * 100}%` }}
        />
        <span
          className="absolute -top-0.5 text-[9px] text-slate-500"
          style={{ left: `${(MAJORITY / TOTAL_SEATS) * 100}%`, transform: "translateX(-50%)" }}
        >
          {MAJORITY} majority
        </span>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {seats.map((p) => (
          <div key={p.short} className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: p.colour }} />
            {p.short} {p.seats}
          </div>
        ))}
      </div>

      <p className="mt-2 text-[10px] text-slate-600">
        Right bloc: {coalitionRight} · Left bloc: {coalitionLeft} · {totalAllocated} seats allocated
      </p>
    </DashboardCard>
  );
}
