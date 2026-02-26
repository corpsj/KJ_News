-- Migration: Replace permissive RLS policies with admin-only policies
-- Purpose: Restrict nf_imports and site_settings tables to admin users only
-- Date: 2026-02-28

-- ============================================================================
-- nf_imports: Drop old permissive policies
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated read nf_imports" ON nf_imports;
DROP POLICY IF EXISTS "Authenticated insert nf_imports" ON nf_imports;

-- ============================================================================
-- nf_imports: Create admin-only policies
-- ============================================================================
CREATE POLICY "Admin read nf_imports" ON nf_imports
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin insert nf_imports" ON nf_imports
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin update nf_imports" ON nf_imports
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin delete nf_imports" ON nf_imports
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ============================================================================
-- site_settings: Drop old permissive policies
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated read site_settings" ON site_settings;
DROP POLICY IF EXISTS "Authenticated upsert site_settings" ON site_settings;
DROP POLICY IF EXISTS "Authenticated update site_settings" ON site_settings;

-- ============================================================================
-- site_settings: Create admin-only policies
-- ============================================================================
CREATE POLICY "Admin read site_settings" ON site_settings
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin insert site_settings" ON site_settings
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin update site_settings" ON site_settings
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin delete site_settings" ON site_settings
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
