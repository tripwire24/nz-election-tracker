"use client";

import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  function cycle() {
    const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
  }

  const icon = theme === "dark" ? "🌙" : theme === "light" ? "☀️" : "💻";
  const label = theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System";

  return (
    <button
      onClick={cycle}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800 transition-colors"
      title={`Theme: ${label}`}
      aria-label={`Switch theme (current: ${label})`}
    >
      <span className="text-base">{icon}</span>
      <span className="hidden sm:inline text-xs">{label}</span>
    </button>
  );
}
