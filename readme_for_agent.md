# KJ_News (광전타임즈) — Exhaustive Technical Reference for AI Agents

This document is the single source of truth for the entire KJ_News project. It contains every file path, every function signature, every API endpoint, every database column, every component prop, every conditional branch, and every fallback value. An AI agent reading ONLY this document can immediately continue development with zero exploratory phase.

---

## 1. PROJECT IDENTITY

- **Project Name**: KJ_News
- **Korean Name**: 광전타임즈 (Kwangjeon Times)
- **Production URL**: https://kj-news.vercel.app
- **Domain**: Regional news CMS for Hampyeong County (함평군), Jeollanam-do (전남), South Korea
- **Press Registration**: 전남, 아00607
- **Publisher (발행인)**: 선종인
- **Editor (편집인)**: 장혁훈
- **Address**: 전남 함평군 함평읍 영수길 148 2층
- **Phone**: 010-9428-5361
- **Fax**: 0504-255-5361
- **Email**: jebo@kjtimes.co.kr
- **Business Registration**: 173-91-02454

---

## 2. TECH STACK (EXACT VERSIONS)

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.1.6 | App Router framework |
| React | 19.2.3 | UI library |
| TypeScript | ^5 | Type safety |
| @supabase/ssr | ^0.8.0 | Server-side Supabase client |
| @supabase/supabase-js | ^2.95.3 | Client-side Supabase + service client |
| @tiptap/react | ^3.20.0 | Rich text editor |
| @tiptap/starter-kit | ^3.20.0 | Base editor extensions |
| @tiptap/extension-image | ^3.20.0 | Image insertion |
| @tiptap/extension-link | ^3.20.0 | Hyperlink support |
| @tiptap/extension-placeholder | ^3.20.0 | Placeholder text |
| @tiptap/extension-underline | ^3.20.0 | Underline formatting |
| @tiptap/extension-character-count | ^3.20.0 | Character/word count |
| @tiptap/pm | ^3.20.0 | ProseMirror dependency |
| @vercel/analytics | ^1.6.1 | Production analytics |
| sanitize-html | ^2.17.1 | HTML sanitization |
| tailwindcss | ^4 | Utility-first CSS |
| @tailwindcss/postcss | ^4 | PostCSS plugin for Tailwind |
| vitest | ^4.0.18 | Test runner |
| jsdom | ^28.1.0 | Browser env for tests |
| @testing-library/react | ^16.3.2 | Component testing |
| @testing-library/jest-dom | ^6.9.1 | DOM matchers |
| @testing-library/user-event | ^14.6.1 | User interaction simulation |
| eslint | ^9 | Linting |
| eslint-config-next | 16.1.6 | Next.js ESLint rules |
| pg | ^8.18.0 | PostgreSQL client (scripts only) |

**Font**: Noto Sans KR from Google Fonts, weights: 300, 400, 500, 700, 900, display: swap

**Package.json scripts**:
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

---

## 3. ENVIRONMENT VARIABLES

Defined in `.env.example`. Every variable with exact usage locations:

| Variable | Runtime | Files That Use It | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts` (both functions), `src/lib/supabase/proxy.ts` | Supabase project API endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts` (`createClient()`), `src/lib/supabase/proxy.ts` | Supabase public anon key. Respects RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | `src/lib/supabase/server.ts` (`createServiceClient()` only) | Bypasses RLS entirely. Used for all `db.ts` queries and view count updates. |
| `NEXT_PUBLIC_SITE_URL` | Yes | `src/lib/constants.ts` | Base URL. Falls back to `"https://kj-news.vercel.app"` if unset. Used in metadata, OG images, sitemap, RSS, JSON-LD. |
| `NF_API_URL` | Yes | `src/lib/nf-client.ts` (`getConfig()`) | News Factory API base URL. Only used as fallback if `site_settings` DB table has no `nf_api_url` row. |
| `NF_API_KEY` | Yes | `src/lib/nf-client.ts` (`getConfig()`) | News Factory Bearer token. Only used as fallback if `site_settings` DB table has no `nf_api_key` row. |
| `DATABASE_URL` | No | `scripts/` only | PostgreSQL connection for setup scripts. Not used at Next.js runtime. |
| `ADMIN_PASSWORD` | No | `scripts/` only | Initial admin password for setup. Not used at runtime. |

**Obsolete variables in .env.example** (no longer used, can be removed):
- `ZOHO_SMTP_HOST`, `ZOHO_SMTP_PORT`, `ZOHO_SMTP_USER`, `ZOHO_SMTP_PASS` — Email sending was removed.

---

## 4. COMPLETE FILE TREE WITH LINE COUNTS

```
/
├── .env.example                                    (17 lines)
├── next.config.ts                                  (53 lines)
├── package.json                                    (47 lines)
├── tsconfig.json
├── vitest.config.ts                                (15 lines)
├── readme_for_human.md                             (120 lines)
├── readme_for_agent.md                             (this file)
├── public/
│   └── brand/
│       ├── KJ_sloganLogo.png                       Logo with slogan (headers, login, OG)
│       └── KJ_Logo.png                             Logo only (footers, inverted)
├── scripts/
│   ├── schema.sql                                  (147 lines) Full initial schema
│   └── contact_messages.sql                        (46 lines)  Contact table schema
├── supabase/
│   └── migrations/
│       ├── 20260220000000_nf_tables.sql            (22 lines)  nf_settings + nf_sync_logs (later dropped)
│       ├── 20260220100000_nf_imports.sql            (19 lines)  nf_imports table + drops old NF tables
│       ├── 20260220120000_site_settings.sql         (10 lines)  site_settings table
│       └── 20260220130000_add_press_release_category.sql (5 lines)
└── src/
    ├── __tests__/
    │   └── setup.ts                                (1 line) imports @testing-library/jest-dom
    ├── lib/
    │   ├── constants.ts                            (6 lines)
    │   ├── db.ts                                   (325 lines)
    │   ├── nf-client.ts                            (155 lines)
    │   ├── nf-constants.ts                         (18 lines)
    │   ├── sanitize.ts                             (21 lines)
    │   ├── types.ts                                (78 lines)
    │   ├── utils.ts                                (23 lines)
    │   └── supabase/
    │       ├── client.ts                           (8 lines)
    │       ├── server.ts                           (36 lines)
    │       └── proxy.ts                            (43 lines)
    ├── contexts/
    │   ├── AuthContext.tsx                          (106 lines)
    │   ├── AdminContext.tsx                         (352 lines)
    │   └── ToastContext.tsx                         (64 lines)
    ├── components/
    │   ├── ArticleCard.tsx                         (66 lines)
    │   ├── ArticleCardHorizontal.tsx               (35 lines)
    │   ├── BreakingNewsTicker.tsx                  (36 lines)
    │   ├── CategoryBadge.tsx                       (19 lines)
    │   ├── Pagination.tsx                          (91 lines)
    │   ├── PrintButton.tsx                         (42 lines)
    │   ├── SearchBar.tsx                           (47 lines)
    │   ├── Sidebar.tsx                             (23 lines)
    │   ├── ViewCounter.tsx                         (22 lines)
    │   ├── layout/
    │   │   ├── Header.tsx                          (257 lines)
    │   │   └── Footer.tsx                          (95 lines)
    │   └── admin/
    │       ├── AdminHeader.tsx                     (54 lines)
    │       ├── AdminSidebar.tsx                    (124 lines)
    │       ├── ArticleForm.tsx                     (323 lines)
    │       ├── ArticlePreview.tsx                  (125 lines)
    │       ├── ConfirmDialog.tsx                   (60 lines)
    │       ├── RichTextEditor.tsx                  (284 lines)
    │       ├── StatCard.tsx                        (25 lines)
    │       └── nf/
    │           ├── NfArticleExplorer.tsx           (793 lines)
    │           └── NfDeliveryHistory.tsx           (189 lines)
    └── app/
        ├── layout.tsx                              (62 lines)  Root layout
        ├── globals.css                             (1111 lines)
        ├── opengraph-image.tsx                     (53 lines)  Edge runtime
        ├── sitemap.ts                              (55 lines)
        ├── robots.ts                               (15 lines)
        ├── feed.xml/
        │   └── route.ts                            (54 lines)  RSS 2.0
        ├── (public)/
        │   ├── layout.tsx                          (24 lines)
        │   ├── page.tsx                            (260 lines) Homepage
        │   ├── article/[id]/page.tsx               (232 lines)
        │   ├── category/[slug]/page.tsx            (252 lines)
        │   ├── search/page.tsx                     (90 lines)
        │   └── contact/page.tsx                    (151 lines)
        ├── special/
        │   ├── layout.tsx                          (73 lines)  Standalone layout
        │   ├── page.tsx                            (231 lines)
        │   └── [id]/page.tsx                       (175 lines)
        ├── admin/
        │   ├── layout.tsx                          (10 lines)  Server layout
        │   ├── AdminLayoutClient.tsx               (94 lines)  Client auth wrapper
        │   ├── page.tsx                            (168 lines) Dashboard
        │   ├── login/page.tsx                      (150 lines)
        │   ├── articles/
        │   │   ├── page.tsx                        (264 lines) Article list
        │   │   ├── new/page.tsx                    (12 lines)
        │   │   └── [id]/edit/page.tsx              (31 lines)
        │   ├── news-feed/page.tsx                  (102 lines)
        │   └── settings/page.tsx                   (188 lines)
        └── api/
            ├── contact/route.ts                    (49 lines)
            ├── articles/[id]/view/route.ts         (65 lines)
            ├── admin/
            │   ├── cleanup/route.ts                (51 lines)
            │   └── settings/
            │       ├── route.ts                    (52 lines)
            │       └── test/route.ts               (39 lines)
            └── nf/
                ├── articles/
                │   ├── route.ts                    (32 lines)
                │   └── [id]/route.ts               (26 lines)
                ├── categories/route.ts             (21 lines)
                ├── imports/route.ts                (125 lines)
                └── regions/route.ts                (21 lines)
```

