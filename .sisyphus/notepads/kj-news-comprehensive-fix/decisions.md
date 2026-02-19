# Decisions

## T1: XSS
- Use `isomorphic-dompurify` (works SSR + CSR)
- Create `src/lib/sanitize.ts` wrapper
- Allow standard HTML tags: p, h2, h3, h4, ul, ol, li, a, strong, em, img, br, blockquote
- Add `escapeLikeQuery()` in db.ts for search

## T2: Header
- Header stays "use client" (needs useState)
- Pass categories as props from layout.tsx (server component)
- layout.tsx calls getCategories() and passes to <Header categories={categories} />

## T3: Footer
- Convert to async server component
- Call getCategories() directly inside

## T4: Dead Links
- Remove login/signup links entirely (no public auth)
- Replace right side of top bar with just the date (or remove right side)
- 광고문의 → mailto:jebo@kjtimes.co.kr

## T5: Loading
- 4 loading.tsx files: (public)/, article/[id]/, category/[slug]/, search/
- Use animate-pulse + bg-gray-200 blocks

## T6: Error
- 3 error.tsx files (improve existing + add article/[id]/ and category/[slug]/)
- "use client" + reset() function
- Match not-found.tsx card style

## T7: mock-data.ts
- Remove articles[] and authors[] arrays
- If categories[] is still used by Header after T2, keep temporarily; but T2 removes the import so can remove
- Check nf-mock-data.ts usage too

## T8: OG/SEO
- Create src/lib/constants.ts with SITE_URL
- SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kj-news.vercel.app"

## T9: RSS
- Create src/app/feed.xml/route.ts
- Raw XML string generation, no library

## T10: View Count
- POST /api/articles/[id]/view route
- ViewCounter.tsx client component with useRef guard

## T11: Pagination
- Add paginated DB functions with range + count
- Pagination component reads ?page= from searchParams
- perPage: home=18, category=15, search=12

## T12: Social Share
- URL-based only (no SDK)
- 카카오: story.kakao.com/share, 페이스북: facebook sharer, X: twitter intent, 링크복사: clipboard API

## T16: Newsletter
- Use existing /api/email endpoint
- Simple email input + submit, no double opt-in

## T17: Analytics
- @vercel/analytics, <Analytics /> in layout.tsx body
