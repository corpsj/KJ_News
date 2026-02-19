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