---

## 5. DATABASE SCHEMA (COMPLETE)

### 5.1 Table: `authors`

```sql
CREATE TABLE authors (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar_url TEXT DEFAULT ''
);
```

**RLS**: Enabled. Public read (anon+authenticated). Authenticated insert/update. **No DELETE policy** — the cleanup endpoint uses the service client to bypass this.

### 5.2 Table: `categories`

```sql
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#64748b'
);
```

**RLS**: Public read (anon+authenticated). Authenticated insert/update.

A migration (20260220130000) inserts a default category:
```sql
INSERT INTO categories (name, slug, description, color)
VALUES ('보도자료', 'press_release', '뉴스팩토리 보도자료', '#64748b')
ON CONFLICT (slug) DO NOTHING;
```

### 5.3 Table: `articles`

```sql
CREATE TABLE articles (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  excerpt TEXT DEFAULT '',
  content TEXT DEFAULT '',
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  author_id BIGINT REFERENCES authors(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ DEFAULT now(),
  thumbnail_url TEXT DEFAULT '',
  view_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','pending_review','scheduled','published','archived','rejected')),
  source TEXT DEFAULT '',
  source_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes**:
- `idx_articles_status ON articles(status)`
- `idx_articles_category ON articles(category_id)`
- `idx_articles_published ON articles(published_at DESC)`
- `idx_articles_view_count ON articles(view_count DESC)`

**RLS**:
- Anon: SELECT only WHERE `status = 'published'`
- Authenticated: SELECT all, INSERT, UPDATE, DELETE

**Trigger**: `set_updated_at` — BEFORE UPDATE sets `updated_at = now()` via `update_updated_at_column()` function.

### 5.4 Table: `contact_messages`

```sql
CREATE TABLE contact_messages (
  id BIGSERIAL PRIMARY KEY,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  status TEXT DEFAULT 'unread'
    CHECK (status IN ('unread','read','archived')),
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes**: `idx_contact_messages_status`, `idx_contact_messages_created(DESC)`
**RLS**: Anon INSERT. Authenticated SELECT/UPDATE/DELETE.
**Trigger**: `set_contact_messages_updated_at` — same function as articles.

### 5.5 Table: `nf_imports`

```sql
CREATE TABLE nf_imports (
  id SERIAL PRIMARY KEY,
  nf_article_id UUID NOT NULL UNIQUE,
  local_article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  nf_title TEXT NOT NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  imported_by UUID NOT NULL,
  import_type TEXT NOT NULL CHECK (import_type IN ('imported','published'))
);
```

**Indexes**: `idx_nf_imports_nf_article_id`, `idx_nf_imports_imported_at(DESC)`
**RLS**: Authenticated SELECT/INSERT. No UPDATE/DELETE policy (delete uses cookie-based server client which is authenticated).
**CASCADE**: When a local article is deleted, its `nf_imports` record is automatically deleted.

### 5.6 Table: `site_settings`

```sql
CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**RLS**: Authenticated SELECT/INSERT/UPDATE.
**Currently used keys**: `nf_api_url`, `nf_api_key`

### 5.7 Supabase Storage

**Bucket**: `press_image`
**Policies**:
- Public read: anon+authenticated, WHERE `bucket_id = 'press_image'`
- Authenticated upload/update/delete: WHERE `bucket_id = 'press_image'`

**Upload path convention**: `articles/{timestamp}-{random6chars}.{extension}`

---

## 6. SUPABASE CLIENT ARCHITECTURE

Three distinct client patterns exist. Understanding which to use where is critical.

### 6.1 Browser Client — `src/lib/supabase/client.ts`

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Used by**: AuthContext, AdminContext, Header (auth check), ArticleForm (image upload)
**Respects RLS**: Yes
**Singleton per component**: Each context creates one via `useMemo(() => createClient(), [])`

### 6.2 Server Client (Cookie-based) — `src/lib/supabase/server.ts` `createClient()`

```typescript
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — middleware handles session refresh
          }
        },
      },
    }
  );
}
```

**Used by**: ALL API routes for auth checks (`supabase.auth.getUser()`), nf-client.ts (for config reads)
**Respects RLS**: Yes — operations run as the authenticated user

### 6.3 Service Client (RLS Bypass) — `src/lib/supabase/server.ts` `createServiceClient()`

```typescript
export async function createServiceClient() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
```

**Used by**: ALL functions in `db.ts`, view count API route, cleanup API route
**Respects RLS**: NO — full database access
**Dynamic import**: Uses `await import()` to avoid bundling supabase-js in client code

### 6.4 Proxy Client — `src/lib/supabase/proxy.ts`

Exports `updateSession(request: NextRequest)` for middleware. Creates a server client that reads/writes cookies on the request/response pair. Checks auth and redirects unauthenticated users from `/admin/*` (except `/admin/login`) to `/admin/login`.

**IMPORTANT**: No `middleware.ts` file currently exists. Auth protection is handled client-side by `AuthGate` and server-side by per-route `getUser()` checks. The proxy module is ready but unused.

---

## 7. TYPE SYSTEM — `src/lib/types.ts`

```typescript
export interface Author {
  id: string;        // String-coerced from DB BIGSERIAL
  name: string;
  role: string;
  avatarUrl: string; // camelCase mapped from DB avatar_url
}

export interface Category {
  id: string;        // String-coerced from DB BIGSERIAL
  name: string;
  slug: string;
  description: string;
  color: string;     // Hex color code, default "#64748b"
}

export type ArticleStatus = 'draft' | 'pending_review' | 'scheduled' | 'published' | 'archived' | 'rejected';

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  draft: '임시저장',
  pending_review: '검토중',
  scheduled: '예약됨',
  published: '발행됨',
  archived: '보관됨',
  rejected: '반려됨',
};

export interface Article {
  id: string;           // String-coerced from DB BIGSERIAL
  title: string;
  subtitle: string;     // Empty string if DB null
  excerpt: string;      // Empty string if DB null
  content: string;      // HTML from TipTap editor
  category: Category;   // Joined from categories table
  author: Author;       // Joined from authors table
  publishedAt: string;  // ISO timestamp string
  thumbnailUrl: string; // URL or empty string
  viewCount: number;    // Default 0
  tags: string[];       // Array of tag strings
  status: ArticleStatus;
  source?: string;      // Set for NF-imported articles
  sourceUrl?: string;   // Original NF article URL
  updatedAt?: string;   // ISO timestamp, set by DB trigger
}

// News Factory types
export interface NfArticle {
  id: string;             // UUID from NF system
  title: string;
  summary: string | null;
  content: string;        // Plain text (NOT HTML)
  category: string;       // NF category code (e.g. "press_release")
  source: string;         // Original news source name
  source_url: string;     // Original article URL
  images: string[];       // Array of image URLs
  published_at: string;
  processed_at: string;   // When NF AI processed it
}

export interface NfRegion { code: string; name: string; }
export interface NfCategory { code: string; name: string; }

export interface NfImportRecord {
  id: number;
  nf_article_id: string;    // UUID
  local_article_id: number;
  nf_title: string;
  imported_at: string;
  imported_by: string;       // Supabase user UUID
  import_type: 'imported' | 'published';
}
```

---

## 8. UTILITY LIBRARIES

### 8.1 `src/lib/constants.ts`

```typescript
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kj-news.vercel.app";
export const SITE_NAME = "광전타임즈";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/brand/KJ_sloganLogo.png`;
```

### 8.2 `src/lib/utils.ts`

```typescript
formatDate(dateStr: string): string
```
- Input: ISO date string or empty string
- Output: `"YYYY.MM.DD HH:mm"` format
- Edge cases: returns `"-"` for empty string or invalid date

```typescript
formatDateShort(dateStr: string): string
```
- Output: `"MM.DD"` format
- No validation (assumes valid input)

```typescript
hasImage(url: string | undefined | null): boolean
```
- Returns `true` only if url is truthy AND `url.trim().length > 0`

### 8.3 `src/lib/sanitize.ts`

```typescript
sanitizeHtml(html: string): string
```
Uses `sanitize-html` library with strict whitelist:
- **Allowed tags**: p, br, strong, em, u, s, h2, h3, h4, ul, ol, li, a, img, blockquote, pre, code, table, thead, tbody, tr, th, td, div, span
- **Allowed attributes**: `a[href, target, rel]`, `img[src, alt, title]`, `*[class]`
- **Allowed schemes**: http, https only
- Strips all other tags, attributes, and protocols (including javascript:)

### 8.4 `src/lib/nf-constants.ts`

```typescript
export const NF_TO_KJ_CATEGORY: Record<string, string> = {
  press_release: "press_release",
};

export const NF_CATEGORY_LABELS: Record<string, string> = {
  press_release: "보도자료",
};

export const DEFAULT_NF_CATEGORY_SLUG = "press_release";

export function plainTextToHtml(text: string): string
```
- Splits on `\n\n` (double newline) to create `<p>` elements
- Within paragraphs, replaces `\n` with `<br/>`
- Filters empty paragraphs
- Returns empty string for falsy input

---

## 9. DATA ACCESS LAYER — `src/lib/db.ts`

ALL functions use `createServiceClient()` (bypasses RLS). ALL return empty arrays or null on errors — no exceptions thrown.

### 9.1 Internal Types and Helpers

```typescript
// Private interface matching raw Supabase join response
interface DbArticle {
  id: number;
  title: string;
  subtitle: string;
  excerpt: string;
  content: string;
  category_id: number;
  author_id: number;
  published_at: string;
  thumbnail_url: string;
  view_count: number;
  tags: string[];
  status: string;
  source: string;
  source_url: string;
  created_at: string;
  updated_at: string;
  categories: { id: number; name: string; slug: string; description: string; color: string } | null;
  authors: { id: number; name: string; role: string; avatar_url: string } | null;
}
```

```typescript
function escapeLikeQuery(query: string): string
```
- Escapes `%`, `_`, `\` characters for safe ILIKE queries
- Used only by `searchArticlesPaginated()`

```typescript
function mapArticle(row: DbArticle): Article
```
- Converts numeric IDs to strings via `String()`
- Fallback category when `categories` join is null: `{ id: "0", name: "미분류", slug: "uncategorized", description: "", color: "#64748b" }`
- Fallback author when `authors` join is null: `{ id: "0", name: "알 수 없음", role: "", avatarUrl: "" }`
- `subtitle`, `excerpt`, `content`, `thumbnail_url` default to empty string if null
- `source` and `sourceUrl` default to `undefined` if falsy (not empty string)
- `status` cast via `row.status as Article["status"]`

```typescript
const ARTICLE_SELECT = "*, categories(*), authors(*)";
```

### 9.2 Exported Functions

```typescript
getPublishedArticles(limit: number = 20): Promise<Article[]>
```
- Query: `articles` WHERE `status = 'published'`, ORDER BY `published_at DESC`, LIMIT
- Used by: RSS feed (`feed.xml/route.ts`)

```typescript
getArticleById(id: string): Promise<Article | null>
```
- Parses `id` as integer: `parseInt(id, 10)`
- Query: `articles` WHERE `id = <parsed>`, single result
- Used by: article detail pages, special article pages

```typescript
getArticlesByCategory(slug: string): Promise<Article[]>
```
- Two-step: first resolves category ID from slug, then queries articles
- Returns `[]` if category not found
- Query: `articles` WHERE `category_id = <resolved>` AND `status = 'published'`, ORDER BY `published_at DESC`
- Used by: homepage category sections

```typescript
getMostViewedArticles(limit: number = 5): Promise<Article[]>
```
- Query: `articles` WHERE `status = 'published'`, ORDER BY `view_count DESC`, LIMIT
- Used by: homepage sidebar, article detail sidebar, category page sidebar, special page sidebar

```typescript
getRelatedArticles(article: Article, limit: number = 4): Promise<Article[]>
```
- Resolves category ID from `article.category.slug`
- Query: same category, exclude current article ID, ORDER BY `published_at DESC`, LIMIT
- Used by: article detail page

```typescript
getSpecialEditionArticles(): Promise<Article[]>
```
- Query: ALL `articles` WHERE `status = 'published'`, ORDER BY `published_at DESC` (NO limit)
- Used by: special edition page

```typescript
getSpecialRelatedArticles(article: Article, limit: number = 4): Promise<Article[]>
```
- Two-phase: same category first (excluding current), then other categories if not enough
- Phase 1: same `category_id`, exclude current `id`, ORDER BY `published_at DESC`, LIMIT
- Phase 2 (if `sameCat.length < limit`): different `category_id`, exclude current `id`, LIMIT `(limit - sameCat.length)`
- Returns concatenated `[...sameCat, ...rest]`
- Used by: special article detail page

```typescript
getCategories(): Promise<Category[]>
```
- Query: ALL categories, ORDER BY `id`
- Maps: `{ id: String(c.id), name, slug, description: c.description || "", color: c.color || "#64748b" }`
- Used by: homepage, public layout (Header), special page, dashboard

```typescript
getCategoryBySlug(slug: string): Promise<Category | null>
```
- Query: single category WHERE `slug = <slug>`
- Used by: category page

```typescript
getPublishedArticleIds(): Promise<string[]>
```
- Query: `articles` SELECT `id` WHERE `status = 'published'`
- Returns string array of IDs
- Used by: `generateStaticParams()` in article and special article pages

```typescript
getCategorySlugs(): Promise<string[]>
```
- Query: `categories` SELECT `slug`
- Used by: `generateStaticParams()` in category page

```typescript
getPublishedArticlesPaginated(page: number, perPage: number): Promise<{ articles: Article[]; total: number }>
```
- Calculates range: `from = (page - 1) * perPage`, `to = from + perPage - 1`
- Query: with `{ count: "exact" }` for total
- Used by: homepage (18/page)

```typescript
getArticlesByCategoryPaginated(slug: string, page: number, perPage: number): Promise<{ articles: Article[]; total: number }>
```
- Resolves category ID first, then paginated query
- Used by: category page (15/page)

```typescript
searchArticlesPaginated(query: string, page: number, perPage: number): Promise<{ articles: Article[]; total: number }>
```
- Escapes query for LIKE safety
- Filter: `.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,tags.cs.{${escaped}}`)`
- The `tags.cs` means "contains" — array contains the search term as an element
- Used by: search page (12/page)

---

## 10. NEWS FACTORY CLIENT — `src/lib/nf-client.ts`

### 10.1 Configuration Resolution

```typescript
async function getConfig(): Promise<NfConfig | null>
```
1. Try DB: queries `site_settings` for keys `nf_api_url` and `nf_api_key` using cookie-based server client
2. If both found in DB, return `{ url: <stripped trailing slashes>, key }`
3. If DB read fails (catch block) or insufficient data, fall through
4. Try env: `NF_API_URL` and `NF_API_KEY`
5. If both present, return `{ url: <stripped trailing slashes>, key }`
6. Otherwise return `null`

```typescript
export async function isConfigured(): Promise<boolean>
```
- Returns `(await getConfig()) !== null`

### 10.2 HTTP Client with Retry

```typescript
const MAX_RETRIES = 3;

async function fetchWithRetry(url: string, headers: Record<string, string>): Promise<Response>
```
- Makes fetch with `{ headers, next: { revalidate: 0 } }` (no caching)
- On 429: reads `Retry-After` header (default 60), waits `min(retryAfter * 1000, 60000)` ms, continues loop
- On non-ok non-429: throws immediately with status and body text
- On ok: returns response
- After all retries exhausted: throws last error or "max retries exceeded"

### 10.3 Exported API Functions

All use `requireConfig()` which throws `"NF API not configured"` if config is null. All use Bearer token auth: `{ Authorization: "Bearer ${config.key}" }`.

```typescript
fetchArticles(params: NfFetchArticlesParams = {}): Promise<NfArticlesResponse>
```
- Endpoint: `GET {config.url}/api/v1/articles?{queryString}`
- Params: region, category, keyword, from, to, status (default "all"), limit (default 20), offset (default 0)

```typescript
fetchArticle(id: string): Promise<NfArticleResponse>
```
- Endpoint: `GET {config.url}/api/v1/articles/{encodeURIComponent(id)}`

```typescript
fetchRegions(): Promise<NfRegionsResponse>
```
- Endpoint: `GET {config.url}/api/v1/regions`

```typescript
fetchCategories(): Promise<NfCategoriesResponse>
```
- Endpoint: `GET {config.url}/api/v1/categories`

---

## 11. AUTHENTICATION SYSTEM

### 11.1 Login Flow (Step by Step)

1. User navigates to `/admin/login`
2. Enters **username** (NOT full email) and password
3. `LoginPage` constructs email: `` `${username}@kjtimes.co.kr` ``
4. Calls `login(email, password)` from `useAuth()` hook
5. `AuthContext.login()` calls `supabase.auth.signInWithPassword({ email, password })`
6. On success: sets session + user state, returns `true`
7. `LoginPage` receives `true`, calls `router.push("/")` — redirects to **homepage** (not admin)
8. On failure: returns `false`, LoginPage shows inline error + floating toast (2400ms auto-dismiss)

### 11.2 Session Management

```
AuthProvider (wraps all admin routes)
  ├── On mount: supabase.auth.getSession() → sets session, user, isLoading=false
  ├── Subscribes: supabase.auth.onAuthStateChange() → updates session/user on any change
  └── Cleanup: subscription.unsubscribe() on unmount
```

`mapUser(user: SupabaseUser | null): User | null`:
- Maps Supabase user to app User type
- Name resolution: `user_metadata.name` → `user_metadata.full_name` → `user.email`
- Role: `user_metadata.role` → fallback `"admin"`

### 11.3 Auth Protection Layers

**Client-side** — `AuthGate` component in `AdminLayoutClient.tsx`:
- If `isLoading`: shows spinner (gray-900 border-t spinning circle)
- If `!isAuthenticated && pathname !== "/admin/login"`: redirects to `/admin/login`, renders null
- Otherwise: renders children

**Server-side** — API routes:
```typescript
const supabase = await createClient();  // cookie-based server client
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```
This pattern is used in: settings GET/PUT, settings test, cleanup, all NF API proxy routes, NF imports GET/POST/DELETE.

**Exception**: `/api/contact` and `/api/articles/[id]/view` are NOT auth-protected (public endpoints).

### 11.4 Admin Layout Nesting

```
src/app/admin/layout.tsx (Server Component)
  → AdminLayoutClient (Client Component)
    → AuthProvider
      → AuthGate
        → AdminShell
          ├── if pathname === "/admin/login": renders children directly (no sidebar/header)
          └── else:
              → AdminProvider
                → ToastProvider
                  → AdminSidebar + AdminHeader + <main>{children}</main>
```

### 11.5 Logout

`AuthContext.logout()`:
1. Calls `supabase.auth.signOut()`
2. Sets session=null, user=null
3. Calls `router.push("/admin/login")`

---

## 12. STATE MANAGEMENT (CONTEXTS)

### 12.1 AdminContext — `src/contexts/AdminContext.tsx`

**Note**: AdminContext has its OWN `DbArticle` interface and `mapArticle()` function, duplicated from `db.ts`. The AdminContext version differs slightly: `category_id` and `author_id` are `number | null`, `published_at` is `string | null`. Same mapping logic.

**Initial Data Load** (on mount):
```typescript
Promise.all([
  supabase.from("articles").select("*, categories(*), authors(*)").order("published_at", { ascending: false }),
  supabase.from("categories").select("*").order("id"),
  supabase.from("authors").select("*").order("id"),
])
```
Updates state: `articles`, `categories`, `authors`.

**Exposed via context**:

```typescript
interface AdminContextValue {
  articles: Article[];
  categories: Category[];
  authors: Author[];
  addArticle: (data: ArticleFormData) => Promise<Article | null>;
  updateArticle: (id: string, data: ArticleFormData) => Promise<Article | null>;
  updateArticleStatus: (id: string, status: ArticleStatus) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  getArticle: (id: string) => Article | undefined;
  importArticle: (data: ImportArticleData) => Promise<Article | null>;
}
```

```typescript
export interface ArticleFormData {
  title: string;
  subtitle: string;
  excerpt: string;
  content: string;
  categorySlug: string;
  authorId: string;
  thumbnailUrl: string;
  tags: string;         // Comma-separated string, split on save
  status?: ArticleStatus;
}

export interface ImportArticleData {
  title: string;
  content: string;
  excerpt: string;
  categorySlug: string;
  source?: string;
  sourceUrl?: string;
}
```

#### `addArticle(data)` — Full Logic:
1. Resolve category by slug from local categories array. Fallback: `categories[0]`
2. Resolve author by ID from local authors array. Fallback: `authors[0]`
3. If neither found, log error and return null
4. Determine status: `data.status || "draft"`
5. Set `published_at`: if status is "published" → `new Date().toISOString()`, else `null`
6. Split tags: `data.tags.split(",").map(t => t.trim()).filter(Boolean)`
7. Insert via Supabase, select with joins
8. Map result and prepend to local articles state
9. Return mapped article or null on error

#### `updateArticle(id, data)` — Full Logic:
1. Find existing article in local state by ID
2. Resolve category/author (fallback to existing values if not found)
3. Determine status: `data.status || existing.status`
4. **published_at logic**: If status is "published" AND existing status was NOT "published" → set to `new Date().toISOString()`. Otherwise preserve `existing.publishedAt || null`.
5. Update via Supabase, replace in local state

#### `updateArticleStatus(id, status)` — Same published_at logic as updateArticle but only updates status and published_at fields.

#### `deleteArticle(id)`:
1. Delete from Supabase: `.delete().eq("id", Number(id))`
2. Filter from local state

#### `importArticle(data)` — Full Logic:
1. Resolve category by slug. Fallback: `categories[0]`
2. Author: always `authors[0]` (first author)
3. If neither found, return null
4. **Auto-excerpt**: if `data.excerpt` is empty → strip HTML: `data.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 160)`
5. Insert with: subtitle="", thumbnail_url="", tags=[], **status="pending_review"**, published_at=null
6. Prepend to local state

#### `getArticle(id)` — Simple find: `articles.find(a => a.id === id)`

### 12.2 ToastContext — `src/contexts/ToastContext.tsx`

```typescript
interface Toast {
  id: string;         // String(Date.now())
  message: string;
  type: "success" | "error" | "info";
  leaving?: boolean;
}
```

**Timing**:
1. Toast added → displayed immediately with `animate-toast-in`
2. After 2800ms → `leaving: true` set → `animate-toast-out` plays
3. After 200ms more → toast removed from array

**Rendering**: Fixed position `bottom-5 right-5 z-[100]`, flex column gap-2, pointer-events-none container.
All toast types have identical styling: white bg, gray-200 border, gray-900 text. Success has checkmark SVG, error has X SVG.

---

## 13. API ROUTES (COMPLETE)

### 13.1 `POST /api/contact`

**File**: `src/app/api/contact/route.ts`
**Auth**: None (public)
**Request body**:
```json
{ "senderName": string, "senderEmail": string, "subject": string, "body": string }
```
**Validation**:
- `senderName`, `senderEmail`, `body` required (400 if missing)
- Email regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` (400 if invalid)

**Success response**: `{ "success": true }` (200)
**Error responses**: 400 (validation), 500 (DB error)
**DB operation**: INSERT into `contact_messages` using cookie-based server client

### 13.2 `POST /api/articles/[id]/view`

**File**: `src/app/api/articles/[id]/view/route.ts`
**Auth**: None (public)
**Request body**: None (empty POST)
**Logic**:
1. Parse article ID as integer. Return 400 if NaN.
2. Read `viewed_articles` cookie (httpOnly). Parse as comma-separated list.
3. If article ID already in list → return `{ success: false, message: "Already viewed" }` (200)
4. Fetch article's current `view_count` via service client
5. If article not found → return 404
6. Update `view_count` to `current + 1`
7. Append article ID to cookie value
8. Set response cookie: `viewed_articles`, maxAge=86400 (24h), httpOnly=true, sameSite=lax, path=/
9. Return `{ success: true, viewCount: <new count> }`

### 13.3 `GET /api/admin/settings`

**File**: `src/app/api/admin/settings/route.ts`
**Auth**: Required (401 if no user)
**Response**:
```json
{ "settings": { "nf_api_url": string, "nf_api_key": string } }
```
Keys may be missing if not yet configured.

### 13.4 `PUT /api/admin/settings`

**File**: `src/app/api/admin/settings/route.ts`
**Auth**: Required
**Request body**: `{ "nf_api_url"?: string, "nf_api_key"?: string }`
**Whitelist**: Only keys `"nf_api_url"` and `"nf_api_key"` are accepted. Others silently ignored.
**Action**: Upserts each key in `site_settings` with `onConflict: "key"`, sets `updated_at`
**Response**: `{ "success": true }` (200) or 400/500

### 13.5 `POST /api/admin/settings/test`

**File**: `src/app/api/admin/settings/test/route.ts`
**Auth**: Required
**Request body**: `{ "url": string, "key": string }`
**Action**: Calls `{url}/api/v1/categories` with Bearer auth
**Success response**: `{ "ok": true, "message": "연결 성공 — 카테고리 N개 확인" }`
**Failure response**: `{ "ok": false, "message": "연결 실패 (status): body..." }`

### 13.6 `POST /api/admin/cleanup`

**File**: `src/app/api/admin/cleanup/route.ts`
**Auth**: Required + custom header
**Required header**: `x-confirm-cleanup: DELETE_ALL_DATA` (exact string match)
**Action** (uses service client):
1. DELETE all from `articles` WHERE `id != 0` (effectively all rows)
2. DELETE all from `authors` WHERE `id != 0`
**Response**: `{ "success": true, "deleted": { "articles": N, "authors": N } }`
**WARNING**: This is destructive and irreversible.

### 13.7 `GET /api/nf/articles`

**File**: `src/app/api/nf/articles/route.ts`
**Auth**: Required
**Proxies to**: `nf-client.ts fetchArticles()` with query params forwarded
**If NF not configured**: returns `{ articles: [], total: 0, limit: 20, offset: 0 }`
**Error**: 502 with error message

### 13.8 `GET /api/nf/articles/[id]`

**File**: `src/app/api/nf/articles/[id]/route.ts`
**Auth**: Required
**Proxies to**: `nf-client.ts fetchArticle(id)`
**Error**: 404 if NF returns 404, otherwise 502

### 13.9 `GET /api/nf/regions`

**File**: `src/app/api/nf/regions/route.ts`
**Auth**: Required
**Proxies to**: `nf-client.ts fetchRegions()`
**If not configured**: returns `{ regions: [] }`

### 13.10 `GET /api/nf/categories`

**File**: `src/app/api/nf/categories/route.ts`
**Auth**: Required
**Proxies to**: `nf-client.ts fetchCategories()`
**If not configured**: returns `{ categories: [] }`

### 13.11 `GET /api/nf/imports`

**File**: `src/app/api/nf/imports/route.ts`
**Auth**: Required
**Two modes**:
- With `?nf_ids=id1,id2,...`: returns `{ imports: [{ nf_article_id, import_type, local_article_id }] }` — used to populate imported-status badges in NF explorer
- Without `nf_ids`: returns paginated history `{ imports: [...NfImportRecord], total: N }` with `limit` and `offset` params

### 13.12 `POST /api/nf/imports`

**Auth**: Required
**Request body**:
```json
{ "nf_article_id": string, "local_article_id": number, "nf_title": string, "import_type": string }
```
**Action**: INSERT into `nf_imports` with `imported_by: user.id`
**Duplicate handling**: Supabase error code `23505` (unique violation on `nf_article_id`) → returns 409 `{ error: "Article already imported" }`
**Success**: 201 with created record

### 13.13 `DELETE /api/nf/imports`

**Auth**: Required
**Request body**: `{ "nf_article_ids": string[] }`
**Action** (cascading delete):
1. Fetch `local_article_id` values from `nf_imports` for the given NF IDs
2. DELETE from `articles` WHERE `id IN (local_article_ids)` — this cascades to delete `nf_imports` records too via FK ON DELETE CASCADE
3. Also explicitly DELETE from `nf_imports` WHERE `nf_article_id IN (...)` as safety measure
**Response**: `{ "deleted": N }`

---

## 14. PAGE-BY-PAGE DOCUMENTATION

### 14.1 Root Layout — `src/app/layout.tsx`
- HTML lang="ko"
- Body class: `${notoSansKR.className} bg-gray-50 antialiased`
- Includes `<Analytics />` from `@vercel/analytics/react`
- Metadata: title template `"%s - 광전타임즈"`, default `"광전타임즈"`
- Open Graph: type website, locale ko_KR
- Twitter: summary_large_image
- RSS alternate link: `${SITE_URL}/feed.xml`

### 14.2 Public Layout — `src/app/(public)/layout.tsx`
- Fetches categories via `getCategories()` (server component)
- Renders: skip-link → Header (with categories) → main#main-content → Footer
- Skip link: `<a href="#main-content" className="sr-only focus:not-sr-only ...">본문으로 바로가기</a>`

### 14.3 Homepage — `src/app/(public)/page.tsx`
**Revalidate**: 60 seconds

**Data fetching** (parallel):
```typescript
const [{ articles: latestArticles, total }, mostViewed, categories] = await Promise.all([
  getPublishedArticlesPaginated(page, 18),
  getMostViewedArticles(5),
  getCategories(),
]);
```

**Layout algorithm**:
1. Filter articles with thumbnails: `latestArticles.filter(a => hasImage(a.thumbnailUrl))`
2. `heroArticle` = first with image
3. `subImageArticles` = next 2 with images
4. `textArticles` = all articles excluding hero + sub-image articles
5. Category sections: `categories.slice(0, 6)`, fetch each via `getArticlesByCategory()`, display 4 articles per category
6. If `textArticles.length > 7`: show remaining in "최신 기사" section below categories

**Sections rendered**:
- Breaking News Ticker (top 5 articles)
- Empty state (if no articles)
- Hero section (3-column grid: hero | headlines | sub-images)
- Category grid (2-column, up to 6 categories x 4 articles)
- Latest articles overflow section
- Most viewed sidebar (sticky, right column)
- Pagination

### 14.4 Article Detail — `src/app/(public)/article/[id]/page.tsx`
**Revalidate**: 3600 seconds (1 hour)
**Static generation**: `generateStaticParams()` from `getPublishedArticleIds()`

**Metadata**: Full OG (article type, images, publishedTime, modifiedTime, authors, section, tags) + Twitter card

**Page content**:
- Breadcrumb: 홈 > {category.name}
- ViewCounter (invisible, fires POST on mount)
- JSON-LD structured data (NewsArticle schema with publisher, author, dates, images)
- Category badge, title, subtitle
- Author info: `{name} {role || " 기자"}` | 입력 {date} | 수정 {date if different}
- PrintButton (with font size controls)
- Horizontal rule (2px gray-900)
- Thumbnail figure with figcaption
- Article body: `.article-body.prose.max-w-none` with `dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}`
- Tags section: links to `/search?q={tag}`
- Related articles (up to 4, ArticleCard grid)
- Sidebar: most viewed (sticky, hidden on mobile and print)

### 14.5 Category Page — `src/app/(public)/category/[slug]/page.tsx`
**Revalidate**: 60 seconds
**Static generation**: `generateStaticParams()` from `getCategorySlugs()`
**Per page**: 15 articles

**Layout**:
- Breadcrumb: 홈 / {category.name}
- Category header with description
- Hero: first article with image (or first article if none have images) — 2-column layout with image and text
- Rest: vertical list with thumbnail on right
- Most viewed sidebar
- Pagination

### 14.6 Search Page — `src/app/(public)/search/page.tsx`
**Dynamic**: `export const dynamic = "force-dynamic"` (no caching)
**Per page**: 12 articles

- SearchBar with default value from URL
- Result count display
- Empty state with search icon
- 3-column ArticleCard grid
- Pagination with search params preserved

### 14.7 Contact Page — `src/app/(public)/contact/page.tsx`
**Client component** ("use client")

**Form fields**: name (required), email (required), subject (optional), body (required, textarea 6 rows)
**Submit**: POST to `/api/contact` with JSON body
**On success**: replaces entire page with green success message + home link
**On error**: shows red error text above form

### 14.8 Special Edition — `src/app/special/`

**Layout** (`layout.tsx`): Standalone — does NOT use public layout. Has its own:
- Header: centered logo + "창간특별호" badge
- Footer: company info, registration, contact details

**Special Page** (`page.tsx`): Same layout logic as homepage but:
- All links go to `/special/{id}` instead of `/article/{id}`
- No pagination (loads all published articles)
- Category sections filter from `allArticles` in memory instead of separate DB calls
- "더보기" links NOT shown (no category detail page for special)
- "더 많은 기사" section instead of "최신 기사"

**Special Article** (`[id]/page.tsx`):
- Revalidate: 3600
- Uses `getSpecialRelatedArticles()` (fills from other categories)
- Back link → `/special`
- Author avatar with fallback initial circle
- Tags as rounded-full badges (not clickable to search)
- Related articles link to `/special/{id}`
- NO ViewCounter, NO PrintButton, NO Sidebar, NO JSON-LD

### 14.9 Admin Dashboard — `src/app/admin/page.tsx`
**Client component**

**Stats cards** (from AdminContext data):
- Total articles count
- Today's articles: `articles.filter(a => a.publishedAt.slice(0,10) === today)`
- Total views: `articles.reduce((sum, a) => sum + a.viewCount, 0)`
- Pending review: `articles.filter(a => a.status === "pending_review")`

**Sections**:
- Status breakdown badges (all 6 statuses with counts)
- Empty state CTA (if no articles)
- Recent articles list (top 5 by publishedAt)
- Category distribution bar chart (horizontal bars proportional to max)
- Top 5 by view count

### 14.10 Admin Login — `src/app/admin/login/page.tsx`
**Client component**

- Username input (autocomplete="username")
- Password input (autocomplete="current-password")
- Email construction: `` `${username}@kjtimes.co.kr` ``
- On success: `router.push("/")`
- On failure: inline error box + floating toast (2400ms, auto-dismiss via `setTimeout`)
- Back button: `router.back()`
- Footer links: 홈으로, (c) 2026 광전타임즈

### 14.11 Admin Articles List — `src/app/admin/articles/page.tsx`
**Client component**

**Filters**: text search (title), category dropdown, status dropdown
**Selection**: checkbox per row + select all + bulk delete
**Table columns** (desktop): checkbox, title (link to edit), category badge, status badge, author, date, view count, actions (preview/edit/delete)
**Mobile**: card layout with condensed info
**Dialogs**: ArticlePreview modal, ConfirmDialog for delete

### 14.12 Admin Article New — `src/app/admin/articles/new/page.tsx`
Simply renders `<ArticleForm />` without article prop.

### 14.13 Admin Article Edit — `src/app/admin/articles/[id]/edit/page.tsx`
Uses `useParams()` to get ID, `useAdmin().getArticle(id)` to find article.
If not found: shows "기사를 찾을 수 없습니다." with link back.
Otherwise renders `<ArticleForm article={article} />`.

### 14.14 Admin News Feed — `src/app/admin/news-feed/page.tsx`
**Tabs**: "기사 탐색" (NfArticleExplorer) | "가져오기 이력" (NfImportHistory)
**Tab switching**: supports touch swipe (dx > 50, dy < 30)
**Stats header**: fetches article count and import count on mount from `/api/nf/articles?limit=1` and `/api/nf/imports?limit=1`

### 14.15 Admin Settings — `src/app/admin/settings/page.tsx`
**Client component**

**Fields**: NF API URL (text), NF API Key (password with show/hide toggle)
**Actions**: "연결 테스트" (POST to /api/admin/settings/test) and "저장" (PUT to /api/admin/settings)
**Dirty detection**: compares current values to saved values
**Key masking**: shows first 6 + "••••••••" + last 4 characters

---

## 15. COMPONENT REFERENCE

### 15.1 `ArticleCard` — `src/components/ArticleCard.tsx`

**Props**: `{ article: Article }`
**Behavior**: Two render modes:
- **With image**: card with 16:10 aspect image, category badge, title (2-line clamp), excerpt (2-line clamp), author + date footer
- **Without image**: card with gray-900 top border (1px), title (3-line clamp), excerpt (3-line clamp), author + date footer
**Link**: `/article/{article.id}`

### 15.2 `ArticleCardHorizontal` — `src/components/ArticleCardHorizontal.tsx`

**Props**: `{ article: Article; rank?: number }`
**Behavior**: Compact horizontal row with optional rank number. Ranks 1-3 are bold gray-900, 4+ are gray-400. Uses circled number characters (①②③...).
**Link**: `/article/{article.id}`

### 15.3 `BreakingNewsTicker` — `src/components/BreakingNewsTicker.tsx`

**Props**: `{ articles: Article[] }`
**Behavior**: Dark bar (gray-900 bg) with "속보" label (red-600), horizontally scrolling article titles. Articles are **duplicated** (`[...articles, ...articles]`) for seamless infinite scroll via CSS `animate-ticker` (40s linear infinite).
**Returns null** if articles array is empty.

### 15.4 `CategoryBadge` — `src/components/CategoryBadge.tsx`

**Props**: `{ category: Category; size?: "sm" | "md" }`
**Behavior**: Inline span with bg-gray-900 text-white. Size "sm": px-2 py-0.5 text-xs. Size "md": px-3 py-1 text-sm. Default "sm".
**Note**: Does NOT use `category.color` — always gray-900 background.

### 15.5 `Pagination` — `src/components/Pagination.tsx`

**Props**: `{ currentPage: number; totalPages: number; basePath: string; searchParams?: Record<string, string> }`
**Returns null** if `totalPages <= 1`.
**Ellipsis logic**: If totalPages <= 7, show all. Otherwise: page 1, ...(if current > 3), current-1/current/current+1, ...(if current < totalPages-2), last page.
**URL building**: `${basePath}?${new URLSearchParams({ ...searchParams, page: String(page) })}`

### 15.6 `PrintButton` — `src/components/PrintButton.tsx`

**Client component**
**Behavior**: "인쇄" link triggers `window.print()`. Font size +/- buttons target `[data-article-body]` element, adjust font between 14px and 24px in 2px steps.
**Hidden in print**: has `data-print-hide` attribute.

### 15.7 `SearchBar` — `src/components/SearchBar.tsx`

**Props**: `{ defaultValue?: string }`
**Behavior**: Controlled input. On form submit, navigates to `/search?q={encodeURIComponent(query.trim())}`. Ignores empty/whitespace-only queries.

### 15.8 `Sidebar` — `src/components/Sidebar.tsx`

**Props**: `{ articles: Article[] }`
**Renders**: Ranked list via `ArticleCardHorizontal` with rank numbers.

### 15.9 `ViewCounter` — `src/components/ViewCounter.tsx`

**Props**: `{ articleId: string }`
**Client component** — renders null (invisible)
**Behavior**: On mount, fires `POST /api/articles/${articleId}/view`. Uses `useRef(false)` to prevent double-fire in React StrictMode.

### 15.10 `Header` — `src/components/layout/Header.tsx`

**Props**: `{ categories: Category[] }`
**Client component**
**Features**:
- Date display: Korean format "YYYY년 M월 D일 X요일" via `getTodayKorean()`
- Admin detection: checks `supabase.auth.getSession()` on mount, subscribes to auth state changes. Shows "관리자" link if logged in, "로그인" link if not.
- Desktop: search bar (w-64), dark nav bar (gray-900) with "창간특별호" first + all categories
- Mobile: hamburger menu (left slide-out 280px, 80vw max), search toggle, backdrop overlay
- Body scroll lock: adds/removes `menu-open` class on body when mobile menu toggles

### 15.11 `Footer` — `src/components/layout/Footer.tsx`

**Server component** — fetches categories via `getCategories()`
**Content**: Brand logo (inverted), address, category links (first 4 + remaining), company info (registration, publisher, editor, phone, fax, email, business reg), terms/privacy/ad inquiry links.

### 15.12 `AdminSidebar` — `src/components/admin/AdminSidebar.tsx`

**Props**: `{ onMobileClose?: () => void }`
**Navigation structure**:
```
콘텐츠:
  대시보드      /admin             (exact match)
  기사 관리     /admin/articles    (prefix match)
  기사 작성     /admin/articles/new (prefix match)
  뉴스팩토리    /admin/news-feed   (prefix match)
시스템:
  설정          /admin/settings    (prefix match)
---
사이트 보기     / (external)
로그아웃       (calls auth.logout())
```

**Active detection**: Collects all hrefs, filters by pathname match (exact for `/admin`, prefix for others), picks longest match.

### 15.13 `AdminHeader` — `src/components/admin/AdminHeader.tsx`

**Breadcrumb mapping**:
```typescript
{
  "/admin": [{ label: "대시보드" }],
  "/admin/articles": [{ label: "기사 관리" }],
  "/admin/articles/new": [{ label: "기사 관리", href: "/admin/articles" }, { label: "새 기사 작성" }],
  "/admin/news-feed": [{ label: "뉴스 피드" }],
}
```
Edit page (`/admin/articles/{id}/edit`) detected via regex `/^\/admin\/articles\/.+\/edit$/`.
Shows user avatar circle (first letter of email, uppercase) with email tooltip.

### 15.14 `ArticleForm` — `src/components/admin/ArticleForm.tsx`

**Props**: `{ article?: Article }` — if present, edit mode; if absent, create mode.

**Autosave**:
- Key: `article-form-{article.id || "new"}`
- Interval: every 10 seconds via `setInterval`
- On mount (new only): checks localStorage for existing key, parses JSON, shows restore/discard banner
- On successful submit: removes localStorage key

**Thumbnail auto-extraction**:
```typescript
function extractFirstImageUrl(html: string): string {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/);
  return match?.[1] ?? "";
}
```
Runs on `content` change via `useEffect`. Updates `thumbnailUrl` only if it differs from current.

**Default selection**: Auto-sets `categorySlug` to `categories[0].slug` and `authorId` to `authors[0].id` if empty.

**Submit buttons**: "임시저장" (draft), "검토 요청" (pending_review), "바로 발행" (published)
**Validation**: Title and content required. Shows toast error if empty.
**After submit**: navigate to `/admin/articles`

**Image upload**:
```typescript
async function handleEditorImageUpload(file: File): Promise<string | null> {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const filePath = `articles/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  // Upload to "press_image" bucket, return public URL
}
```

### 15.15 `RichTextEditor` — `src/components/admin/RichTextEditor.tsx`

**Props**: `{ value: string; onChange: (html: string) => void; placeholder?: string; onImageUpload?: (file: File) => Promise<string | null> }`

**TipTap configuration**:
```typescript
extensions: [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    link: false,      // Disabled in StarterKit, uses separate LinkExtension
    underline: false,  // Disabled in StarterKit, uses separate Underline
  }),
  Underline,
  ImageExtension,
  LinkExtension.configure({ openOnClick: false }),
  Placeholder.configure({ placeholder }),
  CharacterCount,
]
```

**Toolbar items**: Bold, Italic, Underline, Strikethrough | H2, H3 | Blockquote, Code | Bullet list, Ordered list | Horizontal rule, Link, Image | Undo, Redo

**Image insertion**: Two methods:
1. URL input: text field appears below toolbar, enter key or "삽입" button inserts
2. File upload: hidden file input, accepts image/*, calls `onImageUpload` callback

**Link insertion**: Shows URL input with "적용" (apply) and "링크 제거" (remove) buttons. Toggles on/off.

**Character count**: Displayed below editor: "{N}자" and "{N}단어"

**External value sync**: Uses `isInternalChange` ref to prevent feedback loops when parent updates value.

### 15.16 `ArticlePreview` — `src/components/admin/ArticlePreview.tsx`

**Props**: `{ article: { title, subtitle?, excerpt?, content, category?, author?, publishedAt?, thumbnailUrl?, status?, source? }; onClose: () => void }`
**Behavior**: Full-screen modal (mobile) / centered dialog (desktop, max-w-2xl). Body scroll locked. Escape key closes. Content rendered via `sanitizeHtml()`.

### 15.17 `ConfirmDialog` — `src/components/admin/ConfirmDialog.tsx`

**Props**: `{ title, message, confirmLabel="확인", cancelLabel="취소", onConfirm, onCancel }`
**Behavior**: Modal with backdrop blur. Escape key triggers cancel. Body scroll locked. ARIA alertdialog role.

### 15.18 `StatCard` — `src/components/admin/StatCard.tsx`

**Props**: `{ label: string; value: string | number; icon: ReactNode; sub?: string }`
**Behavior**: Dashboard metric card with icon, large value, label, optional subtitle.

### 15.19 `NfArticleExplorer` — `src/components/admin/nf/NfArticleExplorer.tsx` (793 lines)

Split-view UI with list panel (left) and detail panel (right).

**Filtering**: Region dropdown, category chips, keyword search (Enter key or button), date presets (today/3days/week/month — toggleable), custom date range inputs.

**Date presets**: Toggle behavior — clicking active preset deactivates it (clears dates).

**Article grouping**: By date with Korean labels: "YYYY년 M월 D일 (X)" with weekday.

**Selection system**:
- Individual checkbox per article
- Date group checkbox (selects/deselects all in that date)
- Page-wide checkbox
- Batch toolbar appears when `selectedIds.size > 0`

**Batch operations**:
- "일괄 가져오기": imports as pending_review, shows progress counter
- "일괄 발행": imports as published, shows progress counter
- "선택 삭제": only for already-imported articles, shows ConfirmDialog

**Import flow** (`handleImport`):
1. Resolve KJ category from NF category via `NF_TO_KJ_CATEGORY` mapping (fallback: `DEFAULT_NF_CATEGORY_SLUG`)
2. Call `AdminContext.importArticle()` with content converted via `plainTextToHtml()`
3. POST to `/api/nf/imports` to create tracking record
4. Update local `importedMap`

**Publish flow** (`handlePublish`):
1. Same category resolution
2. Call `AdminContext.addArticle()` with status="published", first author, first NF image as thumbnail
3. POST to `/api/nf/imports` with import_type="published"

**Detail panel**: Shows article image (with gradient overlay + badges), title, summary (left-bordered), full content (via `plainTextToHtml()`), source URL link. Import/publish buttons in top bar.

**Mobile**: Detail panel has `mobile-open` class for right-slide animation. Back button returns to list.

### 15.20 `NfDeliveryHistory` — `src/components/admin/nf/NfDeliveryHistory.tsx`

**Per page**: 20 records
**Fetches**: GET `/api/nf/imports?limit=20&offset=N`
**Desktop**: Table with columns: title (link to `/admin/articles/{localId}`), imported_at, import_type badge
**Mobile**: Card layout
**Pagination**: Previous/Next buttons with page counter

---

## 16. SEO AND FEEDS

### 16.1 Sitemap — `src/app/sitemap.ts`

Generates entries for:
- `/` — priority 1, hourly
- `/special` — priority 0.9, daily
- `/terms` — priority 0.3, monthly
- `/privacy` — priority 0.3, monthly
- All published articles: `/article/{id}` — priority 0.8, daily, lastModified from `updated_at`
- All categories: `/category/{slug}` — priority 0.7, daily

### 16.2 Robots — `src/app/robots.ts`

- Allow: `/`
- Disallow: `/admin`
- Sitemap: `${SITE_URL}/sitemap.xml`

### 16.3 RSS Feed — `src/app/feed.xml/route.ts`

- Format: RSS 2.0 with Atom self-link
- Content: Latest 20 published articles via `getPublishedArticles(20)`
- Cache: `Cache-Control: s-maxage=3600, stale-while-revalidate`
- XML escaping: `escapeXml()` handles &, <, >, ", '
- CDATA wrapping for title, description, category

### 16.4 OG Image — `src/app/opengraph-image.tsx`

- Runtime: Edge
- Size: 1200x630 PNG
- Content: White background, logo image (480x270), decorative gradient line (#1B3764 to #8B2332), "KWANGJEON TIMES" text

---

## 17. SECURITY CONFIGURATION

### 17.1 Security Headers — `next.config.ts`

Applied to all routes (`/(.*)`):
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`
- `Content-Security-Policy`:
  - `default-src 'self'`
  - `script-src 'self' 'unsafe-inline' 'unsafe-eval' va.vercel-scripts.com vitals.vercel-insights.com`
  - `style-src 'self' 'unsafe-inline' fonts.googleapis.com`
  - `font-src 'self' fonts.gstatic.com`
  - `img-src 'self' erntllkkeczystqsjija.supabase.co *.go.kr data: blob:`
  - `connect-src 'self' erntllkkeczystqsjija.supabase.co vitals.vercel-insights.com wss://erntllkkeczystqsjija.supabase.co`
  - `frame-ancestors 'none'`
  - `base-uri 'self'`
  - `form-action 'self'`

### 17.2 Image Remote Patterns — `next.config.ts`

```typescript
images: {
  remotePatterns: [
    { protocol: "https", hostname: "erntllkkeczystqsjija.supabase.co" },
    { protocol: "https", hostname: "**.go.kr" },
  ],
}
```

---

## 18. CSS ARCHITECTURE — `src/app/globals.css` (1111 lines)

### 18.1 Tailwind v4 Setup

```css
@import "tailwindcss";

@theme inline {
  /* Custom theme variables defined here */
}
```

### 18.2 Custom Animations

| Class | Animation | Duration | Timing |
|---|---|---|---|
| `.animate-ticker` | translateX(0) → translateX(-50%) | 40s | linear infinite |
| `.animate-fade-in` | opacity 0→1 | 300ms | ease |
| `.animate-slide-in` | translateY(20px)+opacity 0 → normal | 400ms | ease |
| `.animate-toast-in` | translateX(100%)+opacity 0 → normal | 300ms | ease |
| `.animate-toast-out` | normal → translateX(100%)+opacity 0 | 200ms | ease |
| `.animate-slide-up` | translateY(10px)+opacity 0 → normal | 300ms | ease |
| `.animate-slide-down` | normal → translateY(10px)+opacity 0 | 200ms | ease |
| `.animate-slide-in-right` | translateX(100%) → translateX(0) | 300ms | ease |
| `.animate-slide-out-right` | translateX(0) → translateX(100%) | 200ms | ease |
| `.animate-fade-backdrop` | opacity 0 → 1 | 200ms | ease |

### 18.3 Admin UI Classes

| Class | Purpose |
|---|---|
| `.admin-card` | White bg, rounded-xl, border gray-100, shadow-sm |
| `.admin-input` | Full-width input, px-3, py-2, border, rounded-lg, text-sm, focus:ring-2 gray-900 |
| `.admin-btn` | Inline-flex, items-center, gap-1.5, rounded-lg, font-medium, text-[13px], transition |
| `.admin-btn-primary` | bg-gray-900, text-white, hover:bg-gray-800 |
| `.admin-btn-ghost` | bg-transparent, text-gray-600, hover:bg-gray-100 |
| `.admin-btn-danger` | bg-red-50, text-red-600, hover:bg-red-100 |
| `.admin-badge` | px-2, py-0.5, text-[11px], font-medium, bg-gray-100, text-gray-700, rounded |
| `.admin-badge-draft` | bg-gray-100, text-gray-500 |
| `.admin-badge-pending_review` | bg-yellow-50, text-yellow-700 |
| `.admin-badge-published` | bg-green-50, text-green-700 |
| `.admin-badge-archived` | bg-gray-100, text-gray-400 |
| `.admin-badge-rejected` | bg-red-50, text-red-600 |
| `.admin-badge-scheduled` | bg-blue-50, text-blue-600 |
| `.admin-editor` | min-h-[400px], border, rounded-b-lg, overflow-y-auto |
| `.admin-toolbar` | flex, flex-wrap, gap-0.5, p-2, border, rounded-t-lg, bg-gray-50 |
| `.admin-toolbar-sep` | w-px, h-5, bg-gray-200, mx-1 |
| `.admin-tab` | px-4, py-2.5, text-[13px], font-medium, border-b-2, transition |
| `.admin-tab-active` | border-gray-900, text-gray-900 |

### 18.4 NF-Specific Classes

All prefixed `nf-`:
- `.nf-split-container` — flex, min-h-[600px], border, rounded-xl
- `.nf-list-panel` — w-[380px], border-r, overflow-y-auto
- `.nf-detail-panel` — flex-1, overflow-y-auto
- `.nf-list-item` — cursor-pointer, p-3, border-b, hover:bg-gray-50
- `.nf-list-item.selected` — bg-blue-50
- `.nf-list-item.processed` — opacity-60
- `.nf-filter-chip` — pill-shaped toggle button
- `.nf-filter-chip.active` — bg-gray-900, text-white
- `.nf-date-header` — date group separator
- `.nf-batch-toolbar` — sticky batch action bar
- `.nf-skeleton` — loading placeholder animation
- `.nf-page-btn` — pagination button
- `.nf-checkbox` — styled checkbox
- `.nf-ai-badge` — "뉴스팩토리" AI badge
- `.nf-source-badge` — news source indicator
- `.nf-quick-publish` — quick action button on list items
- `.nf-mobile-back` — mobile back button
- `.nf-detail-topbar` — detail panel header
- `.nf-detail-content` — detail panel body
- `.nf-detail-empty` — empty state for detail panel

### 18.5 Article Body Typography

```css
.article-body {
  font-size: 17px;
  line-height: 1.9;
}
/* Responsive: 16px at md, 15.5px at sm */
```

### 18.6 Print Styles

```css
@media print {
  header, footer, nav, aside,
  [data-print-hide], .print-hide { display: none !important; }
  a[href]:after { content: " (" attr(href) ")"; }
}
```

---

## 19. STATIC GENERATION AND CACHING STRATEGY

| Route | Strategy | Revalidate | generateStaticParams |
|---|---|---|---|
| `/` (homepage) | ISR | 60s | No |
| `/article/[id]` | ISR | 3600s (1h) | Yes — all published article IDs |
| `/category/[slug]` | ISR | 60s | Yes — all category slugs |
| `/search` | Dynamic | `force-dynamic` | No |
| `/contact` | Client component | N/A | No |
| `/special` | ISR | 60s | No |
| `/special/[id]` | ISR | 3600s | Yes — all published article IDs |
| `/admin/*` | Client components | N/A | No |
| `/feed.xml` | On-demand | `s-maxage=3600` header | No |
| `/sitemap.xml` | On-demand | Default | No |
| `/opengraph-image` | Edge runtime | Default | No |

---

## 20. TESTING

### 20.1 Configuration — `vitest.config.ts`

```typescript
{
  test: {
    environment: "jsdom",
    setupFiles: ["src/__tests__/setup.ts"],
    alias: { "@": "src" }
  }
}
```

### 20.2 Setup — `src/__tests__/setup.ts`

```typescript
import "@testing-library/jest-dom";
```

### 20.3 Test Files

3 test files, 7 tests total — all passing.

---

## 21. STATIC ASSETS

| Path | Usage |
|---|---|
| `/brand/KJ_sloganLogo.png` | Public Header, Special Header, Login page, OG image generator |
| `/brand/KJ_Logo.png` | Public Footer (inverted), Special Footer (inverted) |

---

## 22. DATA FLOW DIAGRAMS

### 22.1 Public Page Data Flow

```
Browser Request
  → Next.js Server Component
    → db.ts function (e.g. getPublishedArticlesPaginated)
      → createServiceClient() [bypasses RLS]
        → Supabase PostgreSQL
          → Returns raw rows with joined categories/authors
      → mapArticle() converts to Article type
    → Renders HTML with article data
  → Response to browser (ISR cached)
```

### 22.2 Admin Mutation Flow

```
Admin UI Action (e.g. "발행" button in ArticleForm)
  → AdminContext.addArticle(formData)
    → createClient() [browser client, respects RLS]
      → Supabase INSERT with authenticated session
      → Returns inserted row with joins
    → mapArticle() converts to Article type
    → Prepend to local articles state
    → Return to component
  → Component shows toast + navigates to /admin/articles
```

### 22.3 NF Import Flow

```
Admin clicks "가져오기" on NF article in NfArticleExplorer
  → handleImport(article: NfArticle)
    → Resolve KJ category from NF category code
    → AdminContext.importArticle(data)
      → Browser Supabase INSERT (status: pending_review)
      → Returns new local Article
    → POST /api/nf/imports (create tracking record)
      → Server Supabase INSERT into nf_imports
    → Update importedMap state
    → Show success toast
```

### 22.4 View Count Flow

```
User visits /article/[id]
  → Server renders page (ISR)
  → ViewCounter mounts on client
    → POST /api/articles/{id}/view
      → Read "viewed_articles" cookie
      → If already viewed: return {success: false}
      → If new:
        → createServiceClient() [bypasses RLS]
        → Read current view_count
        → UPDATE view_count + 1
        → Set response cookie (24h httpOnly)
        → Return {success: true, viewCount: N}
```

---

## 23. CRITICAL IMPLEMENTATION DETAILS

### 23.1 ID Type Mismatch
- Database uses `BIGSERIAL` (numeric) for IDs
- Application uses `string` for all IDs
- Conversion happens in `mapArticle()`: `String(row.id)`
- Reverse conversion in mutations: `Number(id)`, `parseInt(id, 10)`

### 23.2 Duplicate DbArticle/mapArticle
- `src/lib/db.ts` has its own `DbArticle` interface and `mapArticle()` function
- `src/contexts/AdminContext.tsx` has a SEPARATE `DbArticle` and `mapArticle()`
- They are functionally identical but maintained independently
- The AdminContext version has `category_id: number | null` and `published_at: string | null` (nullable types)

### 23.3 Published_at Logic
When transitioning article status to "published":
- If the article was NOT previously published → set `published_at = new Date().toISOString()`
- If the article was already published → preserve existing `publishedAt`
- This logic exists in `addArticle`, `updateArticle`, and `updateArticleStatus`

### 23.4 NF Delete Cascade
The `DELETE /api/nf/imports` endpoint performs a dual delete:
1. Deletes local articles by ID (which auto-cascades to delete nf_imports via FK)
2. Also explicitly deletes nf_imports records as a safety measure
The NfArticleExplorer additionally calls `deleteArticle()` on AdminContext to update local state.

### 23.5 No Middleware
Despite `proxy.ts` existing with `updateSession()`, there is NO `middleware.ts` file. Auth is enforced:
- Client-side: `AuthGate` component redirects unauthenticated users
- Server-side: Each API route individually checks `getUser()`

### 23.6 Login Email Construction
The login page accepts a username (not email). The email is constructed as `${username}@kjtimes.co.kr`. This means Supabase Auth users must be created with emails following this pattern.

### 23.7 Supabase Hostname
The Supabase project hostname is `erntllkkeczystqsjija.supabase.co` — this appears in:
- `next.config.ts` image remote patterns
- `next.config.ts` CSP img-src and connect-src directives

---

**END OF DOCUMENTATION**
