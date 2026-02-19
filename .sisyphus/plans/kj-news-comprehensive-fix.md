# KJ_News (광전타임즈) 종합 개선

## TL;DR

> **Quick Summary**: 광전타임즈 뉴스 웹사이트의 보안 취약점, SEO 부재, 핵심 기능 미비, UX 미흡, 기술부채를 한 번에 수정하는 종합 개선 작업.
> 
> **Deliverables**:
> - XSS 보안 취약점 수정 (DOMPurify 적용)
> - Header/Footer mock 데이터 → DB 연동
> - 죽은 링크 수정
> - OG/Twitter Card SEO 메타데이터
> - RSS 피드
> - 조회수 카운트 로직
> - 페이지네이션 (홈/카테고리/검색)
> - 소셜 공유 버튼
> - 기사 인쇄 CSS
> - Loading/Error 상태
> - 접근성(A11y) 개선
> - 모바일 UX 개선
> - 뉴스레터 구독 UI
> - Vercel Analytics
> - mock-data.ts 정리
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 3 waves + Final
> **Critical Path**: T1 (XSS) → T8 (SEO) → T12 (Social share) → F1-F4

---

## Context

### Original Request
사용자가 현재 웹사이트에서 부족한 점을 분석해달라고 요청. 16개 이슈를 식별한 후, "전부 다 한꺼번에" 수정 요청.

### Interview Summary
**Key Discussions**:
- 보안, SEO, 기능, UX, 기술부채 전 영역을 한 번에 수정
- 광전타임즈는 전남 함평군 지역 뉴스 매체
- Next.js 16 + Supabase + Tailwind CSS 4 + Vercel 배포

**Research Findings**:
- `special/layout.tsx`은 자체 인라인 Header/Footer 사용 → 공유 컴포넌트와 별개
- Header.tsx는 `"use client"` → categories를 props로 전달 필요
- Footer.tsx는 서버 컴포넌트 → DB 직접 조회 가능
- `mock-data.ts`는 Header/Footer에서만 import → 이 둘 수정 후 삭제 가능
- 검색 쿼리에 SQL injection 유사 패턴 가능 (`db.ts:128` ilike 쿼리)
- nodemailer + email API 이미 존재 → 뉴스레터 UI만 추가하면 됨

### Metis Review
**Identified Gaps** (addressed):
- 로그인/회원가입 링크: 공개 인증 시스템 없음 → 링크 제거 처리
- 프로덕션 도메인: `NEXT_PUBLIC_SITE_URL` 환경변수 도입, 기본값 `https://kj-news.vercel.app`
- special/ 라우트 별도 레이아웃: 공유 Header/Footer 수정 범위에서 제외
- NF(News Factory) 시스템: 이번 범위에서 제외
- 검색 쿼리 sanitization: XSS 수정 시 함께 처리

---

## Work Objectives

### Core Objective
광전타임즈 웹사이트의 보안·SEO·기능·UX·기술부채 16개 이슈를 모두 해결하여 프로덕션 품질의 뉴스 사이트로 완성한다.

### Concrete Deliverables
- 보안: XSS-safe 기사 렌더링 + 검색 쿼리 sanitization
- SEO: OG/Twitter meta, RSS 피드, sitemap URL 환경변수화
- 기능: 조회수 증가, 페이지네이션, 소셜 공유, 인쇄 지원
- UX: loading 스켈레톤, error boundary, 모바일 애니메이션, 접근성
- 인프라: 뉴스레터 구독 UI, Vercel Analytics, mock 데이터 정리

### Definition of Done
- [ ] `npm run build` 에러 없이 완료
- [ ] 모든 공개 페이지에 OG meta 태그 존재 (curl로 확인)
- [ ] `/feed.xml` 접속 시 유효한 RSS XML 반환
- [ ] 기사 페이지 HTML에 sanitized content만 포함
- [ ] Header/Footer에 mock-data.ts import 없음
- [ ] `mock-data.ts`에서 articles 배열과 authors 배열 제거됨
- [ ] 기사 상세 페이지 방문 시 view_count 증가

### Must Have
- DOMPurify 기반 HTML sanitization
- 모든 공개 페이지에 OG image + description
- RSS 2.0 피드
- 서버사이드 조회수 증가 API
- 홈/카테고리/검색 페이지네이션
- 기사 페이지 소셜 공유 (카카오, 페이스북, X, 링크복사)
- loading.tsx 스켈레톤 (최소 3개 라우트)
- skip navigation + 주요 ARIA 라벨
- Vercel Analytics 통합

### Must NOT Have (Guardrails)
- 공개 사용자 인증 시스템 구현하지 않음 (로그인/회원가입 페이지 만들지 않음)
- special/ 라우트의 레이아웃 변경하지 않음
- admin/ 라우트 수정하지 않음
- News Factory(NF) 시스템 수정하지 않음
- 새로운 npm 패키지는 최소한으로 (DOMPurify, @vercel/analytics 정도만)
- 기존 디자인 톤(모노크롬) 변경하지 않음
- 뉴스레터: 이메일 입력 + API 호출만, double opt-in이나 관리 대시보드 없음
- 과도한 주석, 불필요한 추상화 금지

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: None (agent QA only)
- **Framework**: N/A

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) — Navigate, interact, assert DOM, screenshot
- **API/Backend**: Use Bash (curl) — Send requests, assert status + response fields
- **Build**: Use Bash — `npm run build`, verify 0 errors

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — security + foundation, 7 parallel):
├── Task 1: XSS 보안 수정 (DOMPurify 설치 + 적용) [quick]
├── Task 2: Header DB 연동 (mock → props) [quick]
├── Task 3: Footer DB 연동 (mock → direct fetch) [quick]
├── Task 4: 죽은 링크 수정 [quick]
├── Task 5: Loading 스켈레톤 추가 [quick]
├── Task 6: Error boundary 추가 [quick]
└── Task 7: mock-data.ts 정리 (depends: T2, T3 완료 후) [quick]

Wave 2 (After Wave 1 — SEO + core features, 6 parallel):
├── Task 8: OG/Twitter Card 메타데이터 [unspecified-high]
├── Task 9: RSS 피드 생성 [quick]
├── Task 10: 조회수 증가 로직 [unspecified-high]
├── Task 11: 페이지네이션 (홈/카테고리/검색) [unspecified-high]
├── Task 12: 소셜 공유 버튼 [visual-engineering]
└── Task 13: 기사 인쇄 CSS [quick]

Wave 3 (After Wave 2 — UX + polish, 4 parallel):
├── Task 14: 접근성(A11y) 개선 [unspecified-high]
├── Task 15: 모바일 UX 개선 [visual-engineering]
├── Task 16: 뉴스레터 구독 UI [visual-engineering]
└── Task 17: Vercel Analytics 통합 [quick]

Wave FINAL (After ALL — verification, 4 parallel):
├── Task F1: Plan compliance audit [oracle]
├── Task F2: Code quality review [unspecified-high]
├── Task F3: Real manual QA [unspecified-high + playwright]
└── Task F4: Scope fidelity check [deep]

