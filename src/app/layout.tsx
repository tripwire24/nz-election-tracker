import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/nav-bar";
import { ThemeProvider } from "@/components/theme-provider";

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
  title: {
    default: "NZ Election Tracker — 2026 Polling, Forecasts & Sentiment",
    template: "%s | NZ Election Tracker",
  },
  description:
    "Real-time NZ election forecast dashboard — polling, sentiment analysis, and interactive maps for the 2026 general election.",
  metadataBase: new URL("https://nz-election-tracker.com"),
  alternates: { canonical: "/" },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    siteName: "NZ Election Tracker",
    title: "NZ Election Tracker — 2026 Polling, Forecasts & Sentiment",
    description:
      "Real-time NZ election forecast dashboard — polling, sentiment analysis, and interactive maps for the 2026 general election.",
    url: "https://nz-election-tracker.com",
    locale: "en_NZ",
  },
  twitter: {
    card: "summary_large_image",
    title: "NZ Election Tracker — 2026 Polling, Forecasts & Sentiment",
    description:
      "Real-time NZ election forecast dashboard — polling, sentiment analysis, and interactive maps for the 2026 general election.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="gtm" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-K2VQJPG6');`}</Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-K2VQJPG6" height="0" width="0" style={{display:'none',visibility:'hidden'}} /></noscript>
        <ThemeProvider>
        <NavBar />
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        <footer className="mt-12 border-t border-card-border dark:border-stone-700">
          <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="flex flex-col items-center gap-4 text-xs text-stone-400 sm:flex-row sm:justify-between">
              <div className="flex flex-col items-center gap-1 sm:items-start">
                <span className="font-medium text-stone-500 dark:text-stone-400">NZ Election Tracker</span>
                <span>&copy; {new Date().getFullYear()} Tripwire Digital Ltd. All Rights Reserved.</span>
              </div>
              <div className="flex flex-col items-center gap-1 sm:items-end">
                <span>Data: Wikipedia polls, Bluesky, NZ media RSS</span>
                <a href="/contact" className="text-blue-500 hover:text-blue-600 transition-colors">Contact Us</a>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-stone-100 dark:bg-stone-800 px-4 py-3 text-[11px] leading-relaxed text-stone-400">
              <strong className="text-stone-500 dark:text-stone-400">Disclaimer:</strong> This site is an independent project and is not affiliated with, endorsed by, or connected to any political party, government body, or electoral agency. All polling data, sentiment analysis, and forecasts are provided for informational purposes only and should not be taken as definitive predictions of election outcomes. Data is sourced from publicly available information and may contain inaccuracies. Use at your own discretion.
            </div>
          </div>
        </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
