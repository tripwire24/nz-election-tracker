import { createClient } from "@supabase/supabase-js";

export const revalidate = 300;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export default async function SentimentPage() {
  const supabase = getSupabase();

  const { count: articleCount } = await supabase
    .from("content_items")
    .select("id", { count: "exact", head: true });

  const { count: scoredCount } = await supabase
    .from("sentiment_scores")
    .select("id", { count: "exact", head: true });

  const { data: parties } = await supabase
    .from("parties")
    .select("short_name, name, colour")
    .neq("short_name", "OTH")
    .order("sort_order");

  const partyList = parties ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Sentiment Analysis</h1>
        <p className="mt-1 text-sm text-slate-400">
          AI-powered media sentiment tracking per party and topic, scored using Claude API.
        </p>
      </div>

      {/* Status overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Articles ingested</div>
          <div className="mt-2 text-3xl font-bold text-white">{articleCount ?? 0}</div>
          <div className="mt-1 text-xs text-slate-500">from RSS feeds</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Articles scored</div>
          <div className="mt-2 text-3xl font-bold text-white">{scoredCount ?? 0}</div>
          <div className="mt-1 text-xs text-slate-500">{articleCount ? `${Math.round(((scoredCount ?? 0) / articleCount) * 100)}% coverage` : "awaiting scoring"}</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Model</div>
          <div className="mt-2 text-lg font-bold text-white">Claude Haiku</div>
          <div className="mt-1 text-xs text-slate-500">per-article sentiment scoring</div>
        </div>
      </div>

      {/* Party sentiment grid */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
          Sentiment by party (7-day rolling average)
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {partyList.map((party) => (
            <div
              key={party.short_name}
              className="flex items-center gap-3 rounded-lg border border-slate-800 p-3"
            >
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: party.colour }}
              >
                {party.short_name}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-200">{party.name}</div>
                <div className="text-xs text-slate-500">Awaiting data</div>
              </div>
              <div className="text-sm text-slate-600">—</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scoring pipeline */}
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Sentiment scoring pipeline</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 rounded-full bg-green-600/20 flex items-center justify-center text-green-400 text-lg">✓</div>
            <div className="mt-2 text-xs font-medium text-slate-300">RSS Ingestion</div>
            <div className="mt-0.5 text-[10px] text-slate-500">{articleCount ?? 0} articles</div>
          </div>
          <div className="text-center">
            <div className="mx-auto h-10 w-10 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-400 text-lg">○</div>
            <div className="mt-2 text-xs font-medium text-slate-300">Claude API scoring</div>
            <div className="mt-0.5 text-[10px] text-slate-500">Needs API key</div>
          </div>
          <div className="text-center">
            <div className="mx-auto h-10 w-10 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-400 text-lg">○</div>
            <div className="mt-2 text-xs font-medium text-slate-300">Party attribution</div>
            <div className="mt-0.5 text-[10px] text-slate-500">Per-party scores</div>
          </div>
          <div className="text-center">
            <div className="mx-auto h-10 w-10 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-400 text-lg">○</div>
            <div className="mt-2 text-xs font-medium text-slate-300">Rolling averages</div>
            <div className="mt-0.5 text-[10px] text-slate-500">7-day window</div>
          </div>
        </div>
      </div>
    </div>
  );
}
