/** Reusable card wrapper for dashboard widgets */
export function DashboardCard({
  title,
  badge,
  tooltip,
  children,
  className = "",
  accent,
}: {
  title: string;
  badge?: string;
  tooltip?: string;
  children: React.ReactNode;
  className?: string;
  accent?: string;
}) {
  const tooltipLabel = `${title} info`;

  return (
    <div
      className={`relative h-full overflow-hidden rounded-[1.35rem] border border-white/10 bg-[linear-gradient(180deg,rgba(38,38,38,0.96),rgba(26,26,26,0.98))] p-5 shadow-[0_20px_45px_rgba(0,0,0,0.3)] backdrop-blur-sm animate-fade-in ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_34%)]" />
      {accent && (
        <div className="absolute inset-x-0 top-0 h-px rounded-t-[1.35rem] opacity-90" style={{ background: accent }} />
      )}
      <div className="relative mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight text-neutral-200">
            {title}
          </h2>
          {tooltip && (
            <span className="group relative flex shrink-0">
              <button
                type="button"
                aria-label={tooltipLabel}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-neutral-500 transition-colors hover:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
              </button>
              <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-xl border border-white/10 bg-[#161616] px-3 py-2 text-xs font-normal leading-5 tracking-normal text-neutral-300 opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                {tooltip}
              </span>
            </span>
          )}
        </div>
        {badge && (
          <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            {badge}
          </span>
        )}
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
