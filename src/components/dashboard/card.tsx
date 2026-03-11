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
      className={`relative h-full rounded-xl border border-[rgba(109,220,255,0.12)] bg-[rgba(15,23,48,0.82)] p-5 shadow-[0_0_0_1px_rgba(52,182,255,0.06),0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm animate-fade-in ${className}`}
    >
      {accent && (
        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl" style={{ background: accent }} />
      )}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#A9BEDD]">
          {title}
        </h2>
        {badge && (
          <span className="rounded-full bg-[rgba(21,32,65,0.9)] px-2.5 py-0.5 text-[10px] font-medium text-[#B8F1FF] ring-1 ring-[rgba(109,220,255,0.22)]">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
