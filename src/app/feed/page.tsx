import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

const sourceColour: Record<string, string> = {
  official: "bg-blue-50 text-blue-700",
  media: "bg-stone-100 text-stone-600",
  blog: "bg-purple-50 text-purple-700",
  social: "bg-emerald-50 text-emerald-700",
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
  });
}

interface ContentItem {
  id: string;
  title: string;
  excerpt: string | null;
  source_name: string;
  source_type: string;
  source_url: string;
  published_at: string;
  topics: string[] | null;
  author: string | null;
}

export default async function FeedPage() {
  const supabase = getSupabase();

  const { data: items, count } = await supabase
    .from("content_items")
    .select("id, title, excerpt, source_name, source_type, source_url, published_at, topics, author", { count: "exact" })
    .order("published_at", { ascending: false })
    .limit(50);

  const feedItems = (items as ContentItem[]) ?? [];
  const totalCount = count ?? 0;

  // Group by source for filter counts
  const sourceCounts: Record<string, number> = {};
  feedItems.forEach((item) => {
    sourceCounts[item.source_name] = (sourceCounts[item.source_name] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Content Feed</h1>
        <p className="mt-1 text-sm text-stone-400">
          {totalCount} articles from NZ political sources — aggregated from RSS feeds across media, government, and blogs.
        </p>
      </div>

      {/* Source chips */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(sourceCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([name, count]) => (
            <span
              key={name}
              className="rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-xs text-stone-600"
            >
              {name} <span className="text-stone-500">({count})</span>
            </span>
          ))}
      </div>

      {/* Feed list */}
      {feedItems.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-stone-100 p-8 text-center">
          <p className="text-sm text-stone-500">No articles ingested yet. Run the RSS ingestion endpoint to populate.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedItems.map((item) => (
            <a
              key={item.id}
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-stone-200 bg-white p-4 transition-colors hover:border-stone-200 hover:bg-stone-100"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-stone-700 leading-snug line-clamp-2">
                    {item.title}
                  </h3>
                  {item.excerpt && (
                    <p className="mt-1.5 text-xs text-stone-500 line-clamp-2">
                      {item.excerpt}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-xs text-stone-500">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        sourceColour[item.source_type] ?? "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {item.source_name}
                    </span>
                    {item.author && <span>by {item.author}</span>}
                    <span>{relativeTime(item.published_at)}</span>
                  </div>
                </div>
              </div>
              {item.topics && item.topics.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.topics.map((topic) => (
                    <span
                      key={topic}
                      className="rounded bg-stone-100 px-2 py-0.5 text-[10px] text-stone-500"
                    >
                      {topic.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </a>
          ))}
        </div>
      )}

      {totalCount > 50 && (
        <p className="text-center text-xs text-stone-400">
          Showing 50 of {totalCount} articles
        </p>
      )}
    </div>
  );
}
