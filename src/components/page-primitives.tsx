import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PagePill({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-neutral-300",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PagePanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.35rem] border border-white/10 bg-[linear-gradient(180deg,rgba(38,38,38,0.96),rgba(26,26,26,0.98))] p-5 shadow-[0_20px_45px_rgba(0,0,0,0.3)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  pills = [],
  aside,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  pills?: ReactNode[];
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(28,28,28,0.98),rgba(18,18,18,0.98))] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.32)] md:p-8",
        className,
      )}
    >
      <div
        className={cn(
          "grid items-start gap-6",
          aside && "lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]",
        )}
      >
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-400">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c0c0c0]" />
            {eyebrow}
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-100 md:text-4xl">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-neutral-400 md:text-[15px]">
              {description}
            </p>
          </div>
          {pills.length > 0 && <div className="flex flex-wrap gap-2.5">{pills}</div>}
        </div>

        {aside ? (
          <div className="h-fit self-start rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/5">
            {aside}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function PageState({
  icon,
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  eyebrow?: string;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(28,28,28,0.98),rgba(18,18,18,0.98))] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.32)] md:p-10",
        className,
      )}
    >
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        {icon ? (
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[1.35rem] border border-white/10 bg-white/[0.04] text-neutral-200 shadow-[0_16px_35px_rgba(0,0,0,0.22)]">
            {icon}
          </div>
        ) : null}
        {eyebrow ? (
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-400">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c0c0c0]" />
            {eyebrow}
          </div>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-100 md:text-4xl">
          {title}
        </h1>
        <div className="mt-3 max-w-lg text-sm leading-7 text-neutral-400 md:text-[15px]">
          {description}
        </div>
        {action ? <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{action}</div> : null}
      </div>
    </section>
  );
}
