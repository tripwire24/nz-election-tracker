"use client";

import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { resolved, setTheme } = useTheme();

  function toggle() {
    setTheme(resolved === "light" ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
      title={resolved === "light" ? "Switch to dark mode" : "Switch to light mode"}
      aria-label={resolved === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {resolved === "light" ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
          <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 4.343a.75.75 0 010 1.06l-1.06 1.061a.75.75 0 01-1.061-1.06l1.06-1.061a.75.75 0 011.061 0zM6.464 13.536a.75.75 0 010 1.06l-1.06 1.061a.75.75 0 11-1.061-1.06l1.06-1.061a.75.75 0 011.061 0zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM15.657 15.657a.75.75 0 01-1.061 0l-1.06-1.06a.75.75 0 111.06-1.061l1.061 1.06a.75.75 0 010 1.061zM6.464 6.464a.75.75 0 01-1.061 0l-1.06-1.06a.75.75 0 011.06-1.061l1.061 1.06a.75.75 0 010 1.061z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
          <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.967.75.75 0 011.067.853A8.5 8.5 0 118.25 3.07a.75.75 0 01-.795-.067z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
}

