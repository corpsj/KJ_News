import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  // 1. Verify authenticated session (cookie-based, respects RLS)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Require explicit confirmation header to prevent accidents
  const confirm = request.headers.get("x-confirm-cleanup");
  if (confirm !== "DELETE_ALL_DATA") {
    return NextResponse.json(
      { error: "Missing confirmation header. Set x-confirm-cleanup: DELETE_ALL_DATA" },
      { status: 400 }
    );
  }

  // 3. Use service client to bypass RLS (authors table has no DELETE RLS policy)
  const serviceClient = await createServiceClient();

  // Step A: Delete all articles first
  const { error: articlesError, count: articlesCount } = await serviceClient
    .from("articles")
    .delete({ count: "exact" })
    .neq("id", 0);

  if (articlesError) {
    return NextResponse.json({ success: false, error: articlesError.message }, { status: 500 });
  }

  // Step B: Delete all authors
  const { error: authorsError, count: authorsCount } = await serviceClient
    .from("authors")
    .delete({ count: "exact" })
    .neq("id", 0);

  if (authorsError) {
    return NextResponse.json({ success: false, error: authorsError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    deleted: {
      articles: articlesCount ?? 0,
      authors: authorsCount ?? 0,
    },
  });
}
