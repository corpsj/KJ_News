# Task 14: 접근성(A11y) 개선 — skip navigation 링크 추가, 주요 ARIA 라벨 보강

## 완료 항목

### 1. src/app/(public)/layout.tsx
✅ Skip navigation 링크 추가
- `<body>` 바로 다음에 skip link 추가 (sr-only 클래스 사용)
- `<main>` 태그에 `id="main-content"` 추가
- 링크 텍스트: "본문으로 바로가기"
- Focus 시 시각적으로 표시되도록 스타일링

### 2. src/components/layout/Header.tsx
✅ 접근성 개선
- 최상위 `<header>` 태그에 `role="banner"` 추가
- 데스크탑 nav에 `aria-label="주 메뉴"` 추가
- 모바일 nav에 `aria-label="모바일 메뉴"` 추가
- 기존 aria-label 유지: 메뉴 버튼, 검색 버튼

### 3. src/components/layout/Footer.tsx
✅ 접근성 개선
- 최상위 `<footer>` 태그에 `role="contentinfo"` 추가
- 카테고리 섹션을 `<nav aria-label="푸터 카테고리 메뉴">` 로 감싸기
- 기존 구조 유지하면서 semantic HTML 강화

### 4. src/app/(public)/article/[id]/page.tsx
✅ 접근성 개선
- `<article>` 태그에 `aria-label={article.title}` 추가
- 기사 제목으로 article 영역 식별

## 빌드 결과
✅ Build successful
- Next.js 16.1.6 (Turbopack)
- 49개 페이지 생성 완료
- TypeScript 컴파일 성공

## 기술 노트
- Tailwind CSS의 `sr-only` 클래스 활용 (screen reader only)
- `focus:not-sr-only` 사용으로 focus 시 skip link 표시
- ARIA roles 및 labels는 semantic HTML과 함께 사용
- 기존 디자인/스타일 변경 없음
- 새 npm 패키지 설치 없음

## 검증
- ✅ 모든 파일 수정 완료
- ✅ 빌드 성공
- ✅ LSP 진단: 기존 경고만 유지 (dangerouslySetInnerHTML)
