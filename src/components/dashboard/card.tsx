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
      className={`relative h-full rounded-xl border border-blue-200/70 bg-white/95 p-5 shadow-[0_10px_30px_rgba(37,99,235,0.08)] backdrop-blur-sm animate-fade-in ${className}`}
    >
      {accent && (
        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl" style={{ background: accent }} />
      )}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </h2>
        {badge && (
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-blue-200">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
