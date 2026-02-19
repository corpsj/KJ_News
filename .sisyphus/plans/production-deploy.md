# KJ_News 프로덕션 배포 준비

## TL;DR

> **Quick Summary**: 광전타임즈(KJ_News) Next.js 뉴스 웹사이트의 프로덕션 배포 준비. Mock 데이터 제거, 보안 취약점 수정, 테스트 인프라 구축(vitest + TDD), Vercel 배포 설정, SEO/접근성 강화를 모두 포함하는 완전한 프로덕션 준비.
> 
> **Deliverables**:
> - Mock/더미 데이터 완전 제거 (NF articles, connection, sync logs, picsum URLs)
> - 보안 취약점 수정 (XSS, API 인증, rate limiting, CSP/HSTS 헤더)
> - 뉴스레터 기능 비활성화 + Kakao 공유 숨김
> - Vitest 테스트 인프라 + TDD 기반 구현
> - Vercel 배포 설정 및 환경변수 가이드
> - JSON-LD 구조화 데이터, 접근성 개선
> - 프로덕션 빌드 검증 통과
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 5 waves
> **Critical Path**: Task 1 → Task 2 → Task 3/4/5 (parallel) → Task 8/9/10 (parallel) → Task 15 → Final

---

## Context

### Original Request
"더미 데이터를 모두 지우고 이제 배포를 준비해. 배포는 vercel을 사용할거고 db는 supabase야. 그외에 고려 사항이 있을까?"

### Interview Summary
**Key Discussions**:
- **배포 범위**: 전부 (CRITICAL + IMPORTANT + NICE-TO-HAVE) — 완전한 프로덕션 준비
- **뉴스레터**: 기능 비활성화/숨김 — UI에서 폼 숨기고 API 제거
- **Rate limiting**: 간단한 쿠키/세션 기반 — 외부 서비스 없이 구현
- **NF 관리자 탭**: UI 유지 + 빈 상태 표시 — API는 빈 배열 반환
- **작성자 ID**: 현재 로그인 사용자 ID 사용 — AuthContext에서 가져옴
- **SMTP/Kakao**: SMTP만 Vercel 환경변수 설정, Kakao 공유 버튼 숨김
- **테스트 전략**: vitest 인프라 세팅 + TDD 패턴

**Research Findings (4 Explore Agents)**:
- `nf-mock-data.ts`: 18 mock articles, fake API key, 10 sync logs — NF_CATEGORIES/NF_CATEGORY_MAP은 유지 필수
- Supabase 클라이언트: `src/lib/supabase/{client,server,middleware}.ts` 정상 동작
- XSS: `ArticlePreview.tsx:115`, `NfArticlePreview.tsx:129` — sanitizeHtml() 미적용
- API 인증: NF routes 전부 인증 없음 (/api/nf/connection PUT으로 설정 변경 가능)
- 보안 헤더: X-Frame-Options 등 기본만 있음, CSP/HSTS 없음
- Newsletter: `Footer.tsx`에서 `NewsletterSubscribe` 임포트/렌더 중
- 환경변수 8개 확인, ZOHO_SMTP_PASS 비어있음, KAKAO_APP_ID 미설정

### Metis Review
**Identified Gaps** (addressed):
- nf-mock-data.ts 분리 필요: constants(KEEP) vs mock data(DELETE) — Task 2에서 처리
- Newsletter 제거 시 Footer.tsx 동시 수정 필수 — Task 7에서 함께 처리
- NF handleTestConnection()이 setTimeout fake — Task 5에서 "준비 중" 레이블로 교체
- CSP 헤더에 Supabase, Vercel Analytics, Google Fonts 도메인 포함 필수 — Task 10에서 처리
- scripts/setup-supabase.mjs에 picsum URLs — Task 3에서 정리
- .env.example 파일 없음 — Task 15에서 생성

---

## Work Objectives

### Core Objective
KJ_News를 Vercel에 프로덕션 배포하기 위해 모든 mock 데이터를 제거하고, 보안 취약점을 수정하며, 프로덕션 품질의 코드베이스를 확보한다.

### Concrete Deliverables
- `src/lib/nf-constants.ts` (NF_CATEGORIES, NF_CATEGORY_MAP 분리)
- `src/lib/nf-mock-data.ts` 삭제
- XSS 수정된 ArticlePreview.tsx, NfArticlePreview.tsx
- 인증 추가된 NF API routes
- 쿠키 기반 rate limiting이 적용된 view counter API
- CSP/HSTS/Permissions-Policy 보안 헤더
- 뉴스레터 기능 제거 (컴포넌트 + API + Footer 수정)
- Kakao 공유 버튼 숨김
- JSON-LD 구조화 데이터 (NewsArticle schema)
- 접근성 수정 (button type, SVG alt)
- vitest 설정 + 핵심 테스트
- `.env.example` 템플릿
- 프로덕션 빌드 통과

### Definition of Done
- [ ] `npm run build` — 0 errors
- [ ] `npm run test` — all pass
- [ ] `grep -r "picsum.photos" src/` — 0 results
- [ ] `grep -r "sk_live_" src/` — 0 results  
- [ ] `grep -r "nf-mock-data" src/` — 0 results
- [ ] `curl -sI localhost:3001 | grep -i content-security-policy` — present
- [ ] `curl -s localhost:3001/api/nf/articles` — returns 401

### Must Have
- Mock/더미 데이터 완전 제거
- XSS 취약점 수정
- API 인증 추가
- Vercel 배포 가능한 빌드
- vitest 테스트 인프라 및 핵심 테스트

### Must NOT Have (Guardrails)
- `src/app/special/layout.tsx` 수정 금지
- 모노크롬 디자인 톤 변경 금지
- `src/lib/db.ts` 수정 금지 (이미 프로덕션 안전)
- RSS feed, sitemap.ts, robots.ts 수정 금지
- Sentry/LogRocket 등 에러 로깅 서비스 추가 금지
- 이미지 최적화(avif/webp) 설정 변경 금지
- Supabase RLS 정책 변경 금지
- 색상 추가/디자인 톤 변경 금지
- 실제 NF API 연동 구현 금지 (mock→empty만)

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (신규 세팅)
- **Automated tests**: TDD (RED → GREEN → REFACTOR)
- **Framework**: vitest + @testing-library/react + jsdom
- **If TDD**: 각 task에서 테스트 먼저 작성 후 구현

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright — Navigate, interact, assert DOM, screenshot
- **API/Backend**: Use Bash (curl) — Send requests, assert status + response fields
- **Library/Module**: Use Bash (node/bun REPL) — Import, call functions, compare output

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — foundation):
├── Task 1: Vitest 테스트 인프라 세팅 [quick]
└── Task 2: nf-mock-data.ts 분리 (constants vs mock) [quick]

Wave 2 (After Wave 1 — mock data cleanup + security, MAX PARALLEL):
├── Task 3: Mock 데이터 제거 + picsum URLs 정리 (depends: 2) [unspecified-high]
├── Task 4: XSS 취약점 수정 (depends: 1) [quick]
├── Task 5: NF API routes 인증 + 빈 상태 전환 (depends: 2) [unspecified-high]
├── Task 6: 하드코딩 작성자 ID 수정 (depends: 2) [quick]
└── Task 7: 뉴스레터 비활성화 + Kakao 숨김 (depends: 1) [unspecified-high]

Wave 3 (After Wave 2 — security hardening + SEO):
├── Task 8: 조회수 API rate limiting (depends: 1, 5) [unspecified-high]
├── Task 9: NF 에러 핸들링 + 빈 상태 UI 개선 (depends: 5) [visual-engineering]
├── Task 10: CSP/HSTS/Permissions-Policy 보안 헤더 (depends: 7) [unspecified-high]
├── Task 11: JSON-LD 구조화 데이터 (depends: 1) [quick]
└── Task 12: 접근성 개선 (depends: 1) [quick]

