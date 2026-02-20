import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchArticle, isConfigured } from "@/lib/nf-client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await isConfigured())) {
    return NextResponse.json({ error: "NF not configured" }, { status: 503 });
  }

  try {
    const { id } = await params;
    const data = await fetchArticle(id);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("404") ? 404 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
