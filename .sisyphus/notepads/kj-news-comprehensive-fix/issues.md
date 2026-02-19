# Issues / Gotchas

## LSP Errors Detected (pre-existing)
- Header.tsx: SVG title element empty (lines 57, 99) → fix with aria-hidden="true"
- Header.tsx: button missing type prop (lines 52, 94)
- article/[id]/page.tsx: dangerouslySetInnerHTML warning → will fix with T1
- error.tsx: button missing type prop
- globals.css: Tailwind syntax LSP warning (false positive for v4, ignore)
- admin/page.tsx: SVG title issues (DO NOT TOUCH - admin)

## Wave 1 FILE CONFLICT — RESOLVED
- T4 modifies Header.tsx AND Footer.tsx (dead links)
- T2 modifies Header.tsx; T3 modifies Footer.tsx → CONFLICT
- RESOLUTION: T4 dead-link work MERGED INTO T2 and T3
- Wave 1 actual dispatch: T1, T2(+T4header), T3(+T4footer), T5, T6 (5 parallel)
- T7 runs AFTER T2+T3 complete

## Email API Finding (Critical for T16)
- /api/email/route.ts requires Supabase auth (admin-only endpoint)
- CANNOT use for public newsletter subscriptions
- T16 decision: Create NEW /api/newsletter/route.ts
  - No auth required
  - Takes { email } body
  - Uses nodemailer to notify admin: jebo@kjtimes.co.kr
  - Simple notification: "새 뉴스레터 구독 신청: {email}"

## special/[id] Status
- special/[id]/page.tsx does NOT exist → skip XSS fix for special in T1

## nf-mock-data.ts Status
- Used extensively by admin NF components (DO NOT DELETE — admin scope)
- Keep nf-mock-data.ts as-is

## mock-data.ts After T2/T3
- Only Header/Footer imported categories from it (public scope)
- After T2+T3, no public files will import mock-data.ts
- T7: Can safely delete entire mock-data.ts (articles, authors, categories all unused by public)