Wave 4 (After Wave 3 — deployment + docs):
├── Task 13: next.config.ts 정리 (depends: 10) [quick]
├── Task 14: .env.example + Vercel 배포 가이드 (depends: 13) [quick]
└── Task 15: 프로덕션 빌드 + 전체 테스트 검증 (depends: 3-14) [deep]

Wave FINAL (After ALL tasks — independent review, 4 parallel):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)

Critical Path: Task 1 → Task 4 → Task 8 → Task 10 → Task 13 → Task 15 → F1-F4
Parallel Speedup: ~65% faster than sequential
Max Concurrent: 5 (Wave 2)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 4, 7, 8, 11, 12 | 1 |
| 2 | — | 3, 5, 6 | 1 |
| 3 | 2 | 13, 15 | 2 |
| 4 | 1 | 15 | 2 |
| 5 | 2 | 8, 9 | 2 |
| 6 | 2 | 15 | 2 |
| 7 | 1 | 10 | 2 |
| 8 | 1, 5 | 15 | 3 |
| 9 | 5 | 15 | 3 |
| 10 | 7 | 13 | 3 |
| 11 | 1 | 15 | 3 |
| 12 | 1 | 15 | 3 |
| 13 | 10 | 14 | 4 |
| 14 | 13 | 15 | 4 |
| 15 | 3-14 | F1-F4 | 4 |
| F1-F4 | 15 | — | FINAL |

### Agent Dispatch Summary

- **Wave 1**: **2** — T1 → `quick`, T2 → `quick`
- **Wave 2**: **5** — T3 → `unspecified-high`, T4 → `quick`, T5 → `unspecified-high`, T6 → `quick`, T7 → `unspecified-high`
- **Wave 3**: **5** — T8 → `unspecified-high`, T9 → `visual-engineering`, T10 → `unspecified-high`, T11 → `quick`, T12 → `quick`
- **Wave 4**: **3** — T13 → `quick`, T14 → `quick`, T15 → `deep`
- **FINAL**: **4** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info + QA Scenarios.

- [ ] 1. Vitest 테스트 인프라 세팅

  **What to do**:
  - `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @testing-library/user-event`
  - `vitest.config.ts` 생성: jsdom environment, src/ alias, globals: true
  - `package.json`에 `"test": "vitest run"`, `"test:watch": "vitest"` 스크립트 추가
  - `src/__tests__/setup.ts` 생성: `@testing-library/jest-dom` import
  - `tsconfig.json`에 vitest types 추가 확인
  - 검증용 샘플 테스트 `src/__tests__/smoke.test.ts` 작성: `expect(1+1).toBe(2)` — `npm run test` 통과 확인

  **Must NOT do**:
  - 기존 코드에 대한 테스트 작성 (변경하는 코드만)
  - jest 사용 금지 (vitest만)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 패키지 설치 + 설정 파일 생성만으로 구성. 단순하고 명확한 작업.
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: 브라우저 테스트가 아닌 유닛 테스트 인프라 세팅

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Tasks 4, 7, 8, 11, 12
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `package.json` — 현재 scripts 섹션 구조 확인, dependencies에 `@supabase/ssr`, `@supabase/supabase-js` 등 이미 있음
  - `tsconfig.json` — 현재 TypeScript 설정 확인, paths alias 매핑

  **API/Type References**:
  - N/A

  **External References**:
  - Vitest 공식 문서: Getting Started + React Testing Library integration

  **WHY Each Reference Matters**:
  - `package.json`: scripts 패턴을 맞추고, 기존 의존성과 충돌 없는지 확인
  - `tsconfig.json`: path alias (`@/`) 설정이 vitest에서도 동작하도록 매핑 필요

  **Acceptance Criteria**:

  **TDD:**
  - [ ] `npm run test` → PASS (1 test, 0 failures)
  - [ ] `vitest.config.ts` 존재
  - [ ] `src/__tests__/setup.ts` 존재
  - [ ] `src/__tests__/smoke.test.ts` 존재

  **QA Scenarios:**

  ```
  Scenario: Vitest 정상 실행 확인
    Tool: Bash
    Preconditions: npm install 완료
    Steps:
      1. Run: npm run test
      2. Assert exit code 0
      3. Assert output contains "1 passed"
    Expected Result: 1 test passed, 0 failures, exit code 0
    Failure Indicators: "FAIL", non-zero exit code, "Cannot find module"
    Evidence: .sisyphus/evidence/task-1-vitest-run.txt

  Scenario: vitest.config.ts 설정 검증
    Tool: Bash
    Preconditions: vitest.config.ts 생성됨
    Steps:
      1. Run: cat vitest.config.ts
      2. Assert contains "jsdom"
      3. Assert contains "@/" alias mapping
    Expected Result: jsdom environment + path alias 설정 포함
    Failure Indicators: "environment" 미설정, alias 미설정
    Evidence: .sisyphus/evidence/task-1-config-check.txt
  ```

  **Commit**: YES
  - Message: `chore: set up vitest test infrastructure`
  - Files: `vitest.config.ts`, `package.json`, `src/__tests__/setup.ts`, `src/__tests__/smoke.test.ts`
  - Pre-commit: `npm run test`

- [ ] 2. nf-mock-data.ts 분리 (constants vs mock data)

  **What to do**:
  - `src/lib/nf-constants.ts` 신규 생성: `NF_CATEGORIES`와 `NF_CATEGORY_MAP`을 nf-mock-data.ts에서 이동
  - `src/lib/nf-mock-data.ts`에서 NF_CATEGORIES, NF_CATEGORY_MAP export 제거 (나머지 mock data만 남김)
  - import 경로 업데이트:
    - `src/components/admin/nf/NfArticleExplorer.tsx:7` — `nf-mock-data` → `nf-constants`
    - `src/components/admin/nf/NfSubscriptionManager.tsx:5` — `nf-mock-data` → `nf-constants`
  - `lsp_find_references`로 NF_CATEGORIES, NF_CATEGORY_MAP의 모든 참조 확인 후 누락 없이 업데이트
  - TDD: 테스트 작성 — `nf-constants.ts`에서 NF_CATEGORIES 9개 항목, NF_CATEGORY_MAP 매핑 정확성 검증

  **Must NOT do**:
  - mock data (nfArticles, nfConnection, nfSyncLogs)는 아직 삭제하지 않음 (Task 3에서 처리)
  - NF_CATEGORIES, NF_CATEGORY_MAP 값 변경 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 파일 분리 + import 경로 변경. 2개 파일 생성, 2개 파일 import 수정.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Tasks 3, 5, 6
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `src/lib/constants.ts` — 기존 상수 파일 패턴 (SITE_NAME, SITE_URL 등). 같은 네이밍 컨벤션 따를 것
  - `src/lib/nf-mock-data.ts:3-16` — NF_CATEGORIES와 NF_CATEGORY_MAP 현재 정의. 그대로 이동

  **API/Type References**:
  - `src/lib/types.ts` — NfArticle, NfConnection 타입 정의 (참조만, 수정 불필요)

  **Test References**:
  - Task 1에서 생성한 vitest 인프라 사용

  **WHY Each Reference Matters**:
  - `constants.ts`: 네이밍 컨벤션 (`UPPER_CASE` export)과 파일 위치(`src/lib/`)를 맞추기 위해
  - `nf-mock-data.ts:3-16`: 이동할 코드의 정확한 위치와 내용 확인
  - NfArticleExplorer.tsx:7, NfSubscriptionManager.tsx:5: import 경로를 변경해야 할 정확한 줄 번호

  **Acceptance Criteria**:

  **TDD:**
  - [ ] `src/__tests__/nf-constants.test.ts` 작성
  - [ ] `npm run test` → PASS (nf-constants 테스트 포함)

  **QA Scenarios:**

  ```
  Scenario: nf-constants.ts에서 정상 import 가능
    Tool: Bash
    Preconditions: nf-constants.ts 생성됨
    Steps:
      1. Run: grep -r "nf-mock-data" src/components/ src/contexts/
      2. Assert: 0 results (모든 컴포넌트가 nf-constants로 전환됨)
      3. Run: grep -r "nf-constants" src/components/admin/nf/
      4. Assert: 2 results (NfArticleExplorer, NfSubscriptionManager)
    Expected Result: 컴포넌트에서 nf-mock-data import 0건, nf-constants import 2건
    Failure Indicators: nf-mock-data import가 컴포넌트에 남아있음
    Evidence: .sisyphus/evidence/task-2-import-check.txt

  Scenario: 빌드 통과 확인
    Tool: Bash
    Preconditions: import 경로 변경 완료
    Steps:
      1. Run: npm run build
      2. Assert exit code 0
    Expected Result: Build succeeded
    Failure Indicators: "Module not found", import 에러
    Evidence: .sisyphus/evidence/task-2-build.txt
  ```

  **Commit**: YES
  - Message: `refactor: extract NF constants from mock data file`
  - Files: `src/lib/nf-constants.ts`, `src/lib/nf-mock-data.ts`, `src/components/admin/nf/NfArticleExplorer.tsx`, `src/components/admin/nf/NfSubscriptionManager.tsx`
  - Pre-commit: `npm run build && npm run test`

