"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "./theme-toggle";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/polls", label: "Polls" },
  { href: "/forecast", label: "Forecast" },
  { href: "/sentiment", label: "Sentiment" },
  { href: "/map", label: "Map" },
  { href: "/feed", label: "Feed" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/contact", label: "Contact" },
];

export function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-stone-200 dark:border-stone-700 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-black text-white shadow-md shadow-blue-500/20">
            NZ
          </div>
          <span className="text-base font-bold tracking-tight text-stone-900 dark:text-stone-100 group-hover:text-blue-600 transition-colors">
            Election Tracker
          </span>
          <span className="hidden sm:inline-flex rounded-full bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800">
            Beta
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  active
                    ? "text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-stone-800"
                    : "text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800"
                }`}
              >
                {label}
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-blue-500" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Utilities */}
        <div className="hidden md:flex items-center gap-1">
          <ThemeToggle />
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          aria-label="Toggle navigation"
        >
          <span className={`block h-0.5 w-5 bg-stone-400 transition-all duration-200 ${open ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block h-0.5 w-5 bg-stone-400 transition-all duration-200 ${open ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-5 bg-stone-400 transition-all duration-200 ${open ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-stone-200 dark:border-stone-700 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md px-4 pb-4 pt-2 space-y-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-stone-800"
                    : "text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800"
                }`}
              >
                {label}
              </Link>
            );
          })}
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-stone-200 dark:border-stone-700">
            <ThemeToggle />
          </div>
        </div>
      )}
    </nav>
  );
}
