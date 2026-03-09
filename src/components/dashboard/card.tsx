/** Reusable card wrapper for dashboard widgets */
export function DashboardCard({
  title,
  badge,
  children,
  className = "",
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-800 bg-slate-900 p-5 ${className}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </h2>
        {badge && (
          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-500">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
