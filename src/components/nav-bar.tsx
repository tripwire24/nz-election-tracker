"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const ALL_NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/polls", label: "Polls" },
  { href: "/forecast", label: "Forecast" },
  { href: "/sentiment", label: "Sentiment" },
  { href: "/map", label: "Map" },
  { href: "/feed", label: "Feed" },
  { href: "/poll", label: "Your Vote" },
  { href: "/blog", label: "Blog" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/contact", label: "Contact" },
];

export function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [navLinks, setNavLinks] = useState(ALL_NAV_LINKS);

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

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#1a1a1a]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-neutral-600 to-neutral-800 text-xs font-black text-white shadow-md shadow-black/30">
            NZ
          </div>
          <span className="text-base font-bold tracking-tight text-neutral-100 group-hover:text-neutral-300 transition-colors">
            Election Tracker
          </span>
          <span className="hidden sm:inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 ring-1 ring-white/15">
            Beta
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  active
                    ? "text-white bg-white/10 ring-1 ring-white/15"
                    : "text-neutral-400 hover:text-neutral-100 hover:bg-white/5"
                }`}
              >
                {label}
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-neutral-400" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Toggle navigation"
        >
          <span className={`block h-0.5 w-5 bg-neutral-400 transition-all duration-200 ${open ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block h-0.5 w-5 bg-neutral-400 transition-all duration-200 ${open ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-5 bg-neutral-400 transition-all duration-200 ${open ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-[#1a1a1a]/98 backdrop-blur-md px-4 pb-4 pt-2 space-y-1">
          {navLinks.map(({ href, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "text-white bg-white/10 ring-1 ring-white/15"
                    : "text-neutral-400 hover:text-neutral-100 hover:bg-white/5"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
