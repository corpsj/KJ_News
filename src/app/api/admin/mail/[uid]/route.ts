import { NextRequest, NextResponse } from "next/server";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { uid: uidStr } = await params;
  const uid = parseInt(uidStr, 10);

  if (isNaN(uid)) {
    return NextResponse.json({ error: "Invalid uid" }, { status: 400 });
  }

  const client = new ImapFlow({
    host: "imap.zoho.com",
    port: 993,
    secure: true,
    auth: {
      user: process.env.ZOHO_SMTP_USER || "",
      pass: process.env.ZOHO_SMTP_PASS || "",
    },
    logger: false as const,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      const download = await client.download(String(uid), undefined, {
        uid: true,
      });
      const parsed = await simpleParser(download.content);

      await client.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true });

      const from = parsed.from?.value?.[0];
      const toAddresses = parsed.to;
      const to: { name: string; address: string }[] = [];
      if (toAddresses) {
        const list = Array.isArray(toAddresses) ? toAddresses : [toAddresses];
        for (const group of list) {
          for (const v of group.value) {
            to.push({ name: v.name || "", address: v.address || "" });
          }
        }
      }

      return NextResponse.json({
        uid,
        fromName: from?.name || "",
        fromAddress: from?.address || "",
        to,
        subject: parsed.subject || "",
        date: parsed.date?.toISOString() || "",
        html: parsed.html || "",
        text: parsed.text || "",
        seen: true,
      });
    } finally {
      lock.release();
    }
  } catch (error) {
    console.error("IMAP detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch email" },
      { status: 500 },
    );
  } finally {
    await client.logout().catch(() => {});
  }
}
