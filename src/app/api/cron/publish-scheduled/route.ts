import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { reportError } from "@/lib/observability";

// Publishes due scheduled articles. Invoked by Vercel Cron (see vercel.json).
// Protected by CRON_SECRET: Vercel attaches `Authorization: Bearer <CRON_SECRET>`
// to cron invocations when the env var is set. Manual calls must send the same.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = await createServiceClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("articles")
    .update({ status: "published" })
    .eq("status", "scheduled")
    .lte("published_at", nowIso)
    .not("published_at", "is", null)
    .select("id");

  if (error) {
    reportError(error, { route: "cron/publish-scheduled" });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const publishedCount = data?.length ?? 0;
  if (publishedCount > 0) {
    revalidatePath("/");
    revalidatePath("/category/[slug]", "page");
    for (const a of data!) revalidatePath(`/article/${a.id}`);
  }

  return NextResponse.json({ published: publishedCount, at: nowIso });
}
