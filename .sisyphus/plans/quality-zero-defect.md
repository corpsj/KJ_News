# Zero Defect: 광전타임즈 품질 완전 정비

## TL;DR

> **Quick Summary**: 4개 에이전트 전방위 감사에서 발견된 보안/성능/UX 결함 전부 수정. 신기능 추가 없음. 클라이언트 QA에서 꼬투리 제로 목표.
> 
> **Deliverables**:
> - 보안: RLS admin 전용 강화, API 관리자 권한 검증, View counter 원자적 증가 + rate limit, Contact form 보호, console 문 제거
> - 성능: 홈페이지 N+1 쿼리 → 배치, raw img → next/image
> - CSP: unsafe-eval 제거 (TipTap 호환 검증 포함)
> - UX: 접근성, loading.tsx 추가, form 검증, focus management
> 
> **Estimated Effort**: Medium (12 tasks + 4 verification)
> **Parallel Execution**: YES — 4 waves
> **Critical Path**: T1→T2 (RLS→API auth) → T8 (CSP gate) → FINAL

---

## Context

### Original Request
"프로젝트를 완벽하게 분석해서 클라이언트가 놀랄만하게 해줘" → 분석 후 "버그 없는 완성도" 선택. 신기능 불필요. DB 변경 가능.

### Interview Summary
**Key Discussions**:
- 목표: 보안/성능/UX 결함 전부 수정 (Zero Defect)
- 범위: 신기능 추가 없음 (소셜 공유, 기자 프로필, 다크 모드 등 전부 제외)
- DB: 마이그레이션 가능

**Research Findings (4 agents)**:
- 보안: API routes에 admin role check 전무, RLS가 authenticated면 누구나, AuthContext가 role 없으면 "admin" 기본값
- 성능: 홈페이지 카테고리별 6회 별도 쿼리 (N+1), raw img 태그 사용, Suspense 없음
- UX: 접근성 갭 (aria-controls, lang 미설정), contact/terms/privacy loading.tsx 없음, form 검증 미흡
- 코드품질: console.error/warn 14군데, view counter 비원자적

### Metis Review
**Identified Gaps** (addressed):
- API-level admin role check 누락 → T2에서 전수 수정
- AuthContext "admin" 기본값 → T2에서 함께 수정
- View counter race condition (SELECT→UPDATE 비원자적) → T3에서 Postgres RPC로 원자적 증가
- getArticlesByCategory에 LIMIT 없음 → T6에서 함께 수정
- viewed_articles 쿠키 무한 증가 → T3에서 200개 cap
- OG image 파일은 raw img 필수 → T7에서 명시적 제외
- TipTap이 unsafe-eval 없으면 깨질 수 있음 → T8에서 gate check

---

## Work Objectives

### Core Objective
보안/성능/UX/코드품질 결함을 전부 수정하여 프로덕션 QA에서 지적 사항 제로를 달성한다.

### Concrete Deliverables
- 1 new SQL migration file (RLS admin-only)
- 1 new Postgres RPC function (atomic view increment)
- 8 modified source files (API routes, components, config)
- 3 new loading.tsx files
- 0 console statements in production code
- 0 raw img tags in public pages (OG generators 제외)

### Definition of Done
- [ ] `bun run build` 성공 (exit 0)
- [ ] `bun run test` 성공 (exit 0)
- [ ] `grep -rn "console\." src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | wc -l` → 0
- [ ] CSP 헤더에 `unsafe-eval` 없음 (또는 TipTap 호환 문서화)
- [ ] 모든 admin/nf API route에 role check 존재

### Must Have
- API admin role enforcement on ALL admin/nf routes
- Atomic view counter (race condition 제거)
- Contact form rate limit + honeypot + input length validation
- RLS admin-only policies
- N+1 쿼리 해결
- Console statements 전수 제거
- 접근성: `lang="ko"`, `aria-controls` on mobile menu

### Must NOT Have (Guardrails)
- ❌ 신기능 추가 (소셜 공유, 기자 프로필, 다크 모드, 뉴스레터, 댓글 등)
- ❌ `middleware.ts` 생성 (새로운 아키텍처 도입 금지)
- ❌ 새 npm 의존성 추가 (focus trap, rate limit 등은 자체 구현)
- ❌ 기존 SQL 마이그레이션 파일 수정 (새 파일만 추가)
- ❌ OG image 파일(`icon.tsx`, `apple-icon.tsx`, `opengraph-image.tsx`)의 raw img 변경
- ❌ 공개 페이지의 시각적 렌더링/데이터 내용 변경 (결함 수정만)
- ❌ CSRF 인프라, Redis, admin profiles table 등 과잉 설계
- ❌ `text-gray-400` 등 디자인 판단 영역의 색상 대비 변경

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (vitest configured, `view-rate-limit.test.ts` exists)
- **Automated tests**: Tests-after (기존 테스트 유지, 신규 테스트는 필요 시만)
- **Framework**: vitest (bun run test)

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **API/Backend**: Bash (curl) — Send requests, assert status + response fields
- **Frontend/UI**: Playwright — Navigate, interact, assert DOM, screenshot
- **Build**: Bash — `bun run build`, `bun run test`

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Security Foundation — 5 parallel):
├── T1: RLS admin-only migration [quick]
├── T2: API admin role enforcement + AuthContext fix [deep]
├── T3: View counter: atomic RPC + rate limit + cookie cap [deep]
├── T4: Contact form: rate limit + honeypot + input validation [unspecified-high]
└── T5: Console statements removal (14 instances) [quick]

