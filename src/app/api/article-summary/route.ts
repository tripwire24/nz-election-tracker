import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI summarisation is not configured" },
      { status: 503 },
    );
  }

  const { title, url, excerpt } = (await request.json()) as {
    title?: string;
    url?: string;
    excerpt?: string;
  };

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const prompt = [
    `Summarise this NZ political news article in 2-3 concise sentences for a general audience.`,
    `Title: ${title}`,
    excerpt ? `Excerpt: ${excerpt}` : null,
    url ? `URL: ${url}` : null,
    `Respond ONLY with the summary text, no preamble.`,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-20250414",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "AI request failed" },
      { status: 502 },
    );
  }

  const data = await response.json();
  const summary =
    data?.content?.[0]?.text?.trim() ?? "Summary unavailable.";

  return NextResponse.json({ summary });
}
