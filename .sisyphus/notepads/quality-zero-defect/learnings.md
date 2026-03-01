## [2026-02-27] Wave 1 완료 — 축적된 지식

### 프로젝트 패턴
- Supabase client: `createClient()` = 일반 서버 클라이언트, `createServiceClient()` = 서비스 롤 (권한 우회)
- API 인증 패턴: `supabase.auth.getUser()` → `user.user_metadata?.role !== 'admin'`
- 새로운 admin role 체크 패턴 (실제 적용됨):
  ```typescript
  const userRole = user.user_metadata?.role as string | undefined;
  if (userRole !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  ```
- `undefined !== 'admin'` → 403 (기존 admin 메타데이터 없는 계정도 차단됨 — 의도적)

### 빌드 환경
- `bun run build` = Next.js 프로덕션 빌드
- `bun run test` = vitest (3개 테스트 파일, 7개 테스트)
- TypeScript strict mode 활성화됨

### Rate Limit 패턴 (T3, T4에서 사용)
- Redis 없이 module-level in-memory Map
- 서버 재시작 시 초기화됨 (의도적 — 단순성 우선)

### RLS 패턴
- `(auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'` 패턴 사용
- SECURITY DEFINER RPC 함수는 일반 클라이언트로 호출 가능

### 제약사항
- `middleware.ts` 생성 금지
- 새 npm 의존성 추가 금지
- 기존 마이그레이션 파일 수정 금지 (새 파일만 추가)
- OG image 파일(icon.tsx, apple-icon.tsx, opengraph-image.tsx)의 raw img 건드리지 않음
- NfArticleExplorer.tsx의 외부 이미지 URL img 태그 — 건드리지 않음