Wave 2 (Performance + CSP — 3 parallel):
├── T6: Homepage N+1 → batch query with LIMIT (depends: none) [deep]
├── T7: Raw img → next/image (depends: none) [quick]
└── T8: CSP hardening + TipTap gate check (depends: none) [deep]

Wave 3 (UI/UX Polish — 4 parallel):
├── T9: Missing loading.tsx (contact, terms, privacy) (depends: none) [quick]
├── T10: Contact form client validation + honeypot UI (depends: T4) [quick]
├── T11: Accessibility (lang, aria-controls, login aria) (depends: none) [quick]
└── T12: ConfirmDialog focus restore (depends: none) [quick]

Wave FINAL (Verification — 4 parallel):
├── F1: Plan compliance audit [oracle]
├── F2: Code quality review [unspecified-high]
├── F3: Real QA (Playwright + curl) [unspecified-high]
└── F4: Scope fidelity check [deep]

Critical Path: T1 → T2 (auth pattern) → T8 (CSP gate) → FINAL
Parallel Speedup: ~65% faster than sequential
Max Concurrent: 5 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| T1 | — | T2 (RLS context) | 1 |
| T2 | T1 (RLS) | FINAL | 1 |
| T3 | — | FINAL | 1 |
| T4 | — | T10 | 1 |
| T5 | — | FINAL | 1 |
| T6 | — | FINAL | 2 |
| T7 | — | FINAL | 2 |
| T8 | — | FINAL | 2 |
| T9 | — | FINAL | 3 |
| T10 | T4 | FINAL | 3 |
| T11 | — | FINAL | 3 |
| T12 | — | FINAL | 3 |

### Agent Dispatch Summary

- **Wave 1**: 5 — T1→`quick`, T2→`deep`, T3→`deep`, T4→`unspecified-high`, T5→`quick`
- **Wave 2**: 3 — T6→`deep`, T7→`quick`, T8→`deep`
- **Wave 3**: 4 — T9→`quick`, T10→`quick`, T11→`quick`, T12→`quick`
- **FINAL**: 4 — F1→`oracle`, F2→`unspecified-high`, F3→`unspecified-high`, F4→`deep`

---

## TODOs


- [ ] 1. RLS Admin-Only 마이그레이션

  **What to do**:
  - 새 마이그레이션 파일 `supabase/migrations/20260228000000_rls_admin_only.sql` 생성
  - `nf_imports` 테이블: 기존 `Authenticated read/insert/update/delete` 정책 DROP → `admin` role 전용으로 재생성
  - `site_settings` 테이블: 기존 정책 DROP → `admin` role 전용으로 재생성
  - 패턴: `USING (auth.jwt() ->> 'role' = 'admin')` 또는 `USING ((SELECT auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')`
  - `articles` 테이블의 기존 RLS도 확인 — public SELECT은 유지하되 INSERT/UPDATE/DELETE는 admin 전용
  - Supabase 대시보드 또는 `psql`로 마이그레이션 적용 가능 여부 확인

  **Must NOT do**:
  - 기존 마이그레이션 파일(`20260220*.sql`) 수정 금지
  - public SELECT 정책 제거 금지 (공개 페이지 데이터 로딩에 필요)
  - anon 사용자의 articles 읽기 권한 제거 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T2, T3, T4, T5)
  - **Blocks**: T2 (RLS context 이해 필요)
  - **Blocked By**: None

  **References**:
  - `supabase/migrations/20260220100000_nf_imports.sql` — 현재 RLS 정책 (too permissive)
  - `supabase/migrations/20260220120000_site_settings.sql` — 현재 RLS 정책
  - `src/contexts/AuthContext.tsx:40` — `role: metadata?.role || 'admin'` (role 필드 위치 확인)

  **Acceptance Criteria**:
  - [ ] 새 마이그레이션 파일이 `supabase/migrations/` 에 존재
  - [ ] SQL 문법 오류 없음 (`psql -f` 또는 Supabase SQL editor에서 실행 가능)

  ```
  Scenario: RLS가 admin이 아닌 authenticated 사용자를 차단
    Tool: Bash
    Steps:
      1. 마이그레이션 SQL 파일 읽기 — DROP POLICY + CREATE POLICY 문 확인
      2. 정책 조건에 `role` 또는 `user_metadata` 기반 admin 체크 존재 확인
      3. SELECT/INSERT/UPDATE/DELETE 각각에 대해 정책 존재 확인
    Expected Result: nf_imports, site_settings 모든 CRUD에 admin 전용 정책 존재
    Evidence: .sisyphus/evidence/task-1-rls-policies.txt
  ```

  **Commit**: YES
  - Message: `fix(security): RLS admin 전용 정책 추가`
  - Files: `supabase/migrations/20260228000000_rls_admin_only.sql`

