"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHero, PagePanel, PagePill } from "@/components/page-primitives";

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

  const visibleCount = pages.filter((page) => page.visible).length;
  const hiddenCount = Math.max(0, pages.length - visibleCount);

  return (
    <div className="space-y-8 py-6">
      <PageHero
        eyebrow="Admin"
        title="Control publishing, visibility, and moderation"
        description="Use this area to manage public routes, edit blog content, and handle maintenance actions without affecting the public shell."
        pills={[
          <PagePill key="routes">{loading ? "Loading routes" : `${pages.length} routes tracked`}</PagePill>,
          <PagePill key="visible">{loading ? "Checking visibility" : `${visibleCount} visible`}</PagePill>,
          <PagePill key="hidden">{loading ? "Checking hidden routes" : `${hiddenCount} hidden`}</PagePill>,
        ]}
        aside={
          <div className="space-y-4 text-sm text-neutral-300">
            <p>Changes made here affect what the public site exposes and how editorial content is published.</p>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2.5 text-sm font-semibold text-neutral-300 transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              Sign out
            </button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <div className="space-y-6">
          <PagePanel className="space-y-4 p-6">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-400">Content</h2>
              <p className="mt-2 text-sm text-neutral-500">Create, edit, and publish articles from the tracker blog CMS.</p>
            </div>
            <Link
              href="/admin/blog"
              className="flex items-center justify-between rounded-[1.15rem] border border-white/10 bg-white/[0.03] px-5 py-4 transition-colors hover:border-white/20 hover:bg-white/[0.05]"
            >
              <div>
                <span className="font-medium text-neutral-100">Blog posts</span>
                <p className="mt-0.5 text-xs text-neutral-500">Create drafts, update live posts, and manage publishing.</p>
              </div>
              <span className="text-sm font-semibold text-neutral-400">Open</span>
            </Link>
          </PagePanel>

          <PagePanel className="space-y-4 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-400">Page visibility</h2>
                <p className="mt-2 text-sm text-neutral-500">Control which public routes are visible without removing the underlying page.</p>
              </div>
              {!loading && (
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  {visibleCount}/{pages.length} live
                </span>
              )}
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 rounded-[1rem] border border-white/10 bg-white/[0.03] animate-pulse" />
                ))}
              </div>
            ) : pages.length === 0 ? (
              <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.03] px-6 py-10 text-center text-sm text-neutral-500">
                No managed routes are configured yet.
              </div>
            ) : (
              <div className="space-y-3">
                {pages.map((page) => (
                  <div
                    key={page.slug}
                    className="flex items-center justify-between gap-4 rounded-[1.15rem] border border-white/10 bg-white/[0.03] px-5 py-4"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-neutral-100">{page.label}</span>
                        <span className="text-xs text-neutral-500">/{page.slug}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleVisibility(page.slug, page.visible)}
                      disabled={toggling === page.slug}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:ring-offset-2 focus:ring-offset-[#1a1a1a] ${
                        page.visible ? "bg-neutral-400" : "bg-neutral-700"
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
          </PagePanel>
        </div>

        <div className="space-y-6">
          <PagePanel className="space-y-4 p-6">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-400">Poll maintenance</h2>
              <p className="mt-2 text-sm text-neutral-500">Reset the public community poll if you need to clear the running count and start again.</p>
            </div>
            <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.03] px-5 py-4">
              <div className="space-y-3">
                <div>
                  <div className="font-medium text-neutral-100">Reset poll votes</div>
                  <p className="mt-1 text-xs leading-5 text-neutral-500">This permanently deletes every community poll response. Use it sparingly.</p>
                </div>
                <button
                  onClick={handleResetPoll}
                  disabled={resettingPoll}
                  className="inline-flex items-center justify-center rounded-full border border-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-40"
                >
                  {resettingPoll ? "Resetting…" : "Reset votes"}
                </button>
              </div>
            </div>
          </PagePanel>

          <PagePanel className="space-y-3 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-400">Notes</h2>
            <p className="text-sm leading-6 text-neutral-400">Visibility changes affect whether a route appears publicly, while content tools affect what is published on pages that are already live.</p>
            <p className="text-sm leading-6 text-neutral-400">Use the blog section for editorial work. Use the route toggles only when you need to hide or reveal an entire page.</p>
          </PagePanel>
        </div>
      </div>
    </div>
  );
}