- [ ] 3. Mock 데이터 완전 제거 + picsum URLs 정리

  **What to do**:
  - `src/lib/nf-mock-data.ts` 파일 삭제 (Task 2에서 constants 분리 완료 후)
  - NF API routes에서 nf-mock-data import 제거 및 빈 데이터 반환으로 변경:
    - `src/app/api/nf/articles/route.ts`: nfArticles import 제거 → 빈 배열 `[]` 반환
    - `src/app/api/nf/connection/route.ts`: nfConnection import 제거 → disconnected 기본 상태 반환
    - `src/app/api/nf/deliveries/route.ts`: nfSyncLogs import 제거 → 빈 배열 `[]` 반환
    - `src/app/api/nf/subscriptions/route.ts`: nfConnection import 제거 → disconnected 상태 반환
  - `next.config.ts`: remotePatterns에서 `picsum.photos` 항목 제거
  - `scripts/setup-supabase.mjs`: picsum.photos URLs을 빈 문자열 또는 placeholder 표시 주석으로 교체
  - TDD: mock data 제거 확인 테스트 (grep 기반)

  **Must NOT do**:
  - NF_CATEGORIES, NF_CATEGORY_MAP 삭제 (이미 nf-constants.ts로 이동됨)
  - NF API routes 자체를 삭제하지 않음 (빈 데이터만 반환)
  - src/lib/db.ts 수정 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 여러 파일(6+)에 걸쳐 일관된 변경 필요. 파일 삭제 + import 경로 변경 + 데이터 교체.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 6, 7)
  - **Blocks**: Tasks 13, 15
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `src/app/api/nf/articles/route.ts:1-38` — 현재 mock import 및 필터링 로직. import 제거 후 빈 배열 반환
  - `src/app/api/nf/connection/route.ts:1-40` — 현재 in-memory connectionState. disconnected 기본값으로 교체
  - `src/app/api/nf/deliveries/route.ts:1-15` — 현재 nfSyncLogs import. 빈 배열 반환
  - `src/app/api/nf/subscriptions/route.ts:1-7` — 현재 nfConnection import. disconnected 상태 반환

  **API/Type References**:
  - `src/lib/types.ts:NfConnection` — disconnected 기본 상태 객체의 타입 구조
  - `src/lib/types.ts:NfSyncLog` — 빈 배열의 타입

  **External References**:
  - `next.config.ts:6-7` — picsum.photos remotePattern 제거 위치

  **WHY Each Reference Matters**:
  - API routes: import 제거 후에도 타입이 맞는 빈 데이터를 반환해야 함
  - types.ts: disconnected NfConnection 객체 구조를 정확히 맞추기 위해
  - next.config.ts: picsum.photos 제거 시 Supabase 패턴만 남겨야 함

  **Acceptance Criteria**:

  **TDD:**
  - [ ] `npm run test` → PASS

  **QA Scenarios:**

  ```
  Scenario: Mock 데이터 파일 삭제 확인
    Tool: Bash
    Preconditions: Task 2 완료
    Steps:
      1. Run: test -f src/lib/nf-mock-data.ts && echo "EXISTS" || echo "DELETED"
      2. Assert: "DELETED"
      3. Run: grep -r "nf-mock-data" src/
      4. Assert: 0 results
      5. Run: grep -r "picsum.photos" src/
      6. Assert: 0 results
      7. Run: grep -r "sk_live_" src/
      8. Assert: 0 results
    Expected Result: nf-mock-data.ts 삭제됨, 모든 참조 제거됨
    Failure Indicators: 파일 존재, import 남아있음, picsum URL 남아있음
    Evidence: .sisyphus/evidence/task-3-mock-removal.txt

  Scenario: NF API routes 빈 데이터 반환
    Tool: Bash
    Preconditions: Dev server running on port 3001
    Steps:
      1. 주의: Task 5에서 인증이 추가되므로, 이 시나리오는 빌드 통과만 확인
      2. Run: npm run build
      3. Assert: exit code 0
    Expected Result: 빌드 성공
    Failure Indicators: import 에러, 타입 에러
    Evidence: .sisyphus/evidence/task-3-build.txt
  ```

  **Commit**: YES
  - Message: `chore: remove all mock data and placeholder URLs`
  - Files: `src/lib/nf-mock-data.ts` (delete), `src/app/api/nf/articles/route.ts`, `src/app/api/nf/connection/route.ts`, `src/app/api/nf/deliveries/route.ts`, `src/app/api/nf/subscriptions/route.ts`, `next.config.ts`, `scripts/setup-supabase.mjs`
  - Pre-commit: `npm run build && npm run test`

- [ ] 4. XSS 취약점 수정 (dangerouslySetInnerHTML sanitize)

  **What to do**:
  - TDD RED: `src/__tests__/sanitize.test.ts` 작성
    - `sanitizeHtml('<script>alert("xss")</script><p>safe</p>')` → `<script>` 미포함, `<p>safe</p>` 포함
    - `sanitizeHtml('<img onerror="alert(1)" src="x">')` → `onerror` 미포함
    - `sanitizeHtml('<a href="javascript:void(0)">click</a>')` → `javascript:` 미포함
  - TDD GREEN: `src/lib/sanitize.ts` 이미 존재하므로 테스트 통과 확인
  - `src/components/admin/ArticlePreview.tsx:115` — `sanitizeHtml(article.content)` 적용
    - `import { sanitizeHtml } from "@/lib/sanitize"` 추가
    - `dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}` 변경
  - `src/components/admin/nf/NfArticlePreview.tsx:129` — 동일하게 sanitizeHtml 적용
  - `ast_grep_search`로 전체 codebase에서 `dangerouslySetInnerHTML` 사용처 확인하여 누락 없는지 검증

  **Must NOT do**:
  - `src/lib/sanitize.ts` 로직 변경 금지 (이미 동작하는 함수)
  - public 페이지의 dangerouslySetInnerHTML (article/[id]/page.tsx) — 이미 sanitize 적용됨

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 2개 파일에 import 추가 + 함수 호출 래핑. 단순 변경.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 5, 6, 7)
  - **Blocks**: Task 15
  - **Blocked By**: Task 1 (vitest 필요)

  **References**:

  **Pattern References**:
  - `src/app/(public)/article/[id]/page.tsx:155` — 이미 sanitizeHtml 적용된 패턴. 이 패턴을 그대로 따를 것
  - `src/lib/sanitize.ts:1-17` — sanitizeHtml 함수 구현. import 경로: `@/lib/sanitize`

  **API/Type References**:
  - N/A

  **WHY Each Reference Matters**:
  - article/[id]/page.tsx:155: 정확한 적용 패턴 (`sanitizeHtml(content)` 호출 방식)
  - sanitize.ts: 함수 시그니처와 import 경로 확인

  **Acceptance Criteria**:

  **TDD:**
  - [ ] `src/__tests__/sanitize.test.ts` 생성
  - [ ] `npm run test src/__tests__/sanitize.test.ts` → PASS (3+ tests)

  **QA Scenarios:**

  ```
  Scenario: XSS 스크립트 필터링 확인
    Tool: Bash
    Preconditions: vitest 설정 완료 (Task 1)
    Steps:
      1. Run: npm run test src/__tests__/sanitize.test.ts
      2. Assert: all tests pass
      3. Run: grep -n "sanitizeHtml" src/components/admin/ArticlePreview.tsx
      4. Assert: sanitizeHtml 호출 존재
      5. Run: grep -n "sanitizeHtml" src/components/admin/nf/NfArticlePreview.tsx
      6. Assert: sanitizeHtml 호출 존재
    Expected Result: 테스트 통과 + 두 파일 모두 sanitize 적용
    Failure Indicators: 테스트 실패, sanitizeHtml 미적용
    Evidence: .sisyphus/evidence/task-4-xss-fix.txt

  Scenario: 미적용 dangerouslySetInnerHTML 없음 확인
    Tool: Bash
    Preconditions: 수정 완료
    Steps:
      1. ast_grep_search로 dangerouslySetInnerHTML 전체 검색
      2. 각 사용처에서 sanitizeHtml 래핑 확인
    Expected Result: 모든 dangerouslySetInnerHTML에 sanitize 적용
    Failure Indicators: sanitize 없는 dangerouslySetInnerHTML 발견
    Evidence: .sisyphus/evidence/task-4-xss-audit.txt
  ```

  **Commit**: YES
  - Message: `fix(security): sanitize dangerouslySetInnerHTML in admin previews`
  - Files: `src/components/admin/ArticlePreview.tsx`, `src/components/admin/nf/NfArticlePreview.tsx`, `src/__tests__/sanitize.test.ts`
  - Pre-commit: `npm run test`

