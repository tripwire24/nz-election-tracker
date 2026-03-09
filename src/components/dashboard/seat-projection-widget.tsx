import { DashboardCard } from "./card";

const TOTAL_SEATS = 120;
const MAJORITY = 61;

const PLACEHOLDER_SEATS = [
  { name: "National", short: "NAT", seats: 47, colour: "#00529F" },
  { name: "ACT",      short: "ACT", seats: 11, colour: "#FDE401" },
  { name: "NZ First", short: "NZF", seats: 8,  colour: "#1a1a1a" },
  { name: "Labour",   short: "LAB", seats: 35, colour: "#D82A20" },
  { name: "Green",    short: "GRN", seats: 14, colour: "#098137" },
  { name: "TPM",      short: "TPM", seats: 5,  colour: "#B2001A" },
];

/** Parliament seat projection bar */
export function SeatProjectionWidget() {
  const coalitionRight = PLACEHOLDER_SEATS
    .filter((p) => ["NAT", "ACT", "NZF"].includes(p.short))
    .reduce((sum, p) => sum + p.seats, 0);

  return (
    <DashboardCard title="Seat Projection" badge="Indicative">
      {/* Seat bar */}
      <div className="flex h-8 overflow-hidden rounded-lg">
        {PLACEHOLDER_SEATS.map((p) => (
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
        {PLACEHOLDER_SEATS.map((p) => (
          <div key={p.short} className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: p.colour }} />
            {p.short} {p.seats}
          </div>
        ))}
      </div>

      <p className="mt-2 text-[10px] text-slate-600">
        Centre-right bloc: {coalitionRight} seats · Indicative — will be model-driven
      </p>
    </DashboardCard>
  );
}
