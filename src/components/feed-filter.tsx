"use client";

import { useState } from "react";
import ArticleSummaryModal from "./article-summary-modal";
import { PagePanel } from "./page-primitives";

const sourceColour: Record<string, string> = {
  official: "bg-white/[0.06] text-neutral-300 ring-1 ring-white/10",
  media: "bg-white/5 text-neutral-300 ring-1 ring-white/10",
  blog: "bg-[#5d5144]/35 text-[#d0c0aa] ring-1 ring-[#8e775a]/30",
  social: "bg-[#3c5860]/40 text-[#a9cad3] ring-1 ring-[#5c7980]/30",
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
      <PagePanel className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">Source filters</h2>
            <p className="mt-1 text-xs leading-5 text-neutral-500">
              Filter the latest coverage by publisher, blog, or source channel.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            {filtered.length} shown
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSource(null)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              activeSource === null
                ? "border-white/15 bg-white/12 text-white"
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
                  ? "border-white/15 bg-white/12 text-white"
                  : "border-white/10 bg-white/5 text-neutral-300 hover:border-white/15 hover:bg-white/10"
              }`}
            >
              {name} <span className="opacity-60">({count})</span>
            </button>
          ))}
        </div>
      </PagePanel>

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
        <PagePanel className="p-8 text-center">
          <p className="text-sm text-neutral-400">
            No articles ingested yet. Run the RSS ingestion endpoint to
            populate.
          </p>
        </PagePanel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedArticle(item)}
              className="block h-full w-full rounded-[1.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(38,38,38,0.96),rgba(26,26,26,0.98))] p-4 text-left shadow-[0_20px_45px_rgba(0,0,0,0.3)] transition-colors hover:border-white/20 hover:bg-white/[0.04]"
            >
              <div className="flex h-full flex-col justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-3 text-[11px] text-neutral-500">
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium ${
                        sourceColour[item.source_type] ??
                        "bg-white/5 text-neutral-400 ring-1 ring-white/10"
                      }`}
                    >
                      {item.source_name}
                    </span>
                    <span>{relativeTime(item.published_at)}</span>
                  </div>
                  <h3 className="mt-3 text-sm font-medium leading-6 text-neutral-200 line-clamp-3">
                    {item.title}
                  </h3>
                  {item.excerpt && (
                    <p className="mt-2 text-xs leading-5 text-neutral-400 line-clamp-3">
                      {item.excerpt}
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  {item.topics && item.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {item.topics.slice(0, 3).map((topic) => (
                        <span
                          key={topic}
                          className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-neutral-400 ring-1 ring-white/10"
                        >
                          {topic.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                    {item.author && <span>by {item.author}</span>}
                    <span>Open summary</span>
                  </div>
                </div>
              </div>
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

