import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("id, title, slug, body, excerpt, author, published_at")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!post) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-neutral-300"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to blog
      </Link>

      <article>
        <header className="space-y-3">
          <h1 className="text-3xl font-bold text-neutral-100">{post.title}</h1>
          <div className="flex items-center gap-3 text-sm text-neutral-500">
            {post.author && <span>{post.author}</span>}
            {post.published_at && (
              <time dateTime={post.published_at}>
                {new Date(post.published_at).toLocaleDateString("en-NZ", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            )}
          </div>
        </header>

        <div className="mt-8 whitespace-pre-wrap text-neutral-300 leading-relaxed">
          {post.body}
        </div>
      </article>
    </div>
  );
}