Critical Path: T1 → T8 → T12 → F1-F4
Parallel Speedup: ~65% faster than sequential
Max Concurrent: 7 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| T1 | — | T8, T10 |
| T2 | — | T7 |
| T3 | — | T7 |
| T4 | — | — |
| T5 | — | — |
| T6 | — | — |
| T7 | T2, T3 | — |
| T8 | T1 | T12 |
| T9 | — | — |
| T10 | — | — |
| T11 | — | — |
| T12 | — | — |
| T13 | — | — |
| T14 | T2 (Header) | — |
| T15 | T2 (Header) | — |
| T16 | — | — |
| T17 | — | — |

### Agent Dispatch Summary

- **Wave 1**: **7** — T1-T6 → `quick`, T7 → `quick`
- **Wave 2**: **6** — T8 → `unspecified-high`, T9 → `quick`, T10 → `unspecified-high`, T11 → `unspecified-high`, T12 → `visual-engineering`, T13 → `quick`
- **Wave 3**: **4** — T14 → `unspecified-high`, T15 → `visual-engineering`, T16 → `visual-engineering`, T17 → `quick`
- **FINAL**: **4** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. XSS 보안 수정 — DOMPurify 설치 + HTML sanitization 적용

  **What to do**:
  - `npm install isomorphic-dompurify` 설치
  - `src/lib/sanitize.ts` 유틸 함수 생성: `sanitizeHtml(html: string): string` — DOMPurify.sanitize() 래핑
  - `src/app/(public)/article/[id]/page.tsx`의 `dangerouslySetInnerHTML` 부분에서 `article.content`를 `sanitizeHtml(article.content)`로 교체
  - `src/app/special/[id]/page.tsx`에도 동일하게 적용 (special 기사 상세 페이지가 존재하는 경우)
  - `src/lib/db.ts:128`의 검색 쿼리에서 사용자 입력 sanitize: 특수문자(`%`, `_`, `\`) 이스케이프 처리하는 `escapeLikeQuery(query: string)` 함수 추가

  **Must NOT do**:
  - DOMPurify 외 다른 sanitization 라이브러리 사용 금지
  - 기사 content의 허용 태그를 과도하게 제한하지 않음 (p, h2, h3, ul, ol, li, a, strong, em, img 등 표준 HTML 허용)
  - admin/ 라우트 수정 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 패키지 설치 + 유틸 함수 1개 + 2-3개 파일 수정
  - **Skills**: [`playwright`]
    - `playwright`: QA 시나리오에서 기사 페이지 DOM 확인 필요

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4, 5, 6)
  - **Blocks**: Tasks 8, 10
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/app/(public)/article/[id]/page.tsx:116-119` — 현재 dangerouslySetInnerHTML 사용 위치. 이곳을 sanitizeHtml로 감싸야 함
  - `src/lib/db.ts:121-133` — searchArticles 함수. line 128의 `or()` 쿼리에서 사용자 입력이 직접 들어감. escapeLikeQuery 적용 필요

  **API/Type References**:
  - `src/lib/types.ts:27-42` — Article 타입. content 필드가 HTML string

  **External References**:
  - isomorphic-dompurify npm: https://www.npmjs.com/package/isomorphic-dompurify — SSR/CSR 모두 동작하는 DOMPurify 래퍼

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 기사 페이지 HTML이 sanitized 상태로 렌더링됨
    Tool: Playwright
    Preconditions: dev 서버 실행 중, 기사가 1개 이상 존재
    Steps:
      1. page.goto('/article/{첫번째기사ID}')
      2. const articleContent = page.locator('article .prose')
      3. const html = await articleContent.innerHTML()
      4. assert: html에 <script> 태그 없음
      5. assert: html에 onerror=, onclick= 등 인라인 이벤트 핸들러 없음
      6. assert: <p>, <h2>, <a> 등 허용 태그는 정상 존재
    Expected Result: sanitized HTML만 렌더링, XSS 벡터 제거
    Failure Indicators: <script> 태그 존재, 인라인 이벤트 핸들러 존재
    Evidence: .sisyphus/evidence/task-1-xss-sanitize.png

  Scenario: 검색 쿼리 특수문자 이스케이프
    Tool: Bash (curl)
    Preconditions: dev 서버 실행 중
    Steps:
      1. curl -s "http://localhost:3000/search?q=%25DROP%25" — % 포함 쿼리
      2. assert: HTTP 200 반환 (서버 에러 아님)
      3. curl -s "http://localhost:3000/search?q=test'OR'1'='1" — SQL injection 패턴
      4. assert: HTTP 200 반환, 정상 검색 결과 페이지
    Expected Result: 특수문자가 이스케이프되어 안전하게 처리
    Failure Indicators: 500 에러, 서버 크래시
    Evidence: .sisyphus/evidence/task-1-search-escape.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `fix(security): add DOMPurify HTML sanitization and search query escaping`
  - Files: `src/lib/sanitize.ts`, `src/app/(public)/article/[id]/page.tsx`, `src/lib/db.ts`
  - Pre-commit: `npm run build`

- [x] 2. Header DB 연동 — mock 데이터 → Supabase categories props 전달

  **What to do**:
  - `src/app/(public)/layout.tsx`에서 `getCategories()` 호출하여 categories 데이터 fetch
  - `Header` 컴포넌트에 `categories` props 전달: `<Header categories={categories} />`
  - `src/components/layout/Header.tsx` 수정:
    - `import { categories } from "@/lib/mock-data"` 제거
    - props로 `categories: Category[]` 받도록 변경
    - Category 타입은 `@/lib/types`에서 import
  - 기존 `"use client"` 유지 (useState 사용하므로)

  **Must NOT do**:
  - Header를 서버 컴포넌트로 변경하지 않음 (useState 필요)
  - special/ 레이아웃 수정하지 않음 (자체 인라인 Header 사용)
  - 디자인/스타일 변경하지 않음

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 2개 파일 수정, props 전달 패턴
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4, 5, 6)
  - **Blocks**: Task 7
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/components/layout/Header.tsx:6` — 현재 `import { categories } from "@/lib/mock-data"` 위치. 이 줄 제거
  - `src/components/layout/Header.tsx:133` — categories.map() 사용 위치. props로 변경
  - `src/app/(public)/layout.tsx:1-16` — 레이아웃 파일. 여기서 getCategories() 호출 + Header에 props 전달

  **API/Type References**:
  - `src/lib/types.ts:8-14` — Category 타입 정의
  - `src/lib/db.ts:201-216` — getCategories() 함수

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Header에 DB 카테고리가 표시됨
    Tool: Bash (grep)
    Preconditions: 빌드 가능 상태
    Steps:
      1. grep -r "mock-data" src/components/layout/Header.tsx
      2. assert: 결과 없음 (mock-data import 제거됨)
      3. npm run build
      4. assert: 빌드 성공
    Expected Result: Header에서 mock-data 의존성 완전 제거, 빌드 성공
    Failure Indicators: mock-data import 잔존, 빌드 실패
    Evidence: .sisyphus/evidence/task-2-header-no-mock.txt

  Scenario: Header 네비게이션이 정상 렌더링됨
    Tool: Playwright
    Preconditions: dev 서버 실행 중
    Steps:
      1. page.goto('/')
      2. const navItems = page.locator('nav ul li a')
      3. const count = await navItems.count()
      4. assert: count >= 2 (최소 창간특별호 + 1개 이상 카테고리)
      5. const firstCatText = await navItems.nth(1).textContent()
      6. assert: firstCatText가 빈 문자열이 아님
    Expected Result: DB에서 가져온 카테고리가 네비게이션에 표시
    Failure Indicators: 네비게이션 비어있음, 에러 발생
    Evidence: .sisyphus/evidence/task-2-header-nav.png
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `refactor(header): replace mock categories with Supabase DB data`
  - Files: `src/components/layout/Header.tsx`, `src/app/(public)/layout.tsx`

- [x] 3. Footer DB 연동 — mock 데이터 → Supabase 직접 조회

  **What to do**:
  - `src/components/layout/Footer.tsx` 수정:
    - `import { categories } from "@/lib/mock-data"` 제거
    - `import { getCategories } from "@/lib/db"` 추가
    - 컴포넌트를 `async` 서버 컴포넌트로 변경: `export default async function Footer()`
    - 함수 내에서 `const categories = await getCategories()` 호출
    - 나머지 JSX는 동일하게 유지

  **Must NOT do**:
  - Footer 디자인/레이아웃 변경 금지
  - special/ 레이아웃의 인라인 footer 수정 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 파일 수정, import 교체 + async 추가
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4, 5, 6)
  - **Blocks**: Task 7
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/components/layout/Footer.tsx:2` — 현재 `import { categories } from "@/lib/mock-data"` 위치
  - `src/components/layout/Footer.tsx:30,45` — categories 사용 위치 (slice로 분할 표시)

  **API/Type References**:
  - `src/lib/db.ts:201-216` — getCategories() 함수. Category[] 반환

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Footer에서 mock-data 의존성 제거됨
    Tool: Bash (grep)
    Preconditions: 빌드 가능 상태
    Steps:
      1. grep -r "mock-data" src/components/layout/Footer.tsx
      2. assert: 결과 없음
      3. npm run build
      4. assert: 빌드 성공
    Expected Result: Footer에서 mock-data import 완전 제거
    Failure Indicators: mock-data import 잔존
    Evidence: .sisyphus/evidence/task-3-footer-no-mock.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `refactor(footer): replace mock categories with Supabase DB query`
  - Files: `src/components/layout/Footer.tsx`

