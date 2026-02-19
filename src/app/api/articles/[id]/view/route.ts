import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const articleId = parseInt(id, 10);

  if (isNaN(articleId)) {
    return NextResponse.json({ error: "Invalid article ID" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const viewedCookie = cookieStore.get("viewed_articles");
  const viewedIds = viewedCookie?.value
    ? viewedCookie.value.split(",").filter(Boolean)
    : [];

  if (viewedIds.includes(id)) {
    return NextResponse.json({ success: false, message: "Already viewed" });
  }

  const supabase = await createServiceClient();

  const { data: article, error: fetchError } = await supabase
    .from("articles")
    .select("id, view_count")
    .eq("id", articleId)
    .single();

  if (fetchError || !article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("articles")
    .update({ view_count: (article.view_count || 0) + 1 })
    .eq("id", articleId)
    .select("view_count")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update view count" },
      { status: 500 }
    );
  }

  const newViewedIds = [...viewedIds, id].join(",");
  const response = NextResponse.json({
    success: true,
    viewCount: data.view_count,
  });
  response.cookies.set("viewed_articles", newViewedIds, {
    maxAge: 60 * 60 * 24, // 24 hours
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return response;
}
