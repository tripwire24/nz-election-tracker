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
  return (
    <div
      className={`relative h-full rounded-xl border border-white/10 bg-[#242424] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-sm animate-fade-in ${className}`}
    >
      {accent && (
        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl" style={{ background: accent }} />
      )}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
            {title}
          </h2>
          {tooltip && (
            <span className="group relative cursor-help">
              <svg className="h-3.5 w-3.5 text-neutral-500 transition-colors group-hover:text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-xs font-normal normal-case tracking-normal text-neutral-300 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                {tooltip}
              </span>
            </span>
          )}
        </div>
        {badge && (
          <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-neutral-400 ring-1 ring-white/10">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
