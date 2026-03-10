import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-100`}
      >
        <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">
                NZ Election Tracker
              </span>
              <span className="rounded bg-blue-600/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                Beta
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <a href="/" className="text-white">Dashboard</a>
              <a href="/polls" className="hover:text-white transition-colors">Polls</a>
              <a href="/forecast" className="hover:text-white transition-colors">Forecast</a>
              <a href="/sentiment" className="hover:text-white transition-colors">Sentiment</a>
              <a href="/map" className="hover:text-white transition-colors">Map</a>
              <a href="/feed" className="hover:text-white transition-colors">Feed</a>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
