import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchArticles, isConfigured } from "@/lib/nf-client";
import { NF_REVERSE_CATEGORY_MAP } from "@/lib/nf-constants";
import type { NfArticle } from "@/lib/types";

export async function GET() {
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

  if (!isConfigured()) {
    return NextResponse.json({ articles: [], total: 0 });
  }

  try {
    const data = await fetchArticles({ limit: 100, status: "all" });

    const articles: NfArticle[] = data.articles.map((a) => ({
      id: a.id,
      title: a.title,
      summary: a.summary ?? undefined,
      content: a.content ?? undefined,
      category: NF_REVERSE_CATEGORY_MAP[a.category] || a.category,
      source: a.source,
      source_url: a.source_url,
      images: a.images,
      published_at: a.published_at,
      processed_at: a.processed_at,
    }));

    // Log sync (deduplicate: skip if last log was <5 min ago)
    try {
      const { data: lastLog } = await supabase
        .from("nf_sync_logs")
        .select("synced_at")
        .order("synced_at", { ascending: false })
        .limit(1)
        .single();

      const shouldLog =
        !lastLog ||
        Date.now() - new Date(lastLog.synced_at).getTime() > 5 * 60 * 1000;

      if (shouldLog) {
        await supabase.from("nf_sync_logs").insert({
          article_count: articles.length,
          status: "success",
        });
        await supabase
          .from("nf_settings")
          .update({ last_synced_at: new Date().toISOString() })
          .eq("id", 1);
      }
    } catch {
      // Logging failure should not break article response
    }

    return NextResponse.json({ articles, total: data.total });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    try {
      await supabase.from("nf_sync_logs").insert({
        article_count: 0,
        status: "failed",
        error_message: message,
      });
    } catch {
      // Ignore logging failure
    }

    return NextResponse.json(
      { error: message, articles: [], total: 0 },
      { status: 502 }
    );
  }
}
