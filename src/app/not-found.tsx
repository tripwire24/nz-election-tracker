import Link from "next/link";
import { SearchX } from "lucide-react";
import { PageState } from "@/components/page-primitives";

export default function NotFound() {
  return (
    <PageState
      icon={<SearchX className="h-7 w-7" />}
      eyebrow="Not found"
      title="That page is not available"
      description="The page you were looking for either does not exist, is still unpublished, or has moved to a different route."
      action={
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm font-semibold text-neutral-100 transition-colors hover:bg-white/[0.1]"
        >
          Back to dashboard
        </Link>
      }
    />
  );
}