- [ ] 5. NF API routes 인증 추가 + 빈 상태 전환

  **What to do**:
  - 모든 NF API routes에 Supabase 인증 체크 추가 (패턴: `src/app/api/email/route.ts:7-17`):
    ```typescript
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    ```
  - 적용 대상:
    - `src/app/api/nf/connection/route.ts` — GET, PUT 모두
    - `src/app/api/nf/articles/route.ts` — GET
    - `src/app/api/nf/deliveries/route.ts` — GET
    - `src/app/api/nf/subscriptions/route.ts` — GET
  - `src/app/api/nf/subscriptions/[id]/route.ts` — 이미 410 반환, 유지
  - NF connection의 `handleTestConnection()` 관련: NfSubscriptionManager.tsx의 연결 테스트 버튼을 "준비 중" 상태로 변경 (disabled + 라벨 변경)
  - TDD: API 인증 테스트 (curl로 인증 없이 호출 시 401 반환 확인)

  **Must NOT do**:
  - API route 자체 삭제 금지
  - NF_CATEGORIES, NF_CATEGORY_MAP 관련 로직 변경 금지
  - 실제 NF API 연동 구현 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 5개 API route 파일 + 1개 컴포넌트 수정. 일관된 인증 패턴 적용.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4, 6, 7)
  - **Blocks**: Tasks 8, 9
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `src/app/api/email/route.ts:7-17` — 인증 체크 정확한 패턴. createClient import, getUser 호출, 401 반환
  - `src/lib/supabase/server.ts` — `createClient` 함수 정의 위치. import 경로: `@/lib/supabase/server`

  **API/Type References**:
  - `src/lib/types.ts:NfConnection` — disconnected 상태 기본 객체 구조

  **WHY Each Reference Matters**:
  - email/route.ts: 동일 프로젝트의 인증 패턴을 정확히 복제하기 위해
  - supabase/server.ts: createClient import 경로 확인

  **Acceptance Criteria**:

  **TDD:**
  - [ ] `npm run test` → PASS

  **QA Scenarios:**

  ```
  Scenario: 인증 없이 NF API 호출 시 401 반환
    Tool: Bash (curl)
    Preconditions: Dev server running on port 3001
    Steps:
      1. Run: curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/nf/articles
      2. Assert: 401
      3. Run: curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/nf/connection
      4. Assert: 401
      5. Run: curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/nf/deliveries
      6. Assert: 401
      7. Run: curl -s http://localhost:3001/api/nf/articles
      8. Assert: contains "Unauthorized"
    Expected Result: 모든 NF API가 인증 없이 401 반환
    Failure Indicators: 200 반환, 데이터 노출
    Evidence: .sisyphus/evidence/task-5-api-auth.txt

  Scenario: 연결 테스트 버튼 비활성화 확인
    Tool: Playwright
    Preconditions: 관리자 로그인 상태, /admin/news-feed 페이지
    Steps:
      1. Navigate to http://localhost:3001/admin/login
      2. Login with admin / password
      3. Navigate to http://localhost:3001/admin/news-feed
      4. Click "연동 설정" tab
      5. Find connection test button
      6. Assert: button is disabled or shows "준비 중"
    Expected Result: 연결 테스트 버튼 비활성화 또는 "준비 중" 표시
    Failure Indicators: 버튼 클릭 가능, fake setTimeout 실행
    Evidence: .sisyphus/evidence/task-5-test-button.png
  ```

  **Commit**: YES
  - Message: `fix(security): add auth to NF API routes + disable fake test`
  - Files: `src/app/api/nf/connection/route.ts`, `src/app/api/nf/articles/route.ts`, `src/app/api/nf/deliveries/route.ts`, `src/app/api/nf/subscriptions/route.ts`, `src/components/admin/nf/NfSubscriptionManager.tsx`
  - Pre-commit: `npm run build && npm run test`

- [ ] 6. 하드코딩 작성자 ID "a1" 수정

  **What to do**:
  - `src/components/admin/nf/NfArticleExplorer.tsx:62` — `authorId: "a1"` → 현재 로그인 사용자 ID 사용
  - AuthContext에서 user 정보 가져오기: `useAuth()` 훅 사용
  - fallback: user가 없을 경우 authors 배열의 첫 번째 항목 사용 (AdminContext에서 제공)
  - TDD: authorId가 "a1"이 아닌 동적 값인지 확인하는 테스트

  **Must NOT do**:
  - AuthContext 로직 변경 금지
  - AdminContext의 importArticle 함수 시그니처 변경 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 파일 1줄 변경 + import 추가. 매우 간단.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4, 5, 7)
  - **Blocks**: Task 15
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `src/components/admin/nf/NfArticleExplorer.tsx:62` — `authorId: "a1"` 하드코딩 위치
  - `src/contexts/AuthContext.tsx` — `useAuth()` 훅 정의. user.id 접근 패턴
  - `src/contexts/AdminContext.tsx` — `useAdmin()` 훅, authors 배열 접근

  **WHY Each Reference Matters**:
  - NfArticleExplorer.tsx:62: 정확한 수정 위치
  - AuthContext: user ID를 가져오는 올바른 방법
  - AdminContext: authors[0] fallback 접근 패턴

  **Acceptance Criteria**:

  **QA Scenarios:**

  ```
  Scenario: 하드코딩된 "a1" 제거 확인
    Tool: Bash
    Preconditions: 수정 완료
    Steps:
      1. Run: grep -n '"a1"' src/components/admin/nf/NfArticleExplorer.tsx
      2. Assert: 0 results (authorId: "a1" 제거됨)
      3. Run: grep -n "useAuth\|user\.id" src/components/admin/nf/NfArticleExplorer.tsx
      4. Assert: useAuth 또는 user.id 참조 존재
    Expected Result: "a1" 하드코딩 제거, 동적 사용자 ID 사용
    Failure Indicators: "a1" 여전히 존재
    Evidence: .sisyphus/evidence/task-6-author-id.txt
  ```

  **Commit**: YES
  - Message: `fix: use logged-in user ID for NF article publish`
  - Files: `src/components/admin/nf/NfArticleExplorer.tsx`
  - Pre-commit: `npm run build`

