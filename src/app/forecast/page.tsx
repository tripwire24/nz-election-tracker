export default function ForecastPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Forecast</h1>
        <p className="mt-1 text-sm text-slate-400">
          Monte Carlo simulation combining polling averages, sentiment analysis, and economic fundamentals.
        </p>
      </div>

      {/* Coalition probabilities */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
          Coalition win probability
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-blue-900/50 bg-blue-950/30 p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">52%</div>
            <div className="mt-1 text-sm text-slate-400">Centre-right</div>
            <div className="mt-0.5 text-[10px] text-slate-600">NAT + ACT + NZF</div>
          </div>
          <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-center">
            <div className="text-3xl font-bold text-red-400">41%</div>
            <div className="mt-1 text-sm text-slate-400">Centre-left</div>
            <div className="mt-0.5 text-[10px] text-slate-600">LAB + GRN + TPM</div>
          </div>
          <div className="rounded-lg border border-amber-900/50 bg-amber-950/30 p-4 text-center">
            <div className="text-3xl font-bold text-amber-400">7%</div>
            <div className="mt-1 text-sm text-slate-400">Hung parliament</div>
            <div className="mt-0.5 text-[10px] text-slate-600">No bloc reaches 61</div>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-600">
          Indicative only — forecast model not yet connected.
        </p>
      </div>

      {/* Model methodology */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
          Model methodology
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400 text-sm font-bold">1</div>
              <h3 className="text-sm font-medium text-slate-200">Polling average</h3>
            </div>
            <p className="text-xs text-slate-500">
              Weighted average of recent polls with recency decay and house-effect adjustment per pollster.
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-green-600/20 flex items-center justify-center text-green-400 text-sm font-bold">2</div>
              <h3 className="text-sm font-medium text-slate-200">Sentiment index</h3>
            </div>
            <p className="text-xs text-slate-500">
              AI-scored media + social sentiment per party, contributing a ±2pp adjustment to polling estimates.
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-amber-600/20 flex items-center justify-center text-amber-400 text-sm font-bold">3</div>
              <h3 className="text-sm font-medium text-slate-200">Fundamentals</h3>
            </div>
            <p className="text-xs text-slate-500">
              Economic indicators (OCR, unemployment, CPI) regressed against historical incumbency swing.
            </p>
          </div>
        </div>
      </div>

      {/* What's needed */}
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">To activate the forecast model:</h2>
        <ul className="space-y-2 text-sm text-slate-400">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-slate-600">○</span>
            <span>Polling data ingested (Wikipedia scraper or manual entry)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-slate-600">○</span>
            <span>Historical election results seeded (2017, 2020, 2023)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-slate-600">○</span>
            <span>Economic data feed connected (RBNZ, Stats NZ)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-slate-600">○</span>
            <span>Sentiment engine scoring articles (Claude API)</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
