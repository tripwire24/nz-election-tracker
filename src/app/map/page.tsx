import { createClient } from "@supabase/supabase-js";
import NZMapLoader from "@/components/nz-map-loader";

export const revalidate = 300;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export default async function MapPage() {
  const supabase = getSupabase();

  const { data: electorates } = await supabase
    .from("electorates")
    .select("id, name, electorate_type, region")
    .order("name");

  const electorateList = (electorates ?? []).map((e: { id: string; name: string; electorate_type: string; region: string | null }) => ({
    id: e.id,
    name: e.name,
    type: e.electorate_type,
    region: e.region,
  }));
  const generalCount = electorateList.filter((e) => e.type === "general").length;
  const maoriCount = electorateList.filter((e) => e.type === "maori").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Electorate Map</h1>
        <p className="mt-1 text-sm text-stone-400">
          NZ&apos;s {electorateList.length || 72} electorates — {generalCount || 65} general + {maoriCount || 7} Māori — with party lean and demographic overlays.
        </p>
      </div>

      {/* Map + legend */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-stone-200 bg-stone-100 overflow-hidden">
          <NZMapLoader electorates={electorateList} />
        </div>
        <div className="space-y-4">
          {/* Legend */}
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">Legend</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-sm text-stone-600">General electorate</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm text-stone-600">Māori electorate</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">Seats</h3>
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold text-stone-900">{generalCount || 65}</div>
                <div className="text-xs text-stone-500">General electorates</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-stone-900">{maoriCount || 7}</div>
                <div className="text-xs text-stone-500">Māori electorates</div>
              </div>
              <div className="border-t border-stone-200 pt-3">
                <div className="text-2xl font-bold text-stone-900">120</div>
                <div className="text-xs text-stone-500">Total seats (72 electorate + ~48 list)</div>
              </div>
            </div>
          </div>

          {/* Electorate list */}
          {electorateList.length > 0 && (
            <div className="rounded-xl border border-stone-200 bg-white p-4 max-h-64 overflow-y-auto">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">Electorates ({electorateList.length})</h3>
              <div className="space-y-1">
                {electorateList.map((e) => (
                  <div key={e.id} className="flex items-center gap-2 text-xs">
                    <span className={`h-2 w-2 rounded-full ${e.type === "maori" ? "bg-red-500" : "bg-blue-500"}`} />
                    <span className="text-stone-600">{e.name}</span>
                    {e.region && <span className="text-stone-400">· {e.region}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Roadmap */}
      <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 p-6">
        <h2 className="text-sm font-semibold text-stone-600 mb-3">Map progress</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-emerald-500">✓</span>
            <span className="text-stone-600">72 electorates plotted at real geographic coordinates</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-emerald-500">✓</span>
            <span className="text-stone-600">General vs Māori electorate distinction</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-amber-500">○</span>
            <span className="text-stone-400">Full LINZ electorate boundary GeoJSON (2024 redistribution)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-amber-500">○</span>
            <span className="text-stone-400">Colour-coded party lean from 2023 election results</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-amber-500">○</span>
            <span className="text-stone-400">Census demographic overlays from Stats NZ</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-amber-500">○</span>
            <span className="text-stone-400">Candidate data per electorate</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