- [ ] 7. 뉴스레터 비활성화 + Kakao 공유 숨김

  **What to do**:
  - **뉴스레터 비활성화**:
    - `src/components/layout/Footer.tsx:4` — `NewsletterSubscribe` import 제거
    - `src/components/layout/Footer.tsx:79` — `<NewsletterSubscribe />` 렌더링 제거
    - `src/components/NewsletterSubscribe.tsx` — 파일 삭제 또는 빈 컴포넌트로 교체
    - `src/app/api/newsletter/route.ts` — 파일 삭제
  - **Kakao 공유 숨김**:
    - Kakao 공유 버튼을 사용하는 컴포넌트 찾기 (`grep -r "kakao\|KAKAO" src/`)
    - 해당 버튼/링크를 조건부 렌더링: `NEXT_PUBLIC_KAKAO_APP_ID`가 설정된 경우에만 표시
    - 또는 Kakao 관련 UI 요소를 주석 처리 / 제거
  - TDD: Footer에 NewsletterSubscribe 렌더링이 없음을 확인하는 테스트

  **Must NOT do**:
  - Footer의 다른 기능 (회사 정보, 링크 등) 변경 금지
  - 디자인 톤 변경 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 4개 파일 수정/삭제 + Kakao 컴포넌트 검색 필요. 파일 삭제 시 다른 import 영향 확인 필요.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4, 5, 6)
  - **Blocks**: Task 10
  - **Blocked By**: Task 1 (vitest 필요)

  **References**:

  **Pattern References**:
  - `src/components/layout/Footer.tsx:4` — `import NewsletterSubscribe from...` import 위치
  - `src/components/layout/Footer.tsx:79` — `<NewsletterSubscribe />` 렌더링 위치
  - `src/components/NewsletterSubscribe.tsx` — 삭제 대상 컴포넌트

  **API/Type References**:
  - `src/app/api/newsletter/route.ts` — 삭제 대상 API route

  **WHY Each Reference Matters**:
  - Footer.tsx: import와 렌더링 모두 제거해야 빌드 통과
  - NewsletterSubscribe.tsx: 삭제 전 다른 곳에서 import하는지 확인 필요

  **Acceptance Criteria**:

  **TDD:**
  - [ ] `npm run test` → PASS

  **QA Scenarios:**

  ```
  Scenario: 뉴스레터 구독 폼 제거 확인
    Tool: Playwright
    Preconditions: Dev server running on port 3001
    Steps:
      1. Navigate to http://localhost:3001
      2. Scroll to footer
      3. Assert: "뉴스레터" 텍스트 없음
      4. Assert: email input in footer 없음
    Expected Result: Footer에 뉴스레터 구독 폼 없음
    Failure Indicators: 뉴스레터 관련 UI 요소 존재
    Evidence: .sisyphus/evidence/task-7-newsletter-removed.png

  Scenario: 뉴스레터 API 제거 확인
    Tool: Bash (curl)
    Preconditions: Dev server running
    Steps:
      1. Run: curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/newsletter -H "Content-Type: application/json" -d '{"email":"test@test.com"}'
      2. Assert: 404 (route 삭제됨)
    Expected Result: 404 Not Found
    Failure Indicators: 200 반환
    Evidence: .sisyphus/evidence/task-7-newsletter-api.txt

  Scenario: 빌드 통과 확인
    Tool: Bash
    Preconditions: 모든 수정 완료
    Steps:
      1. Run: npm run build
      2. Assert: exit code 0
      3. Run: grep -r "NewsletterSubscribe" src/
      4. Assert: 0 results
    Expected Result: 빌드 성공, NewsletterSubscribe 참조 0건
    Failure Indicators: import 에러, build 실패
    Evidence: .sisyphus/evidence/task-7-build.txt
  ```

  **Commit**: YES
  - Message: `feat: disable newsletter subscription + hide Kakao share`
  - Files: `src/components/layout/Footer.tsx`, `src/components/NewsletterSubscribe.tsx` (delete), `src/app/api/newsletter/route.ts` (delete), Kakao 관련 파일
  - Pre-commit: `npm run build && npm run test`

- [ ] 8. 조회수 API 쿠키 기반 rate limiting

  **What to do**:
  - `src/app/api/articles/[id]/view/route.ts` 수정:
    - 요청에서 쿠키 확인: `viewed_articles` 쿠키에 현재 article ID가 포함되어 있으면 조회수 증가하지 않음
    - 조회수 증가 후 쿠키에 article ID 추가 (24시간 만료)
    - 쿠키 형식: `viewed_articles=id1,id2,id3` (콤마 구분)
    - 성공 시 `{ success: true, viewCount: N }` 반환
    - 이미 조회한 경우 `{ success: false, message: "Already viewed" }` 반환 (200 OK)
  - TDD: 쿠키 없이 호출 시 조회수 증가, 쿠키 있는 상태에서 재호출 시 조회수 미증가 테스트

  **Must NOT do**:
  - 외부 서비스(Redis, Upstash 등) 추가 금지
  - 기존 view_count DB 로직 변경 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: API route 로직 수정 + 쿠키 관리. 테스트 복잡성이 있음.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 9, 10, 11, 12)
  - **Blocks**: Task 15
  - **Blocked By**: Tasks 1, 5

  **References**:

  **Pattern References**:
  - `src/app/api/articles/[id]/view/route.ts:1-44` — 현재 view counter 로직. createServiceClient 사용, view_count 증가

  **API/Type References**:
  - Next.js `cookies()` API — 쿠키 읽기/쓰기 방법

  **WHY Each Reference Matters**:
  - view/route.ts: 기존 로직 위에 쿠키 체크를 추가해야 함. 기존 DB 쿼리 패턴 유지

  **Acceptance Criteria**:

  **TDD:**
  - [ ] `src/__tests__/view-rate-limit.test.ts` 생성
  - [ ] `npm run test` → PASS

  **QA Scenarios:**

  ```
  Scenario: 첫 조회 시 조회수 증가
    Tool: Bash (curl)
    Preconditions: Dev server running, 기사 ID 1 존재
    Steps:
      1. Run: curl -s -c /tmp/cookies.txt http://localhost:3001/api/articles/1/view -X POST
      2. Assert: response contains "success": true
      3. Assert: Set-Cookie header에 viewed_articles 포함
    Expected Result: 조회수 증가, 쿠키 설정
    Failure Indicators: success: false, 쿠키 미설정
    Evidence: .sisyphus/evidence/task-8-first-view.txt

  Scenario: 재조회 시 조회수 미증가
    Tool: Bash (curl)
    Preconditions: 첫 조회 완료, 쿠키 파일 존재
    Steps:
      1. Run: curl -s -b /tmp/cookies.txt http://localhost:3001/api/articles/1/view -X POST
      2. Assert: response contains "Already viewed" or success: false
    Expected Result: 조회수 미증가, "Already viewed" 메시지
    Failure Indicators: success: true (중복 증가)
    Evidence: .sisyphus/evidence/task-8-repeat-view.txt
  ```

  **Commit**: YES
  - Message: `fix(security): add cookie-based rate limiting to view counter`
  - Files: `src/app/api/articles/[id]/view/route.ts`, `src/__tests__/view-rate-limit.test.ts`
  - Pre-commit: `npm run test`

