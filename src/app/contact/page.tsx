"use client";

import { useState, type FormEvent } from "react";
import { PageHero, PagePanel } from "@/components/page-primitives";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "queued" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    setSuccessMsg("");

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

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Something went wrong.");
      }

      if (json.delivered) {
        setStatus("sent");
        setSuccessMsg("Thanks for getting in touch. We\u2019ll reply as soon as we can.");
      } else {
        setStatus("queued");
        setSuccessMsg("Your message has been saved. We\u2019ll get back to you shortly.");
      }

      form.reset();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Contact"
        title="Get in touch"
        description="Questions, feedback, partnership enquiries — send us a message and we'll get back to you."
      />

      {/* Partnership note */}
      <PagePanel className="px-5 py-4 md:px-6">
        <p className="text-sm leading-relaxed text-neutral-400">
          <span className="font-medium text-neutral-200">Partnerships &amp; sponsorship</span>{" "}
          — We&apos;re open to media partnerships, data licensing, and custom dashboards for the 2026 election cycle. Include your organisation and timeline below.
        </p>
      </PagePanel>

      {/* Form */}
      <PagePanel className="p-5 md:p-6">
        {status === "sent" || status === "queued" ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-2xl">
              {status === "sent" ? "✓" : "…"}
            </div>
            <h2 className="mt-4 text-lg font-semibold text-neutral-100">{status === "sent" ? "Message sent" : "Message received"}</h2>
            <p className="mt-1 max-w-sm text-sm text-neutral-400">
              {successMsg}
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-6 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-neutral-200 transition-colors hover:bg-white/[0.1]"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  maxLength={200}
                  className="w-full rounded-lg border border-white/10 bg-[#2a2a2a] px-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400/20 transition-colors"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  maxLength={320}
                  className="w-full rounded-lg border border-white/10 bg-[#2a2a2a] px-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400/20 transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-xs font-medium text-neutral-400 mb-1.5">
                Subject
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                required
                maxLength={500}
                className="w-full rounded-lg border border-white/10 bg-[#2a2a2a] px-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400/20 transition-colors"
                placeholder="What's this about?"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-xs font-medium text-neutral-400 mb-1.5">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                required
                maxLength={5000}
                rows={5}
                className="w-full rounded-lg border border-white/10 bg-[#2a2a2a] px-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400/20 transition-colors resize-y"
                placeholder="Tell us more..."
              />
            </div>

            {status === "error" && (
              <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-600 ring-1 ring-red-500/20">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-full border border-white/10 bg-white/[0.06] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Send Message"}
            </button>
          </form>
        )}
      </PagePanel>
    </div>
  );
}

