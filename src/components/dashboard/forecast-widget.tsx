import { DashboardCard } from "./card";

/** Headline coalition win probability */
export function ForecastWidget() {
  return (
    <DashboardCard title="Forecast" badge="Indicative">
      <div className="flex items-end gap-6">
        <div className="flex-1">
          <div className="mb-1 text-xs text-slate-500">Centre-right</div>
          <div className="text-3xl font-bold text-blue-400">52%</div>
          <div className="mt-1 h-2 w-full rounded-full bg-slate-800">
            <div className="h-2 rounded-full bg-blue-500" style={{ width: "52%" }} />
          </div>
        </div>
        <div className="flex-1">
          <div className="mb-1 text-xs text-slate-500">Centre-left</div>
          <div className="text-3xl font-bold text-red-400">41%</div>
          <div className="mt-1 h-2 w-full rounded-full bg-slate-800">
            <div className="h-2 rounded-full bg-red-500" style={{ width: "41%" }} />
          </div>
        </div>
        <div className="flex-none text-center">
          <div className="mb-1 text-xs text-slate-500">Hung</div>
          <div className="text-3xl font-bold text-amber-400">7%</div>
          <div className="mt-1 h-2 w-20 rounded-full bg-slate-800">
            <div className="h-2 rounded-full bg-amber-500" style={{ width: "7%" }} />
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-600">
        Indicative only — forecast model not yet connected. Will combine polling averages, sentiment, and economic fundamentals.
      </p>
    </DashboardCard>
  );
}
