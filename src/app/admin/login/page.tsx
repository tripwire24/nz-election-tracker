"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHero, PagePanel, PagePill } from "@/components/page-primitives";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div className="space-y-8 py-6">
      <PageHero
        eyebrow="Admin access"
        title="Sign in to manage publishing and visibility"
        description="This area is reserved for tracker administration. Use your admin account to manage blog posts, route visibility, and moderation controls."
        pills={[
          <PagePill key="cms">Editorial and route controls</PagePill>,
          <PagePill key="return">Returns you to your requested page after sign-in</PagePill>,
        ]}
        aside={
          <div className="space-y-3 text-sm text-neutral-300">
            <p>Only authorised admins should use this area.</p>
            <p>If you were redirected here from a protected route, you will be sent back there after a successful sign-in.</p>
          </div>
        }
      />

      <div className="mx-auto w-full max-w-md">
        <PagePanel className="space-y-5 p-6">
          <div>
            <h2 className="text-lg font-semibold text-neutral-100">Admin login</h2>
            <p className="mt-1 text-sm text-neutral-500">Enter your credentials to continue to {next}.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-[1rem] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-neutral-400">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[1rem] border border-white/10 bg-[#2a2a2a] px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 outline-none transition-colors focus:border-neutral-300 focus:ring-1 focus:ring-neutral-300"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-neutral-400">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[1rem] border border-white/10 bg-[#2a2a2a] px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 outline-none transition-colors focus:border-neutral-300 focus:ring-1 focus:ring-neutral-300"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.1] disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </PagePanel>
      </div>
    </div>
  );
}
