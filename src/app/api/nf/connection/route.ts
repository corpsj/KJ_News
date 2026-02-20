import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isConfigured, maskApiKey } from "@/lib/nf-client";
import type { NfConnection } from "@/lib/types";

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
    const disconnected: NfConnection = {
      api_key: "",
      status: "disconnected",
      client_name: "",
      is_active: false,
      collect_categories: [],
      collect_schedule: "",
      connected_at: "",
      updated_at: "",
    };
    return NextResponse.json(disconnected);
  }

  const { data: settings, error } = await supabase
    .from("nf_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !settings) {
    return NextResponse.json(
      { error: "Failed to load settings" },
      { status: 500 }
    );
  }

  const conn: NfConnection = {
    api_key: maskApiKey(process.env.NF_API_KEY || ""),
    status: "connected",
    client_name: settings.client_name,
    is_active: settings.is_active,
    collect_categories: settings.collect_categories,
    collect_schedule: settings.collect_schedule,
    last_synced_at: settings.last_synced_at ?? undefined,
    connected_at: settings.connected_at,
    updated_at: settings.updated_at,
  };

  return NextResponse.json(conn);
}

export async function PUT(request: Request) {
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.is_active === "boolean") {
    updates.is_active = body.is_active;
  }
  if (Array.isArray(body.collect_categories)) {
    updates.collect_categories = body.collect_categories;
  }

  const { data: settings, error } = await supabase
    .from("nf_settings")
    .update(updates)
    .eq("id", 1)
    .select()
    .single();

  if (error || !settings) {
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }

  const conn: NfConnection = {
    api_key: maskApiKey(process.env.NF_API_KEY || ""),
    status: isConfigured() ? "connected" : "disconnected",
    client_name: settings.client_name,
    is_active: settings.is_active,
    collect_categories: settings.collect_categories,
    collect_schedule: settings.collect_schedule,
    last_synced_at: settings.last_synced_at ?? undefined,
    connected_at: settings.connected_at,
    updated_at: settings.updated_at,
  };

  return NextResponse.json(conn);
}
