## [2026-02-27] 알려진 이슈/주의사항

### Wave 2 주의
- T7: NfArticleExplorer.tsx는 외부 이미지 URL 사용 → next/image 전환 대상 제외
- T8: TipTap(ProseMirror)이 unsafe-eval을 요구할 수 있음 → gate check 필수
  - 만약 TipTap이 깨지면: unsafe-eval 유지 + 주석 문서화
- T6: getArticlesByCategory 함수는 다른 곳에서 사용 중일 수 있으므로 삭제 금지

### Wave 3 주의
- T10: T4(honeypot 서버 필드명 = "honeypot") 완료 전제 — 이미 완료됨
- T11: lang="ko" 추가 시 html 태그 전체 확인 필요 (기존 속성 덮어쓰기 주의)

### Wave 4 주의
- T12: 홈페이지 카테고리 섹션은 기존 시각 결과 유지가 중요하므로 `getArticlesByCategory` 삭제 대신 `getArticlesByCategorySlugs` 배치 함수 추가로 N+1만 제거
- T12: Supabase 호환성 때문에 SQL window function 대신 앱 레벨에서 slug별 `limit` 슬라이싱으로 개수 제한
