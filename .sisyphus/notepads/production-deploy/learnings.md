# Learnings

## [2026-02-19] Session Start — production-deploy

### Stack
- Next.js 16.1.6 + React 19 + TypeScript
- Supabase (DB, Auth, Storage: `press_image` bucket)
- Dev server: port 3001
- Package manager: npm (not bun for install, check package.json scripts)

### Key Files
- Supabase clients: `src/lib/supabase/{client,server,middleware}.ts`
- DB queries: `src/lib/db.ts`
- Auth: `src/contexts/AuthContext.tsx` — `useAuth()` hook, `user.id`
- Admin context: `src/contexts/AdminContext.tsx` — `useAdmin()` hook, authors array
- Sanitize fn: `src/lib/sanitize.ts` — `sanitizeHtml()`
- Auth pattern (API): `src/app/api/email/route.ts:7-17` — createClient → getUser → 401

### NF Mock Data File (CRITICAL)
- `src/lib/nf-mock-data.ts` EXPORTS:
  - `NF_CATEGORIES` — KEEP (used by NfArticleExplorer, NfSubscriptionManager)
  - `NF_CATEGORY_MAP` — KEEP (used by NfArticleExplorer for category mapping)
  - `nfArticles` — DELETE (18 mock articles)
  - `nfConnection` — DELETE (fake API key sk_live_...)
  - `nfSyncLogs` — DELETE (10 mock logs)
- Strategy: Create `src/lib/nf-constants.ts` with KEEP exports, then delete nf-mock-data.ts

### Wave Execution Order
- Wave 1 (parallel): Task 1 + Task 2
- Wave 2 (parallel, after Wave 1): Tasks 3, 4, 5, 6, 7
- Wave 3 (parallel, after Wave 2): Tasks 8, 9, 10, 11, 12
- Wave 4 (sequential): Task 13 → Task 14 → Task 15
- Final (parallel): F1, F2, F3, F4

## [2026-02-19 23:04] Task 1: Vitest setup

### Setup Completed
- Installed vitest v4.0.18 with @testing-library/react, @testing-library/jest-dom, jsdom, @testing-library/user-event
- Created vitest.config.ts with jsdom environment, globals: true, and @/ path alias mapping to src/
- Created src/__tests__/setup.ts with @testing-library/jest-dom import
- Created src/__tests__/smoke.test.ts with basic assertion test
- Updated package.json with "test": "vitest run" and "test:watch": "vitest" scripts
- Added "types": ["vitest/globals"] to tsconfig.json for TypeScript support

### Test Results
- npm run test: 1 test passed, 0 failures
- Duration: 466ms
- All configuration working correctly with Next.js 16 + React 19 + TypeScript

### Key Learnings
- vitest globals: true allows describe/it/expect without imports
- jsdom environment required for DOM testing in Next.js
- Path alias @/ automatically resolved via tsconfig.json paths configuration
- Setup file pattern: import testing-library/jest-dom for DOM matchers

## [2026-02-19 Task 2] nf-constants split

**Completed**: Extract NF_CATEGORIES and NF_CATEGORY_MAP from nf-mock-data.ts into new nf-constants.ts

**Actions taken**:
1. Created `src/lib/nf-constants.ts` with exact exports from nf-mock-data.ts (lines 3-16)
2. Removed both exports from `src/lib/nf-mock-data.ts` (kept nfConnection, nfArticles, nfSyncLogs)
3. Updated imports in 2 components:
   - NfArticleExplorer.tsx: line 7
   - NfSubscriptionManager.tsx: line 5
4. Verified: `npm run build` passed (exit 0, 51 pages generated)
5. Verified: `grep -r "nf-mock-data" src/components/` returned 0 results

**Key findings**:
- NF_CATEGORIES used in 2 places (import + usage in NfArticleExplorer line 96, NfSubscriptionManager line 175)
- NF_CATEGORY_MAP only imported, not directly referenced in components
- Mock data (nfConnection, nfArticles, nfSyncLogs) left untouched for Task 3
- No breaking changes; all imports resolved correctly

**Commit**: `refactor: extract NF constants from mock data file` (a5e0944)

## [2026-02-19] Task 4: XSS fix (dangerouslySetInnerHTML sanitize)

**Completed**: Add `sanitizeHtml()` wrapping to all `dangerouslySetInnerHTML` usages in admin preview components + TDD test

