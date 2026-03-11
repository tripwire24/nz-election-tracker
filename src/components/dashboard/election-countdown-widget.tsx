"use client";

import { useEffect, useState } from "react";
import { DashboardCard } from "./card";

/** Live countdown to election day — ticks every 100ms */
export function ElectionCountdownWidget() {
  const electionDate = new Date("2026-11-07T00:00:00+13:00");

  const calcRemaining = () => {
    const diffMs = Math.max(0, electionDate.getTime() - Date.now());
    const totalSecs = diffMs / 1000;
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    return { days, hours, mins, secs, weeks, months };
  };

  const [remaining, setRemaining] = useState(calcRemaining);

  useEffect(() => {
    const id = setInterval(() => setRemaining(calcRemaining()), 100);
    return () => clearInterval(id);
  }, []);

  return (
    <DashboardCard title="Election Day" badge="7 Nov 2026" accent="linear-gradient(90deg, #f59e0b, #ef4444)">
      <div className="flex flex-col items-center text-center py-2">
        <span className="text-6xl font-black tabular-nums text-stone-800 dark:text-stone-100 leading-none">{remaining.days}</span>
        <span className="mt-1 text-sm font-medium text-stone-500">days to go</span>
        <div className="mt-2 font-mono text-lg tabular-nums text-stone-600 dark:text-stone-300 tracking-wide">
          {String(remaining.hours).padStart(2, "0")}:{String(remaining.mins).padStart(2, "0")}:{remaining.secs.toFixed(1).padStart(4, "0")}
        </div>
        <div className="mt-3 flex gap-3 text-xs text-stone-500">
          <span className="rounded-full bg-stone-100 dark:bg-stone-700 px-2.5 py-1 ring-1 ring-stone-200 dark:ring-stone-600">{remaining.weeks} weeks</span>
          <span className="rounded-full bg-stone-100 dark:bg-stone-700 px-2.5 py-1 ring-1 ring-stone-200 dark:ring-stone-600">{remaining.months} months</span>
        </div>
      </div>
    </DashboardCard>
  );
}