- [ ] 2. API Admin Role Enforcement + AuthContext 수정

  **What to do**:
  - `src/contexts/AuthContext.tsx` line 40: `role: metadata?.role || 'admin'` → `role: metadata?.role || 'viewer'` (기본값을 비관리자로 변경)
  - 모든 admin/NF API route에 admin role 검증 추가. 현재 패턴:
    ```typescript
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    ```
  - 추가할 패턴 (위 코드 바로 아래):
    ```typescript
    if (user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    ```
  - 적용 대상 파일 (전수):
    - `src/app/api/admin/settings/route.ts` (GET, PUT)
    - `src/app/api/admin/settings/test/route.ts` (POST)
    - `src/app/api/admin/cleanup/route.ts` (POST)
    - `src/app/api/nf/articles/route.ts` (GET)
    - `src/app/api/nf/articles/[id]/route.ts` (GET)
    - `src/app/api/nf/categories/route.ts` (GET)
    - `src/app/api/nf/regions/route.ts` (GET)
    - `src/app/api/nf/imports/route.ts` (GET, POST, DELETE)
  - `src/app/api/contact/route.ts`와 `src/app/api/articles/[id]/view/route.ts`는 공개 엔드포인트 → 건드리지 않음

  **Must NOT do**:
  - `middleware.ts` 생성 금지
  - 공개 API route (`/api/contact`, `/api/articles/[id]/view`)에 admin 체크 추가 금지
  - 새 npm 의존성 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: FINAL
  - **Blocked By**: T1 (RLS context)

  **References**:
  - `src/app/api/admin/settings/route.ts:6-8` — 현재 인증 패턴
  - `src/contexts/AuthContext.tsx:38-42` — role 매핑 로직
  - `src/app/api/admin/cleanup/route.ts` — 가장 위험한 엔드포인트 (전체 삭제)

  **Acceptance Criteria**:
  - [ ] AuthContext default role이 `'viewer'` (또는 admin이 아닌 값)
  - [ ] 8개 API 파일 모두에 `user.user_metadata?.role !== 'admin'` 체크 존재
  - [ ] `bun run build` 성공

  ```
  Scenario: Admin이 아닌 인증 사용자가 admin API 호출 시 403
    Tool: Bash (grep)
    Steps:
      1. grep -rn "user_metadata.*role.*admin" src/app/api/ --include="*.ts" | wc -l
      2. 결과가 8 이상인지 확인 (8개 파일)
      3. AuthContext.tsx에서 default role 확인
    Expected Result: 모든 admin/NF API에 role check 존재, default role != 'admin'
    Evidence: .sisyphus/evidence/task-2-admin-role-check.txt

  Scenario: 기존 admin 사용자는 정상 동작
    Tool: Bash
    Steps:
      1. bun run build → exit 0
      2. lsp_diagnostics on AuthContext.tsx → no errors
    Expected Result: 빌드 성공, 타입 에러 없음
    Evidence: .sisyphus/evidence/task-2-build-pass.txt
  ```

  **Commit**: YES
  - Message: `fix(security): API 관리자 권한 검증 + AuthContext 기본값 수정`
  - Files: `src/app/api/admin/**/*.ts`, `src/app/api/nf/**/*.ts`, `src/contexts/AuthContext.tsx`

