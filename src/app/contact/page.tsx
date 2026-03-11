"use client";

import { useState, type FormEvent } from "react";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      subject: (form.elements.namedItem("subject") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Something went wrong.");
      }

      setStatus("sent");
      form.reset();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Contact Us</h1>
        <p className="mt-1 text-sm text-stone-500">
          Questions, feedback, or partnership enquiries — we&apos;d love to hear from you.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Form */}
        <div className="lg:col-span-3 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          {status === "sent" ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl">
                ✓
              </div>
              <h2 className="mt-4 text-lg font-semibold text-stone-900">Message sent</h2>
              <p className="mt-1 text-sm text-stone-500">
                Thanks for getting in touch. We&apos;ll get back to you shortly.
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="mt-6 rounded-lg bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-200"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-xs font-medium text-stone-500 mb-1.5">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    maxLength={200}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-stone-500 mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    maxLength={320}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-xs font-medium text-stone-500 mb-1.5">
                  Subject
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  required
                  maxLength={500}
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors"
                  placeholder="What's this about?"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-medium text-stone-500 mb-1.5">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  maxLength={5000}
                  rows={5}
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors resize-y"
                  placeholder="Tell us more..."
                />
              </div>

              {status === "error" && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === "sending" ? "Sending…" : "Send Message"}
              </button>
            </form>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-stone-900">Get in touch directly</h3>
            <div className="mt-3 space-y-3 text-sm text-stone-600">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-stone-400">✉</span>
                <div>
                  <p className="text-xs text-stone-400">Email</p>
                  <a href="mailto:luke@tripwiredigital.co.nz" className="text-blue-600 hover:text-blue-700 transition-colors">
                    luke@tripwiredigital.co.nz
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-stone-400">🌐</span>
                <div>
                  <p className="text-xs text-stone-400">Company</p>
                  <span className="text-stone-700">Tripwire Digital Ltd</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-stone-400">📍</span>
                <div>
                  <p className="text-xs text-stone-400">Location</p>
                  <span className="text-stone-700">New Zealand</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-stone-900">Partnership &amp; Sponsorship</h3>
            <p className="mt-2 text-xs leading-relaxed text-stone-500">
              Interested in sponsoring the NZ Election Tracker or integrating our data into your platform?
              We&apos;re open to media partnerships, data licensing, and custom dashboards for the 2026 election cycle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
