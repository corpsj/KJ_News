# NF Article Explorer UX v2 — Date Grouping, Quick Actions, Batch Operations

## TL;DR

> **Quick Summary**: Redesign the NF Article Explorer component to add date-based article grouping, move publish/import buttons to a top sticky action bar, add inline quick-publish from list, and support multi-select batch import/publish for handling hundreds of articles.
> 
> **Deliverables**:
> - Rewritten `NfArticleExplorer.tsx` with date grouping, top action bar, inline quick-actions, multi-select batch ops
> - Updated `globals.css` with new NF-specific CSS classes
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: NO — single component file, sequential modification
> **Critical Path**: Task 1 (implement) → Task 2 (build+deploy) → Task 3 (verify)

---

## Context

### Original Request
"뉴스팩토리 기사 탐색 시 날짜별 분류가 추가 되어야 해. 발행 버튼이 기사 맨 아래 있어서 불편해. 발행이 더 편해야해. 기사는 한번에 가져와 지는게 몇백건이 될 수도 있다는 점을 충분히 고려하고 시스템 UI/UX를 설계해줘"

### Current Pain Points
1. Articles are a flat list — no visual date grouping across 340+ articles
2. Import/publish buttons are at the very bottom of the detail panel — must scroll entire article to reach them
3. No batch operations — each article must be imported/published one by one
4. No quick-action from list — must open detail panel to take any action

### Technical Context
- **Component**: `src/components/admin/nf/NfArticleExplorer.tsx` (484 lines)
- **CSS**: `src/app/globals.css` (lines 612-799 for NF styles)
- **NfArticle.published_at**: ISO date string — used for grouping
- **API**: 50 articles/page, `from`/`to` date params supported server-side
- **Import flow**: `importArticle()` → status "pending_review", `addArticle(status="published")` → direct publish
- **ImportedMap**: `Map<string, string>` tracks article_id → "imported"|"published"

---

## Work Objectives

### Core Objective
Transform the NF Article Explorer into a production-grade article management interface that handles hundreds of articles with date-based organization, immediately accessible publish actions, and batch operations.

### Concrete Deliverables
- `NfArticleExplorer.tsx` — Rewritten with 4 new features
- `globals.css` — ~60-80 lines of new NF CSS classes added

### Definition of Done
- [ ] Articles are visually grouped by date in the list panel
- [ ] Import/Publish buttons are at the TOP of the detail panel (immediately visible)
- [ ] Inline quick-publish button exists on each list item
- [ ] Multi-select with batch import/publish works for any number of articles
- [ ] All existing functionality preserved (filters, pagination, mobile, toasts)
- [ ] `npm run build` succeeds with zero errors
- [ ] Deployed to production and verified via Playwright

### Must Have
- Date group headers showing "2026년 2월 22일 (토)" format with article count per date
- Sticky action bar at TOP of detail panel (below title, above content)
- Inline "바로 발행" quick-action icon on each list item
- Multi-select checkboxes on list items
- "이 페이지 전체 선택" toggle
- Batch action floating toolbar when items are selected (showing count + buttons)
- Sequential batch processing with progress indication
- All existing filters, pagination, mobile behavior, toast notifications preserved

### Must NOT Have (Guardrails)
- DO NOT modify `AdminContext.tsx`, `nf-client.ts`, `types.ts`, `nf-constants.ts`, `news-feed/page.tsx`
- DO NOT modify any API route files
- DO NOT change the master-detail split view layout structure
- DO NOT add external libraries — use existing React + Tailwind
- DO NOT change the NF API pagination model (50/page)
- DO NOT add virtual scrolling — standard pagination is sufficient
- DO NOT over-engineer — keep the component readable and maintainable

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: None
- **Framework**: None

### QA Policy
Every task includes agent-executed QA scenarios via Playwright.
Evidence saved to `.sisyphus/evidence/`.

---

## Execution Strategy

### Task Flow

```
Wave 1 (Implementation):
└── Task 1: Rewrite NfArticleExplorer.tsx + globals.css [visual-engineering + frontend-ui-ux]

Wave 2 (Deploy):
└── Task 2: Build + git commit + vercel deploy [quick]

Wave 3 (Verify):
└── Task 3: Playwright QA on production [quick + playwright]

Critical Path: Task 1 → Task 2 → Task 3
```

