import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchArticles, isConfigured } from "@/lib/nf-client";
import type { NfArticle } from "@/lib/types";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userRole = user.user_metadata?.role as string | undefined;
  if (userRole !== undefined && userRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!(await isConfigured())) {
    return NextResponse.json({ articles: [], total: 0, limit: 20, offset: 0, imports: [] });
  }

  try {
    const sp = request.nextUrl.searchParams;
    const data = await fetchArticles({
      region: sp.get("region") || undefined,
      category: sp.get("category") || undefined,
      keyword: sp.get("keyword") || undefined,
      from: sp.get("from") || undefined,
      to: sp.get("to") || undefined,
      status: sp.get("status") || undefined,
      limit: sp.has("limit") ? Number(sp.get("limit")) : undefined,
      offset: sp.has("offset") ? Number(sp.get("offset")) : undefined,
    });

    const articleIds = data.articles.map((article: NfArticle) => article.id);
    let imports: Array<{ nf_article_id: string; import_type: string; local_article_id: number }> = [];
    if (articleIds.length > 0) {
      const { data: impData } = await supabase
        .from("nf_imports")
        .select("nf_article_id, import_type, local_article_id")
        .in("nf_article_id", articleIds);
      imports = impData ?? [];
    }

    return NextResponse.json({ ...data, imports });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message, articles: [], total: 0, limit: 20, offset: 0, imports: [] }, { status: 502 });
  }
}
