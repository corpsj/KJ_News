import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("ad_banners")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) return NextResponse.json({ banners: {} });

  const grouped: Record<string, typeof data> = {
    main_news_below: [],
    category_below: [],
    latest_below: [],
  };

  for (const banner of data || []) {
    if (grouped[banner.slot]) {
      grouped[banner.slot].push(banner);
    }
  }

  return NextResponse.json({ banners: grouped });
}