- [x] 4. 죽은 링크 수정

  **What to do**:
  - `src/components/layout/Header.tsx`:
    - 상단 바의 "로그인" `<Link href="#">` → 제거 (공개 인증 없음)
    - 상단 바의 "회원가입" `<Link href="#">` → 제거
    - 대신 빈 공간이 남지 않도록 날짜 옆에 전화번호나 이메일 등 유용한 정보로 교체하거나, 우측 영역을 자연스럽게 정리
  - `src/components/layout/Footer.tsx`:
    - "광고문의" `<Link href="#">` → `<a href="mailto:jebo@kjtimes.co.kr">` 또는 전화번호 연결 `<a href="tel:010-9428-5361">`
  - Header의 `<button>` 요소들에 `type="button"` 명시 추가 (LSP 경고 해결)
  - Header의 `<svg>` 내 빈 `<path>` title 접근성 경고 해결: aria-hidden="true" 추가

  **Must NOT do**:
  - 로그인/회원가입 페이지 생성 금지
  - 디자인 톤 변경 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 2개 파일, 링크 텍스트/href 변경
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/components/layout/Header.tsx:38-43` — 로그인/회원가입 링크 위치
  - `src/components/layout/Header.tsx:52-53` — 모바일 햄버거 button (type 누락)
  - `src/components/layout/Header.tsx:94-95` — 검색 toggle button (type 누락)
  - `src/components/layout/Footer.tsx:84` — 광고문의 링크 위치

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 죽은 링크 제거 확인
    Tool: Bash (grep)
    Steps:
      1. grep -n 'href="#"' src/components/layout/Header.tsx
      2. assert: 결과 없음
      3. grep -n 'href="#"' src/components/layout/Footer.tsx
      4. assert: 결과 없음
    Expected Result: 두 파일 모두에서 href="#" 완전 제거
    Evidence: .sisyphus/evidence/task-4-no-dead-links.txt

  Scenario: 광고문의 링크가 동작함
    Tool: Playwright
    Preconditions: dev 서버 실행 중
    Steps:
      1. page.goto('/')
      2. const adLink = page.locator('footer').locator('text=광고문의')
      3. const href = await adLink.getAttribute('href')
      4. assert: href가 'mailto:' 또는 'tel:'로 시작
    Expected Result: 광고문의가 이메일 또는 전화 링크로 변경됨
    Evidence: .sisyphus/evidence/task-4-ad-link.png
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `fix(layout): remove dead links, add proper contact links`
  - Files: `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`

- [x] 5. Loading 스켈레톤 추가

  **What to do**:
  - 다음 경로에 `loading.tsx` 파일 생성:
    - `src/app/(public)/loading.tsx` — 홈페이지 로딩 스켈레톤
    - `src/app/(public)/article/[id]/loading.tsx` — 기사 상세 로딩 스켈레톤
    - `src/app/(public)/category/[slug]/loading.tsx` — 카테고리 로딩 스켈레톤
    - `src/app/(public)/search/loading.tsx` — 검색 로딩 스켈레톤
  - 스켈레톤 디자인: Tailwind의 `animate-pulse` + `bg-gray-200` 블록으로 구성
  - 각 스켈레톤은 해당 페이지의 실제 레이아웃을 대략적으로 모방 (hero 영역, 기사 목록 등)
  - 간결하게 유지: 각 파일 30-50줄 이내

  **Must NOT do**:
  - 복잡한 스켈레톤 라이브러리 설치 금지
  - admin/ 경로에 loading 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 4개 새 파일 생성, 모두 간단한 JSX
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/app/(public)/page.tsx:78-156` — 홈페이지 히어로 섹션 구조 참고하여 스켈레톤 모양 결정
  - `src/app/(public)/article/[id]/page.tsx:50-157` — 기사 상세 레이아웃 구조
  - `src/app/globals.css:65-68` — shimmer 애니메이션 이미 정의됨 (활용 가능)

  **External References**:
  - Next.js loading.tsx: https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: loading.tsx 파일 존재 확인
    Tool: Bash
    Steps:
      1. ls src/app/\(public\)/loading.tsx
      2. ls src/app/\(public\)/article/\[id\]/loading.tsx
      3. ls src/app/\(public\)/category/\[slug\]/loading.tsx
      4. ls src/app/\(public\)/search/loading.tsx
      5. assert: 모든 파일 존재
      6. npm run build
      7. assert: 빌드 성공
    Expected Result: 4개 loading.tsx 파일 생성됨, 빌드 정상
    Evidence: .sisyphus/evidence/task-5-loading-files.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(ux): add loading skeletons for public routes`
  - Files: `src/app/(public)/loading.tsx`, `src/app/(public)/article/[id]/loading.tsx`, `src/app/(public)/category/[slug]/loading.tsx`, `src/app/(public)/search/loading.tsx`

- [x] 6. Error boundary 추가

  **What to do**:
  - 기존 `src/app/(public)/error.tsx` 확인 후 개선:
    - button에 `type="button"` 추가 (LSP 경고 해결)
    - 에러 메시지를 더 사용자 친화적으로
  - 다음 경로에 `error.tsx` 추가:
    - `src/app/(public)/article/[id]/error.tsx` — 기사 로딩 실패 시
    - `src/app/(public)/category/[slug]/error.tsx` — 카테고리 로딩 실패 시
  - 모든 error.tsx는 `"use client"` + `reset()` 함수 포함
  - 디자인: 기존 not-found.tsx 스타일과 일관되게 (흰색 카드, 중앙 정렬)

  **Must NOT do**:
  - admin/ 경로 수정 금지
  - 에러 리포팅 서비스(Sentry 등) 통합 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 2-3개 파일 생성/수정, 간단한 UI 컴포넌트
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/app/(public)/error.tsx` — 기존 에러 컴포넌트 (개선 대상)
  - `src/app/not-found.tsx:1-19` — 디자인 패턴 참고 (흰색 카드, 중앙 정렬, "홈으로 돌아가기" 버튼)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: error.tsx 파일 존재 + 빌드 성공
    Tool: Bash
    Steps:
      1. ls src/app/\(public\)/error.tsx src/app/\(public\)/article/\[id\]/error.tsx src/app/\(public\)/category/\[slug\]/error.tsx
      2. assert: 모든 파일 존재
      3. grep -l '"use client"' src/app/\(public\)/article/\[id\]/error.tsx
      4. assert: "use client" 포함
      5. npm run build
      6. assert: 빌드 성공
    Expected Result: error boundary 파일 생성됨, 클라이언트 컴포넌트, 빌드 정상
    Evidence: .sisyphus/evidence/task-6-error-boundaries.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(ux): add error boundaries for article and category pages`
  - Files: `src/app/(public)/error.tsx`, `src/app/(public)/article/[id]/error.tsx`, `src/app/(public)/category/[slug]/error.tsx`

- [x] 7. mock-data.ts 정리

  **What to do**:
  - Task 2, 3 완료 후 실행 (Header/Footer가 더 이상 mock-data를 import하지 않아야 함)
  - `src/lib/mock-data.ts`에서:
    - `articles` 배열 전체 삭제 (410줄 → 대폭 축소)
    - `authors` 배열 전체 삭제
    - `categories` 배열은 유지할 수 있으나, 다른 곳에서 import하는지 확인 후 결정
  - `grep -r "mock-data" src/` 실행하여 잔여 import 확인
    - 만약 categories만 남은 import가 있다면 해당 파일도 DB 조회로 전환
    - 모든 import 제거 가능하면 `mock-data.ts` 파일 자체를 삭제
  - `src/lib/nf-mock-data.ts`도 확인: 사용처 없으면 삭제

  **Must NOT do**:
  - admin/ 라우트에서 mock-data 사용하는 경우 수정 금지 (admin은 범위 외)
  - 단, admin에서도 mock-data를 쓰지 않는다면 파일 삭제 가능

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: grep으로 사용처 확인 + 파일 삭제/축소
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (T2, T3 완료 후)
  - **Parallel Group**: Wave 1 후반
  - **Blocks**: None
  - **Blocked By**: Task 2, Task 3

  **References**:

  **Pattern References**:
  - `src/lib/mock-data.ts` — 전체 파일 (411줄). articles/authors 배열이 대부분
  - `src/lib/nf-mock-data.ts` — News Factory mock 데이터 (사용처 확인 필요)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: mock-data 의존성 완전 제거 확인
    Tool: Bash
    Steps:
      1. grep -r "mock-data" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v ".next"
      2. assert: 결과가 없거나, admin/ 경로만 남음
      3. npm run build
      4. assert: 빌드 성공
    Expected Result: public 라우트에서 mock-data 의존성 완전 제거
    Failure Indicators: Header/Footer/public 컴포넌트에서 mock-data import 잔존
    Evidence: .sisyphus/evidence/task-7-mock-cleanup.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `chore: remove unused mock data (articles, authors)`
  - Files: `src/lib/mock-data.ts` (또는 삭제)

- [ ] 8. Open Graph + Twitter Card 메타데이터 추가

  **What to do**:
  - `src/lib/constants.ts` 생성: `SITE_URL`, `SITE_NAME`, `DEFAULT_OG_IMAGE` 등 상수 정의
    - `SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kj-news.vercel.app"`
  - `src/app/layout.tsx`의 metadata 객체에 글로벌 OG 메타 추가:
    - `openGraph: { type: "website", locale: "ko_KR", siteName: "광전타임즈", images: [DEFAULT_OG_IMAGE] }`
    - `twitter: { card: "summary_large_image", site: "@kjtimes" }`
  - `src/app/(public)/page.tsx`에 `generateMetadata` 추가 (또는 export metadata):
    - title, description, openGraph (홈페이지용)
  - `src/app/(public)/article/[id]/page.tsx`의 `generateMetadata` 개선:
    - `openGraph: { title, description, images: [article.thumbnailUrl || DEFAULT_OG_IMAGE], type: "article", publishedTime, authors }`
    - `twitter: { card: "summary_large_image", title, description, images }`
  - `src/app/(public)/category/[slug]/page.tsx`의 `generateMetadata` 개선:
    - openGraph + twitter 추가
  - `src/app/(public)/search/page.tsx`의 `generateMetadata` 개선
  - `src/app/sitemap.ts`와 `src/app/robots.ts`에서 하드코딩된 URL을 `SITE_URL` 상수로 교체

  **Must NOT do**:
  - 실제 OG 이미지 생성 API (next/og) 구현 금지 — 기사 썸네일 또는 기본 로고 이미지 사용
  - special/ 라우트 메타데이터 수정 금지 (이미 자체 metadata 있음)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 5-6개 파일 수정, metadata 객체 구성 필요
  - **Skills**: [`playwright`]
    - `playwright`: OG meta 태그 존재 확인

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 9-13)
  - **Blocks**: None
  - **Blocked By**: Task 1 (Wave 1 완료)

  **References**:

  **Pattern References**:
  - `src/app/layout.tsx:11-15` — 현재 metadata 객체. openGraph/twitter 추가 위치
  - `src/app/(public)/article/[id]/page.tsx:30-38` — 기존 generateMetadata. OG 확장 필요
  - `src/app/(public)/category/[slug]/page.tsx:28-36` — 기존 generateMetadata
  - `src/app/sitemap.ts:4` — `const baseUrl = "https://kj-news.vercel.app"` 하드코딩 위치
  - `src/app/robots.ts:12` — sitemap URL 하드코딩 위치

  **External References**:
  - Next.js Metadata: https://nextjs.org/docs/app/building-your-application/optimizing/metadata

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 홈페이지 OG 메타 태그 존재
    Tool: Bash (curl)
    Preconditions: dev 서버 실행 중
    Steps:
      1. curl -s http://localhost:3000 | grep -o 'property="og:[^"]*"' | sort
      2. assert: og:title, og:description, og:type, og:image, og:locale 존재
      3. curl -s http://localhost:3000 | grep -o 'name="twitter:[^"]*"' | sort
      4. assert: twitter:card, twitter:title 존재
    Expected Result: OG + Twitter 메타 태그 모두 존재
    Evidence: .sisyphus/evidence/task-8-og-home.txt

  Scenario: 기사 페이지 OG 메타에 기사 정보 포함
    Tool: Bash (curl)
    Preconditions: dev 서버 실행 중, 기사 존재
    Steps:
      1. curl -s http://localhost:3000/article/{첫번째기사ID} | grep 'og:type'
      2. assert: content="article" 포함
      3. curl -s http://localhost:3000/article/{첫번째기사ID} | grep 'og:image'
      4. assert: content에 이미지 URL 포함 (빈 문자열 아님)
    Expected Result: 기사별 OG 메타 동적 생성
    Evidence: .sisyphus/evidence/task-8-og-article.txt
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(seo): add Open Graph and Twitter Card metadata to all public pages`
  - Files: `src/lib/constants.ts`, `src/app/layout.tsx`, `src/app/(public)/article/[id]/page.tsx`, `src/app/(public)/category/[slug]/page.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`

- [ ] 9. RSS 피드 생성

  **What to do**:
  - `src/app/feed.xml/route.ts` 생성 (Route Handler):
    - `getPublishedArticles(20)` 호출하여 최신 20개 기사 fetch
    - RSS 2.0 XML 포맷으로 응답 생성
    - `Content-Type: application/xml; charset=utf-8` 헤더
    - 각 item: title, link, description (excerpt), pubDate, category, guid
    - channel: title("광전타임즈"), link(SITE_URL), description, language("ko")
  - `src/components/layout/Header.tsx`에 RSS 아이콘 링크 추가 (데스크톱 검색바 옆)
  - `src/app/layout.tsx`의 metadata에 `alternates: { types: { "application/rss+xml": "/feed.xml" } }` 추가

  **Must NOT do**:
  - RSS 라이브러리 설치 금지 — 직접 XML 문자열 생성 (간단하므로)
  - Atom 피드 추가 금지 — RSS 2.0만

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 1개 route handler + 2개 파일 수정
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: Wave 1 완료

  **References**:

  **Pattern References**:
  - `src/app/sitemap.ts` — Route handler 패턴 참고 (Supabase 호출 + XML 생성)
  - `src/lib/db.ts:61-72` — getPublishedArticles 함수
  - `src/lib/constants.ts` — SITE_URL 상수 (Task 8에서 생성)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: RSS 피드가 유효한 XML 반환
    Tool: Bash (curl)
    Preconditions: dev 서버 실행 중
    Steps:
      1. curl -s http://localhost:3000/feed.xml | head -5
      2. assert: 첫 줄에 <?xml 포함
      3. assert: <rss version="2.0"> 포함
      4. curl -s http://localhost:3000/feed.xml | grep '<item>' | wc -l
      5. assert: 1개 이상의 <item> 존재
    Expected Result: 유효한 RSS 2.0 XML, 기사 항목 포함
    Evidence: .sisyphus/evidence/task-9-rss-feed.txt

  Scenario: RSS 피드 빈 기사일 때 처리
    Tool: Bash (curl)
    Steps:
      1. curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/feed.xml
      2. assert: HTTP 200
    Expected Result: 기사 없어도 200 반환 (빈 channel)
    Evidence: .sisyphus/evidence/task-9-rss-empty.txt
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(seo): add RSS 2.0 feed at /feed.xml`
  - Files: `src/app/feed.xml/route.ts`, `src/app/layout.tsx`

