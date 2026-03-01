import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("youtube_videos")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) return NextResponse.json({ videos: [] });
  return NextResponse.json({ videos: data });
}
