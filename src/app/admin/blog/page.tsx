"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  author: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
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
    setBody("");
    setEditing(true);
    // Load full body
    fetch(`/api/admin/blog`)
      .then((r) => r.json())
      .then((all: BlogPost[]) => {
        // The list doesn't include body — for the scaffold we re-fetch individual posts
        // For now, body editing starts empty for existing posts
      });
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

  return (
    <div className="min-h-screen bg-[#1a1a1a] px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-100">Blog Posts</h1>
            <p className="mt-1 text-sm text-neutral-500">Create and manage blog content</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-200"
            >
              ← Admin
            </Link>
            {!editing && (
              <button
                onClick={openNew}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                New post
              </button>
            )}
          </div>
        </div>

        {/* Editor */}
        {editing && (
          <div className="rounded-xl border border-white/10 bg-[#242424] p-6 space-y-4">
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
                className="rounded-lg border border-white/10 bg-[#2a2a2a] px-3 py-2 text-sm text-neutral-200 outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                placeholder="slug-url"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="rounded-lg border border-white/10 bg-[#2a2a2a] px-3 py-2 text-sm text-neutral-200 outline-none focus:border-emerald-500"
              />
            </div>
            <input
              type="text"
              placeholder="Author (optional)"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#2a2a2a] px-3 py-2 text-sm text-neutral-200 outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="Excerpt (optional, shown on listing)"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#2a2a2a] px-3 py-2 text-sm text-neutral-200 outline-none focus:border-emerald-500"
            />
            <textarea
              placeholder="Post body (plain text for now)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="w-full rounded-lg border border-white/10 bg-[#2a2a2a] px-3 py-2 text-sm text-neutral-200 outline-none focus:border-emerald-500 resize-y"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={!title.trim() || !slug.trim() || saving}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {saving ? "Saving…" : editId ? "Update" : "Create"}
              </button>
              <button
                onClick={resetForm}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-neutral-400 transition-colors hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Post list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#242424] px-6 py-12 text-center">
            <p className="text-neutral-500">No blog posts yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-[#242424] px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-neutral-100">
                      {post.title}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        post.published
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {post.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <span className="text-xs text-neutral-500">/{post.slug}</span>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={() => togglePublished(post)}
                    className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
                  >
                    {post.published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => openEdit(post)}
                    className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deletePost(post)}
                    className="rounded-lg border border-red-500/20 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