- [ ] 3. View Counter: 원자적 증가 + Rate Limit + 쿠키 Cap

  **What to do**:
  - **Postgres RPC 함수 생성**: 새 마이그레이션 `supabase/migrations/20260228000001_atomic_view_count.sql`
    ```sql
    CREATE OR REPLACE FUNCTION increment_view_count(article_id_param BIGINT)
    RETURNS void AS $$
    BEGIN
      UPDATE articles SET view_count = view_count + 1 WHERE id = article_id_param;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    ```
  - **API route 수정** (`src/app/api/articles/[id]/view/route.ts`):
    - 기존 SELECT→UPDATE 패턴을 `supabase.rpc('increment_view_count', { article_id_param: articleId })` 호출로 교체
    - `createServiceClient()` → `createClient()` (일반 클라이언트)로 변경. RPC 함수가 SECURITY DEFINER이므로 서비스 키 불필요
    - Rate limit 추가: IP 기반 in-memory Map (1 article당 1 IP에서 24시간 1회)
      ```typescript
      const rateLimitMap = new Map<string, number>();
      const RATE_LIMIT_MS = 24 * 60 * 60 * 1000;
      const key = `${articleId}:${ip}`;
      const lastViewed = rateLimitMap.get(key);
      if (lastViewed && Date.now() - lastViewed < RATE_LIMIT_MS) return early;
      rateLimitMap.set(key, Date.now());
      ```
    - viewed_articles 쿠키 cap: 최대 200개 ID 유지 (오래된 것부터 제거)
  - 기존 `view-rate-limit.test.ts` 테스트가 계속 통과하도록 보장

  **Must NOT do**:
  - Redis/Upstash 등 외부 캐시 추가 금지
  - 쿠키 제거 금지 (기존 중복 조회 방지 로직 유지)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: FINAL
  - **Blocked By**: None

  **References**:
  - `src/app/api/articles/[id]/view/route.ts` — 현재 비원자적 view counter 전체 코드
  - `src/lib/supabase/server.ts` — createClient, createServiceClient 정의
  - `src/__tests__/view-rate-limit.test.ts` — 기존 테스트 (반드시 통과 유지)

  **Acceptance Criteria**:
  - [ ] 새 마이그레이션 파일 존재 (increment_view_count RPC)
  - [ ] API route에서 `rpc('increment_view_count')` 호출 사용
  - [ ] `createServiceClient` import 제거됨
  - [ ] rate limit 로직 존재 (IP 기반)
  - [ ] 쿠키 파싱 시 200개 초과 ID trim 로직 존재
  - [ ] `bun run test` 통과

  ```
  Scenario: 원자적 증가 함수 존재 확인
    Tool: Bash
    Steps:
      1. cat supabase/migrations/20260228000001_*.sql
      2. grep 'increment_view_count' → 함수 정의 확인
      3. grep 'SECURITY DEFINER' → 권한 설정 확인
    Expected Result: RPC 함수가 plpgsql로 정의됨
    Evidence: .sisyphus/evidence/task-3-rpc-function.txt

  Scenario: Rate limit 로직 확인
    Tool: Bash (grep)
    Steps:
      1. grep -n 'rateLimitMap\|rateLimit\|RATE_LIMIT' src/app/api/articles/*/view/route.ts
      2. rate limit 패턴 존재 확인
    Expected Result: IP 기반 rate limit 코드 존재
    Evidence: .sisyphus/evidence/task-3-rate-limit.txt
  ```

  **Commit**: YES
  - Message: `fix(security): 조회수 원자적 증가 + rate limit + 쿠키 cap`
  - Files: `src/app/api/articles/[id]/view/route.ts`, `supabase/migrations/20260228000001_atomic_view_count.sql`

- [ ] 4. Contact Form 서버: Rate Limit + Honeypot + 입력 검증

  **What to do**:
  - `src/app/api/contact/route.ts` 수정:
    - **Rate limit**: IP 기반 in-memory Map (1 IP당 시간당 5회)
    - **Honeypot**: request body에서 `honeypot` 필드 확인 — 값이 있으면 성공 응답 반환 (봇 무시)
    - **Input length validation**:
      - `senderName`: 최대 100자
      - `senderEmail`: 최대 254자
      - `subject`: 최대 200자
      - `body`: 최대 10,000자
    - **Email regex 강화**: 현재 기본 regex → RFC 5322 준수 수준으로
  - `console.error` 제거 (T5와 겹치지만, contact route는 이 태스크에서 완전 처리)

  **Must NOT do**:
  - Redis/외부 rate limit 서비스 추가 금지
  - CSRF 토큰 인프라 추가 금지
  - 새 npm 의존성 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: T10 (client-side honeypot UI)
  - **Blocked By**: None

  **References**:
  - `src/app/api/contact/route.ts` — 현재 contact form 서버 로직 전체

  **Acceptance Criteria**:
  - [ ] Rate limit 로직 존재 (IP 기반, 시간당 5회)
  - [ ] `honeypot` 필드 체크 존재
  - [ ] 4개 필드 모두 maxLength 검증 존재
  - [ ] `console.error` 제거됨
  - [ ] `bun run build` 성공

  ```
  Scenario: 입력 검증 + honeypot 확인
    Tool: Bash (grep)
    Steps:
      1. grep -n 'honeypot\|maxLength\|length.*>' src/app/api/contact/route.ts
      2. length 체크 4개 이상 존재 확인
      3. honeypot 분기 존재 확인
    Expected Result: honeypot + 4개 필드 length 검증 코드 존재
    Evidence: .sisyphus/evidence/task-4-contact-validation.txt
  ```

  **Commit**: YES
  - Message: `fix(security): 연락 폼 rate limit + honeypot + 입력 검증`
  - Files: `src/app/api/contact/route.ts`

