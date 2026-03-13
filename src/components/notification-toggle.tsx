"use client";

import { useEffect, useState } from "react";

type PermState = "default" | "granted" | "denied" | "unsupported";

export function NotificationToggle() {
  const [perm, setPerm] = useState<PermState>("default");
  const [swReady, setSwReady] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPerm("unsupported");
      return;
    }
    setPerm(Notification.permission as PermState);

    navigator.serviceWorker
      .register("/sw.js")
      .then(() => setSwReady(true))
      .catch(() => setSwReady(false));
  }, []);

  async function subscribe() {
    if (perm === "unsupported") return;

    const result = await Notification.requestPermission();
    setPerm(result as PermState);

    if (result !== "granted") return;

    // Show a test notification via the service worker
    const reg = await navigator.serviceWorker.ready;
    reg.showNotification("NZ Election Tracker", {
      body: "Notifications enabled! You\u2019ll get alerts for poll releases and sentiment shifts.",
      icon: "/icons/icon-192.png",
    });
  }

  if (perm === "unsupported") return null;

  return (
    <button
      onClick={subscribe}
      disabled={perm === "denied"}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        perm === "granted"
          ? "bg-stone-50 text-stone-700 ring-1 ring-stone-200 cursor-default"
          : perm === "denied"
            ? "bg-stone-100 text-stone-400 cursor-not-allowed"
            : "bg-blue-50 text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100"
      }`}
      title={perm === "denied" ? "Notifications blocked in browser settings" : undefined}
    >
      <span className="text-base">
        {perm === "granted" ? "🔔" : perm === "denied" ? "🔕" : "🔔"}
      </span>
      <span>
        {perm === "granted"
          ? "Notifications on"
          : perm === "denied"
            ? "Blocked"
            : "Enable notifications"}
      </span>
    </button>
  );
}
