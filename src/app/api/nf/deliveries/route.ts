import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const { data: logs, count, error } = await supabase
    .from("nf_sync_logs")
    .select("*", { count: "exact" })
    .order("synced_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: "Failed to load sync logs" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    deliveries: logs ?? [],
    total: count ?? 0,
  });
}
