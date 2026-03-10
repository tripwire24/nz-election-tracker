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
  official: "bg-blue-900 text-blue-300",
  media: "bg-slate-800 text-slate-300",
  blog: "bg-purple-900 text-purple-300",
  social: "bg-green-900 text-green-300",
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
      <DashboardCard title="Breaking Content" badge="Feed">
        <p className="text-sm text-slate-500">No articles ingested yet. Run the RSS ingestion endpoint to populate.</p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Breaking Content" badge={`${totalArticles} articles`}>
      <div className="space-y-3">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 rounded-lg border border-slate-800/50 px-3 py-2.5 transition-colors hover:border-slate-700 hover:bg-slate-800/30"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 leading-snug line-clamp-2">
                {item.title}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${sourceColour[item.source_type] ?? "bg-slate-800 text-slate-400"}`}>
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