- [ ] 9. NF 에러 핸들링 + 빈 상태 UI 개선

  **What to do**:
  - **NfArticleExplorer.tsx**:
    - fetch 실패 시 에러 상태 표시 (현재 silently ignored)
    - connection.status !== "connected" 시 "뉴스팩토리 연동 대기 중" 메시지 표시
    - 에러 상태에 "다시 시도" 버튼 추가
  - **NfDeliveryHistory.tsx**:
    - fetch 실패 시 에러 상태 표시
    - 빈 상태 메시지 개선: "자동 수집을 활성화하면 이력이 표시됩니다"
    - 에러 상태에 "다시 시도" 버튼 추가
  - **NfSubscriptionManager.tsx**:
    - fetch 실패 시 에러 상태 구분 (loading vs error vs not configured)
    - 연결 테스트 버튼 비활성화 상태 유지 (Task 5에서 처리)
  - **admin/news-feed/page.tsx**:
    - 통계 카드에 로딩 상태 추가 (현재 0 즉시 표시)
    - fetch 실패 시 에러 메시지 표시

  **Must NOT do**:
  - 모노크롬 디자인 톤 변경 금지
  - 실제 NF API 연동 구현 금지
  - NF_CATEGORIES, NF_CATEGORY_MAP 변경 금지

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI 상태 관리 개선 (empty, loading, error states). 사용자 경험 관련 변경.
  - **Skills**: [`playwright`]
    - `playwright`: 빈 상태 UI가 올바르게 표시되는지 브라우저에서 직접 확인

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 10, 11, 12)
  - **Blocks**: Task 15
  - **Blocked By**: Task 5

  **References**:

  **Pattern References**:
  - `src/components/admin/nf/NfArticleExplorer.tsx` — 현재 fetch 로직, loading skeleton, empty state
  - `src/components/admin/nf/NfDeliveryHistory.tsx` — 현재 loading skeleton, empty state 메시지
  - `src/components/admin/nf/NfSubscriptionManager.tsx` — 현재 empty state "연동 정보 없음"
  - `src/app/admin/news-feed/page.tsx` — 통계 카드 구조

  **WHY Each Reference Matters**:
  - 각 컴포넌트의 현재 상태 관리 패턴을 이해하고 일관되게 개선

  **Acceptance Criteria**:

  **QA Scenarios:**

  ```
  Scenario: NF 관리자 페이지 빈 상태 표시
    Tool: Playwright
    Preconditions: 관리자 로그인, mock 데이터 제거됨, dev server running
    Steps:
      1. Navigate to http://localhost:3001/admin/login
      2. Login with admin / password
      3. Navigate to http://localhost:3001/admin/news-feed
      4. Assert: 통계 카드에 "0" 또는 "OFF" 표시 (로딩 후)
      5. Click "기사 탐색" tab
      6. Assert: "연동 대기 중" 또는 빈 상태 메시지 표시
      7. Click "수집 이력" tab
      8. Assert: "수집 이력이 없습니다" 메시지 표시
      9. Click "연동 설정" tab
      10. Assert: 연동 설정 패널 표시 (disconnected 상태)
    Expected Result: 모든 탭이 적절한 빈 상태/disconnected 상태 표시
    Failure Indicators: 에러 화면, 빈 화면, 무한 로딩
    Evidence: .sisyphus/evidence/task-9-empty-states.png
  ```

  **Commit**: YES
  - Message: `fix(ui): improve NF empty state handling and error UX`
  - Files: `src/components/admin/nf/NfArticleExplorer.tsx`, `src/components/admin/nf/NfDeliveryHistory.tsx`, `src/components/admin/nf/NfSubscriptionManager.tsx`, `src/app/admin/news-feed/page.tsx`
  - Pre-commit: `npm run build`

- [ ] 10. CSP/HSTS/Permissions-Policy 보안 헤더

  **What to do**:
  - `next.config.ts` headers 섹션에 추가:
    - **Content-Security-Policy**:
      - `default-src 'self'`
      - `script-src 'self' 'unsafe-inline' 'unsafe-eval' va.vercel-scripts.com vitals.vercel-insights.com`
      - `style-src 'self' 'unsafe-inline' fonts.googleapis.com`
      - `font-src 'self' fonts.gstatic.com`
      - `img-src 'self' erntllkkeczystqsjija.supabase.co data: blob:`
      - `connect-src 'self' erntllkkeczystqsjija.supabase.co vitals.vercel-insights.com`
      - `frame-ancestors 'none'`
    - **Strict-Transport-Security**: `max-age=31536000; includeSubDomains; preload`
    - **Permissions-Policy**: `camera=(), microphone=(), geolocation=(), interest-cohort=()`
  - 기존 X-Frame-Options, X-Content-Type-Options 등 유지
  - TDD: 헤더 존재 확인 테스트
  - **중요**: dev server에서 CSP 적용 후 Supabase 이미지, Google Fonts, Vercel Analytics가 정상 로드되는지 확인

  **Must NOT do**:
  - 기존 보안 헤더 제거 금지
  - CSP에 `unsafe-eval` 불필요 시 제거 (Next.js dev mode에서만 필요할 수 있으므로 production에서 테스트)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 보안 헤더 설정은 도메인 whitelist가 정확해야 함. 잘못 설정 시 프로덕션 기능 장애.
  - **Skills**: [`playwright`]
    - `playwright`: CSP 적용 후 이미지/폰트/스크립트 로드 확인

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 9, 11, 12)
  - **Blocks**: Task 13
  - **Blocked By**: Task 7

  **References**:

  **Pattern References**:
  - `next.config.ts:16-28` — 기존 보안 헤더 위치. 여기에 추가

  **External References**:
  - MDN Content-Security-Policy docs
  - Vercel Analytics CSP requirements

  **WHY Each Reference Matters**:
  - next.config.ts: 기존 헤더 구조에 맞춰 추가해야 함
  - Vercel Analytics: `va.vercel-scripts.com`과 `vitals.vercel-insights.com` 도메인 필수

  **Acceptance Criteria**:

  **QA Scenarios:**

  ```
  Scenario: 보안 헤더 존재 확인
    Tool: Bash (curl)
    Preconditions: Dev server running on port 3001
    Steps:
      1. Run: curl -sI http://localhost:3001 | grep -i "content-security-policy"
      2. Assert: CSP 헤더 존재
      3. Run: curl -sI http://localhost:3001 | grep -i "strict-transport-security"
      4. Assert: HSTS 헤더 존재
      5. Run: curl -sI http://localhost:3001 | grep -i "permissions-policy"
      6. Assert: Permissions-Policy 헤더 존재
    Expected Result: 3개 보안 헤더 모두 존재
    Failure Indicators: 헤더 미존재
    Evidence: .sisyphus/evidence/task-10-headers.txt

  Scenario: CSP 적용 후 사이트 정상 동작 확인
    Tool: Playwright
    Preconditions: Dev server running with CSP headers
    Steps:
      1. Navigate to http://localhost:3001
      2. Assert: 페이지 정상 렌더링 (no blank screen)
      3. Assert: Supabase 이미지 정상 로드 (기사 썸네일)
      4. Assert: Google Fonts 정상 로드 (Noto Sans KR)
      5. Check browser console for CSP violations
      6. Assert: 0 CSP violations
    Expected Result: 페이지 정상, 이미지/폰트 로드, CSP 위반 없음
    Failure Indicators: 빈 화면, 이미지 깨짐, 폰트 fallback, console CSP 에러
    Evidence: .sisyphus/evidence/task-10-csp-check.png
  ```

  **Commit**: YES
  - Message: `fix(security): add CSP, HSTS, Permissions-Policy headers`
  - Files: `next.config.ts`
  - Pre-commit: `npm run build`

