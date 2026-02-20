import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchArticles, isConfigured } from "@/lib/nf-client";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await isConfigured())) {
    return NextResponse.json({ articles: [], total: 0, limit: 20, offset: 0 });
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

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message, articles: [], total: 0, limit: 20, offset: 0 }, { status: 502 });
  }
}
