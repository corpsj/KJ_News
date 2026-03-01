import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userRole = user.user_metadata?.role as string | undefined;
  if (userRole !== undefined && userRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("ad_banners")
    .select("*")
    .order("slot")
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ banners: data });
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

  const validSlots = ["main_news_below", "category_below", "latest_below"];
  if (!body.slot || !validSlots.includes(body.slot as string)) {
    return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("ad_banners")
    .insert({
      title: body.title || "",
      image_url: body.image_url || "",
      link_url: body.link_url || "",
      slot: body.slot,
      is_active: body.is_active ?? false,
      sort_order: body.sort_order || 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ banner: data }, { status: 201 });
}