**Actions taken**:
1. Created `src/__tests__/sanitize.test.ts` with 3 tests:
   - removes script tags
   - removes onerror event handlers
   - removes javascript: protocol in href
2. Updated `src/components/admin/ArticlePreview.tsx`:
   - Added import: `import { sanitizeHtml } from "@/lib/sanitize";`
   - Line 115: Changed `dangerouslySetInnerHTML={{ __html: article.content }}` to `dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}`
3. Updated `src/components/admin/nf/NfArticlePreview.tsx`:
   - Added import: `import { sanitizeHtml } from "@/lib/sanitize";`
   - Line 129: Changed `dangerouslySetInnerHTML={{ __html: article.content }}` to `dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}`
4. Verified: `npm run test` passed (4 tests: 1 smoke + 3 sanitize)
5. Verified: `npm run build` passed (51 pages generated)

**Key findings**:
- `src/lib/sanitize.ts` already exists with DOMPurify integration
- Reference pattern: `src/app/(public)/article/[id]/page.tsx:155` already uses sanitizeHtml correctly
- sanitizeHtml() uses DOMPurify with whitelist: p, br, strong, em, u, s, h2-h4, ul, ol, li, a, img, blockquote, pre, code, table, div, span
- Allowed attributes: href, src, alt, title, target, rel, class
- Data attributes disabled (ALLOW_DATA_ATTR: false)

**Commit**: `fix(security): sanitize dangerouslySetInnerHTML in admin previews` (c232ce2)

## [2026-02-19] Task 6: Author ID fix

**Completed**: Replace hardcoded `authorId: "a1"` with logged-in user ID from AuthContext

**Actions taken**:
1. Updated `src/contexts/AuthContext.tsx`:
   - Added `id: string` field to User interface (line 17)
   - Updated `mapUser()` function to include `id: user.id` (line 36)
2. Updated `src/components/admin/nf/NfArticleExplorer.tsx`:
   - Added import: `import { useAuth } from "@/contexts/AuthContext";` (line 6)
   - Added hook call: `const { user } = useAuth();` (line 14)
   - Updated `authors` destructuring in useAdmin hook (line 12)
   - Line 62: Changed `authorId: "a1"` to `authorId: user?.id ?? authors[0]?.id ?? ""`
3. Verified: `grep -n '"a1"' src/components/admin/nf/NfArticleExplorer.tsx` returned 0 results
4. Verified: `npm run build` passed (51 pages generated)

**Key findings**:
- Supabase User object has `id` field (UUID)
- AuthContext now properly exposes user.id for downstream components
- Fallback chain: user?.id (logged-in user) → authors[0]?.id (first author) → "" (empty string)
- No breaking changes; all imports resolved correctly

**Commit**: `fix: use logged-in user ID for NF article publish` (6607cde)

## [2026-02-19] Task 5: NF API auth
- Auth pattern: createClient() → getUser() → 401 if !user
- Import: import { createClient } from "@/lib/supabase/server"
- Applied to: articles GET, connection GET+PUT, deliveries GET, subscriptions GET
- NfSubscriptionManager: test button disabled with "준비 중" label, removed fake handleTestConnection
- Task 3 ran in parallel and simplified routes to return empty data before auth was applied
- Commit picked up extra staged files from Task 3 (newsletter, ShareButtons, Footer cleanup)

## [2026-02-19] Task 3: Mock data removal

- Deleted src/lib/nf-mock-data.ts (308 lines of mock data)
- NF API routes now return empty arrays / disconnected state:
  - articles: `{ articles: [], total: 0 }`
  - connection: `{ status: "disconnected", apiKey: "", lastSync: null, autoSync: false, syncInterval: 60 }`
  - connection PUT: `{ error: "Not configured" }` (503)
  - deliveries: `{ deliveries: [], total: 0 }`
  - subscriptions: `{ status: "disconnected", subscriptions: [] }`
  - subscriptions/[id]: unchanged (already returns 410 Gone)
- picsum.photos removed from next.config.ts remotePatterns
- scripts/setup-supabase.mjs: 18 picsum URLs replaced with "" (authors + articles)
- sk_live_ fake API key removed with the mock data file
- First build attempt failed due to stale Turbopack cache — cleaning .next/ fixed it
- Verification: grep -r for nf-mock-data, picsum.photos, sk_live_ all returned 0 results
- Build: passed (51 pages), Tests: 4 passed (smoke + sanitize)

