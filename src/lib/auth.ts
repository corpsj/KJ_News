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
  const role = (user.user_metadata as Record<string, unknown> | undefined)?.role;
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
 * The role is read from user_metadata to match how the admin account is
 * provisioned (scripts/setup-supabase.mjs) and the existing RLS policies.
 * Since user_metadata is self-editable in Supabase, migrating the role claim to
 * app_metadata (not self-editable) is a recommended hardening follow-up.
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