- [ ] 11. JSON-LD 구조화 데이터 (NewsArticle)

  **What to do**:
  - `src/app/(public)/article/[id]/page.tsx`에 JSON-LD 추가:
    - `@type`: `NewsArticle`
    - `headline`: article.title
    - `description`: article.excerpt
    - `image`: article.thumbnail_url
    - `datePublished`: article.published_at
    - `dateModified`: article.updated_at
    - `author`: `{ @type: "Person", name: author.name }`
    - `publisher`: `{ @type: "Organization", name: "광전타임즈", logo: { @type: "ImageObject", url: site_url + "/logo.png" } }`
    - `mainEntityOfPage`: canonical URL
  - `<script type="application/ld+json">` 태그로 `<head>`에 삽입 (Next.js metadata API 또는 직접 script 태그)
  - TDD: JSON-LD 구조 유효성 테스트

  **Must NOT do**:
  - 페이지 레이아웃/디자인 변경 금지
  - 기존 OpenGraph 메타데이터 제거 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 파일에 JSON-LD script 태그 추가. 명확한 스키마 따르기.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 9, 10, 12)
  - **Blocks**: Task 15
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/app/(public)/article/[id]/page.tsx` — 기사 상세 페이지. metadata 함수와 렌더링 구조
  - `src/lib/constants.ts` — SITE_NAME, SITE_URL 상수

  **External References**:
  - Schema.org NewsArticle specification
  - Google Structured Data Testing Tool

  **WHY Each Reference Matters**:
  - article/[id]/page.tsx: JSON-LD를 삽입할 정확한 위치와 데이터 접근 패턴
  - constants.ts: publisher 정보에 사이트 이름/URL 사용

  **Acceptance Criteria**:

  **QA Scenarios:**

  ```
  Scenario: JSON-LD 구조화 데이터 존재 확인
    Tool: Bash (curl)
    Preconditions: Dev server running, 기사 ID 1 존재
    Steps:
      1. Run: curl -s http://localhost:3001/article/1 | grep -o 'application/ld+json'
      2. Assert: 1 result
      3. Run: curl -s http://localhost:3001/article/1 | grep -o '"@type":"NewsArticle"'
      4. Assert: 1 result
      5. Run: curl -s http://localhost:3001/article/1 | grep -o '"광전타임즈"'
      6. Assert: publisher name 존재
    Expected Result: JSON-LD script 태그에 NewsArticle 스키마 포함
    Failure Indicators: application/ld+json 미존재, @type 미일치
    Evidence: .sisyphus/evidence/task-11-jsonld.txt
  ```

  **Commit**: YES
  - Message: `feat(seo): add JSON-LD structured data for articles`
  - Files: `src/app/(public)/article/[id]/page.tsx`
  - Pre-commit: `npm run build`

- [ ] 12. 접근성 개선

  **What to do**:
  - `ast_grep_search`로 `<button` 태그 중 `type` 속성 없는 것 찾기 → `type="button"` 추가
    - `src/app/admin/news-feed/page.tsx:104` — 탭 전환 버튼에 type="button" 추가
    - `src/app/admin/AdminLayoutClient.tsx` 또는 `AdminHeader.tsx` — 메뉴 토글 버튼
  - SVG 아이콘에 빈 `<title>` 제거하거나 의미 있는 텍스트 추가:
    - `src/app/admin/page.tsx:41,46,51,56` — SVG title 요소에 설명 추가 또는 `aria-hidden="true"` 적용
    - `src/app/admin/news-feed/page.tsx:66,79,86,93` — 동일
  - 장식용 아이콘에 `aria-hidden="true"` 적용
  - 의미 있는 아이콘에 `aria-label` 추가

  **Must NOT do**:
  - 디자인 변경 금지
  - special/layout.tsx 수정 금지
  - 공개 페이지의 기존 접근성 설정 변경 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 여러 파일에 걸친 속성 추가이지만 모두 단순한 HTML 속성 변경.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 9, 10, 11)
  - **Blocks**: Task 15
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/app/admin/page.tsx:41,46,51,56` — LSP 진단에서 "Alternative text title element cannot be empty" 발견
  - `src/app/admin/news-feed/page.tsx:66,79,86,93,104` — 동일 이슈 + button type 미설정

  **WHY Each Reference Matters**:
  - 정확한 줄 번호에서 수정해야 할 위치 확인
  - LSP 진단과 일치시켜 에러 해결

  **Acceptance Criteria**:

  **QA Scenarios:**

  ```
  Scenario: button type 속성 확인
    Tool: Bash
    Preconditions: 수정 완료
    Steps:
      1. ast_grep_search로 <button 태그 중 type 없는 것 검색
      2. Assert: 0 results (모든 button에 type 존재)
    Expected Result: 모든 button 요소에 type 속성 존재
    Failure Indicators: type 없는 button 발견
    Evidence: .sisyphus/evidence/task-12-a11y-buttons.txt

  Scenario: SVG 접근성 확인
    Tool: Bash
    Preconditions: 수정 완료
    Steps:
      1. Run: grep -n '<title></title>' src/app/admin/page.tsx
      2. Assert: 0 results (빈 title 제거됨)
      3. Run: grep -n '<title></title>' src/app/admin/news-feed/page.tsx
      4. Assert: 0 results
    Expected Result: 빈 SVG title 없음
    Failure Indicators: 빈 <title></title> 존재
    Evidence: .sisyphus/evidence/task-12-a11y-svg.txt
  ```

  **Commit**: YES
  - Message: `fix(a11y): add button types and SVG accessibility`
  - Files: `src/app/admin/page.tsx`, `src/app/admin/news-feed/page.tsx`, AdminHeader 관련 파일
  - Pre-commit: `npm run build`

- [ ] 13. next.config.ts 정리

  **What to do**:
  - `picsum.photos` remotePattern 제거 확인 (Task 3에서 처리되었는지 검증)
  - Supabase hostname이 올바른지 확인: `erntllkkeczystqsjija.supabase.co`
  - CSP 헤더가 정확한지 확인 (Task 10에서 추가됨)
  - 불필요한 주석 제거
  - 최종 next.config.ts 상태 검증

  **Must NOT do**:
  - 이미지 최적화 설정 변경 금지
  - experimental 플래그 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 검증 + 미세 조정. 단일 파일.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 14, 15)
  - **Blocks**: Task 14
  - **Blocked By**: Task 10

  **References**:

  **Pattern References**:
  - `next.config.ts` — 전체 파일 검토

  **Acceptance Criteria**:

  **QA Scenarios:**

  ```
  Scenario: next.config.ts 최종 상태 확인
    Tool: Bash
    Preconditions: Tasks 3, 10 완료
    Steps:
      1. Run: grep "picsum" next.config.ts
      2. Assert: 0 results
      3. Run: grep "content-security-policy\|Content-Security-Policy" next.config.ts
      4. Assert: 1+ results
      5. Run: grep "erntllkkeczystqsjija.supabase.co" next.config.ts
      6. Assert: 1+ results (이미지 도메인)
      7. Run: npm run build
      8. Assert: exit code 0
    Expected Result: picsum 제거, CSP 존재, Supabase 도메인 존재, 빌드 통과
    Failure Indicators: picsum 잔존, 헤더 누락
    Evidence: .sisyphus/evidence/task-13-config.txt
  ```

  **Commit**: YES (그룹: Task 14와 함께)
  - Message: `chore: clean up next.config.ts for production`
  - Files: `next.config.ts`
  - Pre-commit: `npm run build`

- [ ] 14. .env.example + Vercel 배포 가이드

  **What to do**:
  - `.env.example` 파일 생성 (값 없이 키만):
    ```
    # Supabase
    NEXT_PUBLIC_SUPABASE_URL=
    NEXT_PUBLIC_SUPABASE_ANON_KEY=
    SUPABASE_SERVICE_ROLE_KEY=

    # Zoho SMTP (이메일 발송)
    ZOHO_SMTP_HOST=smtp.zoho.com
    ZOHO_SMTP_PORT=465
    ZOHO_SMTP_USER=
    ZOHO_SMTP_PASS=

    # Site
    NEXT_PUBLIC_SITE_URL=
    ```
  - `.gitignore` 확인: `.env.local`, `.env.*.local` 포함 확인
  - Vercel 배포 시 필요한 환경변수 목록 정리 (계획 문서에 이미 포함)

  **Must NOT do**:
  - 실제 자격 증명 값을 .env.example에 넣지 않음
  - README.md 생성/수정 금지 (명시적 요청 없음)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 파일 1개 생성 + .gitignore 확인. 매우 단순.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 13, 15)
  - **Blocks**: Task 15
  - **Blocked By**: Task 13

  **References**:

  **Pattern References**:
  - `.env.local` — 현재 환경변수 키 목록
  - `.gitignore` — 현재 무시 패턴

  **Acceptance Criteria**:

  **QA Scenarios:**

  ```
  Scenario: .env.example 존재 및 내용 확인
    Tool: Bash
    Preconditions: 파일 생성 완료
    Steps:
      1. Run: test -f .env.example && echo "EXISTS" || echo "MISSING"
      2. Assert: "EXISTS"
      3. Run: grep "NEXT_PUBLIC_SUPABASE_URL" .env.example
      4. Assert: 존재
      5. Run: grep "SUPABASE_SERVICE_ROLE_KEY" .env.example
      6. Assert: 존재
      7. Run: grep "eyJ\|sk_live\|password" .env.example
      8. Assert: 0 results (실제 자격 증명 없음)
    Expected Result: .env.example에 모든 키 존재, 실제 값 없음
    Failure Indicators: 파일 미존재, 실제 자격 증명 포함
    Evidence: .sisyphus/evidence/task-14-env-example.txt
  ```

  **Commit**: YES
  - Message: `docs: add .env.example for deployment reference`
  - Files: `.env.example`
  - Pre-commit: N/A

