"use client";

import { useState } from "react";

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

export default function FeedFilter({
  items,
  totalCount,
}: {
  items: ContentItem[];
  totalCount: number;
}) {
  const [activeSource, setActiveSource] = useState<string | null>(null);

  // Build source counts from all items
  const sourceCounts: Record<string, number> = {};
  for (const item of items) {
    sourceCounts[item.source_name] = (sourceCounts[item.source_name] || 0) + 1;
  }

  const sortedSources = Object.entries(sourceCounts).sort(
    (a, b) => b[1] - a[1],
  );

  const filtered = activeSource
    ? items.filter((item) => item.source_name === activeSource)
    : items;

  return (
    <>
      {/* Source filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSource(null)}
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
            activeSource === null
              ? "border-cyan-500 bg-cyan-500 text-white"
              : "border-stone-200 bg-stone-100 text-stone-600 hover:border-stone-300 hover:bg-stone-200"
          }`}
        >
          All <span className="opacity-60">({items.length})</span>
        </button>
        {sortedSources.map(([name, count]) => (
          <button
            key={name}
            onClick={() =>
              setActiveSource(activeSource === name ? null : name)
            }
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              activeSource === name
                ? "border-cyan-500 bg-cyan-500 text-white"
                : "border-stone-200 bg-stone-100 text-stone-600 hover:border-stone-300 hover:bg-stone-200"
            }`}
          >
            {name} <span className="opacity-60">({count})</span>
          </button>
        ))}
      </div>

      {/* Active filter indicator */}
      {activeSource && (
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <span>
            Showing {filtered.length} of {items.length} articles from{" "}
            <strong className="text-stone-700">{activeSource}</strong>
          </span>
          <button
            onClick={() => setActiveSource(null)}
            className="rounded border border-stone-200 px-2 py-0.5 hover:bg-stone-100"
          >
            Clear
          </button>
        </div>
      )}

      {/* Feed list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-stone-100 p-8 text-center">
          <p className="text-sm text-stone-500">
            No articles ingested yet. Run the RSS ingestion endpoint to
            populate.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <a
              key={item.id}
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-stone-200 bg-white p-4 transition-colors hover:border-stone-200 hover:bg-stone-100"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium leading-snug text-stone-700 line-clamp-2">
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
                        sourceColour[item.source_type] ??
                        "bg-stone-100 text-stone-500"
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
          Showing {filtered.length} of {totalCount} articles
          {activeSource ? ` (filtered by ${activeSource})` : ""}
        </p>
      )}
    </>
  );
}

