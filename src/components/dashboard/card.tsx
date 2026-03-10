/** Reusable card wrapper for dashboard widgets */
export function DashboardCard({
  title,
  badge,
  children,
  className = "",
  accent,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
  accent?: string;
}) {
  return (
    <div
      className={`relative rounded-xl border border-zinc-700/30 bg-zinc-800/40 backdrop-blur-sm p-5 shadow-lg shadow-black/10 animate-fade-in ${className}`}
    >
      {accent && (
        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl" style={{ background: accent }} />
      )}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          {title}
        </h2>
        {badge && (
          <span className="rounded-full bg-zinc-700/40 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400 ring-1 ring-zinc-600/30">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
