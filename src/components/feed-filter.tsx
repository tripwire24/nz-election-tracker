"use client";

import { useState } from "react";
import ArticleSummaryModal from "./article-summary-modal";

const sourceColour: Record<string, string> = {
  official: "bg-blue-500/10 text-blue-400",
  media: "bg-white/5 text-neutral-300",
  blog: "bg-purple-500/10 text-purple-400",
  social: "bg-emerald-500/10 text-emerald-400",
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
  const [selectedArticle, setSelectedArticle] = useState<ContentItem | null>(null);

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
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-white/10 bg-white/5 text-neutral-300 hover:border-white/15 hover:bg-white/10"
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
                ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-white/10 bg-white/5 text-neutral-300 hover:border-white/15 hover:bg-white/10"
            }`}
          >
            {name} <span className="opacity-60">({count})</span>
          </button>
        ))}
      </div>

      {/* Active filter indicator */}
      {activeSource && (
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span>
            Showing {filtered.length} of {items.length} articles from{" "}
            <strong className="text-neutral-200">{activeSource}</strong>
          </span>
          <button
            onClick={() => setActiveSource(null)}
            className="rounded border border-white/10 px-2 py-0.5 hover:bg-white/5"
          >
            Clear
          </button>
        </div>
      )}

      {/* Feed list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-sm text-neutral-400">
            No articles ingested yet. Run the RSS ingestion endpoint to
            populate.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedArticle(item)}
              className="block w-full text-left rounded-xl border border-white/10 bg-[#242424] p-4 transition-colors hover:border-white/10 hover:bg-white/5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium leading-snug text-neutral-200 line-clamp-2">
                    {item.title}
                  </h3>
                  {item.excerpt && (
                    <p className="mt-1.5 text-xs text-neutral-400 line-clamp-2">
                      {item.excerpt}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-xs text-neutral-400">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        sourceColour[item.source_type] ??
                        "bg-white/5 text-neutral-400"
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
                      className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-neutral-400"
                    >
                      {topic.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {totalCount > 50 && (
        <p className="text-center text-xs text-neutral-500">
          Showing {filtered.length} of {totalCount} articles
          {activeSource ? ` (filtered by ${activeSource})` : ""}
        </p>
      )}

      {selectedArticle && (
        <ArticleSummaryModal
          title={selectedArticle.title}
          sourceName={selectedArticle.source_name}
          sourceUrl={selectedArticle.source_url}
          excerpt={selectedArticle.excerpt}
          publishedAt={selectedArticle.published_at}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </>
  );
}

