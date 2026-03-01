import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function extractVideoId(url: string): string | null {
  // youtube.com/watch?v=ID
  const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (longMatch) return longMatch[1];
  // youtu.be/ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  // youtube.com/shorts/ID
  const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];
  return null;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userRole = user.user_metadata?.role as string | undefined;
  if (userRole !== undefined && userRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("youtube_videos")
    .select("*")
    .order("video_type")
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ videos: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userRole = user.user_metadata?.role as string | undefined;
  if (userRole !== undefined && userRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const youtubeUrl = (body.youtube_url as string) || "";
  const videoId = extractVideoId(youtubeUrl);
  if (!videoId) {
    return NextResponse.json({ error: "유효한 YouTube URL을 입력하세요." }, { status: 400 });
  }

  const videoType = (body.video_type as string) || "long";
  if (!["long", "short"].includes(videoType)) {
    return NextResponse.json({ error: "video_type은 long 또는 short이어야 합니다." }, { status: 400 });
  }

  // YouTube oEmbed API로 제목 가져오기
  let title = (body.title as string) || "";
  let thumbnailUrl = (body.thumbnail_url as string) || "";

  if (!title || !thumbnailUrl) {
    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        if (!title) title = oembedData.title || "";
        if (!thumbnailUrl) thumbnailUrl = oembedData.thumbnail_url || "";
      }
    } catch { /* fallback */ }
  }

  // 썸네일 폴백
  if (!thumbnailUrl) {
    thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }

  const { data, error } = await supabase
    .from("youtube_videos")
    .insert({
      youtube_url: youtubeUrl,
      video_id: videoId,
      title,
      thumbnail_url: thumbnailUrl,
      video_type: videoType,
      sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
      is_active: body.is_active ?? true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ video: data }, { status: 201 });
}
