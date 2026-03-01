import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServiceClient();

  // 롱폼 최신 4개
  const { data: longVideos } = await supabase
    .from("youtube_videos")
    .select("*")
    .eq("is_active", true)
    .eq("video_type", "long")
    .order("created_at", { ascending: false })
    .limit(4);

  // 숏폼 최신 5개
  const { data: shortVideos } = await supabase
    .from("youtube_videos")
    .select("*")
    .eq("is_active", true)
    .eq("video_type", "short")
    .order("created_at", { ascending: false })
    .limit(5);

  return NextResponse.json({
    videos: [...(longVideos || []), ...(shortVideos || [])],
  });
}
