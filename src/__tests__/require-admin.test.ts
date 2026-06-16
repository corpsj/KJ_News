import { describe, it, expect, vi, beforeEach } from "vitest";
import type { User } from "@supabase/supabase-js";

const getUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { getUser } })),
}));

import { requireAdmin, isAdmin } from "@/lib/auth";

function userWithRole(role?: string): User {
  return {
    id: "1",
    email: "a@b.com",
    user_metadata: role ? { role } : {},
    app_metadata: {},
    aud: "authenticated",
    created_at: "",
  } as User;
}

describe("isAdmin", () => {
  it("is true only when role === 'admin'", () => {
    expect(isAdmin(userWithRole("admin"))).toBe(true);
    expect(isAdmin(userWithRole("editor"))).toBe(false);
    expect(isAdmin(userWithRole(undefined))).toBe(false); // role-less must NOT pass
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });
});

describe("requireAdmin", () => {
  beforeEach(() => getUser.mockReset());

  it("returns 401 when there is no authenticated user", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const r = await requireAdmin();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(401);
  });

  it("returns 403 when authenticated but role is unset (the original bug)", async () => {
    getUser.mockResolvedValue({ data: { user: userWithRole(undefined) } });
    const r = await requireAdmin();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(403);
  });

  it("returns 403 when role is not admin", async () => {
    getUser.mockResolvedValue({ data: { user: userWithRole("editor") } });
    const r = await requireAdmin();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(403);
  });

  it("returns ok for an admin", async () => {
    getUser.mockResolvedValue({ data: { user: userWithRole("admin") } });
    const r = await requireAdmin();
    expect(r.ok).toBe(true);
  });
});
