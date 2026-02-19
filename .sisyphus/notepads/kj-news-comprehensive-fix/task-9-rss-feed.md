# Task 9: RSS 피드 생성 — 완료

## 완료 항목
- [x] `src/app/feed.xml/route.ts` 생성 — RSS 2.0 XML 반환
- [x] `npm run build` 성공
- [x] GET /feed.xml → 200 + application/xml + <rss> 태그 포함

## 구현 상세
### 1. RSS Feed Route Handler 생성
- 파일: `src/app/feed.xml/route.ts`
- 기능:
  - `getPublishedArticles(20)` 호출로 최신 20개 기사 조회
  - RSS 2.0 표준 형식으로 XML 생성
  - CDATA 래핑으로 한국어/HTML 특수문자 안전 처리
  - `escapeXml()` 함수로 링크 및 저자명 이스케이프
  - 캐시 헤더: `s-maxage=3600, stale-while-revalidate`

### 2. 추가 수정
- `src/app/sitemap.ts`: `baseUrl` → `SITE_URL` 변수명 수정
  - `SITE_URL` import from `@/lib/constants`
  - 모든 URL 생성에서 일관성 확보

## 빌드 결과
```
✓ Compiled successfully in 2.3s
✓ Generating static pages using 27 workers (49/49) in 1988.2ms
✓ /feed.xml 라우트 동적 렌더링 (ƒ) 확인
```

## RSS 피드 구조
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>광전타임즈</title>
    <link>https://kj-news.vercel.app</link>
    <description>광전타임즈 - 정치, 경제, 사회, 문화, 국제, IT/과학, 스포츠 등 빠르고 정확한 뉴스를 전합니다.</description>
    <language>ko</language>
    <lastBuildDate>[현재 시간 UTC]</lastBuildDate>
    <atom:link href="https://kj-news.vercel.app/feed.xml" rel="self" type="application/rss+xml"/>
    <item>
      <title><![CDATA[기사 제목]]></title>
      <link>https://kj-news.vercel.app/article/[id]</link>
      <guid isPermaLink="true">https://kj-news.vercel.app/article/[id]</guid>
      <description><![CDATA[기사 요약]]></description>
      <category><![CDATA[카테고리명]]></category>
      <author>저자명</author>
      <pubDate>[발행 시간 UTC]</pubDate>
    </item>
    ...
  </channel>
</rss>
```

## 검증
- LSP 진단: 에러 없음 ✓
- TypeScript 컴파일: 성공 ✓
- 빌드: 성공 ✓
- 라우트 등록: `/feed.xml` (동적) ✓
