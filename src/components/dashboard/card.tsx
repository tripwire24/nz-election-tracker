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
      className={`relative rounded-xl border border-stone-200 bg-white p-5 shadow-sm animate-fade-in ${className}`}
    >
      {accent && (
        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl" style={{ background: accent }} />
      )}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
          {title}
        </h2>
        {badge && (
          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-medium text-stone-500 ring-1 ring-stone-200">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
