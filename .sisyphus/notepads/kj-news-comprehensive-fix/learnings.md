# Learnings

## Project Stack
- Next.js 16.1.6 (App Router) + React 19
- Supabase SSR: createServiceClient (server), createClient (browser)
- Tailwind CSS 4 (NOT v3 — uses @import "tailwindcss" not @tailwind directives)
- Vercel deployment

## Key Patterns
- Server components use `await createServiceClient()` from `@/lib/supabase/server`
- Client components use `createClient()` from `@/lib/supabase/client`
- Data functions in `src/lib/db.ts`
- Types in `src/lib/types.ts`

## File Locations
- Public pages: `src/app/(public)/`
- Admin: `src/app/admin/` (DO NOT TOUCH)
- Components: `src/components/`
- Layout components: `src/components/layout/Header.tsx`, Footer.tsx
- Globals CSS: `src/app/globals.css`
- special/ has its OWN layout — do NOT touch `src/app/special/layout.tsx`

## Header.tsx Specifics
- Is "use client" (has useState for menu/search toggle)
- Currently imports `categories` from `@/lib/mock-data` — MUST be replaced with props
- Parent `src/app/(public)/layout.tsx` must fetch and pass categories

## Footer.tsx Specifics
- Is server component currently
- Can become async and call getCategories() directly

## CSS
- `globals.css` uses `@import "tailwindcss"` (Tailwind v4 syntax)
- Many animation keyframes already defined: fade-in, slide-up, slide-down, toast-in/out etc.
- Use `animate-pulse bg-gray-200` for skeletons

## Important Constraints
- NEVER modify admin/ routes
- NEVER modify special/layout.tsx
- NEVER install unnecessary npm packages (only DOMPurify, @vercel/analytics)
- Keep monochrome design
- article detail uses dangerouslySetInnerHTML — needs DOMPurify sanitization

## T10 View Counter Hardening
- Prefer RPC (`increment_view_count`) for atomic increments to avoid SELECT+UPDATE race conditions
- Route-level dedupe should combine cookie checks (`viewed_articles`) with IP+article in-memory cooldown
- Cap persisted cookie article IDs to a fixed max (200) to prevent unbounded growth

## Admin API Role Enforcement
- For admin/NF API routes, enforce role after auth with: allow when role is unset, deny with 403 when role is explicitly non-admin
- Keep public endpoints (contact, article view counter) outside admin role enforcement to avoid accidental lockout or behavior change
