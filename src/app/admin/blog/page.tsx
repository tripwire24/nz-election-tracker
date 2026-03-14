"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHero, PagePanel, PagePill } from "@/components/page-primitives";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  author: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
}

function formatDate(value: string | null) {
  if (!value) return "Draft";

  return new Date(value).toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Editor state
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPosts = useCallback(async () => {
    const res = await fetch("/api/admin/blog");
    if (res.ok) setPosts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  function resetForm() {
    setEditing(false);
    setEditId(null);
    setTitle("");
    setSlug("");
    setExcerpt("");
    setBody("");
    setAuthor("");
  }

  function openNew() {
    resetForm();
    setEditing(true);
  }

  function openEdit(post: BlogPost) {
    setEditId(post.id);
    setTitle(post.title);
    setSlug(post.slug);
    setExcerpt(post.excerpt || "");
    setAuthor(post.author || "");
    setBody(post.body || "");
    setEditing(true);
  }

  async function handleSave() {
    if (!title.trim() || !slug.trim()) return;
    setSaving(true);

    if (editId) {
      await fetch("/api/admin/blog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          title: title.trim(),
          slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""),
          excerpt: excerpt.trim() || null,
          body: body || undefined,
          author: author.trim() || null,
        }),
      });
    } else {
      await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""),
          excerpt: excerpt.trim() || null,
          body,
          author: author.trim() || null,
          published: false,
        }),
      });
    }

    setSaving(false);
    resetForm();
    fetchPosts();
  }

  async function togglePublished(post: BlogPost) {
    await fetch("/api/admin/blog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: post.id, published: !post.published }),
    });
    fetchPosts();
  }

  async function deletePost(post: BlogPost) {
    if (!confirm(`Delete "${post.title}"?`)) return;
    await fetch("/api/admin/blog", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: post.id }),
    });
    fetchPosts();
  }

  function autoSlug(t: string) {
    return t
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80);
  }

  const publishedCount = posts.filter((post) => post.published).length;
  const draftCount = Math.max(0, posts.length - publishedCount);

  return (
    <div className="space-y-8 py-6">
      <PageHero
        eyebrow="Admin content"
        title="Manage editorial posts and drafts"
        description="Create new articles, update existing posts, and decide what is live on the public blog without leaving the admin workflow."
        pills={[
          <PagePill key="count">{loading ? "Loading posts" : `${posts.length} total posts`}</PagePill>,
          <PagePill key="published">{loading ? "Checking live posts" : `${publishedCount} published`}</PagePill>,
          <PagePill key="drafts">{loading ? "Checking drafts" : `${draftCount} drafts`}</PagePill>,
        ]}
        aside={
          <div className="space-y-3 text-sm text-neutral-300">
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2.5 text-sm font-semibold text-neutral-300 transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                Back to admin
              </Link>
              {!editing && (
                <button
                  onClick={openNew}
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.1]"
                >
                  New post
                </button>
              )}
            </div>
            <p>Keep titles plain, slugs clean, and excerpts short enough to scan quickly on the public site.</p>
          </div>
        }
      />

        {editing && (
          <PagePanel className="space-y-4 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
              {editId ? "Edit Post" : "New Post"}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!editId) setSlug(autoSlug(e.target.value));
                }}
                className="rounded-[1rem] border border-white/10 bg-[#2a2a2a] px-3 py-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-300"
              />
              <input
                type="text"
                placeholder="slug-url"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="rounded-[1rem] border border-white/10 bg-[#2a2a2a] px-3 py-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-300"
              />
            </div>
            <input
              type="text"
              placeholder="Author (optional)"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full rounded-[1rem] border border-white/10 bg-[#2a2a2a] px-3 py-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-300"
            />
            <input
              type="text"
              placeholder="Excerpt (optional, shown on listing)"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full rounded-[1rem] border border-white/10 bg-[#2a2a2a] px-3 py-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-300"
            />
            <textarea
              placeholder="Post body (plain text for now)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="w-full resize-y rounded-[1rem] border border-white/10 bg-[#2a2a2a] px-3 py-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-300"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={!title.trim() || !slug.trim() || saving}
                className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.1] disabled:opacity-40"
              >
                {saving ? "Saving…" : editId ? "Update" : "Create"}
              </button>
              <button
                onClick={resetForm}
                className="rounded-full border border-white/10 px-4 py-2.5 text-sm text-neutral-300 transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                Cancel
              </button>
            </div>
          </PagePanel>
        )}

      <PagePanel className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-400">Posts</h2>
            <p className="mt-2 text-sm text-neutral-500">Review what is live, what remains in draft, and what needs editing.</p>
          </div>
          {!loading && (
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              {posts.length} items
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-[1rem] border border-white/10 bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
            <p className="text-sm text-neutral-400">No blog posts yet.</p>
            <p className="mt-2 text-xs text-neutral-500">Create your first post to start building the public editorial section.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="flex flex-col gap-4 rounded-[1.15rem] border border-white/10 bg-white/[0.03] px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium text-neutral-100">{post.title}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        post.published
                          ? "bg-white/[0.08] text-neutral-200 ring-1 ring-white/10"
                          : "bg-[#5d5144]/35 text-[#d0c0aa] ring-1 ring-[#8e775a]/30"
                      }`}
                    >
                      {post.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                    <span>/{post.slug}</span>
                    <span>{post.author || "No author set"}</span>
                    <span>{post.published ? `Live ${formatDate(post.published_at)}` : `Created ${formatDate(post.created_at)}`}</span>
                  </div>
                  {post.excerpt ? <p className="mt-3 text-sm leading-6 text-neutral-400">{post.excerpt}</p> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:ml-3 lg:justify-end">
                  <button
                    onClick={() => togglePublished(post)}
                    className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition-colors hover:bg-white/[0.04] hover:text-white"
                  >
                    {post.published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => openEdit(post)}
                    className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition-colors hover:bg-white/[0.04] hover:text-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deletePost(post)}
                    className="rounded-full border border-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </PagePanel>
    </div>
  );
}
