import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Module-level rate limit: IP -> timestamps[]
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const now = Date.now();
    const timestamps = (rateLimitMap.get(ip) || []).filter(
      (t) => now - t < RATE_LIMIT_WINDOW_MS
    );
    if (timestamps.length >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }
    timestamps.push(now);
    rateLimitMap.set(ip, timestamps);

    const body = await request.json();
    const {
      senderName,
      senderEmail,
      subject,
      body: messageBody,
      honeypot,
    } = body;

    // Honeypot — silently succeed to fool bots
    if (honeypot) {
      return NextResponse.json({ success: true });
    }

    // Required field check
    if (!senderName || !senderEmail || !messageBody) {
      return NextResponse.json(
        { error: "Missing required fields: senderName, senderEmail, body" },
        { status: 400 }
      );
    }

    // Input length validation
    if (senderName.length > 100) {
      return NextResponse.json(
        { error: "Name too long (max 100 characters)" },
        { status: 400 }
      );
    }
    if (senderEmail.length > 254) {
      return NextResponse.json(
        { error: "Email too long (max 254 characters)" },
        { status: 400 }
      );
    }
    if (subject && subject.length > 200) {
      return NextResponse.json(
        { error: "Subject too long (max 200 characters)" },
        { status: 400 }
      );
    }
    if (messageBody.length > 10000) {
      return NextResponse.json(
        { error: "Message too long (max 10,000 characters)" },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(senderEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.from("contact_messages").insert({
      sender_name: senderName,
      sender_email: senderEmail,
      subject: subject || "",
      body: messageBody,
    });

    if (error) {
      return NextResponse.json(
        { error: "Failed to submit contact message" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