- [ ] 10. 조회수 증가 로직 구현

  **What to do**:
  - `src/app/api/articles/[id]/view/route.ts` 생성 (POST Route Handler):
    - article ID를 받아 Supabase `articles` 테이블의 `view_count`를 +1 증가 (RPC 또는 update)
    - Rate limiting: 간단한 방법으로 동일 IP의 중복 카운트 방지 (선택사항 — 복잡하면 스킵)
    - 응답: `{ viewCount: number }` JSON
  - `src/components/ViewCounter.tsx` 클라이언트 컴포넌트 생성:
    - `"use client"` — useEffect에서 POST `/api/articles/${id}/view` 호출
    - 페이지 로드 시 1회만 호출 (StrictMode 대응: useRef flag)
    - UI 렌더링 없음 (보이지 않는 컴포넌트)
  - `src/app/(public)/article/[id]/page.tsx`에 `<ViewCounter id={article.id} />` 추가

  **Must NOT do**:
  - Redis 등 별도 인프라 추가 금지
  - 클라이언트에서 직접 Supabase 업데이트 금지 (API route 경유)
  - 조회수 실시간 반영 WebSocket 등 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: API route + 클라이언트 컴포넌트 + 기존 페이지 수정
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: Wave 1 완료

  **References**:

  **Pattern References**:
  - `src/app/api/email/route.ts` — 기존 API route 패턴 참고
  - `src/lib/supabase/server.ts` — createServiceClient 사용 패턴
  - `src/app/(public)/article/[id]/page.tsx:99` — 현재 viewCount 표시 위치

  **API/Type References**:
  - Supabase articles 테이블: `view_count` integer 컬럼

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 조회수 API가 정상 동작
    Tool: Bash (curl)
    Preconditions: dev 서버 실행 중, 기사 존재
    Steps:
      1. curl -s http://localhost:3000/api/articles/{기사ID}/view -X POST
      2. assert: HTTP 200
      3. assert: 응답 JSON에 viewCount 필드 존재
    Expected Result: POST 호출 시 200 + viewCount 반환
    Evidence: .sisyphus/evidence/task-10-view-api.txt

  Scenario: 존재하지 않는 기사 ID로 호출
    Tool: Bash (curl)
    Steps:
      1. curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/articles/999999/view -X POST
      2. assert: HTTP 404
    Expected Result: 없는 기사 → 404
    Evidence: .sisyphus/evidence/task-10-view-404.txt
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat: implement article view count increment API + client component`
  - Files: `src/app/api/articles/[id]/view/route.ts`, `src/components/ViewCounter.tsx`, `src/app/(public)/article/[id]/page.tsx`

- [ ] 11. 페이지네이션 구현 (홈/카테고리/검색)

  **What to do**:
  - `src/lib/db.ts`에 페이지네이션 지원 함수 추가:
    - `getPublishedArticlesPaginated(page: number, perPage: number)` → `{ articles: Article[], total: number }`
    - `getArticlesByCategoryPaginated(slug: string, page: number, perPage: number)` → 동일
    - `searchArticlesPaginated(query: string, page: number, perPage: number)` → 동일
    - Supabase `.range(from, to)` 사용 + `.select('*', { count: 'exact' })`로 total 가져오기
  - `src/components/Pagination.tsx` 컴포넌트 생성:
    - props: `currentPage: number, totalPages: number, basePath: string`
    - "이전", "다음", 페이지 번호 표시
    - Link 컴포넌트로 `?page=N` 쿼리 파라미터 사용
    - 디자인: 모노크롬 톤, 간결한 스타일
  - `src/app/(public)/page.tsx` 수정:
    - searchParams에서 `page` 파라미터 읽기
    - `getPublishedArticlesPaginated(page, 18)` 사용
    - 하단에 `<Pagination />` 추가
  - `src/app/(public)/category/[slug]/page.tsx` 수정:
    - 동일 패턴 적용 (perPage: 15)
  - `src/app/(public)/search/page.tsx` 수정:
    - 동일 패턴 적용 (perPage: 12)

  **Must NOT do**:
  - 무한 스크롤 구현 금지 — 전통 페이지네이션만
  - 클라이언트 사이드 페이지네이션 금지 — 서버 사이드 쿼리

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: DB 함수 3개 + 컴포넌트 1개 + 페이지 3개 수정
  - **Skills**: [`playwright`]
    - `playwright`: 페이지네이션 네비게이션 확인

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: Wave 1 완료

  **References**:

  **Pattern References**:
  - `src/lib/db.ts:61-72` — getPublishedArticles 함수. 이를 기반으로 paginated 버전 생성
  - `src/lib/db.ts:86-106` — getArticlesByCategory 함수
  - `src/lib/db.ts:121-133` — searchArticles 함수
  - `src/app/(public)/page.tsx:49-54` — 현재 데이터 fetch 로직. paginated로 교체

  **External References**:
  - Supabase range/count: `.range(from, to)`, `.select('*', { count: 'exact' })`

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 홈페이지 페이지네이션 동작
    Tool: Playwright
    Preconditions: dev 서버 실행 중, 기사 19개 이상 존재
    Steps:
      1. page.goto('/')
      2. const pagination = page.locator('[data-testid="pagination"]') 또는 nav[aria-label="페이지네이션"]
      3. assert: pagination이 visible
      4. page.goto('/?page=2')
      5. assert: 페이지 정상 로드, 기사 목록 표시
    Expected Result: 페이지네이션 UI 존재, 2페이지 이동 가능
    Evidence: .sisyphus/evidence/task-11-pagination-home.png

  Scenario: 검색 페이지네이션 + 쿼리 유지
    Tool: Playwright
    Steps:
      1. page.goto('/search?q=정치&page=1')
      2. assert: 검색 결과 표시
      3. const url = page.url()
      4. assert: URL에 q=정치 포함
    Expected Result: 페이지 전환 시 검색 쿼리 유지
    Evidence: .sisyphus/evidence/task-11-pagination-search.png
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat: add server-side pagination to home, category, and search pages`
  - Files: `src/lib/db.ts`, `src/components/Pagination.tsx`, `src/app/(public)/page.tsx`, `src/app/(public)/category/[slug]/page.tsx`, `src/app/(public)/search/page.tsx`

