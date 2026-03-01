## [2026-02-27] Wave 1 아키텍처 결정사항

### T2: AuthContext 기본 role
- `"admin"` → `"viewer"` 변경 (보안 취약점 수정)
- 기존 admin 사용자는 Supabase metadata에 `role: "admin"` 이 있으므로 영향 없음

### T3: View Counter
- SELECT+UPDATE → SECURITY DEFINER RPC 함수 (`increment_view_count`)
- `createServiceClient` 제거됨 (RPC가 SECURITY DEFINER이므로 불필요)
- IP 기반 in-memory rate limit (24시간 article당 IP당 1회)
- viewed_articles 쿠키 200개 cap

### T4: Contact Form 서버
- in-memory rate limit: IP당 시간당 5회
- Honeypot 필드: `honeypot` 키 확인
- Input length: name≤100, email≤254, subject≤200, body≤10000

### T?: CSP unsafe-eval 제거 Gate Check
- `next.config.ts`의 CSP `script-src`에서 `'unsafe-eval'` 제거 유지
- Playwright gate check 수행: `/admin/articles/new`에서 TipTap 입력, 굵게/기울임 포맷 버튼 동작 확인
- 브라우저 콘솔 `error`/`warning` 레벨에서 CSP 위반 메시지 0건 확인
- 결론: 현재 코드/런타임 기준 TipTap 동작에 `'unsafe-eval'` 불필요
