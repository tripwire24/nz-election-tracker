import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/nav-bar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  title: "NZ Election Tracker",
  description:
    "Real-time NZ election forecast dashboard — polling, sentiment analysis, and interactive maps for the 2026 general election.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-stone-50 text-stone-900`}
      >
        <NavBar />
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        <footer className="mt-12 border-t border-stone-200">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-6 text-xs text-stone-400 sm:flex-row sm:justify-between">
            <span>NZ Election Tracker &middot; Open methodology &middot; Not affiliated with any political party</span>
            <span>Data: Wikipedia polls, Bluesky, NZ media RSS &middot; Updated every 6 hours</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
