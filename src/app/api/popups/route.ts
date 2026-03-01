import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("popups")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) return NextResponse.json({ popups: [] });
  return NextResponse.json({ popups: data });
}