- [ ] 15. 프로덕션 빌드 + 전체 테스트 검증

  **What to do**:
  - 전체 테스트 실행: `npm run test`
  - 프로덕션 빌드: `npm run build`
  - Mock 데이터 완전 제거 확인:
    ```bash
    grep -r "picsum.photos" src/ && echo "FAIL" || echo "PASS"
    grep -r "sk_live_" src/ && echo "FAIL" || echo "PASS"
    grep -r "nf-mock-data" src/ && echo "FAIL" || echo "PASS"
    ```
  - 보안 헤더 확인 (dev server):
    ```bash
    curl -sI http://localhost:3001 | grep -i "content-security-policy"
    curl -sI http://localhost:3001 | grep -i "strict-transport-security"
    ```
  - API 인증 확인:
    ```bash
    curl -s http://localhost:3001/api/nf/articles | jq '.error'
    ```
  - 뉴스레터 제거 확인:
    ```bash
    grep -r "NewsletterSubscribe" src/
    ```
  - Playwright로 주요 페이지 동작 확인:
    - 메인 페이지 로드
    - 기사 상세 페이지
    - 관리자 로그인 → 대시보드
    - NF 관리 페이지 (빈 상태)

  **Must NOT do**:
  - 새로운 기능 추가 금지
  - 이 task에서 코드 수정 금지 (검증만)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 전체 프로젝트 통합 검증. 다수 커맨드 실행 + Playwright 브라우저 검증.
  - **Skills**: [`playwright`]
    - `playwright`: 브라우저에서 실제 페이지 동작 확인

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (모든 이전 task 완료 후)
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 3-14 (ALL)

  **References**:

  **Pattern References**:
  - 모든 이전 task의 acceptance criteria 참조

  **Acceptance Criteria**:

  **QA Scenarios:**

  ```
  Scenario: 프로덕션 빌드 성공
    Tool: Bash
    Preconditions: 모든 이전 task 완료
    Steps:
      1. Run: npm run test
      2. Assert: all tests pass, exit code 0
      3. Run: npm run build
      4. Assert: Build succeeded, exit code 0
      5. Run: grep -r "picsum.photos" src/
      6. Assert: 0 results
      7. Run: grep -r "sk_live_" src/
      8. Assert: 0 results
      9. Run: grep -r "nf-mock-data" src/
      10. Assert: 0 results
    Expected Result: 테스트 통과, 빌드 성공, mock 데이터 0건
    Failure Indicators: 테스트 실패, 빌드 에러, mock 잔존
    Evidence: .sisyphus/evidence/task-15-build.txt

  Scenario: 메인 페이지 + 기사 페이지 동작 확인
    Tool: Playwright
    Preconditions: Dev server running on port 3001
    Steps:
      1. Navigate to http://localhost:3001
      2. Assert: 페이지 제목 "광전타임즈" 포함
      3. Assert: 기사 목록 렌더링 (article card 존재)
      4. Assert: Footer에 "뉴스레터" 텍스트 없음
      5. Click first article
      6. Assert: 기사 상세 페이지 로드
      7. Assert: JSON-LD script 태그 존재
      8. Assert: 이미지 정상 로드 (picsum 아닌 실제 URL)
    Expected Result: 메인/기사 페이지 정상 동작
    Failure Indicators: 빈 화면, 깨진 이미지, 에러
    Evidence: .sisyphus/evidence/task-15-public-pages.png

  Scenario: 관리자 페이지 동작 확인
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to http://localhost:3001/admin/login
      2. Login with admin / password
      3. Assert: 대시보드 로드
      4. Navigate to /admin/news-feed
      5. Assert: NF 페이지 로드 (빈 상태)
      6. Assert: 에러 없이 모든 탭 전환 가능
    Expected Result: 관리자 로그인 → NF 빈 상태 정상
    Failure Indicators: 로그인 실패, 에러 화면
    Evidence: .sisyphus/evidence/task-15-admin-pages.png

  Scenario: 보안 헤더 + API 인증 확인
    Tool: Bash (curl)
    Preconditions: Dev server running
    Steps:
      1. Run: curl -sI http://localhost:3001 | grep -ci "content-security-policy"
      2. Assert: 1
      3. Run: curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/nf/articles
      4. Assert: 401
      5. Run: curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/nf/connection
      6. Assert: 401
    Expected Result: CSP 헤더 존재, NF API 401 반환
    Failure Indicators: 헤더 없음, 200 반환
    Evidence: .sisyphus/evidence/task-15-security.txt
  ```

  **Commit**: NO (검증만)

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + linter + `npm run test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together, not isolation). Test edge cases: empty state, invalid input, rapid actions. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1**: `chore: set up vitest test infrastructure` — vitest.config.ts, package.json
- **Wave 1**: `refactor: extract NF constants from mock data file` — nf-constants.ts, nf-mock-data.ts
- **Wave 2**: `chore: remove all mock data and placeholder URLs` — nf-mock-data.ts (delete), next.config.ts, setup-supabase.mjs
- **Wave 2**: `fix(security): sanitize dangerouslySetInnerHTML in admin previews` — ArticlePreview.tsx, NfArticlePreview.tsx
- **Wave 2**: `fix(security): add auth to NF API routes + empty state` — api/nf/*.ts
- **Wave 2**: `fix: use logged-in user ID for NF article publish` — NfArticleExplorer.tsx
- **Wave 2**: `feat: disable newsletter subscription + hide Kakao share` — Footer.tsx, NewsletterSubscribe.tsx, newsletter/route.ts
- **Wave 3**: `fix(security): add cookie-based rate limiting to view counter` — view/route.ts
- **Wave 3**: `fix(ui): improve NF empty state handling and error UX` — NF components
- **Wave 3**: `fix(security): add CSP, HSTS, Permissions-Policy headers` — next.config.ts
- **Wave 3**: `feat(seo): add JSON-LD structured data for articles` — article/[id]/page.tsx
- **Wave 3**: `fix(a11y): add button types and SVG accessibility` — AdminHeader.tsx, admin pages
- **Wave 4**: `chore: clean up next.config.ts for production` — next.config.ts
- **Wave 4**: `docs: add .env.example and deployment guide` — .env.example

---

## Success Criteria

### Verification Commands
```bash
npm run build        # Expected: Build succeeded, 0 errors
npm run test         # Expected: All tests pass
grep -r "picsum.photos" src/  # Expected: 0 results
grep -r "sk_live_" src/       # Expected: 0 results
grep -r "nf-mock-data" src/   # Expected: 0 results
curl -sI localhost:3001 | grep -i "content-security-policy"  # Expected: present
curl -sI localhost:3001 | grep -i "strict-transport-security" # Expected: present
curl -s localhost:3001/api/nf/articles  # Expected: {"error":"Unauthorized"} 401
curl -s localhost:3001/api/nf/connection  # Expected: {"error":"Unauthorized"} 401
curl -s localhost:3001 | grep -c "뉴스레터"  # Expected: 0
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] Build succeeds
- [ ] Security headers verified
- [ ] Mock data completely removed
- [ ] NF admin tab shows proper empty states
