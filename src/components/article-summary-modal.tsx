"use client";

import { useEffect, useState } from "react";

interface Props {
  title: string;
  sourceName: string;
  sourceUrl: string;
  excerpt: string | null;
  publishedAt: string;
  onClose: () => void;
}

export default function ArticleSummaryModal({
  title,
  sourceName,
  sourceUrl,
  excerpt,
  publishedAt,
  onClose,
}: Props) {
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/article-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, url: sourceUrl, excerpt }),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setSummary(d.summary))
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [title, sourceUrl, excerpt]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const date = new Date(publishedAt).toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#242424] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-neutral-500 hover:bg-white/10 hover:text-neutral-200 transition-colors"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Source + date */}
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span className="rounded bg-white/5 px-2 py-0.5 font-medium ring-1 ring-white/10">
            {sourceName}
          </span>
          <span>{date}</span>
        </div>

        {/* Title */}
        <h2 className="mt-3 text-lg font-semibold leading-snug text-neutral-100 pr-8">
          {title}
        </h2>

        {/* AI Summary */}
        <div className="mt-4 rounded-xl border border-white/10 bg-[#1a1a1a] p-4">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            AI Summary
          </div>
          {error ? (
            <p className="text-sm text-neutral-400">
              Summary unavailable. Read the full article instead.
            </p>
          ) : summary ? (
            <p className="text-sm leading-relaxed text-neutral-300">{summary}</p>
          ) : (
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-white/5 animate-pulse" />
              <div className="h-3 w-4/5 rounded bg-white/5 animate-pulse" />
              <div className="h-3 w-3/5 rounded bg-white/5 animate-pulse" />
            </div>
          )}
        </div>

        {/* CTA */}
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Read full article
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </div>
    </div>
  );
}
