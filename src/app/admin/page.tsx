"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface PageSetting {
  slug: string;
  label: string;
  visible: boolean;
  updated_at: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [pages, setPages] = useState<PageSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [resettingPoll, setResettingPoll] = useState(false);

  const fetchPages = useCallback(async () => {
    const res = await fetch("/api/admin/pages");
    if (res.ok) {
      setPages(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  async function toggleVisibility(slug: string, currentVisible: boolean) {
    setToggling(slug);
    const res = await fetch("/api/admin/pages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, visible: !currentVisible }),
    });
    if (res.ok) {
      setPages((prev) =>
        prev.map((p) => (p.slug === slug ? { ...p, visible: !p.visible } : p)),
      );
    }
    setToggling(null);
  }

  async function handleResetPoll() {
    if (!confirm("Are you sure you want to reset ALL poll votes? This cannot be undone.")) return;
    if (!confirm("Final confirmation — this will permanently delete every vote. Continue?")) return;
    setResettingPoll(true);
    await fetch("/api/admin/poll", { method: "DELETE" });
    setResettingPoll(false);
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-100">Admin Panel</h1>
            <p className="mt-1 text-sm text-neutral-500">Manage site pages and visibility</p>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-200"
          >
            Sign out
          </button>
        </div>

        {/* Blog Management */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Content
          </h2>
          <a
            href="/admin/blog"
            className="flex items-center justify-between rounded-xl border border-white/10 bg-[#242424] px-5 py-4 transition-colors hover:border-white/20 hover:bg-[#2a2a2a]"
          >
            <div>
              <span className="font-medium text-neutral-100">Blog Posts</span>
              <p className="mt-0.5 text-xs text-neutral-500">Create, edit, and publish articles</p>
            </div>
            <svg className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </a>
        </section>

        {/* Poll Management */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Poll
          </h2>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#242424] px-5 py-4">
            <div>
              <span className="font-medium text-neutral-100">Reset Poll</span>
              <p className="mt-0.5 text-xs text-neutral-500">Delete all votes and start fresh</p>
            </div>
            <button
              onClick={handleResetPoll}
              disabled={resettingPoll}
              className="rounded-lg border border-red-500/20 px-3 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-40"
            >
              {resettingPoll ? "Resetting…" : "Reset votes"}
            </button>
          </div>
        </section>

        {/* Page Visibility */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Page Visibility
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {pages.map((page) => (
                <div
                  key={page.slug}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-[#242424] px-5 py-4"
                >
                  <div>
                    <span className="font-medium text-neutral-100">{page.label}</span>
                    <span className="ml-2 text-xs text-neutral-500">/{page.slug}</span>
                  </div>
                  <button
                    onClick={() => toggleVisibility(page.slug, page.visible)}
                    disabled={toggling === page.slug}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none ${
                      page.visible ? "bg-neutral-500" : "bg-neutral-700"
                    } ${toggling === page.slug ? "opacity-50" : ""}`}
                    aria-label={`Toggle ${page.label} visibility`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                        page.visible ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
