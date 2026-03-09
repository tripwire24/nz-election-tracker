export default function MapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Electorate Map</h1>
        <p className="mt-1 text-sm text-slate-400">
          Interactive map of NZ&apos;s 72 electorates — 65 general + 7 Māori — with party lean and demographic overlays.
        </p>
      </div>

      {/* Map placeholder */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="relative flex items-center justify-center bg-slate-900" style={{ minHeight: "500px" }}>
          {/* Stylised NZ outline placeholder */}
          <div className="text-center">
            <svg viewBox="0 0 200 400" className="mx-auto h-64 w-32 text-slate-700" fill="currentColor" opacity="0.3">
              {/* Simplified NZ shape */}
              <ellipse cx="120" cy="100" rx="50" ry="80" transform="rotate(-20 120 100)" />
              <ellipse cx="90" cy="280" rx="35" ry="90" transform="rotate(-15 90 280)" />
            </svg>
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-white">Map coming soon</h2>
              <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
                Will display electorate boundaries from LINZ geodata with colour-coded party lean, 
                MP info, demographic overlays, and historical results.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Electorate stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">General electorates</div>
          <div className="mt-2 text-3xl font-bold text-white">65</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Māori electorates</div>
          <div className="mt-2 text-3xl font-bold text-white">7</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total seats</div>
          <div className="mt-2 text-3xl font-bold text-white">120</div>
          <div className="mt-1 text-xs text-slate-500">72 electorate + ~48 list</div>
        </div>
      </div>

      {/* What's needed */}
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">To activate the map:</h2>
        <ul className="space-y-2 text-sm text-slate-400">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-slate-600">○</span>
            <span>LINZ electorate boundary GeoJSON (2024 redistribution)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-slate-600">○</span>
            <span>D3.js or Mapbox GL for interactive rendering</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-slate-600">○</span>
            <span>Candidate data per electorate</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-slate-600">○</span>
            <span>Census demographic overlays from Stats NZ</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
