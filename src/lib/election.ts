/**
 * Shared MMP election utilities — Sainte-Laguë seat allocation, weighted
 * polling average, and type definitions.
 */

// ── Types ──────────────────────────────────────────────────────────────

export interface PollResult {
  short_name: string;
  name: string;
  colour: string;
  value: number; // percentage
}

export interface SeatAllocation {
  name: string;
  short: string;
  seats: number;
  colour: string;
  votePct: number;
}

export interface WeightedPollInput {
  poll_id: string;
  pollster: string;
  published_date: string; // ISO date
  results: PollResult[];
}

// ── Sainte-Laguë MMP seat allocation ───────────────────────────────────

/**
 * Allocate `totalSeats` using Sainte-Laguë (modified Webster) method.
 * Applies 5% party-vote threshold (simplified — doesn't model electorate wins).
 */
export function allocateSeats(
  results: PollResult[],
  totalSeats: number = 120,
): SeatAllocation[] {
  const eligible = results.filter((p) => p.value >= 5);
  if (eligible.length === 0) return [];

  const totalVote = eligible.reduce((s, p) => s + p.value, 0);

  // Generate quotients using odd divisors (1, 3, 5, 7, ...)
  const quotients: { party: string; q: number }[] = [];
  for (const p of eligible) {
    const normalisedVote = (p.value / totalVote) * 100;
    for (let d = 1; d <= totalSeats * 2; d += 2) {
      quotients.push({ party: p.short_name, q: normalisedVote / d });
    }
  }
  quotients.sort((a, b) => b.q - a.q);

  const seatCount: Record<string, number> = {};
  for (let i = 0; i < totalSeats; i++) {
    const p = quotients[i].party;
    seatCount[p] = (seatCount[p] || 0) + 1;
  }

  return eligible.map((p) => ({
    name: p.name
      .replace(/^New Zealand /, "")
      .replace(/ Party.*$/, "")
      .replace("of Aotearoa NZ", ""),
    short: p.short_name,
    seats: seatCount[p.short_name] || 0,
    colour: p.colour,
    votePct: p.value,
  }));
}

// ── Coalition helpers ──────────────────────────────────────────────────

export const RIGHT_BLOC = ["NAT", "ACT", "NZF"];
export const LEFT_BLOC = ["LAB", "GRN", "TPM"];
export const MAJORITY = 61;

export function coalitionSeats(seats: SeatAllocation[], bloc: string[]) {
  return seats
    .filter((p) => bloc.includes(p.short))
    .reduce((s, p) => s + p.seats, 0);
}

// ── Weighted polling average ───────────────────────────────────────────

/**
 * Compute an exponential-decay weighted average of multiple polls.
 *
 * Each poll is weighted by:
 *   w = exp(-lambda * daysAgo)
 *
 * where lambda = ln(2) / halfLifeDays  (so a poll halfLifeDays ago
 * gets half the weight of today's poll).
 *
 * @param polls     Array of polls with their per-party results
 * @param asOfDate  Reference date (defaults to now)
 * @param halfLifeDays  Half-life in days for recency decay (default 14)
 * @param maxAgeDays    Ignore polls older than this (default 90)
 * @returns Weighted-average PollResult[] sorted by value descending
 */
export function weightedPollingAverage(
  polls: WeightedPollInput[],
  asOfDate: Date = new Date(),
  halfLifeDays: number = 14,
  maxAgeDays: number = 90,
): PollResult[] {
  if (polls.length === 0) return [];

  const lambda = Math.LN2 / halfLifeDays;
  const cutoff = maxAgeDays * 86_400_000; // ms

  // Accumulate weighted sums per party
  const accum: Record<
    string,
    { name: string; colour: string; weightedSum: number; totalWeight: number }
  > = {};

  for (const poll of polls) {
    const ageMs = asOfDate.getTime() - new Date(poll.published_date).getTime();
    if (ageMs < 0 || ageMs > cutoff) continue;

    const ageDays = ageMs / 86_400_000;
    const weight = Math.exp(-lambda * ageDays);

    for (const r of poll.results) {
      if (!accum[r.short_name]) {
        accum[r.short_name] = {
          name: r.name,
          colour: r.colour,
          weightedSum: 0,
          totalWeight: 0,
        };
      }
      accum[r.short_name].weightedSum += r.value * weight;
      accum[r.short_name].totalWeight += weight;
    }
  }

  return Object.entries(accum)
    .map(([short_name, a]) => ({
      short_name,
      name: a.name,
      colour: a.colour,
      value: Math.round((a.weightedSum / a.totalWeight) * 100) / 100,
    }))
    .sort((a, b) => b.value - a.value);
}
