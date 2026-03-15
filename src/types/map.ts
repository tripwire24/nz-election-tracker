/** GeoJSON geometry object from Supabase */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GeoJSONGeometry = Record<string, any>;

/** Party vote breakdown for a single electorate hover popup */
export interface ElectoratePartyVote {
  partyShort: string;
  partyColour: string;
  votes: number;
  pct: number;
}

/** Enriched electorate data for the map component */
export interface MapElectorate {
  id: string;
  name: string;
  type: string;
  region: string | null;
  population: number | null;
  geojson: GeoJSONGeometry | null;
  winnerParty: string | null;
  winnerColour: string | null;
  partyVotes: ElectoratePartyVote[];
}
