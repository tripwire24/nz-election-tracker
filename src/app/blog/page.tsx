import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { PageHero, PagePanel, PagePill } from "@/components/page-primitives";

export const dynamic = "force-dynamic";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  author: string | null;
  published_at: string | null;
}

export default async function BlogPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, author, published_at")
    .eq("published", true)
    .order("published_at", { ascending: false });

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Blog"
        title="Analysis, commentary, and project updates"
        description="Read explainers, commentary, and product notes from the team in a cleaner editorial layout that sits closer to the rest of the public site."
        pills={[
          <PagePill key="posts">{posts?.length ?? 0} published posts</PagePill>,
          <PagePill key="topics">Commentary, analysis, and updates</PagePill>,
        ]}
      />

      {!posts || posts.length === 0 ? (
        <PagePanel className="px-6 py-16 text-center">
          <p className="text-neutral-500">No posts yet — check back soon.</p>
        </PagePanel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(posts as BlogPost[]).map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="block rounded-[1.35rem] border border-white/10 bg-[linear-gradient(180deg,rgba(38,38,38,0.96),rgba(26,26,26,0.98))] p-6 shadow-[0_20px_45px_rgba(0,0,0,0.3)] transition-colors hover:border-white/20 hover:bg-white/[0.04]"
            >
              <h2 className="text-lg font-semibold text-neutral-100">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="mt-2 line-clamp-2 text-sm text-neutral-400">
                  {post.excerpt}
                </p>
              )}
              <div className="mt-3 flex items-center gap-3 text-xs text-neutral-500">
                {post.author && <span>{post.author}</span>}
                {post.published_at && (
                  <time dateTime={post.published_at}>
                    {new Date(post.published_at).toLocaleDateString("en-NZ", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </time>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