- [ ] 5. Console 문 전수 제거

  **What to do**:
  - 아래 파일에서 모든 `console.error`, `console.warn`, `console.log` 제거 또는 무음 처리:
    - `src/contexts/AdminContext.tsx` — ~10군데 (catch 블록 내 console.error)
    - `src/components/ViewCounter.tsx` — 1군데 (console.warn)
    - `src/components/admin/ArticleForm.tsx` — 1군데 (console.warn)
  - 제거 전략:
    - catch 블록의 console.error → 단순 제거 (이미 toast로 사용자에게 알림)
    - 개발용 console.warn → 제거
  - `src/app/api/contact/route.ts`의 console은 T4에서 처리하므로 건너뜀

  **Must NOT do**:
  - Sentry 등 외부 로깅 서비스 추가 금지 (scope out)
  - 에러 핸들링 로직 자체 변경 금지 (console만 제거)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: FINAL
  - **Blocked By**: None

  **References**:
  - `src/contexts/AdminContext.tsx` — console.error 다수
  - `src/components/ViewCounter.tsx:12` — console.warn
  - `src/components/admin/ArticleForm.tsx:61` — console.warn

  **Acceptance Criteria**:
  - [ ] `grep -rn 'console\.' src/ --include='*.ts' --include='*.tsx' | grep -v node_modules | grep -v '.test.' | wc -l` → 0
  - [ ] `bun run build` 성공
  - [ ] 기존 에러 핸들링 로직 (try/catch/toast) 변경 없음

  ```
  Scenario: 프로덕션 코드에 console 문 제로
    Tool: Bash
    Steps:
      1. grep -rn 'console\.' src/ --include='*.ts' --include='*.tsx' | grep -v node_modules | grep -v '.test.' | wc -l
    Expected Result: 0
    Evidence: .sisyphus/evidence/task-5-zero-console.txt
  ```

  **Commit**: YES
  - Message: `chore: 프로덕션 console 문 전수 제거`
  - Files: `src/contexts/AdminContext.tsx`, `src/components/ViewCounter.tsx`, `src/components/admin/ArticleForm.tsx`

- [ ] 6. Homepage N+1 → 배치 쿼리 + LIMIT

  **What to do**:
  - `src/lib/db.ts`에 새 함수 추가:
    ```typescript
    export async function getArticlesByCategorySlugs(
      slugs: string[], limit: number = 4
    ): Promise<Record<string, Article[]>> { ... }
    ```
    - 1번의 categories 조회 + 1번의 articles 조회 (IN 절)로 통합
    - 카테고리별 `limit`개만 반환 (기본 4)
    - `published_at DESC` 정렬 유지
  - `src/app/(public)/page.tsx` 수정:
    - 기존 `Promise.all(displayCategories.map(cat => getArticlesByCategory(cat.slug)))` → `getArticlesByCategorySlugs(slugs, 4)` 단일 호출로 교체
  - 기존 `getArticlesByCategory` 함수는 다른 곳에서 사용 중이면 유지, 안 쓰이면 제거

  **Must NOT do**:
  - `getArticlesByCategory` 기존 시그니처 변경 금지 (다른 곳에서 사용 중일 수 있음)
  - 홈페이지의 시각적 결과 변경 금지 (같은 기사가 같은 순서로 표시)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T7, T8)
  - **Blocks**: FINAL
  - **Blocked By**: None

  **References**:
  - `src/lib/db.ts:90-110` — 기존 `getArticlesByCategory()` 함수
  - `src/app/(public)/page.tsx:75-80` — 현재 N+1 패턴 (`Promise.all + map`)
  - `src/lib/db.ts:23-40` — `mapArticle()` 함수, `ARTICLE_SELECT` 상수

  **Acceptance Criteria**:
  - [ ] `getArticlesByCategorySlugs` 함수가 db.ts에 존재
  - [ ] homepage에서 카테고리별 개별 쿼리 패턴 제거됨
  - [ ] `bun run build` 성공

  ```
  Scenario: 배치 쿼리로 교체 확인
    Tool: Bash (grep)
    Steps:
      1. grep -n 'getArticlesByCategorySlugs\|getArticlesByCategory' src/app/(public)/page.tsx
      2. getArticlesByCategory 호출이 page.tsx에서 사라졌는지 확인
      3. getArticlesByCategorySlugs 호출이 존재하는지 확인
    Expected Result: page.tsx에 getArticlesByCategorySlugs만 존재
    Evidence: .sisyphus/evidence/task-6-batch-query.txt
  ```

  **Commit**: YES
  - Message: `perf: 홈페이지 카테고리 쿼리 배치 최적화`
  - Files: `src/lib/db.ts`, `src/app/(public)/page.tsx`

