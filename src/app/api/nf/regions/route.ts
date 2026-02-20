import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchRegions, isConfigured } from "@/lib/nf-client";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await isConfigured())) {
    return NextResponse.json({ regions: [] });
  }

  try {
    const data = await fetchRegions();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message, regions: [] }, { status: 502 });
  }
}
