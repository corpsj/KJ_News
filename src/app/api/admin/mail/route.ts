import { NextRequest, NextResponse } from "next/server";
import { ImapFlow } from "imapflow";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function getImapConfig() {
  return {
    host: "imap.zoho.com",
    port: 993,
    secure: true,
    auth: {
      user: process.env.ZOHO_SMTP_USER || "",
      pass: process.env.ZOHO_SMTP_PASS || "",
    },
    logger: false as const,
  };
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10), 100);

  const client = new ImapFlow(getImapConfig());

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      const mailbox = client.mailbox;
      const total = mailbox && typeof mailbox === "object" && "exists" in mailbox ? mailbox.exists : 0;

      if (total === 0) {
        return NextResponse.json({ emails: [], total: 0 });
      }

      const startSeq = Math.max(1, total - limit + 1);
      const range = `${startSeq}:${total}`;

      const emails: {
        uid: number;
        fromName: string;
        fromAddress: string;
        subject: string;
        date: string;
        seen: boolean;
        flagged: boolean;
      }[] = [];

      for await (const msg of client.fetch(range, {
        uid: true,
        envelope: true,
        flags: true,
      })) {
        const from = msg.envelope?.from?.[0];
        emails.push({
          uid: msg.uid,
          fromName: from?.name || "",
          fromAddress: from?.address || "",
          subject: msg.envelope?.subject || "",
          date: msg.envelope?.date?.toISOString() || "",
          seen: msg.flags?.has("\\Seen") ?? false,
          flagged: msg.flags?.has("\\Flagged") ?? false,
        });
      }

      emails.reverse();

      return NextResponse.json({ emails, total });
    } finally {
      lock.release();
    }
  } catch (error) {
    console.error("IMAP fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 },
    );
  } finally {
    await client.logout().catch(() => {});
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { uid, seen } = body as { uid: number; seen?: boolean };

  if (!uid) {
    return NextResponse.json({ error: "Missing uid" }, { status: 400 });
  }

  const client = new ImapFlow(getImapConfig());

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      if (seen === true) {
        await client.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true });
      } else if (seen === false) {
        await client.messageFlagsRemove(String(uid), ["\\Seen"], {
          uid: true,
        });
      }

      return NextResponse.json({ success: true });
    } finally {
      lock.release();
    }
  } catch (error) {
    console.error("IMAP flag error:", error);
    return NextResponse.json(
      { error: "Failed to update flags" },
      { status: 500 },
    );
  } finally {
    await client.logout().catch(() => {});
  }
}
