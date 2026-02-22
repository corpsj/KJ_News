# 프로덕션 최종 진입 — 테스트 데이터 정리 + 보안 강화

## TL;DR

> **Quick Summary**: DB에서 테스트 기사 18개 + 가짜 작성자 5명 일괄 삭제하는 admin cleanup API를 만들고, scripts/ 하드코딩 자격증명을 환경변수화하여 프로덕션 진입 준비를 완료한다.
> 
> **Deliverables**:
> - `/api/admin/cleanup` POST endpoint (인증 필수, articles + authors 일괄 삭제)
> - `scripts/setup-supabase.mjs` 자격증명 환경변수화
> - `scripts/run-schema.mjs` 자격증명 환경변수화
> - `.env.example` 업데이트 (DATABASE_URL 추가)
> - 프로덕션 빌드 검증 통과 (빈 DB 상태)
> 
> **Estimated Effort**: Short
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 → Task 3 → Task 4 → F1

---

## Context

### Original Request
"기존 기사는 모두 삭제하고 대시보드의 값들도 실제의 값으로 모두 변경 해서 프로덕션으로 진입하자"

### Interview Summary
**Key Discussions**:
- **대시보드 분석**: admin/page.tsx 모든 통계가 이미 AdminContext→Supabase 실시간 쿼리. 코드 변경 불필요.
- **NF 대시보드**: 의도적 빈 상태 (NF "준비 중"). 변경 불필요.
- **카테고리/작성자**: 카테고리 8개 유지, 작성자 5명 삭제
- **삭제 방식**: 코드에서 일괄 삭제 API 추가
- **보안**: scripts/ 하드코딩 자격증명 → 환경변수화

**Research Findings**:
- articles FK → categories/authors 모두 `ON DELETE SET NULL` — 삭제 안전
- `authors` 테이블에 RLS DELETE 정책이 없음 → `createServiceClient()` 사용 필수
- 기존 `/api/admin/` 경로 없음 — 새로운 패턴
- ISR 캐시는 자동 갱신됨 (article detail 최대 1시간, homepage 1분)
- scripts/에 SERVICE_ROLE_KEY JWT, DB 비밀번호, admin 비밀번호 하드코딩
- `.env.example`에 DATABASE_URL 누락

### Metis Review
**Identified Gaps** (addressed):
- RLS DELETE 정책 미존재 → createServiceClient() 사용으로 우회
- 부분 실패 위험 → articles 먼저 삭제, 성공 후 authors 삭제 (2단계)
- Cleanup endpoint 보안 → 인증 + 확인 헤더 요구
- DATABASE_URL .env.example 누락 → Task 2에서 추가
- ISR 캐시 → 자동 갱신, 코드 변경 불필요

---

## Work Objectives

### Core Objective
프로덕션 배포 전 테스트 데이터를 안전하게 제거하고, 소스코드의 하드코딩 자격증명을 정리한다.

### Concrete Deliverables
- `/api/admin/cleanup/route.ts` — admin-only 일괄 삭제 API
- 정리된 `scripts/setup-supabase.mjs` (환경변수 사용)
- 정리된 `scripts/run-schema.mjs` (환경변수 사용)
- 업데이트된 `.env.example` (DATABASE_URL 추가)
- 빈 DB 상태에서 프로덕션 빌드 통과

### Definition of Done
- [ ] `npm run build` — 0 errors (빈 DB 상태)
- [ ] `npm run test` — all pass
- [ ] `curl -s -X POST localhost:3001/api/admin/cleanup` — 401 반환 (인증 없이)
- [ ] `SELECT count(*) FROM articles;` — 0
- [ ] `SELECT count(*) FROM authors;` — 0
- [ ] `SELECT count(*) FROM categories;` — 8
- [ ] `grep -c "eyJ" scripts/setup-supabase.mjs` — 0
- [ ] `grep -c "kjtimes2026\|etMBDcYN9spvf4q6" scripts/*.mjs` — 0

