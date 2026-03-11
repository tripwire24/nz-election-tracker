import { DashboardCard } from "./card";

interface ContentItem {
  id: string;
  title: string;
  source_name: string;
  source_type: string;
  source_url: string;
  published_at: string;
  topics: string[] | null;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const sourceColour: Record<string, string> = {
  official: "bg-blue-50 text-blue-600 ring-1 ring-blue-200",
  media: "bg-stone-100 text-stone-600 ring-1 ring-stone-200",
  blog: "bg-purple-50 text-purple-600 ring-1 ring-purple-200",
  social: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200",
};

/** Top breaking content items — wired to Supabase */
export function ContentFeedWidget({
  items,
  totalArticles,
}: {
  items: ContentItem[];
  totalArticles: number;
}) {
  if (items.length === 0) {
    return (
      <DashboardCard title="Breaking Content" badge="Feed" accent="#f97316">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-stone-200 px-3 py-2.5">
              <div className="h-4 w-3/4 rounded bg-stone-100 animate-shimmer" />
              <div className="mt-2 flex gap-2">
                <div className="h-3 w-16 rounded bg-stone-100 animate-shimmer" />
                <div className="h-3 w-10 rounded bg-stone-100 animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Breaking Content" badge={`${totalArticles} articles`} accent="#f97316">
      <div className="max-h-[360px] overflow-y-auto space-y-3 pr-1 scrollbar-thin">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 rounded-lg border border-stone-200 px-3 py-2.5 transition-colors hover:border-stone-300 hover:bg-stone-50"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-700 leading-snug line-clamp-2">
                {item.title}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs text-stone-500">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${sourceColour[item.source_type] ?? "bg-stone-100 text-stone-400 ring-1 ring-stone-200"}`}>
                  {item.source_name}
                </span>
                <span>{relativeTime(item.published_at)}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </DashboardCard>
  );
}

