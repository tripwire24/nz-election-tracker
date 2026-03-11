"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

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
    <nav className="sticky top-0 z-50 border-b border-[#22345F] bg-[rgba(10,16,36,0.72)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-black text-white shadow-md shadow-cyan-500/25">
            NZ
          </div>
          <span className="text-base font-bold tracking-tight text-[#EAFBFF] group-hover:text-[#6DDCFF] transition-colors">
            Election Tracker
          </span>
          <span className="hidden sm:inline-flex rounded-full bg-[rgba(0,207,255,0.10)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#6DDCFF] ring-1 ring-[rgba(109,220,255,0.35)]">
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
                    ? "text-[#EAFBFF] bg-[rgba(0,207,255,0.12)] ring-1 ring-[rgba(0,207,255,0.35)]"
                    : "text-[#A9BEDD] hover:text-[#6DDCFF] hover:bg-[rgba(45,107,255,0.12)]"
                }`}
              >
                {label}
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-[#00CFFF] shadow-[0_0_14px_rgba(0,207,255,0.65)]" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-[rgba(45,107,255,0.18)] transition-colors"
          aria-label="Toggle navigation"
        >
          <span className={`block h-0.5 w-5 bg-[#A9BEDD] transition-all duration-200 ${open ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block h-0.5 w-5 bg-[#A9BEDD] transition-all duration-200 ${open ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-5 bg-[#A9BEDD] transition-all duration-200 ${open ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-[#22345F] bg-[rgba(10,16,36,0.96)] backdrop-blur-md px-4 pb-4 pt-2 space-y-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "text-[#EAFBFF] bg-[rgba(0,207,255,0.12)] ring-1 ring-[rgba(0,207,255,0.35)]"
                    : "text-[#A9BEDD] hover:text-[#6DDCFF] hover:bg-[rgba(45,107,255,0.12)]"
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