- [ ] 12. 소셜 공유 버튼 컴포넌트

  **What to do**:
  - `src/components/ShareButtons.tsx` 클라이언트 컴포넌트 생성 (`"use client"`):
    - props: `title: string, url: string`
    - 4개 공유 버튼:
      - **카카오톡**: `https://story.kakao.com/share?url=` (간단 공유 — Kakao SDK 없이)
      - **페이스북**: `https://www.facebook.com/sharer/sharer.php?u=`
      - **X (트위터)**: `https://twitter.com/intent/tweet?text=&url=`
      - **링크 복사**: `navigator.clipboard.writeText(url)` + 복사 완료 토스트
    - 링크 복사 시 간단한 "복사됨" 피드백 (useState로 2초간 표시)
    - 디자인: 모노크롬, 작은 아이콘 버튼 (inline SVG)
    - `window.open()` 팝업으로 공유 창 열기 (target="_blank" 대신)
  - `src/app/(public)/article/[id]/page.tsx`에 `<ShareButtons />` 추가:
    - 기사 제목 + URL 전달
    - 태그 섹션 아래 또는 기사 상단 메타 영역에 배치

  **Must NOT do**:
  - Kakao JavaScript SDK 설치 금지 — URL 기반 공유만
  - 공유 카운트 표시 금지
  - 외부 공유 버튼 라이브러리 설치 금지

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI 컴포넌트 디자인 + 인터랙션 (복사 피드백)
  - **Skills**: [`playwright`]
    - `playwright`: 공유 버튼 클릭 확인

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: Wave 1 완료

  **References**:

  **Pattern References**:
  - `src/app/(public)/article/[id]/page.tsx:121-133` — 태그 섹션. 이 아래에 공유 버튼 배치
  - `src/app/globals.css` — 기존 디자인 톤 (모노크롬, gray 계열)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 기사 페이지에 공유 버튼 4개 존재
    Tool: Playwright
    Preconditions: dev 서버 실행 중
    Steps:
      1. page.goto('/article/{기사ID}')
      2. const shareSection = page.locator('[data-testid="share-buttons"]') 또는 적절한 선택자
      3. const buttons = shareSection.locator('button, a')
      4. const count = await buttons.count()
      5. assert: count >= 4
    Expected Result: 카카오, 페이스북, X, 링크복사 버튼 존재
    Evidence: .sisyphus/evidence/task-12-share-buttons.png

  Scenario: 링크 복사 동작
    Tool: Playwright
    Steps:
      1. page.goto('/article/{기사ID}')
      2. 링크 복사 버튼 클릭
      3. assert: "복사됨" 또는 유사한 피드백 텍스트가 표시됨
    Expected Result: 클립보드에 URL 복사 + 사용자 피드백
    Evidence: .sisyphus/evidence/task-12-copy-link.png
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat: add social sharing buttons to article page`
  - Files: `src/components/ShareButtons.tsx`, `src/app/(public)/article/[id]/page.tsx`

- [ ] 13. 기사 인쇄 CSS

  **What to do**:
  - `src/app/globals.css`에 `@media print` 규칙 추가:
    - Header, Footer, Sidebar, 공유 버튼, 네비게이션 숨기기: `display: none`
    - 기사 본문 영역: 전체 너비, 검정 텍스트, 흰색 배경
    - 이미지: max-width 100%, page-break-inside: avoid
    - 링크: URL 표시 (a::after { content: " (" attr(href) ")" })
    - 페이지 여백 설정
  - `src/app/(public)/article/[id]/page.tsx`에 "인쇄" 버튼 추가:
    - `window.print()` 호출하는 클라이언트 컴포넌트 (또는 inline onClick)
    - 프린터 아이콘 + "인쇄" 텍스트
    - 기사 메타 영역 (날짜/조회수 근처)에 배치

  **Must NOT do**:
  - PDF 변환 라이브러리 금지
  - 별도 인쇄 페이지 생성 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: CSS @media print + 작은 버튼 1개
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: Wave 1 완료

  **References**:

  **Pattern References**:
  - `src/app/globals.css` — 기존 CSS 파일. @media print 추가 위치
  - `src/app/(public)/article/[id]/page.tsx:81-101` — 기사 메타 영역. 인쇄 버튼 배치 위치

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: print CSS가 존재하고 불필요한 요소 숨김
    Tool: Bash (grep)
    Steps:
      1. grep -c "@media print" src/app/globals.css
      2. assert: 1 이상
      3. grep "display.*none" src/app/globals.css | grep -c "print"
      4. assert: header, footer 등 숨김 규칙 존재
    Expected Result: @media print 블록에 숨김 규칙 포함
    Evidence: .sisyphus/evidence/task-13-print-css.txt
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat: add print-friendly CSS and print button to articles`
  - Files: `src/app/globals.css`, `src/app/(public)/article/[id]/page.tsx`