**Commit**: `chore: remove all mock data and placeholder URLs` (36e9748)

## [2026-02-19] Task 7: Newsletter + Kakao removal
- Footer.tsx: NewsletterSubscribe import and JSX removed (lines 4, 77-81)
- NewsletterSubscribe.tsx: deleted entirely (only used in Footer.tsx)
- src/app/api/newsletter/route.ts: deleted (newsletter dir removed, api/ still has articles/email/nf)
- Kakao share: wrapped with `{process.env.NEXT_PUBLIC_KAKAO_APP_ID && (...)}` conditional render in ShareButtons.tsx
- handleKakaoShare function kept (no dead code issue since it's scoped within the component)
- Changes were committed as part of 1aa00c3 (parallel task overlap with Task 5)
- Verification: grep NewsletterSubscribe → 0 results, build passes, tests pass (4/4)

## [2026-02-19] Task 8: View counter rate limiting
- Cookie: viewed_articles=id1,id2,id3 (comma-separated)
- maxAge: 86400 (24 hours), httpOnly: true, sameSite: lax
- Returns { success: false, message: "Already viewed" } for repeat views
- Empty cookie handled with .filter(Boolean) to avoid [""] from "".split(",")

## [2026-02-19] Task 11: JSON-LD Structured Data
- Added NewsArticle schema to article/[id]/page.tsx
- Uses SITE_NAME, SITE_URL from @/lib/constants
- JSON.stringify is safe for JSON-LD (not user HTML)
- Schema includes: headline, description, image, datePublished, dateModified, author, publisher, mainEntityOfPage
- Placed script tag right after ViewCounter component in article element
## [2026-02-19] Task 10: Security headers
- CSP added: default-src 'self', script-src includes Vercel Analytics domains
- HSTS: max-age=31536000; includeSubDomains; preload
- Permissions-Policy: camera, microphone, geolocation, interest-cohort all disabled
- Supabase domain: erntllkkeczystqsjija.supabase.co (in img-src and connect-src)
- Stale .next/lock required rm -rf .next for clean build

## [2026-02-19] Task 12: Accessibility improvements

**Completed**: Add `type="button"` to all buttons missing it, and add `aria-hidden="true"` to decorative SVGs

**Actions taken**:
1. Found 10 buttons without `type` attribute in admin pages and components:
   - src/components/admin/AdminHeader.tsx:23 (menu toggle)
   - src/components/admin/ArticlePreview.tsx:57 (close button)
   - src/app/admin/news-feed/page.tsx:104 (tab switching)
   - src/app/admin/AdminLayoutClient.tsx:53 (mobile menu)
   - src/components/admin/AdminSidebar.tsx:38 (logout)
   - src/app/admin/articles/page.tsx:109, 112, 163, 165, 203 (bulk delete, clear selection, preview, delete)

2. Added `type="button"` to all 10 buttons (action buttons, not form submit)

3. Added `aria-hidden="true"` to 11 decorative SVG icons:
   - AdminHeader.tsx:24 (menu icon)
   - news-feed/page.tsx:66, 79, 86, 93 (AI badge + 3 stat card icons)
   - AdminLayoutClient.tsx:59 (mobile menu icon)
   - AdminSidebar.tsx:14, 19, 24, 29, 105 (nav icons + logout icon + external link icon)
   - ArticlePreview.tsx:62 (close button icon)

4. Verified: `npm run build` passed (51 pages generated)

**Key findings**:
- All buttons in admin UI are action buttons (type="button"), not form submit buttons
- Decorative SVGs should have aria-hidden="true" to prevent screen readers from announcing them
- SVGs with actual content (like error icons with <title>) should keep the title element
- LSP diagnostics now clean for accessibility issues in modified files

**Commit**: `fix(a11y): add button types and SVG accessibility` (a033f38)

## [2026-02-20] Tasks 13+14: Config cleanup + env example
- next.config.ts: verified picsum removed, CSP present, Supabase domain correct
- .env.example created with all required keys (Supabase, Zoho SMTP, Site URL)
- .gitignore: updated to allow .env.example while ignoring .env.local
- Build passes successfully
- Commit: chore: add .env.example and update .gitignore to allow it
