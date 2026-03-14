"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const DROPDOWN_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/polls", label: "Polls" },
  { href: "/forecast", label: "Forecast" },
  { href: "/sentiment", label: "Sentiment" },
  { href: "/map", label: "Map" },
  { href: "/feed", label: "Feed" },
];

const TOP_LINKS = [
  { href: "/poll", label: "Your Vote" },
  { href: "/blog", label: "Blog" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/contact", label: "Contact" },
];

const ALL_NAV_LINKS = [...DROPDOWN_LINKS, ...TOP_LINKS];

export function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [navLinks, setNavLinks] = useState(ALL_NAV_LINKS);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("page_settings")
      .select("slug, visible")
      .then(({ data }) => {
        if (!data) return;
        const hidden = new Set(data.filter((p) => !p.visible).map((p) => `/${p.slug}`));
        setNavLinks(ALL_NAV_LINKS.filter((l) => !hidden.has(l.href)));
      });
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
    setOpen(false);
  }, [pathname]);

  const visibleDropdown = DROPDOWN_LINKS.filter((l) => navLinks.some((n) => n.href === l.href));
  const visibleTop = TOP_LINKS.filter((l) => navLinks.some((n) => n.href === l.href));
  const dropdownActive = visibleDropdown.some(
    ({ href }) => (href === "/" ? pathname === "/" : pathname.startsWith(href)),
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#111111]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1180px] items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] text-[11px] font-black tracking-[0.28em] text-neutral-100 shadow-[0_10px_22px_rgba(0,0,0,0.26)]">
            NZ
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-neutral-100 transition-colors group-hover:text-white">
              Election Tracker
            </span>
            <span className="hidden sm:block text-[10px] uppercase tracking-[0.22em] text-neutral-500">
              2026 general election
            </span>
          </div>
          <span className="hidden lg:inline-flex rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Beta
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {/* Data dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                dropdownActive
                  ? "bg-white/[0.06] text-neutral-100 ring-1 ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  : "text-neutral-400 hover:bg-white/[0.03] hover:text-neutral-100"
              }`}
            >
              Data
              <svg className={`h-3.5 w-3.5 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-48 rounded-xl border border-white/10 bg-[#1a1a1a] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                {visibleDropdown.map(({ href, label }) => {
                  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? "bg-white/[0.06] text-neutral-100"
                          : "text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-100"
                      }`}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top-level links */}
          {visibleTop.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  active
                    ? "bg-white/[0.06] text-neutral-100 ring-1 ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    : "text-neutral-400 hover:bg-white/[0.03] hover:text-neutral-100"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden flex flex-col gap-1.5 rounded-lg p-2 transition-colors hover:bg-white/[0.06]"
          aria-label="Toggle navigation"
        >
          <span className={`block h-0.5 w-5 bg-neutral-400 transition-all duration-200 ${open ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block h-0.5 w-5 bg-neutral-400 transition-all duration-200 ${open ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-5 bg-neutral-400 transition-all duration-200 ${open ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-white/10 bg-[#111111]/95 px-4 pb-4 pt-2 backdrop-blur-xl md:hidden">
          <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Data</p>
          <div className="space-y-0.5">
            {visibleDropdown.map(({ href, label }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-white/[0.06] text-neutral-100 ring-1 ring-white/10"
                      : "text-neutral-400 hover:bg-white/[0.03] hover:text-neutral-100"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
          <div className="my-2 border-t border-white/10" />
          <div className="space-y-0.5">
            {visibleTop.map(({ href, label }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-white/[0.06] text-neutral-100 ring-1 ring-white/10"
                      : "text-neutral-400 hover:bg-white/[0.03] hover:text-neutral-100"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
