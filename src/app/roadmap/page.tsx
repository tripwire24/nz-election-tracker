import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Roadmap — NZ Election Tracker",
  description: "Planned features and data integrations for the NZ Election Tracker.",
};

const STATUS = {
  live: { label: "Live", colour: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  building: { label: "In Progress", colour: "bg-blue-50 text-blue-700 ring-blue-200" },
  planned: { label: "Planned", colour: "bg-amber-50 text-amber-700 ring-amber-200" },
  exploring: { label: "Exploring", colour: "bg-purple-50 text-purple-700 ring-purple-200" },
} as const;

type Status = keyof typeof STATUS;

interface RoadmapItem {
  title: string;
  description: string;
  status: Status;
  category: string;
}

const ROADMAP: RoadmapItem[] = [
  // Data sources
  {
    title: "NZ Media RSS Aggregation",
    description: "Automated ingestion from NZ Herald, RNZ, Stuff, Newsroom, The Post, and other major outlets.",
    status: "live",
    category: "Data Sources",
  },
  {
    title: "Bluesky Sentiment Feed",
    description: "Real-time sentiment analysis from NZ political discussion on Bluesky.",
    status: "live",
    category: "Data Sources",
  },
  {
    title: "Wikipedia Polling Data",
    description: "Structured poll results scraped from Wikipedia's NZ opinion polling tables.",
    status: "live",
    category: "Data Sources",
  },
  {
    title: "Reddit Integration",
    description: "Ingest posts and comments from r/newzealand and r/nzpolitics for broader sentiment coverage.",
    status: "building",
    category: "Data Sources",
  },
  {
    title: "Twitter / X Feeds",
    description: "Track NZ political accounts and hashtags for real-time discourse analysis.",
    status: "exploring",
    category: "Data Sources",
  },
  {
    title: "Party Press Releases",
    description: "Direct ingestion of official press releases from all registered NZ political parties.",
    status: "planned",
    category: "Data Sources",
  },
  {
    title: "Parliamentary Records",
    description: "Hansard transcripts and select committee submissions for policy tracking.",
    status: "exploring",
    category: "Data Sources",
  },
  {
    title: "Prediction Market Data",
    description: "Observational layer surfacing speculative odds from platforms like Polymarket and PredictIt — kept separate from polling-based models.",
    status: "exploring",
    category: "Data Sources",
  },

  // Analytics & models
  {
    title: "Basic Sentiment Scoring",
    description: "NLP-based sentiment scoring of ingested content, broken down by party and topic.",
    status: "live",
    category: "Analytics & Models",
  },
  {
    title: "Weighted Polling Average",
    description: "Recency-weighted polling averages with 14-day exponential decay half-life across all recent polls.",
    status: "live",
    category: "Analytics & Models",
  },
  {
    title: "Historical Election Results",
    description: "Full NZ election party vote results (2017, 2020, 2023) for trend analysis and model backtesting.",
    status: "live",
    category: "Analytics & Models",
  },
  {
    title: "Monte Carlo Seat Simulation",
    description: "Probabilistic seat projections using 10K Monte Carlo iterations on logit-scale with Sainte-Laguë allocation per iteration.",
    status: "live",
    category: "Analytics & Models",
  },
  {
    title: "Composite Sentiment Index",
    description: "Single numeric party health score (−100 to +100) combining recency-weighted sentiment and media volume over a rolling 7-day window.",
    status: "live",
    category: "Analytics & Models",
  },
  {
    title: "Coalition Probability Engine",
    description: "Model likely coalition combinations with probability scores based on polling and seat simulations.",
    status: "exploring",
    category: "Analytics & Models",
  },

  // Features & UX
  {
    title: "Interactive Electorate Map",
    description: "Leaflet-powered map with per-electorate results, candidate info, and demographic overlays.",
    status: "live",
    category: "Features & UX",
  },
  {
    title: "Real-time Countdown Timer",
    description: "Live countdown to election day with days, hours, minutes, and seconds.",
    status: "live",
    category: "Features & UX",
  },
  {
    title: "Push Notifications (PWA)",
    description: "Opt-in browser notifications via service worker for poll releases, major news, and sentiment shifts.",
    status: "live",
    category: "Features & UX",
  },
  {
    title: "Email Digest / Alerts",
    description: "Weekly or daily email summaries of polling changes, top stories, and forecast shifts.",
    status: "exploring",
    category: "Features & UX",
  },
  {
    title: "Shareable Widgets",
    description: "Embeddable widgets for media partners to display live polling data on their sites.",
    status: "exploring",
    category: "Features & UX",
  },
  {
    title: "Dark / Light Theme Toggle",
    description: "User-selectable light, dark, and system theme with persistent localStorage preference.",
    status: "live",
    category: "Features & UX",
  },
];

const CATEGORIES = ["Data Sources", "Analytics & Models", "Features & UX"];

export default function RoadmapPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Roadmap</h1>
        <p className="mt-1 text-sm text-stone-500">
          What&apos;s live, what&apos;s coming, and what we&apos;re exploring for the 2026 NZ election cycle.
        </p>
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(STATUS).map(([key, { label, colour }]) => (
          <span
            key={key}
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${colour}`}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Roadmap by category */}
      <div className="space-y-10">
        {CATEGORIES.map((cat) => {
          const items = ROADMAP.filter((i) => i.category === cat);
          return (
            <section key={cat}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 mb-4">
                {cat}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => {
                  const s = STATUS[item.status];
                  return (
                    <div
                      key={item.title}
                        className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                          <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100 leading-snug">
                          {item.title}
                        </h3>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ${s.colour}`}
                        >
                          {s.label}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-stone-500">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* CTA */}
        <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-950/30 dark:via-stone-800 dark:to-indigo-950/30 p-6 shadow-sm text-center">
          <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">Got a feature idea?</h3>
        <p className="mt-1 text-sm text-stone-500">
          We&apos;re building this in the open and value community input.
        </p>
        <a
          href="/contact"
          className="mt-4 inline-block rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30"
        >
          Suggest a Feature
        </a>
      </div>
    </div>
  );
}
