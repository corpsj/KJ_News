# 버그 수정 및 품질 개선 — 클라이언트 QA 대비

## TL;DR

> **Quick Summary**: 6개 에이전트의 전체 코드베이스 감사 결과, 코드 버그 3건 + 누락된 UX 2건 + 문서 정리 1건 + 보안 1건을 수정
> 
> **Deliverables**:
> - 코드 버그 3건 수정 (updateAuthor 불완전, refresh 이중호출, 삭제 에러 무시)
> - 로딩 상태 2건 추가 (기사 상세, 카테고리 페이지)
> - 문서에서 삭제된 기능 참조 제거
> - NF 프리뷰 XSS 취약점 수정
> 
> **Estimated Effort**: Short (1-2시간)
> **Parallel Execution**: YES — 3 waves
> **Critical Path**: Task 1-3 (독립) → Task 4-5 (독립) → Task 6-8 (독립)

---

## Context

### Original Request
사용자가 "고쳐야 할 부분이 있는지 찾아줘, 개선할 부분이 있는지도 찾아줘, 클라이언트한테 꼬투리 잡히지 않게 해줘"라고 요청.

### Audit Summary
6개 병렬 탐색 에이전트로 전체 코드베이스를 감사:
1. **창간특별호 잔여 참조** → readme 문서 2개에 18개 참조 남아있음
2. **코드 품질** → TypeScript 깨끗, 미사용 임포트 없음, console.error는 허용 수준
3. **Admin UX** → 삭제 에러핸들링 누락, NF 배치 오류 처리 부족
4. **퍼블릭 페이지** → 기사 상세/카테고리 로딩 화면 누락
5. **회귀 분석** → updateAuthor avatar_url 누락, NF 새로고침 race condition
6. **보안** → NF 프리뷰 XSS 취약점 (plainTextToHtml 미살균)

---

## Work Objectives

### Core Objective
클라이언트 QA에서 지적할 수 있는 모든 버그와 미완성 부분을 수정하여, 프로덕션 수준의 완성도를 확보한다.

### Must Have
- 코드 버그 3건 수정
- 로딩 화면 2건 추가
- 문서 정리 (삭제된 기능 참조 제거)
- XSS 취약점 수정

### Must NOT Have (Guardrails)
- 기존 동작하는 기능을 변경하지 않을 것
- 새로운 기능을 추가하지 않을 것 (버그 수정과 품질 개선만)
- 인프라/DB 스키마 변경 없음 (RLS 정책 등은 별도 작업)
- console.error 제거하지 않을 것 (admin CMS에서는 유용한 디버깅 정보)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.

### Test Decision
- **Infrastructure exists**: NO (테스트 프레임워크 미설치)
- **Automated tests**: None
- **Framework**: none

### QA Policy
Every task MUST include agent-executed QA scenarios.
- **Build**: `npm run build` → exit code 0
- **LSP**: 모든 수정 파일에서 `lsp_diagnostics` 에러 0건

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — 코드 버그 수정, MAX PARALLEL):
├── Task 1: AdminContext updateAuthor avatar_url 수정 [quick]
├── Task 2: NF 새로고침 버튼 race condition 수정 [quick]
├── Task 3: 기사 삭제 에러 핸들링 추가 [quick]
└── Task 4: NF 프리뷰 XSS 수정 [quick]

Wave 2 (After Wave 1 — 로딩 화면 추가):
├── Task 5: 기사 상세 페이지 loading.tsx 추가 [quick]
└── Task 6: 카테고리 페이지 loading.tsx 추가 [quick]

Wave 3 (After Wave 2 — 문서 정리):
├── Task 7: readme_for_agent.md 창간특별호 참조 제거 [quick]
└── Task 8: readme_for_human.md 창간특별호 참조 제거 [quick]