### Dependency Matrix
- **Task 1**: None → Blocks Task 2
- **Task 2**: Task 1 → Blocks Task 3
- **Task 3**: Task 2 → None

---

## TODOs

- [ ] 1. Rewrite NfArticleExplorer + Update CSS — Date Grouping, Top Action Bar, Inline Quick-Actions, Batch Operations

  **What to do**:

  Rewrite `src/components/admin/nf/NfArticleExplorer.tsx` and update `src/app/globals.css` to implement ALL four features in a single cohesive pass. The component currently has 484 lines and will grow to ~650-750 lines.

  **IMPORTANT: Read these files COMPLETELY before any modification:**
  - `src/components/admin/nf/NfArticleExplorer.tsx` — Current full component (484 lines)
  - `src/app/globals.css` — Current NF CSS (lines 612-799)
  - `src/lib/types.ts` — NfArticle type definition
  - `src/lib/nf-constants.ts` — NF_CATEGORY_LABELS, plainTextToHtml
  - `src/contexts/AdminContext.tsx` — importArticle, addArticle signatures
  - `src/contexts/ToastContext.tsx` — useToast() API

  ### Feature A: Date-Based Grouping in List Panel

  **Implementation:**
  1. After `articles` are fetched, group them by date using `published_at`:
     ```typescript
     // Group articles by date (client-side, from already-fetched page of 50)
     const groupedArticles = useMemo(() => {
       const groups: { date: string; label: string; articles: NfArticle[] }[] = [];
       const map = new Map<string, NfArticle[]>();
       
       for (const article of articles) {
         const dateKey = article.published_at?.slice(0, 10) || "unknown";
         if (!map.has(dateKey)) map.set(dateKey, []);
         map.get(dateKey)!.push(article);
       }
       
       for (const [dateKey, arts] of map) {
         const d = new Date(dateKey + "T00:00:00");
         const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
         const label = dateKey === "unknown" 
           ? "날짜 없음" 
           : `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${weekday})`;
         groups.push({ date: dateKey, label, articles: arts });
       }
       
       return groups;
     }, [articles]);
     ```

  2. Render date headers in the list panel:
     ```tsx
     {groupedArticles.map((group) => (
       <div key={group.date}>
         <div className="nf-date-header">
           <span>{group.label}</span>
           <span className="nf-date-count">{group.articles.length}건</span>
         </div>
         {group.articles.map((article) => (
           // ... existing list item rendering with added features
         ))}
       </div>
     ))}
     ```

  ### Feature B: Sticky Action Bar at TOP of Detail Panel

  **Implementation:**
  1. REMOVE the `nf-detail-actions` div from the BOTTOM of the detail panel
  2. ADD a new sticky action bar at the TOP, right after the mobile back button and before the hero image:
     ```tsx
     {selectedArticle && (
       <div className="nf-detail-topbar">
         <div className="nf-detail-topbar-info">
           <h3 className="text-[14px] font-semibold text-gray-900 line-clamp-1">
             {selectedArticle.title}
           </h3>
           <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
             {selectedArticle.source && <span>{selectedArticle.source}</span>}
             <span>·</span>
             {selectedArticle.published_at && <span>{formatDate(selectedArticle.published_at)}</span>}
           </div>
         </div>
         <div className="flex items-center gap-2">
           {importedMap.has(selectedArticle.id) ? (
             <span className="text-[12px] text-gray-400">
               {importedMap.get(selectedArticle.id) === "published" ? "✓ 발행됨" : "✓ 가져옴"}
             </span>
           ) : (
             <>
               <button onClick={(e) => handleImport(e, selectedArticle)}
                 className="admin-btn admin-btn-ghost text-[12px] py-1.5 px-3">
                 가져오기
               </button>
               <button onClick={(e) => handlePublish(e, selectedArticle)}
                 className="admin-btn admin-btn-primary text-[12px] py-1.5 px-3">
                 바로 발행
               </button>
             </>
           )}
         </div>
       </div>
     )}
     ```
  3. This bar is `position: sticky; top: 0; z-index: 5` so it stays visible while scrolling content

  ### Feature C: Inline Quick-Actions on List Items

  **Implementation:**
  1. Add a small "바로 발행" button on each list item (on hover, visible on right side):
     ```tsx
     {!importedMap.has(article.id) && (
       <button
         onClick={(e) => { e.stopPropagation(); handlePublish(e, article); }}
         className="nf-quick-publish"
         title="바로 발행"
       >
         <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
         </svg>
       </button>
     )}
     ```
  2. The button is positioned `absolute right-3 top-1/2 -translate-y-1/2` and appears on hover
  3. Has a tooltip via `title` attribute

  ### Feature D: Multi-Select & Batch Operations

  **New state variables:**
  ```typescript
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  ```

  **Selection logic:**
  ```typescript
  function handleToggleSelect(e: React.MouseEvent, articleId: string) {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(articleId)) next.delete(articleId);
      else next.add(articleId);
      return next;
    });
  }

  // Select all unprocessed articles on current page
  function handleSelectAllPage() {
    const unprocessedIds = articles
      .filter(a => !importedMap.has(a.id))
      .map(a => a.id);
    
    const allSelected = unprocessedIds.every(id => selectedIds.has(id));
    
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        for (const id of unprocessedIds) next.delete(id);
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        for (const id of unprocessedIds) next.add(id);
        return next;
      });
    }
  }
  ```

  **Batch handlers:**
  ```typescript
  async function handleBatchImport() {
    const ids = [...selectedIds].filter(id => !importedMap.has(id));
    if (ids.length === 0) return;
    
    setBatchProcessing(true);
    setBatchProgress({ current: 0, total: ids.length });
    let successCount = 0;
    
    for (const id of ids) {
      const article = articles.find(a => a.id === id);
      if (!article) continue;
      await handleImport(null, article);
      successCount++;
      setBatchProgress(prev => ({ ...prev, current: prev.current + 1 }));
    }
    
    setBatchProcessing(false);
    setSelectedIds(new Set());
    toast(`${successCount}건의 기사를 가져왔습니다.`, "success");
  }

  async function handleBatchPublish() {
    const ids = [...selectedIds].filter(id => !importedMap.has(id));
    if (ids.length === 0) return;
    
    setBatchProcessing(true);
    setBatchProgress({ current: 0, total: ids.length });
    let successCount = 0;
    
    for (const id of ids) {
      const article = articles.find(a => a.id === id);
      if (!article) continue;
      await handlePublish(null, article);
      successCount++;
      setBatchProgress(prev => ({ ...prev, current: prev.current + 1 }));
    }
    
    setBatchProcessing(false);
    setSelectedIds(new Set());
    toast(`${successCount}건의 기사를 바로 발행했습니다.`, "success");
  }
  ```

  **Clear selection on filter/page change:**
  ```typescript
  useEffect(() => {
    setSelectedIds(new Set());
    setSelectedId(null);
    setShowMobileDetail(false);
  }, [regionFilter, categoryFilter, keyword, dateFrom, dateTo, page]);
  ```

  **Batch toolbar UI (above the split container, shown when selectedIds.size > 0):**
  ```tsx
  {selectedIds.size > 0 && (
    <div className="nf-batch-toolbar">
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-medium text-gray-900">
          {selectedIds.size}건 선택됨
        </span>
        <button onClick={() => setSelectedIds(new Set())}
          className="text-[12px] text-gray-400 hover:text-gray-600">
          선택 해제
        </button>
      </div>
      <div className="flex items-center gap-2">
        {batchProcessing ? (
          <div className="flex items-center gap-2 text-[12px] text-gray-500">
            <span className="nf-spinner" />
            <span>{batchProgress.current}/{batchProgress.total} 처리 중...</span>
          </div>
        ) : (
          <>
            <button onClick={handleBatchImport}
              className="admin-btn admin-btn-ghost text-[12px] py-1.5 px-3">
              일괄 가져오기
            </button>
            <button onClick={handleBatchPublish}
              className="admin-btn admin-btn-primary text-[12px] py-1.5 px-3">
              일괄 발행
            </button>
          </>
        )}
      </div>
    </div>
  )}
  ```

  **Checkbox in list items:**
  ```tsx
  <div className="nf-list-item-wrapper">
    {!importedMap.has(article.id) && (
      <input
        type="checkbox"
        checked={selectedIds.has(article.id)}
        onChange={() => {}} // controlled by onClick
        onClick={(e) => handleToggleSelect(e, article.id)}
        className="nf-checkbox"
      />
    )}
    <div
      onClick={() => { setSelectedId(article.id); setShowMobileDetail(true); }}
      className={`nf-list-item ${isSelected ? "selected" : ""} ${processed ? "processed" : ""}`}
    >
      {/* ... existing list item content ... */}
    </div>
  </div>
  ```

  **Select All toggle in list header:**
  ```tsx
  <div className="nf-list-header">
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={articles.filter(a => !importedMap.has(a.id)).length > 0 && 
                 articles.filter(a => !importedMap.has(a.id)).every(a => selectedIds.has(a.id))}
        onChange={handleSelectAllPage}
        className="nf-checkbox"
      />
      <span className="text-[11px] text-gray-500">이 페이지 전체 선택</span>
    </label>
    <span className="text-[11px] text-gray-400">{total}건</span>
  </div>
  ```

  ### CSS Additions to globals.css

  Add these classes AFTER the existing NF section (after line 799, before `/* ============ Mail ============ */`):

  ```css
  /* ── NF Date Group Headers ── */
  .nf-date-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background: #f3f4f6;
    font-size: 12px;
    font-weight: 600;
    color: #374151;
    position: sticky;
    top: 0;
    z-index: 2;
    border-bottom: 1px solid #e5e7eb;
  }
  .nf-date-count {
    font-size: 11px;
    font-weight: 500;
    color: #9ca3af;
  }

  /* ── NF Detail Top Action Bar ── */
  .nf-detail-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 20px;
    background: white;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
    z-index: 5;
  }
  .nf-detail-topbar-info {
    flex: 1;
    min-width: 0;
  }

  /* ── NF List Item with Checkbox ── */
  .nf-list-item-wrapper {
    display: flex;
    align-items: flex-start;
    gap: 0;
    position: relative;
  }
  .nf-checkbox {
    width: 16px;
    height: 16px;
    margin: 14px 0 0 12px;
    accent-color: #111;
    cursor: pointer;
    flex-shrink: 0;
  }
  .nf-list-item-wrapper .nf-list-item {
    flex: 1;
  }

  /* ── NF Quick Publish Button ── */
  .nf-quick-publish {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    display: none;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: #111;
    color: white;
    cursor: pointer;
    transition: all 0.15s ease;
    z-index: 2;
    border: none;
  }
  .nf-quick-publish:hover {
    background: #333;
    transform: translateY(-50%) scale(1.05);
  }
  .nf-list-item-wrapper:hover .nf-quick-publish {
    display: flex;
  }

  /* ── NF List Header (Select All) ── */
  .nf-list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background: white;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
    z-index: 3;
  }

  /* ── NF Batch Toolbar ── */
  .nf-batch-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    background: #111;
    color: white;
    border-radius: 10px;
    margin-bottom: 8px;
    animation: nf-batch-slide-in 0.2s ease-out;
  }
  .nf-batch-toolbar .admin-btn-ghost {
    color: white;
    border-color: rgba(255,255,255,0.3);
  }
  .nf-batch-toolbar .admin-btn-ghost:hover {
    background: rgba(255,255,255,0.1);
  }

  @keyframes nf-batch-slide-in {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ── NF Spinner ── */
  .nf-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: nf-spin 0.6s linear infinite;
  }
  @keyframes nf-spin {
    to { transform: rotate(360deg); }
  }

  /* ── Mobile adjustments ── */
  @media (max-width: 768px) {
    .nf-quick-publish { display: none !important; }
    .nf-batch-toolbar { border-radius: 0; margin: 0 -16px 8px; padding: 10px 16px; }
    .nf-detail-topbar { padding: 10px 16px; }
    .nf-checkbox { margin: 14px 0 0 8px; }
  }
  ```

  **Must NOT do**:
  - DO NOT modify AdminContext.tsx, nf-client.ts, types.ts, nf-constants.ts, news-feed/page.tsx
  - DO NOT add external libraries
  - DO NOT change the split view container structure
  - DO NOT modify the import/publish handler logic (only call them, don't change their internals)
  - DO NOT use English in UI text

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Frontend component rewrite with significant UI/UX changes, CSS work
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: UI/UX design expertise needed for the complex layout restructuring

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (solo)
  - **Blocks**: Task 2, Task 3
  - **Blocked By**: None

  **References**:

  **Pattern References:**
  - `src/components/admin/nf/NfArticleExplorer.tsx` — FULL FILE — Current component to rewrite. Preserve ALL existing logic (handleImport, handlePublish, fetchArticlesData, pagination, filters, mobile behavior)
  - `src/app/globals.css:612-799` — Current NF CSS classes. Add new classes AFTER line 799, before the `/* ============ Mail ============ */` comment on line 801

  **API/Type References:**
  - `src/lib/types.ts:46-57` — NfArticle interface — `published_at` field is the date string used for grouping
  - `src/lib/nf-constants.ts` — NF_CATEGORY_LABELS, NF_TO_KJ_CATEGORY, DEFAULT_NF_CATEGORY_SLUG, plainTextToHtml
  - `src/contexts/AdminContext.tsx:43` — `importArticle(data: ImportArticleData)` signature
  - `src/contexts/AdminContext.tsx:38` — `addArticle(data: ArticleFormData)` signature
  - `src/contexts/ToastContext.tsx` — `toast(message: string, type: "success" | "error")` API

  **External References:**
  - None — pure React + Tailwind implementation

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Date grouping displays correctly
    Tool: Playwright
    Preconditions: Navigate to admin/news-feed, logged in
    Steps:
      1. Click "검색" button to load articles
      2. Wait for articles to load (skeleton disappears)
      3. Look for date header elements with class "nf-date-header"
      4. Verify headers show Korean date format (e.g., "2026년 2월 22일")
      5. Verify article count badge shows next to date header
    Expected Result: Articles grouped under date headers with counts
    Evidence: .sisyphus/evidence/task-1-date-grouping.png

  Scenario: Top action bar shows import/publish buttons
    Tool: Playwright
    Preconditions: Articles loaded, none selected
    Steps:
      1. Click on any article in the list
      2. Observe the detail panel
      3. Verify action bar with "가져오기" and "바로 발행" buttons appears at TOP of detail panel
      4. Verify buttons are visible without scrolling
    Expected Result: Action bar sticky at top with both buttons visible immediately
    Evidence: .sisyphus/evidence/task-1-top-action-bar.png

  Scenario: Quick publish button on list hover
    Tool: Playwright
    Preconditions: Articles loaded
    Steps:
      1. Hover over an unprocessed article in the list
      2. Verify small publish icon button appears on right side
      3. Click the quick publish button
      4. Verify toast shows "기사가 바로 발행되었습니다."
    Expected Result: Quick publish works from list without opening detail
    Evidence: .sisyphus/evidence/task-1-quick-publish.png

  Scenario: Multi-select and batch publish
    Tool: Playwright
    Preconditions: Articles loaded, at least 2 unprocessed articles
    Steps:
      1. Click checkbox on 2 unprocessed articles
      2. Verify batch toolbar appears with "2건 선택됨"
      3. Click "일괄 발행" button
      4. Verify progress indication shows
      5. Wait for completion
      6. Verify success toast
      7. Verify both articles now show as "발행됨"
    Expected Result: Batch publish processes all selected articles with progress
    Evidence: .sisyphus/evidence/task-1-batch-publish.png

  Scenario: Select all on page
    Tool: Playwright
    Preconditions: Articles loaded
    Steps:
      1. Find "이 페이지 전체 선택" checkbox
      2. Click it
      3. Verify all unprocessed articles have checked checkboxes
      4. Verify batch toolbar shows correct count
      5. Click "선택 해제" to clear
      6. Verify all checkboxes unchecked and toolbar disappears
    Expected Result: Select all toggles all unprocessed articles
    Evidence: .sisyphus/evidence/task-1-select-all.png

  Scenario: Error — already processed article
    Tool: Playwright
    Preconditions: Article already published/imported
    Steps:
      1. Find an article with "발행됨" badge in the list
      2. Verify no checkbox appears for this article
      3. Click on it to see detail
      4. Verify top action bar shows "✓ 발행됨" text instead of buttons
    Expected Result: Processed articles cannot be re-imported or selected
    Evidence: .sisyphus/evidence/task-1-processed-article.png
  ```

  **Commit**: YES
  - Message: `feat(nf-explorer): add date grouping, top action bar, inline quick-publish, batch operations`
  - Files: `src/components/admin/nf/NfArticleExplorer.tsx`, `src/app/globals.css`

---

- [ ] 2. Build and Deploy to Production

  **What to do**:
  - Run `npm run build` — verify zero errors
  - Run `git add` + `git commit` + `git push`
  - Run `npx vercel --prod --yes` — deploy to production
  - Wait for deployment to complete
  - Verify deployment URL is `https://www.kjtimes.co.kr`

  **Must NOT do**:
  - DO NOT skip the build step
  - DO NOT deploy if build fails

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 3
  - **Blocked By**: Task 1

  **References**:
  - Working directory: `/Users/zoopark-studio/Documents/dev/KJ_News`
  - Build: `npm run build`
  - Deploy: `npx vercel --prod --yes`

  **Acceptance Criteria**:
  - [ ] `npm run build` exits with code 0
  - [ ] `git push` succeeds
  - [ ] `vercel --prod` deployment completes
  - [ ] Production URL accessible: `curl -s -o /dev/null -w "%{http_code}" https://www.kjtimes.co.kr/admin/news-feed` returns 200

  **Commit**: YES
  - Message: `feat(nf-explorer): add date grouping, top action bar, inline quick-publish, batch operations`
  - Files: `src/components/admin/nf/NfArticleExplorer.tsx`, `src/app/globals.css`

---

- [ ] 3. Playwright QA on Production

  **What to do**:
  - Log into admin at `https://www.kjtimes.co.kr/admin/login`
  - Credentials: ID `kjtimeseditor82` / PW `2ndlife!kjt`
  - Navigate to "뉴스팩토리" page
  - Execute all QA scenarios from Task 1
  - Take screenshots as evidence

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: None
  - **Blocked By**: Task 2

  **References**:
  - Admin URL: `https://www.kjtimes.co.kr/admin/login`
  - Credentials: kjtimeseditor82 / 2ndlife!kjt
  - News feed page: `/admin/news-feed`

  **Acceptance Criteria**:
  - [ ] Screenshot shows date-grouped articles in list panel
  - [ ] Screenshot shows top action bar with import/publish buttons
  - [ ] All QA scenarios pass
  - [ ] Evidence files saved to `.sisyphus/evidence/`

  **QA Scenarios:**
  ```
  Scenario: Full production verification
    Tool: Playwright
    Preconditions: Production deployed, browser opened
    Steps:
      1. Navigate to https://www.kjtimes.co.kr/admin/login
      2. Login with kjtimeseditor82 / 2ndlife!kjt
      3. Navigate to /admin/news-feed
      4. Click "검색" to load articles
      5. Verify date group headers appear
      6. Click an article — verify top action bar
      7. Take full-page screenshot
    Expected Result: All features working on production
    Evidence: .sisyphus/evidence/task-3-production-qa.png
  ```

---

## Commit Strategy

- **Task 1+2**: `feat(nf-explorer): add date grouping, top action bar, inline quick-publish, batch operations` — `src/components/admin/nf/NfArticleExplorer.tsx`, `src/app/globals.css`

---

## Success Criteria

### Verification Commands
```bash
npm run build  # Expected: exit code 0, no errors
curl -s -o /dev/null -w "%{http_code}" https://www.kjtimes.co.kr/admin/news-feed  # Expected: 200
```

### Final Checklist
- [ ] Articles grouped by date with Korean-format headers
- [ ] Import/Publish buttons at top of detail panel (sticky)
- [ ] Inline quick-publish on list item hover
- [ ] Multi-select with checkboxes works
- [ ] Batch import/publish with progress works
- [ ] All existing filters preserved
- [ ] Mobile behavior preserved
- [ ] Build passes with zero errors
- [ ] Deployed to production
- [ ] Playwright QA screenshots saved
