import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

const PARTY_COLOURS: Record<string, string> = {
  NAT: "#00529F",
  LAB: "#D82A20",
  GRN: "#098137",
  ACT: "#FDE401",
  NZF: "#000000",
  TPM: "#B2001A",
  TOP: "#32DAC3",
  NZL: "#512888",
  OTH: "#999999",
};

interface PollRow {
  id: string;
  pollster: string;
  published_date: string;
  sample_size: number | null;
  margin_of_error: number | null;
  source_url: string | null;
  poll_results: {
    value: number;
    parties: { short_name: string; name: string; colour: string } | null;
  }[];
}

export default async function PollsPage() {
  const supabase = getSupabase();

  const { data: polls } = await supabase
    .from("polls")
    .select(
      "id, pollster, published_date, sample_size, margin_of_error, source_url, poll_results(value, parties(short_name, name, colour))"
    )
    .eq("poll_type", "party_vote")
    .order("published_date", { ascending: false })
    .limit(20);

  const { data: parties } = await supabase
    .from("parties")
    .select("short_name, name, colour")
    .order("sort_order");

  const partyList = (parties ?? []) as { short_name: string; name: string; colour: string }[];
  const pollList = (polls as unknown as PollRow[]) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">Polls</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Party vote polling data from NZ pollsters. Auto-scraped from Wikipedia and direct sources.
        </p>
      </div>

      {pollList.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-lg font-semibold text-neutral-100">Awaiting polling data</h2>
          <p className="mt-2 text-sm text-neutral-500">
            No polls have been ingested yet. The Wikipedia polling scraper will populate this page
            once 2026 NZ election polling data is published.
          </p>
          <div className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
              Expected pollsters
            </h3>
            <div className="flex flex-wrap gap-2">
              {["Curia / Taxpayers Union", "Reid Research / Newshub", "Verian (Colmar Brunton)", "Talbot Mills / 1News", "Roy Morgan", "Horizon Research"].map((p) => (
                <span key={p} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-neutral-300">
                  {p}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
              Parties tracked
            </h3>
            <div className="flex flex-wrap gap-2">
              {partyList.filter(p => p.short_name !== "OTH").map((p) => (
                <span
                  key={p.short_name}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-neutral-300"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: p.colour }}
                  />
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {pollList.map((poll) => {
            const results = poll.poll_results
              .filter((r) => r.parties)
              .sort((a, b) => b.value - a.value);

            return (
              <div
                key={poll.id}
                className="rounded-xl border border-white/10 bg-[#242424] p-5"
              >
                <div className="mb-4 flex items-baseline justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-100">{poll.pollster}</h3>
                    <p className="text-xs text-neutral-400">
                      {new Date(poll.published_date).toLocaleDateString("en-NZ", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      {poll.sample_size && ` · n=${poll.sample_size.toLocaleString()}`}
                      {poll.margin_of_error && ` · MoE ±${poll.margin_of_error}%`}
                    </p>
                  </div>
                  {poll.source_url && (
                    <a
                      href={poll.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Source →
                    </a>
                  )}
                </div>
                <div className="space-y-2">
                  {results.map((r) => (
                    <div key={r.parties!.short_name} className="flex items-center gap-3">
                      <span className="w-12 text-xs font-medium text-neutral-500">
                        {r.parties!.short_name}
                      </span>
                      <div className="flex-1">
                        <div className="h-4 rounded bg-white/5">
                          <div
                            className="h-4 rounded transition-all"
                            style={{
                              width: `${Math.min(r.value, 100)}%`,
                              backgroundColor: r.parties!.colour || PARTY_COLOURS[r.parties!.short_name] || "#666",
                            }}
                          />
                        </div>
                      </div>
                      <span className="w-14 text-right text-sm font-semibold text-neutral-300">
                        {r.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

