import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const RESEND_API_URL = "https://api.resend.com/emails";

function parseRecipients(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

async function forwardEmail({
  name,
  email,
  subject,
  message,
}: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ forwarded: boolean; warning?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const recipients = parseRecipients(process.env.CONTACT_TO_EMAIL);
  const from = (process.env.CONTACT_FROM_EMAIL ?? "NZ Election Tracker <onboarding@resend.dev>").trim();

  if (!apiKey || recipients.length === 0) {
    return {
      forwarded: false,
      warning:
        "Message saved, but email forwarding is not configured yet. Set RESEND_API_KEY and CONTACT_TO_EMAIL in Vercel.",
    };
  }

  const text = [
    "New contact form submission",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Subject: ${subject}`,
    "",
    "Message:",
    message,
  ].join("\n");

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: recipients,
        reply_to: email,
        subject: `[Contact] ${subject}`,
        text,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Resend forwarding error:", detail);
      return {
        forwarded: false,
        warning: "Message saved, but forwarding to email failed. Please check Resend sender/domain settings.",
      };
    }
  } catch (error) {
    console.error("Resend forwarding exception:", error);
    return {
      forwarded: false,
      warning: "Message saved, but forwarding to email failed due to a network error.",
    };
  }

  return { forwarded: true };
}

export async function POST(req: NextRequest) {
  let body: {
    name?: unknown;
    email?: unknown;
    subject?: unknown;
    message?: unknown;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const subject = String(body.subject ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  // Cap field lengths
  if (name.length > 200 || email.length > 320 || subject.length > 500 || message.length > 5000) {
    return NextResponse.json({ error: "One or more fields exceed maximum length." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from("contact_submissions").insert({
    name,
    email,
    subject,
    message,
  });

  if (error) {
    console.error("Contact insert error:", error);
    return NextResponse.json({ error: "Failed to send message. Please try again." }, { status: 500 });
  }

  const delivery = await forwardEmail({ name, email, subject, message });

  return NextResponse.json({
    ok: true,
    forwarded: delivery.forwarded,
    warning: delivery.warning,
  });
}