- [ ] 7. Raw img → next/image

  **What to do**:
  - `src/app/(public)/article/[id]/page.tsx` — 기사 본문 내 `<img>` 태그를 `next/image`로 교체
    - 이미지 크기가 동적이면 `fill` + container 패턴 사용
    - `priority={true}` 는 첫 이미지만
  - `src/components/admin/ArticleForm.tsx` — 썸네일 미리보기 `<img>` → `next/image`
  - **제외 (절대 건드리지 않음)**:
    - `src/app/icon.tsx`
    - `src/app/apple-icon.tsx`
    - `src/app/opengraph-image.tsx`
    - `src/components/admin/nf/NfArticleExplorer.tsx` (외부 이미지 URL, next/image remote 설정 필요할 수 있음 → 건드리지 않음)

  **Must NOT do**:
  - OG image 파일의 raw img 변경 금지 (ImageResponse는 next/image 사용 불가)
  - next.config.ts의 images.remotePatterns 변경은 필요 시에만 최소한으로

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: FINAL
  - **Blocked By**: None

  **References**:
  - `src/app/(public)/article/[id]/page.tsx:176-180` — raw img 사용 위치
  - `src/components/admin/ArticleForm.tsx:250` — 썸네일 미리보기 img
  - `next.config.ts:5-17` — 현재 images.remotePatterns 설정

  **Acceptance Criteria**:
  - [ ] 공개 페이지에 raw `<img>` 태그 0개 (OG 제외)
  - [ ] `bun run build` 성공

  ```
  Scenario: raw img 태그 부재 확인
    Tool: Bash
    Steps:
      1. grep -rn '<img ' src/app/'(public)' src/components/ --include='*.tsx' | grep -v ImageResponse | grep -v 'next/image'
    Expected Result: 0 결과 (또는 admin NF explorer만)
    Evidence: .sisyphus/evidence/task-7-no-raw-img.txt
  ```

  **Commit**: YES
  - Message: `perf: raw img → next/image 전환`
  - Files: `src/app/(public)/article/[id]/page.tsx`, `src/components/admin/ArticleForm.tsx`

- [ ] 8. CSP Hardening + TipTap Gate Check

  **What to do**:
  - `next.config.ts` CSP 헤더 수정:
    - `script-src`에서 `'unsafe-eval'` 제거
    - `'unsafe-inline'`은 유지 (Vercel Analytics 부트스트랩 필요)
  - **Gate Check (필수)**:
    1. `bun run dev`로 개발 서버 실행
    2. admin 로그인 → 기사 작성 페이지 (`/admin/articles/new`) 접속
    3. TipTap 에디터가 정상 로딩되는지 확인
    4. 텍스트 입력, 볼드/이탤릭 등 서식 적용
    5. 브라우저 콘솔에 CSP violation 에러 없는지 확인
  - **만약 TipTap이 깨지면**: `'unsafe-eval'` 유지하되, 이유를 주석으로 문서화
    ```typescript
    // TipTap(ProseMirror)이 'unsafe-eval'을 요구함 — 라이브러리 업데이트 시 재확인
    ```

  **Must NOT do**:
  - nonce 기반 CSP 도입 금지 (복잡도 과잉)
  - admin/public 분리 CSP 금지 (Next.js headers는 path 패턴 지원하지만 복잡)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: FINAL
  - **Blocked By**: None

  **References**:
  - `next.config.ts:29` — 현재 CSP script-src 라인
  - `src/components/admin/RichTextEditor.tsx` — TipTap 에디터 컴포넌트

  **Acceptance Criteria**:
  - [ ] CSP에서 `unsafe-eval` 제거됨 (또는 TipTap 때문에 유지 시 주석 문서화)
  - [ ] `bun run build` 성공

  ```
  Scenario: CSP 헤더 확인
    Tool: Bash
    Steps:
      1. grep 'unsafe-eval' next.config.ts | wc -l
    Expected Result: 0 (제거됨) 또는 1 (TipTap 문서화 주석 포함)
    Evidence: .sisyphus/evidence/task-8-csp-check.txt

  Scenario: TipTap 에디터 동작 확인 (Gate Check)
    Tool: Playwright (playwright skill)
    Steps:
      1. localhost:3000/admin/login 접속
      2. 로그인
      3. /admin/articles/new 이동
      4. TipTap 에디터 영역 클릭
      5. 텍스트 입력 + 볼드 적용
      6. 브라우저 콘솔 에러 확인
    Expected Result: 에디터 정상 동작, CSP violation 없음
    Evidence: .sisyphus/evidence/task-8-tiptap-gate.png
  ```

  **Commit**: YES
  - Message: `fix(security): CSP unsafe-eval 제거`
  - Files: `next.config.ts`

