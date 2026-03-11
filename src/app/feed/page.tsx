import { createClient } from "@supabase/supabase-js";
import FeedFilter from "@/components/feed-filter";

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
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Content Feed</h1>
        <p className="mt-1 text-sm text-stone-400">
          {totalCount} articles from NZ political sources — aggregated from RSS feeds across media, government, and blogs. Click a source to filter.
        </p>
      </div>

      <FeedFilter items={feedItems} totalCount={totalCount} />
    </div>
  );
}
