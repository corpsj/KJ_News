import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: User not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { to, subject, html } = body;

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, html" },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.ZOHO_SMTP_HOST || "smtp.zoho.com",
      port: parseInt(process.env.ZOHO_SMTP_PORT || "465", 10),
      secure: true,
      auth: {
        user: process.env.ZOHO_SMTP_USER,
        pass: process.env.ZOHO_SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.ZOHO_SMTP_USER,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