### Must Have
- 기사 + 작성자 완전 삭제
- Cleanup API 인증 필수
- Scripts 하드코딩 자격증명 제거
- 빈 DB에서 빌드 통과

### Must NOT Have (Guardrails)
- `src/app/special/layout.tsx` 수정 금지
- `AdminContext.tsx`, `AuthContext.tsx` 수정 금지
- 카테고리 삭제 금지 (8개 전부 유지)
- NF 기능/라우트 수정 금지
- `next.config.ts` 수정 금지
- RLS 정책 추가/변경 금지 (service client로 우회)
- Supabase storage/bucket 정리 금지 (테스트 기사 thumbnail 전부 비어있음)
- git history rewrite 금지 (자격증명 로테이션으로 대응)
- ISR 캐시 버스팅/revalidation 로직 추가 금지 (자동 갱신)
- soft-delete, audit logging, RBAC 추가 금지

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (vitest, 이전 계획에서 세팅 완료)
- **Automated tests**: NO (일회성 파괴적 작업이므로 TDD 불필요)
- **Framework**: vitest (기존 테스트 통과 확인만)

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **API/Backend**: Use Bash (curl) — Send requests, assert status + response fields
- **Build**: Use Bash — npm run build, npm run test

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — parallel):
├── Task 1: /api/admin/cleanup endpoint 생성 [quick]
└── Task 2: scripts/ 자격증명 환경변수화 + .env.example [quick]

Wave 2 (After Wave 1 — sequential):
├── Task 3: Cleanup 실행 + 검증 (depends: 1) [unspecified-high]
└── Task 4: 프로덕션 빌드 최종 검증 (depends: 1, 2, 3) [deep]

Wave FINAL (After ALL — review):
└── Task F1: 최종 점검 (depends: 4) [unspecified-high]
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 3, 4 | 1 |
| 2 | — | 4 | 1 |
| 3 | 1 | 4 | 2 |
| 4 | 1, 2, 3 | F1 | 2 |
| F1 | 4 | — | FINAL |

### Agent Dispatch Summary

- **Wave 1**: **2** — T1 → `quick`, T2 → `quick`
- **Wave 2**: **2** — T3 → `unspecified-high`, T4 → `deep`
- **FINAL**: **1** — F1 → `unspecified-high`

---

## TODOs

