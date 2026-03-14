import { createClient } from "@supabase/supabase-js";
import { PageHero, PagePanel, PagePill } from "@/components/page-primitives";

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
  const latestPoll = pollList[0] ?? null;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Polling"
        title="Current party vote polls without the clutter"
        description="Compare the latest published NZ party vote polls in a denser grid, with sample size, margin of error, and source links kept close to the data."
        pills={[
          <PagePill key="count">{pollList.length} recent polls</PagePill>,
          <PagePill key="pollster">{latestPoll ? `Latest: ${latestPoll.pollster}` : "Waiting for data"}</PagePill>,
          <PagePill key="tracked">{partyList.filter((p) => p.short_name !== "OTH").length} main parties tracked</PagePill>,
        ]}
        aside={
          <div className="space-y-3 text-sm text-neutral-300">
            <p>These are current poll results, not election-day predictions.</p>
            <p>Use this page to compare individual polls. Use the forecast page to see what the combined polling picture means for seats.</p>
          </div>
        }
      />

      {pollList.length === 0 ? (
        <PagePanel className="p-8">
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
        </PagePanel>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {pollList.map((poll) => {
            const results = poll.poll_results
              .filter((r) => r.parties)
              .sort((a, b) => b.value - a.value);

            return (
              <PagePanel
                key={poll.id}
                className="p-5"
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
                      className="text-xs text-neutral-300 transition-colors hover:text-white"
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
              </PagePanel>
            );
          })}
        </div>
      )}
    </div>
  );
}