- [ ] 14. 접근성(A11y) 개선

  **What to do**:
  - `src/app/(public)/layout.tsx`에 Skip Navigation 추가:
    - `<a href="#main-content" className="sr-only focus:not-sr-only ...">본문으로 바로가기</a>`를 `<Header>` 앞에 배치
    - `<main>` 태그에 `id="main-content"` 추가
  - `src/components/layout/Header.tsx`:
    - 모바일 메뉴 버튼: `aria-expanded={mobileMenuOpen}`, `aria-controls="mobile-menu"`
    - 검색 토글: `aria-expanded={searchOpen}`, `aria-controls="mobile-search"`
    - 모바일 메뉴 `<div>`: `id="mobile-menu"`, `role="navigation"`, `aria-label="모바일 메뉴"`
    - SVG 아이콘들: `aria-hidden="true"` 추가
    - 네비게이션 `<nav>`: `aria-label="주 메뉴"`
  - `src/components/layout/Footer.tsx`:
    - `<footer>`: `aria-label="사이트 정보"` 또는 `role="contentinfo"` (이미 footer이면 불필요)
  - `src/components/SearchBar.tsx`:
    - 입력 필드에 `aria-label="검색어 입력"` (label이 없는 경우)
  - 전체적으로 인터랙티브 이미지에 의미 있는 alt 텍스트 확인

  **Must NOT do**:
  - WAI-ARIA 과다 사용 금지 (시맨틱 HTML이 이미 충분한 곳)
  - admin/ 접근성 수정 금지
  - 색상 대비 전면 수정 금지 (기존 디자인 유지)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 4-5개 파일 수정, ARIA 속성 추가
  - **Skills**: [`playwright`]
    - `playwright`: 접근성 속성 존재 확인

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 15, 16, 17)
  - **Blocks**: None
  - **Blocked By**: Task 2 (Header 수정 후)

  **References**:

  **Pattern References**:
  - `src/components/layout/Header.tsx:52-78` — 모바일 햄버거 버튼 + SVG
  - `src/components/layout/Header.tsx:94-112` — 검색 토글 + SVG
  - `src/components/layout/Header.tsx:122-145` — 데스크톱 네비게이션
  - `src/components/layout/Header.tsx:155-177` — 모바일 메뉴
  - `src/app/(public)/layout.tsx:4-16` — 레이아웃 구조

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Skip Navigation 존재 + 동작
    Tool: Playwright
    Preconditions: dev 서버 실행 중
    Steps:
      1. page.goto('/')
      2. await page.keyboard.press('Tab')
      3. const skipLink = page.locator('a:has-text("본문으로 바로가기")')
      4. assert: await skipLink.isVisible() === true (포커스 시 표시)
      5. const href = await skipLink.getAttribute('href')
      6. assert: href === '#main-content'
      7. const main = page.locator('#main-content')
      8. assert: await main.count() === 1
    Expected Result: Tab 시 skip nav 표시, main-content ID 존재
    Evidence: .sisyphus/evidence/task-14-skip-nav.png

  Scenario: 모바일 메뉴 ARIA 속성 존재
    Tool: Bash (grep)
    Steps:
      1. grep "aria-expanded" src/components/layout/Header.tsx
      2. assert: 2개 이상 (메뉴 버튼, 검색 버튼)
      3. grep "aria-label" src/components/layout/Header.tsx
      4. assert: 1개 이상
    Expected Result: ARIA 속성 적절히 적용됨
    Evidence: .sisyphus/evidence/task-14-aria-attrs.txt
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat(a11y): add skip navigation, ARIA labels, and keyboard accessibility`
  - Files: `src/app/(public)/layout.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`, `src/components/SearchBar.tsx`

- [ ] 15. 모바일 UX 개선

  **What to do**:
  - `src/components/layout/Header.tsx` 모바일 메뉴 애니메이션:
    - 현재: 조건부 렌더링 (mobileMenuOpen && ...) → 뚝 나타남/사라짐
    - 개선: CSS transition 또는 기존 globals.css의 slide-up 애니메이션 활용
    - 메뉴 열림: slide-down 또는 fade-in 애니메이션
    - 메뉴 닫힘: slide-up 또는 fade-out
    - 검색 바도 동일하게 부드러운 전환
  - 모바일 메뉴가 열렸을 때 body 스크롤 잠금 (overflow: hidden)
  - 모바일 검색 UX 개선: 검색 열렸을 때 입력 필드에 자동 포커스

  **Must NOT do**:
  - 하단 네비게이션 바(Bottom Nav) 추가 금지 — 범위 과다
  - framer-motion 등 애니메이션 라이브러리 설치 금지 — CSS만 사용
  - 데스크톱 레이아웃 변경 금지

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: CSS 애니메이션 + 모바일 인터랙션 디자인
  - **Skills**: [`playwright`]
    - `playwright`: 모바일 뷰포트에서 메뉴 동작 확인

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: Task 2 (Header 수정 후)

  **References**:

  **Pattern References**:
  - `src/components/layout/Header.tsx:148-177` — 모바일 검색 + 메뉴 (조건부 렌더링)
  - `src/app/globals.css:233-258` — 기존 slide-up, slide-down, fade 애니메이션 정의 (재사용 가능)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 모바일 메뉴 애니메이션 동작
    Tool: Playwright
    Preconditions: dev 서버 실행 중
    Steps:
      1. page.setViewportSize({ width: 375, height: 812 })
      2. page.goto('/')
      3. const menuBtn = page.locator('button[aria-label="메뉴"]')
      4. await menuBtn.click()
      5. await page.waitForTimeout(400)
      6. screenshot → .sisyphus/evidence/task-15-mobile-menu-open.png
      7. assert: 모바일 메뉴 visible
      8. await menuBtn.click()
      9. await page.waitForTimeout(400)
      10. screenshot → .sisyphus/evidence/task-15-mobile-menu-closed.png
    Expected Result: 메뉴 열림/닫힘이 부드러운 애니메이션으로 전환
    Evidence: .sisyphus/evidence/task-15-mobile-menu-open.png, task-15-mobile-menu-closed.png
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat(mobile): add smooth menu animation and improved mobile UX`
  - Files: `src/components/layout/Header.tsx`, `src/app/globals.css` (필요시)

