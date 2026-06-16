-- Migration: move the admin role claim from user_metadata to app_metadata.
-- Date: 2026-06-17
--
-- user_metadata is self-editable by the user (auth.updateUser), so a non-admin
-- could grant themselves role=admin. app_metadata is only writable with the
-- service role, so it is the correct place for an authorization claim.
--
-- PREREQUISITE: every admin account must already have app_metadata.role='admin'
-- (set via the service-role admin API) AND must re-login so their JWT carries
-- the new claim. Active sessions with old tokens lose access until token refresh
-- / re-login. Verified before applying.
--
-- Re-runnable (DROP POLICY IF EXISTS before each CREATE). Policy names unchanged;
-- only the claim path changes (user_metadata -> app_metadata).

-- nf_imports
DROP POLICY IF EXISTS "Admin read nf_imports" ON nf_imports;
CREATE POLICY "Admin read nf_imports" ON nf_imports FOR SELECT TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "Admin insert nf_imports" ON nf_imports;
CREATE POLICY "Admin insert nf_imports" ON nf_imports FOR INSERT TO authenticated WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "Admin update nf_imports" ON nf_imports;
CREATE POLICY "Admin update nf_imports" ON nf_imports FOR UPDATE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "Admin delete nf_imports" ON nf_imports;
CREATE POLICY "Admin delete nf_imports" ON nf_imports FOR DELETE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- site_settings
DROP POLICY IF EXISTS "Admin read site_settings" ON site_settings;
CREATE POLICY "Admin read site_settings" ON site_settings FOR SELECT TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "Admin insert site_settings" ON site_settings;
CREATE POLICY "Admin insert site_settings" ON site_settings FOR INSERT TO authenticated WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "Admin update site_settings" ON site_settings;
CREATE POLICY "Admin update site_settings" ON site_settings FOR UPDATE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "Admin delete site_settings" ON site_settings;
CREATE POLICY "Admin delete site_settings" ON site_settings FOR DELETE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- articles
DROP POLICY IF EXISTS "Admin read all articles" ON articles;
CREATE POLICY "Admin read all articles" ON articles FOR SELECT TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "Admin insert articles" ON articles;
CREATE POLICY "Admin insert articles" ON articles FOR INSERT TO authenticated WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "Admin update articles" ON articles;
CREATE POLICY "Admin update articles" ON articles FOR UPDATE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "Admin delete articles" ON articles;
CREATE POLICY "Admin delete articles" ON articles FOR DELETE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- authors
DROP POLICY IF EXISTS "Admin insert authors" ON authors;
CREATE POLICY "Admin insert authors" ON authors FOR INSERT TO authenticated WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "Admin update authors" ON authors;
CREATE POLICY "Admin update authors" ON authors FOR UPDATE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "Admin delete authors" ON authors;
CREATE POLICY "Admin delete authors" ON authors FOR DELETE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- categories
DROP POLICY IF EXISTS "Admin insert categories" ON categories;
CREATE POLICY "Admin insert categories" ON categories FOR INSERT TO authenticated WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "Admin update categories" ON categories;
CREATE POLICY "Admin update categories" ON categories FOR UPDATE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "Admin delete categories" ON categories;
CREATE POLICY "Admin delete categories" ON categories FOR DELETE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- contact_messages
DROP POLICY IF EXISTS "Admin read contact messages" ON contact_messages;
CREATE POLICY "Admin read contact messages" ON contact_messages FOR SELECT TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "Admin update contact messages" ON contact_messages;
CREATE POLICY "Admin update contact messages" ON contact_messages FOR UPDATE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "Admin delete contact messages" ON contact_messages;
CREATE POLICY "Admin delete contact messages" ON contact_messages FOR DELETE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- popups / ad_banners / youtube_videos
DROP POLICY IF EXISTS "popups_admin_all" ON popups;
CREATE POLICY "popups_admin_all" ON popups FOR ALL TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "ad_banners_admin_all" ON ad_banners;
CREATE POLICY "ad_banners_admin_all" ON ad_banners FOR ALL TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "youtube_videos_admin_all" ON youtube_videos;
CREATE POLICY "youtube_videos_admin_all" ON youtube_videos FOR ALL TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
