import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const nfIds = sp.get("nf_ids");
  const limit = Number(sp.get("limit") || "50");
  const offset = Number(sp.get("offset") || "0");

  if (nfIds) {
    const ids = nfIds.split(",").filter(Boolean);
    const { data, error } = await supabase
      .from("nf_imports")
      .select("nf_article_id, import_type")
      .in("nf_article_id", ids);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ imports: data ?? [] });
  }

  const { data, count, error } = await supabase
    .from("nf_imports")
    .select("*", { count: "exact" })
    .order("imported_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ imports: data ?? [], total: count ?? 0 });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { nf_article_id, local_article_id, nf_title, import_type } = body as {
    nf_article_id: string;
    local_article_id: number;
    nf_title: string;
    import_type: string;
  };

  if (!nf_article_id || !local_article_id || !nf_title || !import_type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("nf_imports")
    .insert({
      nf_article_id,
      local_article_id,
      nf_title,
      imported_by: user.id,
      import_type,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Article already imported" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
