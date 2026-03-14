import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Roadmap — NZ Election Tracker",
  description: "Planned features and data integrations for the NZ Election Tracker.",
};

const STATUS = {
  live: { label: "Live", colour: "bg-[#31464f]/40 text-[#bdd3db] ring-[#506d78]/35" },
  building: { label: "In Progress", colour: "bg-[#4d4b43]/40 text-[#d5ccb4] ring-[#786f59]/35" },
  planned: { label: "Planned", colour: "bg-[#5b4a3d]/40 text-[#e2c5a3] ring-[#8c6c52]/35" },
  exploring: { label: "Exploring", colour: "bg-white/[0.05] text-neutral-300 ring-white/10" },
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
    title: "Seat Simulation Engine",
    description: "Probabilistic seat projections using 10K+ simulations with proportional MMP allocation per iteration.",
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
      <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(28,28,28,0.98),rgba(18,18,18,0.98))] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.32)] md:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c0c0c0]" />
              Product roadmap
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-100 md:text-4xl">What is already live, what is next, and what is still being tested</h1>
              <p className="max-w-2xl text-sm leading-7 text-neutral-400 md:text-[15px]">
                This page tracks the main data feeds, models, and product features planned for the 2026 NZ election cycle. It is meant to show direction, not promise exact delivery dates.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 text-sm">
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-neutral-300">3 workstreams</span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-neutral-300">Data, models, and product UX</span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-neutral-300">Updated as features move from idea to delivery</span>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-500">How to read this page</p>
            <div className="mt-4 space-y-3 text-sm text-neutral-300">
              <p>Live means available now.</p>
              <p>In progress means work is underway.</p>
              <p>Planned means we expect to build it.</p>
              <p>Exploring means we are still testing value, feasibility, or both.</p>
            </div>
          </div>
        </div>
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
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
                {cat}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => {
                  const s = STATUS[item.status];
                  return (
                    <div
                      key={item.title}
                      className="rounded-[1.35rem] border border-white/10 bg-[linear-gradient(180deg,rgba(38,38,38,0.96),rgba(26,26,26,0.98))] p-5 shadow-[0_20px_45px_rgba(0,0,0,0.3)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-semibold leading-snug text-neutral-200">
                          {item.title}
                        </h3>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ring-1 ${s.colour}`}
                        >
                          {s.label}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-neutral-400">
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
      <div className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(135deg,rgba(30,30,30,0.98),rgba(20,20,20,0.98))] p-6 text-center shadow-[0_20px_45px_rgba(0,0,0,0.28)]">
        <h3 className="text-base font-semibold text-neutral-100">Got a feature idea?</h3>
        <p className="mt-1 text-sm text-neutral-400">
          We&apos;re building this in the open and value community input.
        </p>
        <a
          href="/contact"
          className="mt-4 inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
        >
          Suggest a Feature
        </a>
      </div>
    </div>
  );
}

