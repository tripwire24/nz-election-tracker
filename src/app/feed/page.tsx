import { createClient } from "@supabase/supabase-js";
import FeedFilter from "@/components/feed-filter";
import { PageHero, PagePill } from "@/components/page-primitives";

export const dynamic = "force-dynamic";
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
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

export default async function FeedPage() {
  const supabase = getSupabase();

  const { data: items, count } = await supabase
    .from("content_items")
    .select("id, title, excerpt, source_name, source_type, source_url, published_at, topics, author", { count: "exact" })
    .order("published_at", { ascending: false })
    .limit(50);

  const feedItems = (items as ContentItem[]) ?? [];
  const totalCount = count ?? 0;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Content feed"
        title="Latest NZ political coverage in one place"
        description="Browse the most recent stories, official releases, blog posts, and social items collected by the tracker. Use filters to narrow the feed without losing the bigger picture."
        pills={[
          <PagePill key="total">{totalCount} items tracked</PagePill>,
          <PagePill key="sources">Media, official, blogs, and social</PagePill>,
          <PagePill key="summary">Open any item for a summary</PagePill>,
        ]}
        aside={
          <div className="space-y-3 text-sm text-neutral-300">
            <p>Use this page to spot narrative shifts quickly.</p>
            <p>Source filters help you compare coverage patterns without reading every article in sequence.</p>
          </div>
        }
      />

      <FeedFilter items={feedItems} totalCount={totalCount} />
    </div>
  );
}

