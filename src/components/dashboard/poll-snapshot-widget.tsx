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
      <DashboardCard title="Latest Poll" badge="Awaiting data" tooltip="The most recent published opinion poll, showing party vote share and sample size." accent="#a855f7">
        <div className="space-y-3">
           <div className="h-4 w-1/3 rounded bg-white/5 animate-shimmer" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-12 h-3 rounded bg-white/5 animate-shimmer" />
              <div className="flex-1 h-5 rounded bg-white/5 animate-shimmer" />
              <div className="w-10 h-3 rounded bg-white/5 animate-shimmer" />
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-xs text-neutral-500">Expected pollsters:</p>
          <div className="flex flex-wrap gap-2 text-xs text-neutral-400">
            {["Curia", "Reid Research", "Verian", "Talbot Mills", "Taxpayers Union"].map((p) => (
              <span key={p} className="rounded-full bg-white/5 px-2.5 py-0.5 ring-1 ring-white/10">{p}</span>
            ))}
          </div>
        </div>
      </DashboardCard>
    );
  }

  const date = new Date(poll.published_date);
  const dateStr = date.toLocaleDateString("en-NZ", { month: "short", year: "numeric" });

  return (
    <DashboardCard title="Latest Poll" badge={poll.pollster} tooltip="The most recent published opinion poll, showing party vote share and sample size." accent="#a855f7">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-xs font-medium text-neutral-500">{poll.pollster}</span>
        <span className="text-xs text-neutral-500">
          {poll.sample_size ? `n=${poll.sample_size.toLocaleString()}` : ""}
          {poll.sample_size && dateStr ? " · " : ""}
          {dateStr}
        </span>
      </div>
      <div className="space-y-2.5">
        {results.map((p) => (
          <div key={p.short_name} className="flex items-center gap-3">
            <span className="w-12 text-xs font-semibold text-neutral-300">
              {p.short_name}
            </span>
            <div className="flex-1">
              <div className="h-5 rounded-md bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-md animate-bar-fill"
                  style={{ width: `${p.value}%`, backgroundColor: p.colour }}
                />
              </div>
            </div>
            <span className="w-12 text-right text-sm font-bold tabular-nums text-neutral-200">
              {p.value}%
            </span>
          </div>
        ))}
      </div>
      {poll.margin_of_error && (
        <p className="mt-3 text-xs text-neutral-500">
          MoE: ±{poll.margin_of_error}%
        </p>
      )}
    </DashboardCard>
  );
}

