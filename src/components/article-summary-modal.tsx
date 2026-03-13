"use client";

import { useEffect } from "react";

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

        {/* Excerpt */}
        {excerpt && (
          <p className="mt-3 text-sm leading-relaxed text-neutral-400">
            {excerpt}
          </p>
        )}

        {/* CTA */}
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-neutral-600 to-neutral-700 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
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
