import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * A user is an admin ONLY if their JWT role claim is exactly "admin".
 *
 * NOTE: a previous guard used `role !== undefined && role !== "admin"`, which
 * let any authenticated user WITHOUT a role claim through. This is the correct,
 * allow-list form: anything that is not exactly "admin" is denied.
 */
export function isAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  // Role lives in app_metadata (service-role-only), not user_metadata
  // (self-editable), to prevent privilege escalation.
  const role = (user.app_metadata as Record<string, unknown> | undefined)?.role;
  return role === "admin";
}

type RequireAdminResult =
  | { ok: true; user: User }
  | { ok: false; response: NextResponse };

/**
 * Server-side admin gate for API route handlers.
 * Usage:
 *   const auth = await requireAdmin();
 *   if (!auth.ok) return auth.response;
 *
 * The role is read from app_metadata (service-role-only) — see isAdmin.
 */
export async function requireAdmin(): Promise<RequireAdminResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (!isAdmin(user)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true, user };
}
