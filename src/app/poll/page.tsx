"use client";

import { useState, useEffect, useCallback } from "react";

const PARTIES = [
  { name: "National", colour: "#1C3F94" },
  { name: "Labour", colour: "#D82A20" },
  { name: "ACT", colour: "#FDE047" },
  { name: "Green", colour: "#098137" },
  { name: "NZ First", colour: "#1A1A1A" },
  { name: "Te Pāti Māori", colour: "#870F2C" },
  { name: "TOP", colour: "#07B0AB" },
  { name: "Other", colour: "#737373" },
];

const AGE_BRACKETS = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
const REGIONS = [
  "Northland",
  "Auckland",
  "Waikato",
  "Bay of Plenty",
  "Gisborne",
  "Hawke's Bay",
  "Taranaki",
  "Manawatū-Whanganui",
  "Wellington",
  "Nelson/Marlborough",
  "Canterbury",
  "West Coast",
  "Otago",
  "Southland",
];

interface PollResult {
  party: string;
  votes: number;
  pct: number;
}

export default function PollPage() {
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [ageBracket, setAgeBracket] = useState("");
  const [region, setRegion] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<PollResult[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [alreadyVoted, setAlreadyVoted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("nzet_voted")) {
      setAlreadyVoted(true);
      setSubmitted(true);
    }
  }, []);

  const fetchResults = useCallback(async () => {
    const res = await fetch("/api/poll");
    if (res.ok) {
      const data = await res.json();
      setResults(data.results);
      setTotalVotes(data.total);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedParty || alreadyVoted) return;
    setSubmitting(true);

    const res = await fetch("/api/poll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        party_vote: selectedParty,
        age_bracket: ageBracket || undefined,
        region: region || undefined,
      }),
    });

    if (res.ok) {
      localStorage.setItem("nzet_voted", "1");
      setAlreadyVoted(false);
    } else if (res.status === 409) {
      localStorage.setItem("nzet_voted", "1");
      setAlreadyVoted(true);
    }

    setSubmitted(true);
    setSubmitting(false);
    fetchResults();
  }

  const partyColour = (name: string) =>
    PARTIES.find((p) => p.name === name)?.colour ?? "#737373";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">
          Who would you vote for?
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Anonymous voting intention poll — your response is not linked to any account.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Vote form */}
        <div className="rounded-xl border border-white/10 bg-[#242424] p-6">
          {submitted ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-neutral-300">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-neutral-100">
                {alreadyVoted ? "You\u2019ve already voted" : "Thanks for voting!"}
              </h2>
              <p className="text-sm text-neutral-500">
                {alreadyVoted ? "One vote per person — see the live results on the right." : "Results update live — see the breakdown on the right."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Party vote */}
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
                  Party Vote
                </h2>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {PARTIES.map(({ name, colour }) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSelectedParty(name)}
                      className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                        selectedParty === name
                          ? "border-white/20 bg-white/10 text-white ring-1 ring-white/15"
                          : "border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10"
                      }`}
                    >
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: colour }}
                      />
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Demographics (optional) */}
              <div className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
                  Demographics <span className="text-neutral-600">(optional)</span>
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    value={ageBracket}
                    onChange={(e) => setAgeBracket(e.target.value)}
                    className="rounded-lg border border-white/10 bg-[#2a2a2a] px-3 py-2 text-sm text-neutral-300 outline-none focus:border-neutral-400"
                  >
                    <option value="">Age bracket</option>
                    {AGE_BRACKETS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="rounded-lg border border-white/10 bg-[#2a2a2a] px-3 py-2 text-sm text-neutral-300 outline-none focus:border-neutral-400"
                  >
                    <option value="">Region</option>
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={!selectedParty || submitting}
                className="w-full rounded-xl bg-gradient-to-r from-neutral-600 to-neutral-700 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {submitting ? "Submitting…" : "Cast your vote"}
              </button>
            </form>
          )}
        </div>

        {/* Results */}
        <div className="rounded-xl border border-white/10 bg-[#242424] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
              Results
            </h2>
            <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-neutral-400 ring-1 ring-white/10">
              {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
            </span>
          </div>

          {results.length === 0 || totalVotes === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-500">
              No votes yet — be the first!
            </p>
          ) : (
            <div className="space-y-3">
              {results.map((r) => (
                <div key={r.party} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-neutral-200">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: partyColour(r.party) }}
                      />
                      {r.party}
                    </span>
                    <span className="tabular-nums text-neutral-400">
                      {r.pct}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${r.pct}%`,
                        backgroundColor: partyColour(r.party),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-neutral-500">
        <strong className="text-neutral-400">Disclaimer:</strong> This is a
        completely anonymous and open community poll for interest purposes only.
        It is not a scientific survey and does not represent accurate polling
        data. Results may not reflect the views of the wider New Zealand
        electorate. For official polling, refer to accredited research companies
        such as Curia, Reid Research, or Talbot Mills.
      </div>
    </div>
  );
}
