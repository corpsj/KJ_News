import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { url: string; key: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { url, key } = body;
  if (!url || !key) {
    return NextResponse.json({ error: "URL and key required" }, { status: 400 });
  }

  try {
    const apiUrl = url.replace(/\/+$/, "");
    const res = await fetch(`${apiUrl}/api/v1/categories`, {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (res.ok) {
      const data = await res.json();
      const count = Array.isArray(data.categories) ? data.categories.length : 0;
      return NextResponse.json({ ok: true, message: `연결 성공 — 카테고리 ${count}개 확인` });
    }

    const text = await res.text().catch(() => "");
    return NextResponse.json({ ok: false, message: `연결 실패 (${res.status}): ${text.slice(0, 200)}` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ ok: false, message: `연결 실패: ${msg}` });
  }
}
