import { DashboardCard } from "./card";

interface PollData {
  pollster: string;
  published_date: string;
  sample_size: number | null;
  margin_of_error: number | null;
}

interface PollResult {
  short_name: string;
  name: string;
  colour: string;
  value: number;
}

/** Latest poll snapshot card — wired to Supabase */
export function PollSnapshotWidget({
  poll,
  results,
}: {
  poll: PollData | null;
  results: PollResult[];
}) {
  if (!poll || results.length === 0) {
    return (
      <DashboardCard title="Latest Poll" badge="Awaiting data">
        <p className="text-sm text-slate-500">
          No polls ingested yet. The Wikipedia polling scraper will populate this once 2026 polling data is published.
        </p>
        <div className="mt-4 space-y-2">
          <p className="text-xs text-slate-600">Expected pollsters:</p>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {["Curia", "Reid Research", "Verian", "Talbot Mills", "Taxpayers Union"].map((p) => (
              <span key={p} className="rounded bg-slate-800 px-2 py-0.5">{p}</span>
            ))}
          </div>
        </div>
      </DashboardCard>
    );
  }

  const date = new Date(poll.published_date);
  const dateStr = date.toLocaleDateString("en-NZ", { month: "short", year: "numeric" });

  return (
    <DashboardCard title="Latest Poll" badge={poll.pollster}>
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-xs text-slate-500">{poll.pollster}</span>
        <span className="text-xs text-slate-600">
          {poll.sample_size ? `n=${poll.sample_size.toLocaleString()}` : ""}
          {poll.sample_size && dateStr ? " · " : ""}
          {dateStr}
        </span>
      </div>
      <div className="space-y-2">
        {results.map((p) => (
          <div key={p.short_name} className="flex items-center gap-3">
            <span className="w-12 text-xs font-medium text-slate-400">
              {p.short_name}
            </span>
            <div className="flex-1">
              <div className="h-4 rounded bg-slate-800">
                <div
                  className="h-4 rounded"
                  style={{ width: `${p.value}%`, backgroundColor: p.colour }}
                />
              </div>
            </div>
            <span className="w-12 text-right text-sm font-semibold text-slate-300">
              {p.value}%
            </span>
          </div>
        ))}
      </div>
      {poll.margin_of_error && (
        <p className="mt-2 text-[10px] text-slate-600">
          MoE: ±{poll.margin_of_error}%
        </p>
      )}
    </DashboardCard>
  );
}
