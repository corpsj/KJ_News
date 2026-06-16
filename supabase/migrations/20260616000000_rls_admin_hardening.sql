-- Migration: Harden RLS — restrict writes (and sensitive reads) to admin only.
-- Date: 2026-06-16
--
-- Background: articles / authors / categories / popups / ad_banners /
-- youtube_videos and contact_messages shipped with permissive
-- "TO authenticated ... USING (true)" policies. Because the admin SPA writes
-- via the browser (anon-key) client AS the authenticated admin, RLS is the real
-- access control — so any authenticated principal could create/edit/delete
-- content and read every contact message. This aligns those tables with the
-- admin-claim pattern already used for nf_imports / site_settings
-- (see 20260228000000_rls_admin_only.sql).
--
-- Admin claim:  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
-- Public reads are PRESERVED: anon reads published articles / active promos /
-- authors / categories, and anon may insert contact messages.
--
-- This migration is re-runnable (DROP POLICY IF EXISTS before each CREATE).
-- AFTER APPLYING, verify: (1) the admin (user_metadata.role='admin') can still
-- create/edit/publish and read contact messages; (2) the public site renders.

-- ===========================================================================
-- articles
-- ===========================================================================
DROP POLICY IF EXISTS "Authenticated read all articles" ON articles;
DROP POLICY IF EXISTS "Authenticated insert articles" ON articles;
DROP POLICY IF EXISTS "Authenticated update articles" ON articles;
DROP POLICY IF EXISTS "Authenticated delete articles" ON articles;
-- kept: "Public read published articles" (anon SELECT WHERE status='published')

DROP POLICY IF EXISTS "Admin read all articles" ON articles;
CREATE POLICY "Admin read all articles" ON articles
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "Admin insert articles" ON articles;
CREATE POLICY "Admin insert articles" ON articles
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "Admin update articles" ON articles;
CREATE POLICY "Admin update articles" ON articles
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "Admin delete articles" ON articles;
CREATE POLICY "Admin delete articles" ON articles
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ===========================================================================
-- authors  (kept: "Public read authors")
-- ===========================================================================
DROP POLICY IF EXISTS "Authenticated insert authors" ON authors;
DROP POLICY IF EXISTS "Authenticated update authors" ON authors;

DROP POLICY IF EXISTS "Admin insert authors" ON authors;
CREATE POLICY "Admin insert authors" ON authors
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "Admin update authors" ON authors;
CREATE POLICY "Admin update authors" ON authors
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "Admin delete authors" ON authors;
CREATE POLICY "Admin delete authors" ON authors
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ===========================================================================
-- categories  (kept: "Public read categories")
-- ===========================================================================
DROP POLICY IF EXISTS "Authenticated insert categories" ON categories;
DROP POLICY IF EXISTS "Authenticated update categories" ON categories;

DROP POLICY IF EXISTS "Admin insert categories" ON categories;
CREATE POLICY "Admin insert categories" ON categories
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "Admin update categories" ON categories;
CREATE POLICY "Admin update categories" ON categories
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "Admin delete categories" ON categories;
CREATE POLICY "Admin delete categories" ON categories
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ===========================================================================
-- contact_messages  (kept: "Anon insert contact messages")
-- Sensitive: contained reader-submitted names/emails/messages.
-- ===========================================================================
DROP POLICY IF EXISTS "Authenticated read contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Authenticated update contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Authenticated delete contact messages" ON contact_messages;

DROP POLICY IF EXISTS "Admin read contact messages" ON contact_messages;
CREATE POLICY "Admin read contact messages" ON contact_messages
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "Admin update contact messages" ON contact_messages;
CREATE POLICY "Admin update contact messages" ON contact_messages
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "Admin delete contact messages" ON contact_messages;
CREATE POLICY "Admin delete contact messages" ON contact_messages
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ===========================================================================
-- popups / ad_banners / youtube_videos  (kept: *_public_read for active rows)
-- ===========================================================================
DROP POLICY IF EXISTS "popups_auth_all" ON popups;
DROP POLICY IF EXISTS "popups_admin_all" ON popups;
CREATE POLICY "popups_admin_all" ON popups
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "ad_banners_auth_all" ON ad_banners;
DROP POLICY IF EXISTS "ad_banners_admin_all" ON ad_banners;
CREATE POLICY "ad_banners_admin_all" ON ad_banners
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "youtube_videos_auth_all" ON youtube_videos;
DROP POLICY IF EXISTS "youtube_videos_admin_all" ON youtube_videos;
CREATE POLICY "youtube_videos_admin_all" ON youtube_videos
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
