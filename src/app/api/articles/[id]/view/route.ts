import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 24 * 60 * 60 * 1000;
const MAX_VIEWED_IDS = 200;

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

  const ip =
    _request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    _request.headers.get("x-real-ip") ||
    "unknown";
  const rateLimitKey = `${articleId}:${ip}`;
  const lastViewed = rateLimitMap.get(rateLimitKey);

  if (lastViewed && Date.now() - lastViewed < RATE_LIMIT_MS) {
    return NextResponse.json({ success: false, message: "Rate limited" });
  }

  rateLimitMap.set(rateLimitKey, Date.now());

  const supabase = await createClient();

  const { data: newCount, error } = await supabase.rpc("increment_view_count", {
    article_id_param: articleId,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to update view count" },
      { status: 500 }
    );
  }

  const updatedIds = [...viewedIds, id];
  const cappedIds =
    updatedIds.length > MAX_VIEWED_IDS
      ? updatedIds.slice(updatedIds.length - MAX_VIEWED_IDS)
      : updatedIds;

  const response = NextResponse.json({
    success: true,
    viewCount: newCount,
  });
  response.cookies.set("viewed_articles", cappedIds.join(","), {
    maxAge: 60 * 60 * 24,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return response;
}
