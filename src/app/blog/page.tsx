import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

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
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">Blog</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Analysis, commentary, and updates from the team.
        </p>
      </div>

      {!posts || posts.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-[#242424] px-6 py-16 text-center">
          <p className="text-neutral-500">No posts yet — check back soon.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(posts as BlogPost[]).map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="block rounded-xl border border-white/10 bg-[#242424] p-6 transition-colors hover:border-white/20 hover:bg-[#2a2a2a]"
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