Wave FINAL (After ALL tasks):
└── Task F1: 빌드 검증 + LSP 진단 [quick]
```

### Dependency Matrix
- **1-4**: 없음 — 즉시 병렬 시작 가능
- **5-6**: Wave 1 완료 후 (기능적 의존성은 없으나 빌드 안정성 위해)
- **7-8**: 독립적이나 코드 수정 이후에 실행
- **F1**: 전체 완료 후

---

## TODOs

- [ ] 1. AdminContext updateAuthor — avatar_url 필드 누락 수정

  **What to do**:
  - `src/contexts/AdminContext.tsx` line 366-370의 `setArticles` 호출 수정
  - 현재: `{ ...a, author: { ...a.author, name: mapped.name, role: mapped.role } }` (avatar_url 누락)
  - 수정: `{ ...a, author: mapped }` (전체 author 객체 사용)

  **Must NOT do**:
  - mapAuthor 함수를 수정하지 말 것
  - setAuthors 호출을 변경하지 말 것

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `src/contexts/AdminContext.tsx:351-374` — updateAuthor 함수 전체
  - `src/contexts/AdminContext.tsx:88-95` — mapAuthor 함수 (Author 타입 매핑)
  - `src/lib/types.ts` — Author 타입 정의 (id, name, role, avatar_url)

  **Acceptance Criteria**:
  - [ ] `lsp_diagnostics` on AdminContext.tsx → 0 errors
  - [ ] `npm run build` → success

  **QA Scenarios**:
  ```
  Scenario: author 업데이트 시 모든 필드가 articles에 반영되는지 확인
    Tool: Bash (grep)
    Steps:
      1. AdminContext.tsx에서 setArticles 내부의 author 할당 패턴 확인
      2. grep으로 `author: mapped` 패턴이 존재하는지 확인
    Expected Result: `a.author.id === id ? { ...a, author: mapped } : a` 패턴 존재
    Evidence: .sisyphus/evidence/task-1-author-update.txt
  ```

  **Commit**: YES (groups with 2, 3, 4)
  - Message: `fix: 코드 버그 수정 (updateAuthor, refresh race condition, 삭제 에러핸들링, XSS)`
  - Files: `src/contexts/AdminContext.tsx`

---

- [ ] 2. NF 새로고침 버튼 race condition 수정

  **What to do**:
  - `src/components/admin/nf/NfArticleExplorer.tsx` line 476의 onClick 핸들러 수정
  - 현재: `onClick={() => { setPage(0); fetchArticlesData(); }}` (이중 fetch 발생)
  - 수정: `onClick={() => fetchArticlesData()}` (직접 호출만)
  - 이유: setPage(0)가 useEffect 의존성을 통해 fetchArticlesData를 한번 더 트리거

  **Must NOT do**:
  - fetchArticlesData 함수를 수정하지 말 것
  - useEffect 의존성을 변경하지 말 것
  - 검색 버튼(doSearch)을 수정하지 말 것

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `src/components/admin/nf/NfArticleExplorer.tsx:476` — 새로고침 버튼
  - `src/components/admin/nf/NfArticleExplorer.tsx:99` — useEffect dependency on fetchArticlesData
  - `src/components/admin/nf/NfArticleExplorer.tsx:48-87` — fetchArticlesData useCallback

  **Acceptance Criteria**:
  - [ ] `lsp_diagnostics` → 0 errors
  - [ ] `npm run build` → success

  **QA Scenarios**:
  ```
  Scenario: 새로고침 버튼이 setPage(0) 없이 fetchArticlesData만 호출하는지 확인
    Tool: Bash (grep)
    Steps:
      1. NfArticleExplorer.tsx에서 새로고침 버튼의 onClick 확인
      2. setPage(0)이 onClick에 포함되지 않는지 확인
    Expected Result: onClick에 fetchArticlesData() 호출만 존재, setPage(0) 없음
    Evidence: .sisyphus/evidence/task-2-refresh-button.txt
  ```

  **Commit**: YES (groups with 1, 3, 4)
  - Files: `src/components/admin/nf/NfArticleExplorer.tsx`

---

- [ ] 3. 기사 삭제 에러 핸들링 추가

  **What to do**:
  - `src/app/admin/articles/page.tsx` lines 53-65의 `confirmDelete` 함수를 try/catch로 감싸기
  - catch 블록에서 `toast("삭제 중 오류가 발생했습니다.", "error")` 호출
  - `setDeleteTarget(null)`은 finally 또는 try/catch 바깥에서 항상 실행되도록 유지

  **Must NOT do**:
  - deleteArticle 함수 자체를 수정하지 말 것
  - ConfirmDialog 컴포넌트를 변경하지 말 것

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `src/app/admin/articles/page.tsx:53-65` — confirmDelete 함수
  - `src/contexts/ToastContext.tsx` — toast(message, type) 사용법

  **Acceptance Criteria**:
  - [ ] `lsp_diagnostics` → 0 errors
  - [ ] `npm run build` → success
  - [ ] confirmDelete 함수가 try/catch로 감싸져 있음

  **QA Scenarios**:
  ```
  Scenario: confirmDelete 함수에 try/catch가 존재하는지 확인
    Tool: Bash (grep)
    Steps:
      1. articles/page.tsx에서 confirmDelete 함수 내부에 try/catch 존재 확인
      2. catch 블록에 toast 에러 호출 확인
    Expected Result: try { ... } catch { toast("삭제 중 오류가 발생했습니다.", "error") } 패턴 존재
    Evidence: .sisyphus/evidence/task-3-delete-error.txt
  ```

  **Commit**: YES (groups with 1, 2, 4)
  - Files: `src/app/admin/articles/page.tsx`

---

- [ ] 4. NF 프리뷰 XSS 취약점 수정

  **What to do**:
  - `src/components/admin/nf/NfArticleExplorer.tsx` line 763에서 dangerouslySetInnerHTML에 sanitizeHtml 적용
  - 현재: `dangerouslySetInnerHTML={{ __html: plainTextToHtml(selectedArticle.content) }}`
  - 수정: `dangerouslySetInnerHTML={{ __html: sanitizeHtml(plainTextToHtml(selectedArticle.content)) }}`
  - 파일 상단에 `import { sanitizeHtml } from "@/lib/sanitize";` 추가

  **Must NOT do**:
  - plainTextToHtml 함수를 수정하지 말 것
  - sanitizeHtml 함수를 수정하지 말 것
  - 다른 dangerouslySetInnerHTML 사용처를 변경하지 말 것 (이미 sanitize 적용됨)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `src/components/admin/nf/NfArticleExplorer.tsx:763` — dangerouslySetInnerHTML 사용처
  - `src/lib/sanitize.ts` — sanitizeHtml 함수 (sanitize-html 라이브러리 사용)
  - `src/lib/nf-constants.ts:11-18` — plainTextToHtml 함수 (HTML 이스케이핑 없음)
  - `src/components/admin/ArticlePreview.tsx:117` — 기존 sanitizeHtml 사용 패턴 참고

  **Acceptance Criteria**:
  - [ ] `lsp_diagnostics` → 0 errors
  - [ ] `npm run build` → success
  - [ ] sanitizeHtml이 import되고 적용됨

  **QA Scenarios**:
  ```
  Scenario: NF 프리뷰에서 sanitizeHtml이 적용되는지 확인
    Tool: Bash (grep)
    Steps:
      1. NfArticleExplorer.tsx에서 sanitizeHtml import 확인
      2. dangerouslySetInnerHTML에 sanitizeHtml 래핑 확인
    Expected Result: sanitizeHtml(plainTextToHtml(...)) 패턴 존재
    Evidence: .sisyphus/evidence/task-4-xss-fix.txt
  ```

  **Commit**: YES (groups with 1, 2, 3)
  - Files: `src/components/admin/nf/NfArticleExplorer.tsx`

---

- [ ] 5. 기사 상세 페이지 loading.tsx 추가

  **What to do**:
  - `src/app/(public)/article/[id]/loading.tsx` 파일 새로 생성
  - 기존 `src/app/(public)/loading.tsx`의 스켈레톤 패턴을 참고하되, 기사 상세 레이아웃에 맞게 조정
  - 제목 스켈레톤(큰 바), 본문 스켈레톤(여러 줄), 사이드바 스켈레톤 포함

  **Must NOT do**:
  - 기존 loading.tsx 파일을 수정하지 말 것
  - 외부 라이브러리를 추가하지 말 것

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 6)
  - **Blocks**: None
  - **Blocked By**: Wave 1

  **References**:
  - `src/app/(public)/loading.tsx` — 메인 페이지 로딩 스켈레톤 (패턴 참고)
  - `src/app/(public)/search/loading.tsx` — 검색 페이지 로딩 스켈레톤 (패턴 참고)
  - `src/app/(public)/article/[id]/page.tsx` — 기사 상세 레이아웃 구조 참고

  **Acceptance Criteria**:
  - [ ] 파일이 생성됨: `src/app/(public)/article/[id]/loading.tsx`
  - [ ] `npm run build` → success

  **QA Scenarios**:
  ```
  Scenario: loading.tsx 파일 존재 및 빌드 성공 확인
    Tool: Bash
    Steps:
      1. ls로 파일 존재 확인
      2. npm run build 성공 확인
    Expected Result: 파일 존재, 빌드 성공
    Evidence: .sisyphus/evidence/task-5-article-loading.txt
  ```

  **Commit**: YES (groups with 6)
  - Message: `feat: 기사 상세/카테고리 페이지 로딩 스켈레톤 추가`
  - Files: `src/app/(public)/article/[id]/loading.tsx`

---

- [ ] 6. 카테고리 페이지 loading.tsx 추가

  **What to do**:
  - `src/app/(public)/category/[slug]/loading.tsx` 파일 새로 생성
  - 카테고리 헤더 + 기사 카드 그리드 스켈레톤 레이아웃

  **Must NOT do**:
  - 기존 파일 수정하지 말 것

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 5)
  - **Blocks**: None
  - **Blocked By**: Wave 1

  **References**:
  - `src/app/(public)/loading.tsx` — 메인 페이지 로딩 스켈레톤 (패턴 참고)
  - `src/app/(public)/category/[slug]/page.tsx` — 카테고리 페이지 레이아웃 구조 참고

  **Acceptance Criteria**:
  - [ ] 파일이 생성됨: `src/app/(public)/category/[slug]/loading.tsx`
  - [ ] `npm run build` → success

  **QA Scenarios**:
  ```
  Scenario: loading.tsx 파일 존재 및 빌드 성공 확인
    Tool: Bash
    Steps:
      1. ls로 파일 존재 확인
      2. npm run build 성공 확인
    Expected Result: 파일 존재, 빌드 성공
    Evidence: .sisyphus/evidence/task-6-category-loading.txt
  ```

  **Commit**: YES (groups with 5)
  - Files: `src/app/(public)/category/[slug]/loading.tsx`

---

- [ ] 7. readme_for_agent.md에서 창간특별호 참조 제거

  **What to do**:
  - 다음 섹션/줄 삭제 또는 수정:
    - Lines 643-655: getSpecialEditionArticles, getSpecialRelatedArticles 함수 문서
    - Line 662: "special page" 코멘트
    - Lines 1172-1192: 섹션 14.8 전체 (Special Edition 문서)
    - Line 1317: Header 설명에서 "창간특별호" 참조
    - Line 1492: sitemap 생성에서 /special 경로
    - Lines 1660-1661: ISR 라우트 테이블에서 /special 항목

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 8)
  - **Blocks**: None
  - **Blocked By**: Wave 2

  **References**:
  - `readme_for_agent.md` — 상기 라인 번호 참조

  **Acceptance Criteria**:
  - [ ] "특별호", "special" 키워드가 readme_for_agent.md에서 모두 제거됨

  **Commit**: YES (groups with 8)
  - Message: `docs: readme에서 삭제된 창간특별호 참조 제거`
  - Files: `readme_for_agent.md`

---

- [ ] 8. readme_for_human.md에서 창간특별호 참조 제거

  **What to do**:
  - Line 31: `src/app/special/` 디렉토리 참조 제거
  - Line 48: "특별판" 기능 설명 제거

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 7)
  - **Blocks**: None
  - **Blocked By**: Wave 2

  **References**:
  - `readme_for_human.md` — 상기 라인 번호 참조

  **Acceptance Criteria**:
  - [ ] "특별판", "special" 키워드가 readme_for_human.md에서 모두 제거됨

  **Commit**: YES (groups with 7)
  - Files: `readme_for_human.md`

---

## Final Verification Wave

- [ ] F1. **빌드 검증 + LSP 진단**
  `npm run build` 실행하여 전체 빌드 성공 확인. 모든 수정 파일에 대해 `lsp_diagnostics` 실행하여 에러 0건 확인.

---

## Commit Strategy

- **Commit 1**: `fix: 코드 버그 수정 (updateAuthor 필드 누락, refresh race condition, 삭제 에러핸들링, XSS)` — Tasks 1-4
- **Commit 2**: `feat: 기사 상세/카테고리 페이지 로딩 스켈레톤 추가` — Tasks 5-6
- **Commit 3**: `docs: readme에서 삭제된 창간특별호 참조 제거` — Tasks 7-8

---

## Success Criteria

### Final Checklist
- [ ] `npm run build` 성공
- [ ] LSP 에러 0건
- [ ] updateAuthor가 전체 author 객체를 articles에 반영
- [ ] NF 새로고침이 이중 fetch 없이 작동
- [ ] 기사 삭제 실패 시 에러 토스트 표시
- [ ] NF 프리뷰에 sanitizeHtml 적용됨
- [ ] 기사 상세/카테고리 페이지에 로딩 스켈레톤 표시
- [ ] readme 파일에서 창간특별호 참조 완전 제거