- [ ] 16. 뉴스레터 구독 UI

  **What to do**:
  - `src/components/NewsletterSubscribe.tsx` 클라이언트 컴포넌트 생성:
    - 이메일 입력 필드 + "구독" 버튼
    - 상태 관리: idle → loading → success | error
    - POST `/api/email` 호출 (기존 이메일 API 활용)
    - 성공 시: "구독 신청이 완료되었습니다" 메시지
    - 에러 시: "잠시 후 다시 시도해주세요" 메시지
    - 기본 이메일 validation (format 체크)
    - 디자인: 모노크롬, 컴팩트 (사이드바 또는 푸터에 들어갈 크기)
  - `src/app/(public)/page.tsx`의 사이드바 영역에 `<NewsletterSubscribe />` 추가:
    - "많이 본 뉴스" 아래에 배치
  - 또는 `src/components/layout/Footer.tsx`에 뉴스레터 섹션 추가

  **Must NOT do**:
  - Double opt-in 워크플로우 금지
  - 구독자 관리 대시보드 금지
  - 구독 해지 기능 금지 (이번 범위 외)
  - 외부 뉴스레터 서비스 (Mailchimp 등) 통합 금지

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 폼 UI + 상태 관리 + 인터랙션 피드백
  - **Skills**: [`playwright`]
    - `playwright`: 폼 입력/제출 확인

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: Wave 2 완료

  **References**:

  **Pattern References**:
  - `src/app/api/email/route.ts` — 기존 이메일 API. 이 엔드포인트로 POST
  - `src/app/(public)/page.tsx:206-234` — 사이드바 "많이 본 뉴스" 영역. 이 아래에 뉴스레터 배치
  - `src/app/globals.css` — admin-input, admin-btn 스타일 참고 (공개 페이지용 변형)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 뉴스레터 구독 UI 존재 + 이메일 입력 가능
    Tool: Playwright
    Preconditions: dev 서버 실행 중
    Steps:
      1. page.goto('/')
      2. const emailInput = page.locator('input[type="email"]')
      3. assert: await emailInput.isVisible() === true
      4. await emailInput.fill('test@example.com')
      5. const submitBtn = page.locator('button:has-text("구독")') 또는 유사
      6. assert: await submitBtn.isVisible() === true
    Expected Result: 이메일 입력 필드 + 구독 버튼 존재
    Evidence: .sisyphus/evidence/task-16-newsletter-ui.png

  Scenario: 잘못된 이메일 형식 처리
    Tool: Playwright
    Steps:
      1. page.goto('/')
      2. const emailInput = page.locator('input[type="email"]')
      3. await emailInput.fill('invalid-email')
      4. 구독 버튼 클릭
      5. assert: 에러 메시지 표시 또는 HTML5 validation 발동
    Expected Result: 잘못된 이메일 → 제출 차단 또는 에러 메시지
    Evidence: .sisyphus/evidence/task-16-newsletter-invalid.png
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat: add newsletter subscription UI component`
  - Files: `src/components/NewsletterSubscribe.tsx`, `src/app/(public)/page.tsx`

- [ ] 17. Vercel Analytics 통합

  **What to do**:
  - `npm install @vercel/analytics` 설치
  - `src/app/layout.tsx`에서:
    - `import { Analytics } from "@vercel/analytics/react"` 추가
    - `<body>` 내부 마지막에 `<Analytics />` 컴포넌트 추가
  - Vercel 대시보드에서 자동으로 데이터 수집 시작

  **Must NOT do**:
  - Google Analytics 추가 금지 — Vercel Analytics만
  - Speed Insights 추가 금지 (선택사항이므로 이번에는 스킵)
  - 커스텀 이벤트 트래킹 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 1개 패키지 설치 + 1개 파일 수정 (2줄)
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: Wave 2 완료

  **References**:

  **Pattern References**:
  - `src/app/layout.tsx:17-29` — 루트 레이아웃. `<body>` 내부에 `<Analytics />` 추가

  **External References**:
  - @vercel/analytics: https://vercel.com/docs/analytics

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Analytics 컴포넌트 포함 확인
    Tool: Bash
    Steps:
      1. grep "@vercel/analytics" src/app/layout.tsx
      2. assert: import 문 존재
      3. grep "<Analytics" src/app/layout.tsx
      4. assert: 컴포넌트 사용 존재
      5. npm run build
      6. assert: 빌드 성공
    Expected Result: Analytics 통합 완료, 빌드 정상
    Evidence: .sisyphus/evidence/task-17-analytics.txt
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat: integrate Vercel Analytics`
  - Files: `src/app/layout.tsx`, `package.json`

