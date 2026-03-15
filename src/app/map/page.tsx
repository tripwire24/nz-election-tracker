import { createClient } from "@supabase/supabase-js";
import NZMapLoader from "@/components/nz-map-loader";
import { PageHero, PagePanel, PagePill } from "@/components/page-primitives";
import type { MapElectorate, ElectoratePartyVote, GeoJSONGeometry } from "@/types/map";

export const revalidate = 300;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export default async function MapPage() {
  const supabase = getSupabase();

  // Fetch electorates with geojson + population
  const { data: electorates } = await supabase
    .from("electorates")
    .select("id, name, electorate_type, region, population, geojson")
    .order("name");

  // Fetch parties (for colours/names)
  const { data: parties } = await supabase
    .from("parties")
    .select("id, short_name, colour, name");

  const partyMap = new Map(
    (parties ?? []).map((p: { id: string; short_name: string; colour: string; name: string }) => [
      p.id,
      { short: p.short_name, colour: p.colour, name: p.name },
    ]),
  );

  // Fetch 2023 electorate-level party votes (all rows)
  const allPartyVotes: { electorate_id: string; party_id: string; votes: number; percentage: number }[] = [];
  let offset = 0;
  const pageSize = 1000;
  while (true) {
    const { data: batch } = await supabase
      .from("election_results")
      .select("electorate_id, party_id, votes, percentage")
      .eq("election_year", 2023)
      .eq("vote_type", "party_vote")
      .not("electorate_id", "is", null)
      .order("votes", { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (!batch || batch.length === 0) break;
    allPartyVotes.push(...batch);
    if (batch.length < pageSize) break;
    offset += pageSize;
  }

  // Fetch 2023 electorate vote results (for determining seat winner)
  const allElectorateVotes: { electorate_id: string; party_id: string; votes: number }[] = [];
  let evOffset = 0;
  while (true) {
    const { data: batch } = await supabase
      .from("election_results")
      .select("electorate_id, party_id, votes")
      .eq("election_year", 2023)
      .eq("vote_type", "electorate_vote")
      .not("electorate_id", "is", null)
      .order("votes", { ascending: false })
      .range(evOffset, evOffset + pageSize - 1);
    if (!batch || batch.length === 0) break;
    allElectorateVotes.push(...batch);
    if (batch.length < pageSize) break;
    evOffset += pageSize;
  }

  // Build per-electorate party vote map
  const pvByElectorate = new Map<string, ElectoratePartyVote[]>();
  for (const row of allPartyVotes) {
    const party = partyMap.get(row.party_id);
    if (!party) continue;
    const list = pvByElectorate.get(row.electorate_id) ?? [];
    list.push({
      partyShort: party.short,
      partyColour: party.colour,
      votes: row.votes,
      pct: row.percentage ?? 0,
    });
    pvByElectorate.set(row.electorate_id, list);
  }

  // Build winner map (highest votes per electorate)
  const winnerByElectorate = new Map<string, { party_id: string; votes: number }>();
  for (const w of allElectorateVotes) {
    const existing = winnerByElectorate.get(w.electorate_id);
    if (!existing || w.votes > existing.votes) {
      winnerByElectorate.set(w.electorate_id, { party_id: w.party_id, votes: w.votes });
    }
  }

  // Build the map electorate list
  const electorateList: MapElectorate[] = (electorates ?? []).map(
    (e: { id: string; name: string; electorate_type: string; region: string | null; population: number | null; geojson: GeoJSONGeometry | null }) => {
      const winner = winnerByElectorate.get(e.id);
      const winnerPartyInfo = winner ? partyMap.get(winner.party_id) : null;
      // Get top 6 parties by votes for this electorate
      const pvList = (pvByElectorate.get(e.id) ?? [])
        .sort((a, b) => b.votes - a.votes)
        .slice(0, 6);

      return {
        id: e.id,
        name: e.name,
        type: e.electorate_type,
        region: e.region,
        population: e.population,
        geojson: e.geojson,
        winnerParty: winnerPartyInfo?.short ?? null,
        winnerColour: winnerPartyInfo?.colour ?? null,
        partyVotes: pvList,
      };
    },
  );

  const generalCount = electorateList.filter((e) => e.type === "general").length;
  const maoriCount = electorateList.filter((e) => e.type === "maori").length;
  const withBoundary = electorateList.filter((e) => e.geojson).length;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Map"
        title="Browse electorates without losing the national picture"
        description={`Explore NZ's ${electorateList.length || 72} electorates, including ${generalCount || 65} general electorates and ${maoriCount || 7} Māori electorates. Hover or tap on a boundary to see the 2023 party vote breakdown and population.`}
        pills={[
          <PagePill key="count">{electorateList.length || 72} electorates</PagePill>,
          <PagePill key="general">{generalCount || 65} general</PagePill>,
          <PagePill key="maori">{maoriCount || 7} Māori</PagePill>,
        ]}
        aside={
          <div className="space-y-3 text-sm text-neutral-300">
            <p>Boundaries are from the 2025 electorate redistribution. Colours show the 2023 electorate seat winner.</p>
            <p>Hover over any electorate to see its party vote split and population.</p>
          </div>
        }
      />

      {/* Map + legend */}
      <div className="grid gap-6 lg:grid-cols-3">
        <PagePanel className="overflow-hidden p-0 lg:col-span-2">
          <NZMapLoader electorates={electorateList} />
        </PagePanel>
        <div className="space-y-4">
          {/* Legend */}
          <PagePanel className="p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">Party colours (2023 seat winner)</h3>
            <div className="space-y-2">
              {[
                { colour: "#00529F", label: "National" },
                { colour: "#D82A20", label: "Labour" },
                { colour: "#098137", label: "Green" },
                { colour: "#FDE401", label: "ACT", textDark: true },
                { colour: "#B2001A", label: "Te Pāti Māori" },
              ].map((p) => (
                <div key={p.label} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: p.colour }} />
                  <span className="text-sm text-neutral-300">{p.label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                <span className="h-3 w-3 rounded-sm border border-dashed border-red-400 bg-red-500/20" />
                <span className="text-sm text-neutral-300">Māori electorate (overlay)</span>
              </div>
            </div>
          </PagePanel>

          {/* Stats */}
          <PagePanel className="p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">Seats</h3>
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold text-neutral-100">{generalCount || 65}</div>
                <div className="text-xs text-neutral-400">General electorates</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-100">{maoriCount || 7}</div>
                <div className="text-xs text-neutral-400">Māori electorates</div>
              </div>
              <div className="border-t border-white/10 pt-3">
                <div className="text-2xl font-bold text-neutral-100">122</div>
                <div className="text-xs text-neutral-400">Total seats (71 electorate + 51 list)</div>
              </div>
            </div>
          </PagePanel>

          {/* Electorate list */}
          {electorateList.length > 0 && (
            <PagePanel className="max-h-64 overflow-y-auto p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">Electorates ({electorateList.length})</h3>
              <div className="space-y-1">
                {electorateList.map((e) => (
                  <div key={e.id} className="flex items-center gap-2 text-xs">
                    <span
                      className="h-2 w-2 rounded-sm"
                      style={{ backgroundColor: e.winnerColour || (e.type === "maori" ? "#B2001A" : "#666") }}
                    />
                    <span className="text-neutral-300">{e.name}</span>
                    {e.winnerParty && <span className="text-neutral-500">· {e.winnerParty}</span>}
                  </div>
                ))}
              </div>
            </PagePanel>
          )}
        </div>
      </div>

      {/* Roadmap */}
      <PagePanel className="border-dashed bg-[#2a2a2a] p-6">
        <h2 className="text-sm font-semibold text-neutral-300 mb-3">Map progress</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-neutral-300">✓</span>
            <span className="text-neutral-300">{withBoundary} electorates with full boundary polygons (2025 redistribution)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-neutral-300">✓</span>
            <span className="text-neutral-300">General vs Māori electorate distinction</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-neutral-300">✓</span>
            <span className="text-neutral-300">Colour-coded by 2023 electorate seat winner</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-neutral-300">✓</span>
            <span className="text-neutral-300">Hover popup with party vote breakdown and population</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-amber-500">○</span>
            <span className="text-neutral-500">Census demographic overlays from Stats NZ</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-amber-500">○</span>
            <span className="text-neutral-500">Candidate data per electorate</span>
          </li>
        </ul>
      </PagePanel>
    </div>
  );
}

