import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchCategories, isConfigured } from "@/lib/nf-client";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await isConfigured())) {
    return NextResponse.json({ categories: [] });
  }

  try {
    const data = await fetchCategories();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message, categories: [] }, { status: 502 });
  }
}
