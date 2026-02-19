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