- [ ] 1. /api/admin/cleanup 일괄 삭제 API endpoint 생성

  **What to do**:
  - `src/app/api/admin/cleanup/route.ts` 신규 생성
  - POST 핸들러 구현:
    1. `createClient()` (cookie-based)로 세션 확인 → `supabase.auth.getUser()` → user 없으면 401
    2. 확인 헤더 체크: `request.headers.get('x-confirm-cleanup') === 'DELETE_ALL_DATA'` → 없으면 400
    3. `createServiceClient()` (service role, RLS 우회)로 삭제 실행:
       - Step A: `DELETE FROM articles` (전체 삭제) → `supabase.from("articles").delete().neq("id", 0)`
       - Step B: articles 삭제 성공 확인 후 `DELETE FROM authors` → `supabase.from("authors").delete().neq("id", 0)`
    4. 삭제 결과 반환: `{ success: true, deleted: { articles: N, authors: N } }`
    5. 에러 시: `{ success: false, error: "message" }` + 500
  - Import 필요: `createClient` from `@/lib/supabase/server`, `createServiceClient` from `@/lib/supabase/server`

  **Must NOT do**:
  - categories 삭제 금지 (반드시 유지)
  - RLS 정책 추가/변경 금지
  - AdminContext.tsx 수정 금지
  - GET 핸들러 추가 금지 (POST만)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 API route 파일 생성. 기존 패턴(email/route.ts) 참고하여 구현.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Tasks 3, 4
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/app/api/email/route.ts:7-17` — 인증 체크 패턴 (createClient → getUser → 401). 이 패턴을 그대로 따를 것
  - `src/lib/supabase/server.ts` — `createClient()` (cookie-based, RLS 준수) + `createServiceClient()` (service role, RLS 우회). 두 함수 모두 import 필요
  - `src/contexts/AdminContext.tsx:259-265` — 기존 deleteArticle 함수의 Supabase delete 패턴 참고

  **API/Type References**:
  - `src/lib/supabase/server.ts:29-36` — `createServiceClient()` 함수 시그니처. service role key로 RLS 우회

  **WHY Each Reference Matters**:
  - email/route.ts: 동일 프로젝트의 서버 인증 패턴. getUser()로 세션 확인
  - supabase/server.ts: authors 테이블에 RLS DELETE 정책이 없어서 createServiceClient() 필수
  - AdminContext deleteArticle: `.delete().eq("id", ...)` 패턴 참고

  **Acceptance Criteria**:

  **QA Scenarios:**

  ```
  Scenario: 인증 없이 호출 시 401
    Tool: Bash (curl)
    Preconditions: Dev server running on port 3001
    Steps:
      1. Run: curl -s -w "\n%{http_code}" -X POST http://localhost:3001/api/admin/cleanup
      2. Assert: HTTP 401
      3. Assert: response contains "Unauthorized" or "error"
    Expected Result: 401 Unauthorized
    Failure Indicators: 200 반환, 데이터 삭제됨
    Evidence: .sisyphus/evidence/task-1-unauth.txt

  Scenario: 확인 헤더 없이 호출 시 400
    Tool: Bash (curl)
    Preconditions: Dev server running, 인증 쿠키 필요 (로그인 상태)
    Steps:
      1. Run: (로그인 후 쿠키 획득하여) curl -s -w "\n%{http_code}" -X POST http://localhost:3001/api/admin/cleanup -b <cookie>
      2. Assert: HTTP 400
      3. Assert: response contains "confirm" or "header"
    Expected Result: 400 Bad Request (확인 헤더 누락)
    Failure Indicators: 200 반환
    Evidence: .sisyphus/evidence/task-1-no-confirm.txt

  Scenario: 빌드 통과 확인
    Tool: Bash
    Steps:
      1. Run: npm run build
      2. Assert: exit code 0
    Expected Result: Build succeeded
    Evidence: .sisyphus/evidence/task-1-build.txt
  ```

  **Commit**: YES
  - Message: `feat(admin): add bulk cleanup API endpoint for production prep`
  - Files: `src/app/api/admin/cleanup/route.ts`
  - Pre-commit: `npm run build`

- [ ] 2. scripts/ 자격증명 환경변수화 + .env.example 업데이트

  **What to do**:
  - **scripts/setup-supabase.mjs**:
    - Line 13: `const SUPABASE_URL = "https://..."` → `const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL`
    - Line 14-15: `const SERVICE_ROLE_KEY = "eyJ..."` → `const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY`
    - Line 270: `password: "kjtimes2026!"` → `password: process.env.ADMIN_PASSWORD || "changeme"`
    - Line 336: `console.log("  Admin login: admin@kjtimes.co.kr / kjtimes2026!")` → 비밀번호 출력 제거. `console.log("  Admin login: admin@kjtimes.co.kr / [set via ADMIN_PASSWORD env var]")`
    - 스크립트 시작 부분에 환경변수 검증 추가:
      ```javascript
      if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
        console.error("❌ Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
        process.exit(1);
      }
      ```
  - **scripts/run-schema.mjs**:
    - Lines 10-14: 하드코딩된 pg.Client config → `process.env.DATABASE_URL` 사용
    - 현재:
      ```javascript
      const client = new pg.Client({
        host: "aws-0-ap-northeast-2...",
        user: "postgres.erntl...",
        password: "etMBDcYN9spvf4q6",
        ...
      });
      ```
    - 변경:
      ```javascript
      const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
      ```
    - 환경변수 검증 추가
  - **.env.example** 업데이트:
    - `DATABASE_URL=` 추가 (주석: `# Direct DB connection for schema scripts`)
    - `ADMIN_PASSWORD=` 추가 (주석: `# Admin user password for setup script`)

  **Must NOT do**:
  - .env.local 수정 금지 (사용자가 직접 설정)
  - scripts의 실제 로직 변경 금지 (환경변수화만)
  - git history rewrite 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 2개 파일의 하드코딩 값을 process.env로 교체. 단순 텍스트 치환.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 4
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `scripts/setup-supabase.mjs:13-15` — 현재 하드코딩된 SUPABASE_URL과 SERVICE_ROLE_KEY 위치
  - `scripts/setup-supabase.mjs:269-270` — 하드코딩된 admin 비밀번호 위치
  - `scripts/run-schema.mjs:10-14` — 하드코딩된 pg.Client 설정 위치
  - `.env.example` — 현재 환경변수 템플릿. 여기에 DATABASE_URL, ADMIN_PASSWORD 추가

  **WHY Each Reference Matters**:
  - 정확한 줄 번호에서 교체할 값의 위치 확인
  - .env.example: 기존 형식에 맞춰 추가

  **Acceptance Criteria**:

  **QA Scenarios:**

  ```
  Scenario: 하드코딩 자격증명 제거 확인
    Tool: Bash
    Preconditions: 수정 완료
    Steps:
      1. Run: grep -c "eyJ" scripts/setup-supabase.mjs
      2. Assert: 0 (JWT 토큰 제거됨)
      3. Run: grep -c "kjtimes2026" scripts/setup-supabase.mjs
      4. Assert: 0 (admin 비밀번호 제거됨)
      5. Run: grep -c "etMBDcYN9spvf4q6" scripts/run-schema.mjs
      6. Assert: 0 (DB 비밀번호 제거됨)
      7. Run: grep -c "process.env" scripts/setup-supabase.mjs
      8. Assert: >= 2 (URL + KEY)
      9. Run: grep -c "process.env" scripts/run-schema.mjs
      10. Assert: >= 1 (DATABASE_URL)
    Expected Result: 모든 하드코딩 자격증명 제거, 환경변수 참조로 교체
    Failure Indicators: JWT 토큰, 비밀번호가 여전히 존재
    Evidence: .sisyphus/evidence/task-2-credentials.txt

  Scenario: .env.example 업데이트 확인
    Tool: Bash
    Steps:
      1. Run: grep "DATABASE_URL" .env.example
      2. Assert: 존재
      3. Run: grep "ADMIN_PASSWORD" .env.example
      4. Assert: 존재
    Expected Result: DATABASE_URL과 ADMIN_PASSWORD가 .env.example에 존재
    Evidence: .sisyphus/evidence/task-2-env-example.txt
  ```

  **Commit**: YES
  - Message: `fix(security): remove hardcoded credentials from setup scripts`
  - Files: `scripts/setup-supabase.mjs`, `scripts/run-schema.mjs`, `.env.example`
  - Pre-commit: `grep -c "eyJ" scripts/setup-supabase.mjs` (0이어야 함)

