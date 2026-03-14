import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PagePanel, PagePill } from "@/components/page-primitives";

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
    <div className="mx-auto max-w-3xl space-y-8">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-neutral-300"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to blog
      </Link>

      <article className="space-y-6">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-400">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c0c0c0]" />
            Blog post
          </div>
          <h1 className="text-3xl font-bold text-neutral-100">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
            {post.author && <PagePill className="text-xs" >{post.author}</PagePill>}
            {post.published_at && (
              <PagePill className="text-xs" >
                <time dateTime={post.published_at}>
                {new Date(post.published_at).toLocaleDateString("en-NZ", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                </time>
              </PagePill>
            )}
          </div>
        </header>

        <PagePanel className="p-8">
        <div className="whitespace-pre-wrap text-neutral-300 leading-8">
          {post.body}
        </div>
        </PagePanel>
      </article>
    </div>
  );
}
