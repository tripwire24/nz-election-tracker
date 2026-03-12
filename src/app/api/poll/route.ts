import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_PARTIES = [
  "National",
  "Labour",
  "ACT",
  "Green",
  "NZ First",
  "Te Pāti Māori",
  "TOP",
  "Other",
];

const AGE_BRACKETS = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];

export async function GET() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_polls")
    .select("party_vote");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const total = data?.length ?? 0;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.party_vote] = (counts[row.party_vote] || 0) + 1;
  }

  const results = ALLOWED_PARTIES.map((party) => ({
    party,
    votes: counts[party] ?? 0,
    pct: total > 0 ? Math.round(((counts[party] ?? 0) / total) * 1000) / 10 : 0,
  })).sort((a, b) => b.votes - a.votes);

  return NextResponse.json({ total, results });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { party_vote, electorate_vote, age_bracket, region } = body as {
    party_vote?: string;
    electorate_vote?: string;
    age_bracket?: string;
    region?: string;
  };

  if (!party_vote || !ALLOWED_PARTIES.includes(party_vote)) {
    return NextResponse.json({ error: "Invalid party_vote" }, { status: 400 });
  }

  if (age_bracket && !AGE_BRACKETS.includes(age_bracket)) {
    return NextResponse.json({ error: "Invalid age_bracket" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("user_polls").insert({
    party_vote,
    electorate_vote: electorate_vote || null,
    age_bracket: age_bracket || null,
    region: region || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