- [ ] 9. 누락된 Loading.tsx 추가 (contact, terms, privacy)

  **What to do**:
  - `src/app/(public)/contact/loading.tsx` — 폼 스켈레톤 (입력 필드 4개 + 버튼 모양)
  - `src/app/(public)/terms/loading.tsx` — 텍스트 블록 스켈레톤 (8개 섹션)
  - `src/app/(public)/privacy/loading.tsx` — 텍스트 블록 스켈레톤 (9개 섹션)
  - 기존 loading.tsx 패턴 따르기: `src/app/(public)/article/[id]/loading.tsx` 참조
  - `animate-pulse` + gray 배경 패턴 사용

  **Must NOT do**:
  - Admin loading.tsx는 scope 밖 (내부 도구)
  - 기존 loading.tsx 수정 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T10, T11, T12)
  - **Blocks**: FINAL
  - **Blocked By**: None

  **References**:
  - `src/app/(public)/article/[id]/loading.tsx` — 기존 스켈레톤 패턴
  - `src/app/(public)/category/[slug]/loading.tsx` — 또 다른 스켈레톤 참조

  **Acceptance Criteria**:
  - [ ] 3개 loading.tsx 파일 존재
  - [ ] `bun run build` 성공

  ```
  Scenario: loading.tsx 파일 존재 확인
    Tool: Bash
    Steps:
      1. ls src/app/'(public)'/contact/loading.tsx src/app/'(public)'/terms/loading.tsx src/app/'(public)'/privacy/loading.tsx
    Expected Result: 3개 파일 모두 존재
    Evidence: .sisyphus/evidence/task-9-loading-files.txt
  ```

  **Commit**: YES
  - Message: `feat: 누락된 loading.tsx 추가 (contact, terms, privacy)`
  - Files: 3 new files

- [ ] 10. Contact Form 클라이언트 검증 + Honeypot UI

  **What to do**:
  - `src/app/(public)/contact/page.tsx` 수정:
    - **Honeypot 필드 추가**: 화면에 보이지 않는 input
      ```tsx
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="absolute -left-[9999px] opacity-0 h-0 w-0"
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
      />
      ```
    - **클라이언트 검증 강화**:
      - 이름: 필수 + 100자 제한
      - 이메일: 필수 + 형식 검증 + 254자 제한
      - 제목: 200자 제한
      - 본문: 필수 + 10,000자 제한
    - 제출 시 `honeypot` 필드 값을 body에 포함하여 서버로 전송
    - 각 필드에 남은 글자수 표시 (선택사항 — 간단하면 추가)

  **Must NOT do**:
  - 폼 디자인/레이아웃 변경 금지
  - 새 UI 라이브러리 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: FINAL
  - **Blocked By**: T4 (서버 honeypot 처리 먼저)

  **References**:
  - `src/app/(public)/contact/page.tsx` — 현재 연락 폼 전체 코드

  **Acceptance Criteria**:
  - [ ] honeypot 필드가 `aria-hidden`, `tabIndex={-1}`로 숨겨짐
  - [ ] 각 필드에 maxLength 또는 길이 검증 존재
  - [ ] `bun run build` 성공

  ```
  Scenario: Honeypot 필드 존재 + 숨겨짐
    Tool: Bash (grep)
    Steps:
      1. grep -n 'aria-hidden\|honeypot' src/app/'(public)'/contact/page.tsx
    Expected Result: honeypot input + aria-hidden 존재
    Evidence: .sisyphus/evidence/task-10-honeypot.txt
  ```

  **Commit**: YES
  - Message: `fix(ux): 연락 폼 클라이언트 검증 + honeypot`
  - Files: `src/app/(public)/contact/page.tsx`

- [ ] 11. 접근성: lang, aria-controls, 로그인 개선

  **What to do**:
  - `src/app/layout.tsx`: `<html>` 태그에 `lang="ko"` 추가
  - `src/components/layout/Header.tsx`:
    - 모바일 메뉴 토글에 `aria-controls="mobile-menu"` 추가
    - 모바일 메뉴 `<nav>`에 `id="mobile-menu"` 추가
  - `src/app/admin/login/page.tsx`:
    - 에러 메시지에 `id="login-error"`, `role="alert"` 추가
    - 이메일/비밀번호 input에 `aria-describedby="login-error"` 추가 (에러 존재 시)
    - 로딩 스피너에 `aria-label="로그인 중"` 추가

  **Must NOT do**:
  - 비주얼 변경 금지
  - 새 컴포넌트 생성 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: FINAL
  - **Blocked By**: None

  **References**:
  - `src/app/layout.tsx:41` — 현재 html 태그 (lang 미설정)
  - `src/components/layout/Header.tsx` — 모바일 메뉴 토글 버튼
  - `src/app/admin/login/page.tsx` — 로그인 폼 전체 코드

  **Acceptance Criteria**:
  - [ ] `lang="ko"` 가 html 태그에 존재
  - [ ] `aria-controls="mobile-menu"` 존재
  - [ ] 로그인 에러에 `role="alert"` 존재
  - [ ] `bun run build` 성공

  ```
  Scenario: 접근성 속성 확인
    Tool: Bash (grep)
    Steps:
      1. grep 'lang="ko"' src/app/layout.tsx
      2. grep 'aria-controls' src/components/layout/Header.tsx
      3. grep 'role="alert"' src/app/admin/login/page.tsx
    Expected Result: 3개 모두 존재
    Evidence: .sisyphus/evidence/task-11-a11y.txt
  ```

  **Commit**: YES
  - Message: `fix(a11y): lang, aria-controls, 로그인 접근성 개선`
  - Files: `src/app/layout.tsx`, `src/components/layout/Header.tsx`, `src/app/admin/login/page.tsx`

