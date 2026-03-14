import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const DEFAULT_CONTACT_RECIPIENT = "luke@nz-election-tracker.co.nz";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendContactEmail({
  name,
  email,
  subject,
  message,
}: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.CONTACT_FROM_EMAIL?.trim();
  const recipient = process.env.CONTACT_TO_EMAIL?.trim() || DEFAULT_CONTACT_RECIPIENT;

  if (!resendApiKey || !fromEmail) {
    return {
      delivered: false,
      recipient,
      reason: "Email forwarding is not configured yet.",
      missingConfiguration: true,
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [recipient],
        reply_to: email,
        subject: `[NZ Election Tracker] ${subject}`,
        text: [
          "New contact submission",
          "",
          `Name: ${name}`,
          `Email: ${email}`,
          `Subject: ${subject}`,
          "",
          message,
        ].join("\n"),
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
            <h2 style="margin-bottom: 16px;">New contact submission</h2>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
            <div style="margin-top: 20px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; background: #f9fafb; white-space: pre-wrap;">${escapeHtml(message)}</div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        delivered: false,
        recipient,
        reason: errorText || "Email delivery failed.",
        missingConfiguration: false,
      };
    }

    return {
      delivered: true,
      recipient,
      reason: null,
      missingConfiguration: false,
    };
  } catch (error) {
    return {
      delivered: false,
      recipient,
      reason: error instanceof Error ? error.message : "Email delivery failed.",
      missingConfiguration: false,
    };
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
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

  const delivery = await sendContactEmail({ name, email, subject, message });

  if (!delivery.delivered && !delivery.missingConfiguration) {
    console.error("Contact email delivery error:", delivery.reason);
    return NextResponse.json(
      {
        error: `Your message was saved, but forwarding to ${delivery.recipient} failed. You can email ${delivery.recipient} directly while this is being fixed.`,
        saved: true,
        delivered: false,
        recipient: delivery.recipient,
      },
      { status: 502 },
    );
  }

  if (!delivery.delivered) {
    return NextResponse.json({
      ok: true,
      saved: true,
      delivered: false,
      recipient: delivery.recipient,
      warning: `Your message has been saved, but email forwarding to ${delivery.recipient} is not configured yet.`,
    });
  }

  return NextResponse.json({ ok: true, saved: true, delivered: true, recipient: delivery.recipient });
}
