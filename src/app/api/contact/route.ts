import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, subject, message } = body;

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
    name: name.trim(),
    email: email.trim(),
    subject: subject.trim(),
    message: message.trim(),
  });

  if (error) {
    console.error("Contact insert error:", error);
    return NextResponse.json({ error: "Failed to send message. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