- [ ] 12. ConfirmDialog Focus 복원

  **What to do**:
  - `src/components/admin/ConfirmDialog.tsx` 수정:
    - 다이얼로그 열릴 때 `document.activeElement`을 ref로 저장
    - 닫힐 때 (onConfirm, onCancel) 저장된 요소로 `.focus()` 복원
    ```typescript
    const triggerRef = useRef<HTMLElement | null>(null);
    useEffect(() => {
      triggerRef.current = document.activeElement as HTMLElement;
      return () => { triggerRef.current?.focus(); };
    }, []);
    ```

  **Must NOT do**:
  - `focus-trap-react` 등 외부 라이브러리 추가 금지
  - 기존 focus trap 로직 변경 금지 (있다면)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: FINAL
  - **Blocked By**: None

  **References**:
  - `src/components/admin/ConfirmDialog.tsx` — 현재 다이얼로그 컴포넌트

  **Acceptance Criteria**:
  - [ ] `triggerRef` 또는 유사한 focus 저장/복원 패턴 존재
  - [ ] `bun run build` 성공

  ```
  Scenario: Focus 복원 코드 확인
    Tool: Bash (grep)
    Steps:
      1. grep -n 'activeElement\|triggerRef\|focus()' src/components/admin/ConfirmDialog.tsx
    Expected Result: focus 저장 + 복원 패턴 존재
    Evidence: .sisyphus/evidence/task-12-focus-restore.txt
  ```

  **Commit**: YES
  - Message: `fix(a11y): ConfirmDialog focus 복원`
  - Files: `src/components/admin/ConfirmDialog.tsx`


## Final Verification Wave

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `bun run build` + `bun run test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names.
  Output: `Build [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration. Test edge cases: empty state, invalid input, rapid actions.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (`git log/diff`). Verify 1:1 — everything in spec was built, nothing beyond spec was built. Check "Must NOT do" compliance. Detect cross-task contamination.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| Wave | Commit Message | Files |
|------|---------------|-------|
| 1 | `fix(security): RLS admin 전용 정책 추가` | `supabase/migrations/2026*_rls_admin.sql` |
| 1 | `fix(security): API 관리자 권한 검증 + AuthContext 기본값 수정` | `src/app/api/admin/**`, `src/app/api/nf/**`, `src/contexts/AuthContext.tsx` |
| 1 | `fix(security): 조회수 원자적 증가 + rate limit + 쿠키 cap` | `src/app/api/articles/[id]/view/route.ts`, `supabase/migrations/*` |
| 1 | `fix(security): 연락 폼 rate limit + honeypot + 입력 검증` | `src/app/api/contact/route.ts` |
| 1 | `chore: 프로덕션 console 문 전수 제거` | 다수 |
| 2 | `perf: 홈페이지 카테고리 쿼리 배치 최적화` | `src/lib/db.ts`, `src/app/(public)/page.tsx` |
| 2 | `perf: raw img → next/image 전환` | `src/app/(public)/article/[id]/page.tsx`, `src/components/admin/ArticleForm.tsx` |
| 2 | `fix(security): CSP unsafe-eval 제거` | `next.config.ts` |
| 3 | `feat: 누락된 loading.tsx 추가 (contact, terms, privacy)` | 3 new files |
| 3 | `fix(ux): 연락 폼 클라이언트 검증 + honeypot UI` | `src/app/(public)/contact/page.tsx` |
| 3 | `fix(a11y): lang, aria-controls, 로그인 접근성 개선` | `src/app/layout.tsx`, `src/components/layout/Header.tsx`, `src/app/admin/login/page.tsx` |
| 3 | `fix(a11y): ConfirmDialog focus 복원` | `src/components/admin/ConfirmDialog.tsx` |

---

## Success Criteria

### Verification Commands
```bash
bun run build              # Expected: exit 0
bun run test               # Expected: all pass
grep -rn "console\." src/ --include="*.ts" --include="*.tsx" | wc -l  # Expected: 0
grep -rn "<img " src/app/\(public\) src/components/ --include="*.tsx" | grep -v "ImageResponse" | grep -v "next/image" | wc -l  # Expected: 0
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] Build succeeds
- [ ] Zero console statements in production
- [ ] Zero raw img tags in public pages (OG excluded)
- [ ] CSP hardened (unsafe-eval removed or documented exception)