---

## Final Verification Wave

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npm run build` + linter. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp). Verify no `dangerouslySetInnerHTML` without DOMPurify. Verify no mock-data imports in Header/Footer.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start dev server. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration: OG meta on paginated pages, social share on articles with view count, RSS containing paginated articles. Test edge cases: empty search, invalid category, article with no image. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1 — everything in spec was built, nothing beyond spec was built. Check "Must NOT do" compliance: no public auth pages, no special/ layout changes, no admin/ changes, no NF changes. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

각 Wave 완료 후 커밋:
- Wave 1: `fix(security): XSS 방지 + Header/Footer DB 연동 + 죽은링크 수정 + loading/error 상태`
- Wave 2: `feat(seo): OG meta + RSS + 조회수 + 페이지네이션 + 소셜공유 + 인쇄`
- Wave 3: `feat(ux): 접근성 + 모바일UX + 뉴스레터 + 애널리틱스`

---

## Success Criteria

### Verification Commands
```bash
npm run build                    # Expected: 0 errors
curl -s http://localhost:3000 | grep 'og:title'    # Expected: og:title 존재
curl -s http://localhost:3000/feed.xml | head -5     # Expected: <?xml + <rss
curl -s http://localhost:3000 | grep 'skip-nav'     # Expected: skip navigation link
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] `npm run build` passes
- [ ] 모든 공개 페이지 OG meta 존재
- [ ] RSS 피드 유효
- [ ] 조회수 증가 동작
- [ ] 페이지네이션 동작
- [ ] 소셜 공유 동작
- [ ] mock-data.ts에서 articles/authors 제거됨
