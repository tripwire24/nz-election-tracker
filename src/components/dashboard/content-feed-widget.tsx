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
  official: "bg-white/[0.06] text-neutral-300 ring-1 ring-white/10",
  media: "bg-white/5 text-neutral-400 ring-1 ring-white/10",
  blog: "bg-[#5d5144]/35 text-[#d0c0aa] ring-1 ring-[#8e775a]/30",
  social: "bg-[#3c5860]/40 text-[#a9cad3] ring-1 ring-[#5c7980]/30",
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
      <DashboardCard title="Latest Coverage" badge="Feed" tooltip="Latest NZ political coverage collected from media, official sources, blogs, and social feeds." accent="linear-gradient(90deg, #705b48, #ba8c63)">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-white/10 px-3 py-2.5">
              <div className="h-4 w-3/4 rounded bg-white/5 animate-shimmer" />
              <div className="mt-2 flex gap-2">
                <div className="h-3 w-16 rounded bg-white/5 animate-shimmer" />
                <div className="h-3 w-10 rounded bg-white/5 animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Latest Coverage" badge={`${totalArticles} tracked`} tooltip="Latest NZ political coverage collected from media, official sources, blogs, and social feeds." accent="linear-gradient(90deg, #705b48, #ba8c63)">
      <div className="max-h-[360px] overflow-y-auto space-y-3 pr-1 scrollbar-thin">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 rounded-lg border border-white/10 px-3 py-2.5 transition-colors hover:border-white/20 hover:bg-white/5"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-200 leading-snug line-clamp-2">
                {item.title}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${sourceColour[item.source_type] ?? "bg-white/5 text-neutral-400 ring-1 ring-white/10"}`}>
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

