import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/nf-client";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized: User not authenticated" },
      { status: 401 }
    );
  }

  if (!isConfigured()) {
    return NextResponse.json({ status: "disconnected", subscriptions: [] });
  }

  const { data: settings } = await supabase
    .from("nf_settings")
    .select("is_active")
    .eq("id", 1)
    .single();

  return NextResponse.json({
    status: settings?.is_active ? "connected" : "disconnected",
    subscriptions: [],
  });
}
