import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Per-user, auth-gated — never cache.
export const dynamic = "force-dynamic";

function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 6)}••••••••${key.slice(-4)}`;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userRole = user.app_metadata?.role as string | undefined;
  if (userRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["nf_api_url", "nf_api_key"]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    map[row.key] = row.value;
  }

  // Never return the raw API key to the client — only a masked hint + a flag.
  return NextResponse.json({
    settings: {
      nf_api_url: map.nf_api_url || "",
      nf_api_key_set: Boolean(map.nf_api_key),
      nf_api_key_hint: maskKey(map.nf_api_key || ""),
    },
  });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userRole = user.app_metadata?.role as string | undefined;
  if (userRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const allowed = ["nf_api_url", "nf_api_key"];
  const entries = Object.entries(body).filter(([k, v]) => {
    if (!allowed.includes(k)) return false;
    // Ignore empty or masked-hint key values so saving without re-entering the
    // key never overwrites the stored secret.
    if (k === "nf_api_key" && (!String(v).trim() || String(v).includes("•"))) return false;
    return true;
  });

  if (entries.length === 0) {
    return NextResponse.json({ error: "No valid settings provided" }, { status: 400 });
  }

  for (const [key, value] of entries) {
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
