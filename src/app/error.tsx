"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { PageState } from "@/components/page-primitives";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageState
      icon={<AlertTriangle className="h-7 w-7" />}
      eyebrow="Application error"
      title="Something interrupted this page"
      description={
        <>
          <p>An unexpected error occurred while loading this view. Try again first. If the problem persists, return to the dashboard and retry from there.</p>
          {error.digest ? <p className="mt-3 text-xs text-neutral-500">Reference: {error.digest}</p> : null}
        </>
      }
      action={
        <>
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm font-semibold text-neutral-100 transition-colors hover:bg-white/[0.1]"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-neutral-300 transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            Back to dashboard
          </Link>
        </>
      }
    />
  );
}