- [ ] 3. Cleanup API 실행 — 기사 + 작성자 일괄 삭제

  **What to do**:
  - Dev server 실행 확인 (port 3001)
  - 관리자 로그인하여 인증 쿠키 획득
  - Cleanup API 호출:
    ```bash
    curl -X POST http://localhost:3001/api/admin/cleanup \
      -H "x-confirm-cleanup: DELETE_ALL_DATA" \
      -b <auth_cookie>
    ```
  - 또는 Playwright로 로그인 후 fetch() 호출
  - 삭제 결과 확인:
    - articles: 0건
    - authors: 0건
    - categories: 8건 (유지)
  - 대시보드 확인: 빈 상태 정상 표시

  **Must NOT do**:
  - categories 삭제 금지
  - Supabase Dashboard에서 직접 삭제하지 않음 (API를 통해서만)
  - 스토리지 버킷 정리 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 인증 흐름 (로그인 → 쿠키 획득 → API 호출)이 필요. Playwright 또는 curl 조합.
  - **Skills**: [`playwright`]
    - `playwright`: 관리자 로그인 + 대시보드 빈 상태 확인

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (sequential)
  - **Blocks**: Task 4
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/app/api/admin/cleanup/route.ts` — Task 1에서 생성한 API endpoint
  - `src/app/admin/login/page.tsx` — 관리자 로그인 페이지. 인증 쿠키 획득 경로

  **WHY Each Reference Matters**:
  - cleanup/route.ts: API 호출 시 필요한 헤더와 인증 방식 확인
  - login 페이지: Playwright로 로그인하여 인증 쿠키 획득

  **Acceptance Criteria**:

  **QA Scenarios:**

  ```
  Scenario: Cleanup API 성공 실행
    Tool: Playwright + Bash
    Preconditions: Dev server running, Task 1 완료
    Steps:
      1. Playwright: http://localhost:3001/admin/login 접속
      2. 로그인 (admin@kjtimes.co.kr / kjtimes2026!)
      3. 인증 쿠키를 사용하여 cleanup API 호출
      4. Assert: response.success === true
      5. Assert: response.deleted.articles > 0
      6. Assert: response.deleted.authors > 0
    Expected Result: 기사 18건 + 작성자 5명 삭제 성공
    Failure Indicators: success: false, 401, 500
    Evidence: .sisyphus/evidence/task-3-cleanup-result.txt

  Scenario: 대시보드 빈 상태 확인
    Tool: Playwright
    Preconditions: Cleanup 실행 완료
    Steps:
      1. Navigate to http://localhost:3001/admin
      2. Assert: 총 기사 수 = 0
      3. Assert: 총 조회수 = 0
      4. Assert: 검토 대기 = 0
      5. Assert: 최근 기사 영역 비어있음
      6. Assert: TOP 5 영역 비어있음
      7. Screenshot 촬영
    Expected Result: 모든 통계 0, 리스트 비어있음
    Failure Indicators: 에러 화면, NaN, 크래시
    Evidence: .sisyphus/evidence/task-3-dashboard-empty.png

  Scenario: categories 유지 확인
    Tool: Playwright
    Preconditions: Cleanup 실행 완료
    Steps:
      1. Navigate to http://localhost:3001/admin
      2. Assert: 카테고리 분포 섹션에 8개 카테고리 이름 표시 (정치, 경제, 사회, 문화, 국제, IT/과학, 스포츠, 오피니언)
      3. 각 카테고리 count = 0
    Expected Result: 8개 카테고리 유지, count 0
    Failure Indicators: 카테고리 사라짐
    Evidence: .sisyphus/evidence/task-3-categories.png
  ```

  **Commit**: NO (DB 작업만, 코드 변경 없음)

- [ ] 4. 프로덕션 빌드 + 빈 DB 상태 최종 검증

  **What to do**:
  - `npm run build` — 빈 DB 상태에서 빌드 통과 확인
  - `npm run test` — 기존 7개 테스트 통과 확인
  - 공개 페이지 빈 상태 처리 확인:
    - Homepage (`/`) — 정상 로드, "기사가 없습니다" 또는 빈 리스트
    - 카테고리 페이지 (`/category/politics`) — 빈 상태 정상
    - 검색 (`/search?q=test`) — 결과 없음 정상
  - SEO 확인:
    - `/sitemap.xml` — article URL 0건
    - `/feed.xml` — item 0건
  - 보안 헤더 유지 확인:
    - CSP, HSTS, Permissions-Policy 헤더 존재

  **Must NOT do**:
  - 코드 수정 금지 (검증만)
  - 페이지 빈 상태 UI 변경 금지

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 빌드, 테스트, 다수 페이지 검증. 꼼꼼한 확인 필요.
  - **Skills**: [`playwright`]
    - `playwright`: 공개 페이지 빈 상태 렌더링 확인

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (after Task 3)
  - **Blocks**: F1
  - **Blocked By**: Tasks 1, 2, 3

  **References**:

  **Pattern References**:
  - `src/app/(public)/page.tsx` — Homepage 렌더링. 기사 0건일 때 동작 확인
  - `src/app/(public)/category/[slug]/page.tsx` — 카테고리 페이지 빈 상태
  - `src/app/sitemap.ts` — sitemap 생성 로직
  - `src/app/feed.xml/route.ts` — RSS feed 생성 로직

  **WHY Each Reference Matters**:
  - 공개 페이지가 빈 DB에서 크래시하지 않는지 확인

  **Acceptance Criteria**:

  **QA Scenarios:**

  ```
  Scenario: 빌드 + 테스트 통과
    Tool: Bash
    Steps:
      1. Run: npm run build
      2. Assert: exit code 0
      3. Run: npm run test
      4. Assert: 7 tests pass, 0 failures
    Expected Result: 빌드 + 테스트 모두 통과
    Evidence: .sisyphus/evidence/task-4-build.txt

  Scenario: 공개 페이지 빈 상태 정상
    Tool: Playwright
    Preconditions: Dev server running, DB 비어있음
    Steps:
      1. Navigate to http://localhost:3001
      2. Assert: HTTP 200, 페이지 렌더링 (크래시 없음)
      3. Navigate to http://localhost:3001/category/politics
      4. Assert: HTTP 200, 빈 상태 또는 "기사가 없습니다"
    Expected Result: 모든 공개 페이지 정상 로드
    Failure Indicators: 500 에러, 빈 화면, 크래시
    Evidence: .sisyphus/evidence/task-4-public-pages.png

  Scenario: SEO 빈 상태 확인
    Tool: Bash (curl)
    Steps:
      1. Run: curl -s http://localhost:3001/sitemap.xml | grep -c "/article/"
      2. Assert: 0
      3. Run: curl -s http://localhost:3001/feed.xml | grep -c "<item>"
      4. Assert: 0
    Expected Result: sitemap과 RSS에 article 없음
    Evidence: .sisyphus/evidence/task-4-seo.txt

  Scenario: 보안 헤더 유지 확인
    Tool: Bash (curl)
    Steps:
      1. Run: curl -sI http://localhost:3001 | grep -ci "content-security-policy"
      2. Assert: >= 1
      3. Run: curl -sI http://localhost:3001 | grep -ci "strict-transport-security"
      4. Assert: >= 1
    Expected Result: 보안 헤더 유지
    Evidence: .sisyphus/evidence/task-4-headers.txt
  ```

  **Commit**: NO (검증만, 코드 변경 없음)

---

## Final Verification Wave

- [ ] F1. **프로덕션 준비 최종 점검** — `unspecified-high`
  articles 0건, authors 0건, categories 8건 확인. Homepage 200 응답. Admin 대시보드 빈 상태 정상 표시. sitemap.xml에 /article/ URL 0건. feed.xml에 item 0건. scripts/에 하드코딩 자격증명 0건. npm run build + npm run test 통과.
  Output: `DB [CLEAN] | Build [PASS] | Tests [PASS] | Scripts [CLEAN] | VERDICT: APPROVE/REJECT`

---

## Commit Strategy

- **T1**: `feat(admin): add bulk cleanup API endpoint for production prep`
- **T2**: `fix(security): remove hardcoded credentials from setup scripts`
- **T3**: No commit (DB operation only)
- **T4**: No commit (verification only)

---

## Success Criteria

### Verification Commands
```bash
npm run build          # Expected: exit 0
npm run test           # Expected: all pass
curl -s localhost:3001  # Expected: 200, homepage loads
curl -s -X POST localhost:3001/api/admin/cleanup  # Expected: 401
grep -rc "eyJ" scripts/*.mjs  # Expected: 0
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] DB clean (articles 0, authors 0, categories 8)
- [ ] 프로덕션 빌드 통과

### Post-Deployment Recommendation
> ⚠️ 배포 후 반드시 수행:
> 1. Supabase Dashboard에서 SERVICE_ROLE_KEY 로테이션
> 2. Admin 비밀번호 변경 (현재 kjtimes2026! → 강력한 랜덤 비밀번호)
> 3. DB 비밀번호 변경 (현재 etMBDcYN9spvf4q6)
> 4. `/api/admin/cleanup` 엔드포인트 삭제 또는 비활성화 검토
