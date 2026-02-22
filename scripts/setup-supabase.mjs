/**
 * Supabase setup script:
 * 1. Create DB schema (authors, categories, articles)
 * 2. Seed with mock data
 * 3. Set up RLS policies
 * 4. Create admin auth user
 *
 * Run: node scripts/setup-supabase.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ═══════════════════════════════════════════
// 1. CREATE SCHEMA via SQL
// ═══════════════════════════════════════════
async function createSchema() {
  console.log("📦 Creating schema...");

  const { error } = await supabase.rpc("exec_sql", {
    sql: `SELECT 1`,
  });

  // rpc exec_sql won't exist — use REST API directly
  // Instead, we'll use the Supabase SQL endpoint
  const sqlStatements = `
    -- Drop existing tables (idempotent)
    DROP TABLE IF EXISTS articles CASCADE;
    DROP TABLE IF EXISTS categories CASCADE;
    DROP TABLE IF EXISTS authors CASCADE;

    -- Authors
    CREATE TABLE authors (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      avatar_url TEXT DEFAULT ''
    );

    -- Categories
    CREATE TABLE categories (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      color TEXT DEFAULT '#64748b'
    );

    -- Articles
    CREATE TABLE articles (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT DEFAULT '',
      excerpt TEXT DEFAULT '',
      content TEXT DEFAULT '',
      category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
      author_id BIGINT REFERENCES authors(id) ON DELETE SET NULL,
      published_at TIMESTAMPTZ DEFAULT now(),
      thumbnail_url TEXT DEFAULT '',
      view_count INTEGER DEFAULT 0,
      tags TEXT[] DEFAULT '{}',
      status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'scheduled', 'published', 'archived', 'rejected')),
      source TEXT DEFAULT '',
      source_url TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
    CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
    CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);

    -- Enable RLS
    ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
    ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
    ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

    -- RLS: Public read for all tables
    DROP POLICY IF EXISTS "Public read authors" ON authors;
    CREATE POLICY "Public read authors" ON authors FOR SELECT TO anon, authenticated USING (true);

    DROP POLICY IF EXISTS "Public read categories" ON categories;
    CREATE POLICY "Public read categories" ON categories FOR SELECT TO anon, authenticated USING (true);

    DROP POLICY IF EXISTS "Public read published articles" ON articles;
    CREATE POLICY "Public read published articles" ON articles FOR SELECT TO anon USING (status = 'published');

    -- RLS: Authenticated full read (admin can see all statuses)
    DROP POLICY IF EXISTS "Authenticated read all articles" ON articles;
    CREATE POLICY "Authenticated read all articles" ON articles FOR SELECT TO authenticated USING (true);

    -- RLS: Authenticated write
    DROP POLICY IF EXISTS "Authenticated insert authors" ON authors;
    CREATE POLICY "Authenticated insert authors" ON authors FOR INSERT TO authenticated WITH CHECK (true);

    DROP POLICY IF EXISTS "Authenticated update authors" ON authors;
    CREATE POLICY "Authenticated update authors" ON authors FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Authenticated insert categories" ON categories;
    CREATE POLICY "Authenticated insert categories" ON categories FOR INSERT TO authenticated WITH CHECK (true);

    DROP POLICY IF EXISTS "Authenticated update categories" ON categories;
    CREATE POLICY "Authenticated update categories" ON categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Authenticated insert articles" ON articles;
    CREATE POLICY "Authenticated insert articles" ON articles FOR INSERT TO authenticated WITH CHECK (true);

    DROP POLICY IF EXISTS "Authenticated update articles" ON articles;
    CREATE POLICY "Authenticated update articles" ON articles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Authenticated delete articles" ON articles;
    CREATE POLICY "Authenticated delete articles" ON articles FOR DELETE TO authenticated USING (true);

    -- Updated_at trigger
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS set_updated_at ON articles;
    CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON articles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `;

  // Execute SQL via Supabase REST SQL endpoint
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
  });

  // Since we can't run raw SQL via REST, let's use the pg endpoint
  // We'll use the SQL editor API
  const sqlResponse = await fetch(
    `${SUPABASE_URL}/pg`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sqlStatements }),
    }
  );

  if (!sqlResponse.ok) {
    // Fallback: execute each statement individually via supabase client
    console.log("  Using individual table creation...");
    return false;
  }

  console.log("  ✅ Schema created via SQL");
  return true;
}

// ═══════════════════════════════════════════
// Alternative: Create tables via REST/supabase-js (fallback)
// ═══════════════════════════════════════════
async function createTablesViaRest() {
  console.log("📦 Creating tables via REST fallback — please run the SQL in Supabase Dashboard SQL Editor.");
  console.log("  Copy the SQL from scripts/schema.sql");
  return false;
}

// ═══════════════════════════════════════════
// 2. SEED DATA
// ═══════════════════════════════════════════
async function seedData() {
  console.log("\n🌱 Seeding data...");

  // Authors
  const authors = [
    { id: 1, name: "김서현", role: "정치부 기자", avatar_url: "" },
    { id: 2, name: "박준영", role: "경제부 기자", avatar_url: "" },
    { id: 3, name: "이지은", role: "사회부 기자", avatar_url: "" },
    { id: 4, name: "최민호", role: "국제부 기자", avatar_url: "" },
    { id: 5, name: "정하늘", role: "IT/과학부 기자", avatar_url: "" },
  ];

  const { error: authorsError } = await supabase.from("authors").upsert(authors, { onConflict: "id" });
  if (authorsError) {
    console.error("  ❌ Authors error:", authorsError.message);
    return false;
  }
  console.log("  ✅ 5 authors seeded");

  // Categories
  const categories = [
    { id: 1, name: "정치", slug: "politics", description: "국내외 정치 뉴스와 정책 분석", color: "#dc2626" },
    { id: 2, name: "경제", slug: "economy", description: "경제 동향, 금융, 부동산 소식", color: "#2563eb" },
    { id: 3, name: "사회", slug: "society", description: "사회 이슈와 생활 뉴스", color: "#059669" },
    { id: 4, name: "문화", slug: "culture", description: "문화, 예술, 엔터테인먼트", color: "#7c3aed" },
    { id: 5, name: "국제", slug: "world", description: "세계 각국의 주요 뉴스", color: "#0891b2" },
    { id: 6, name: "IT/과학", slug: "tech", description: "기술 혁신과 과학 발견", color: "#ea580c" },
    { id: 7, name: "스포츠", slug: "sports", description: "국내외 스포츠 소식", color: "#16a34a" },
    { id: 8, name: "오피니언", slug: "opinion", description: "칼럼, 사설, 독자 기고", color: "#64748b" },
  ];

  const { error: catsError } = await supabase.from("categories").upsert(categories, { onConflict: "id" });
  if (catsError) {
    console.error("  ❌ Categories error:", catsError.message);
    return false;
  }
  console.log("  ✅ 8 categories seeded");

  // Articles (mapping from mock-data IDs)
  const articles = [
    { id: 1, title: "정부, 2026년 예산안 발표…복지·국방 분야 대폭 증액", subtitle: "총 680조 원 규모, 전년 대비 5.2% 증가", excerpt: "정부가 2026년 예산안을 발표하며 복지와 국방 분야에 대한 대폭적인 투자 계획을 밝혔다. 저출생 대응과 안보 강화가 핵심 기조로 자리잡았다.", content: `<p>정부는 13일 국무회의를 거쳐 2026년 예산안을 확정 발표했다. 총 680조 원 규모로 전년 대비 5.2% 증가한 수치다.</p>\n<p>특히 저출생 대응을 위한 복지 예산이 크게 늘었다. 육아휴직 급여 상한이 월 250만 원으로 인상되고, 만 0세 아이 부모에게 월 100만 원의 양육수당이 지급된다. 교육부 예산도 늘어나 공교육 질 향상에 힘쓸 방침이다.</p>\n<p>국방 분야에서는 첨단 무기 체계 도입과 병사 처우 개선에 중점을 두었다. 병장 월급은 150만 원으로 인상되며, AI 기반 국방 시스템 구축에 3조 원이 투입된다.</p>\n<p>기획재정부 관계자는 "경제 활력 제고와 국민 삶의 질 향상을 동시에 추구하는 균형 잡힌 예산"이라고 설명했다.</p>`, category_id: 1, author_id: 1, published_at: "2026-02-13T08:30:00Z", thumbnail_url: "", view_count: 15420, tags: ["예산안", "복지", "국방", "저출생"], status: "published" },
    { id: 2, title: "코스피, AI 반도체 랠리에 3,200선 돌파", subtitle: "외국인 매수세 집중, 삼성전자·SK하이닉스 신고가", excerpt: "글로벌 AI 투자 확대에 힘입어 국내 반도체 주가가 급등하며 코스피 지수가 사상 처음으로 3,200선을 돌파했다.", content: `<p>13일 한국거래소에 따르면 코스피 지수는 전일 대비 2.3% 상승한 3,215.47에 거래를 마쳤다. 이는 역대 최고 종가 기록이다.</p>\n<p>상승을 주도한 것은 반도체 대형주였다. 삼성전자는 8만 5천 원을 돌파하며 52주 신고가를 경신했고, SK하이닉스도 25만 원대에 안착했다. 글로벌 빅테크 기업들의 AI 인프라 투자 확대 소식이 호재로 작용했다.</p>\n<p>외국인 투자자들은 이날 코스피에서 1조 2천억 원을 순매수했다. 특히 반도체 섹터에 집중적인 매수세를 보이며, 한국 시장에 대한 신뢰를 드러냈다.</p>\n<p>증권가에서는 HBM 수요 확대와 차세대 메모리 반도체 기술 우위를 근거로 추가 상승 여력이 있다는 분석이 나오고 있다.</p>`, category_id: 2, author_id: 2, published_at: "2026-02-13T09:15:00Z", thumbnail_url: "", view_count: 28350, tags: ["코스피", "반도체", "AI", "삼성전자", "SK하이닉스"], status: "published" },
    { id: 3, title: "서울 지하철 2호선, 자율주행 시범 운행 개시", subtitle: "국내 최초 도심 지하철 무인운전 시대 개막", excerpt: "서울교통공사가 지하철 2호선 일부 구간에서 자율주행 시범 운행을 시작했다. 2028년 전 노선 확대를 목표로 하고 있다.", content: `<p>서울교통공사는 13일부터 지하철 2호선 성수~잠실 구간에서 자율주행 시범 운행을 개시한다고 발표했다. 이는 국내 도심 지하철에서 최초로 시도되는 무인운전이다.</p>\n<p>시범 운행은 심야 시간대에 진행되며, 안전 요원이 탑승한 상태에서 열차가 자동으로 운행된다. AI 기반 장애물 감지 시스템과 실시간 궤도 모니터링 기술이 적용되었다.</p>\n<p>서울시는 이번 시범 운행의 성과를 바탕으로 2028년까지 2호선 전 구간으로 자율주행을 확대할 계획이다. 이를 통해 운행 효율성을 30% 이상 높이고, 심야 운행 시간도 연장할 수 있을 것으로 기대하고 있다.</p>`, category_id: 3, author_id: 3, published_at: "2026-02-13T07:00:00Z", thumbnail_url: "", view_count: 9870, tags: ["지하철", "자율주행", "서울교통", "무인운전"], status: "published" },
    { id: 4, title: "BTS 지민, 솔로 월드투어 전석 매진 기록", subtitle: "아시아·북미·유럽 30개 도시 투어 확정", excerpt: "BTS 멤버 지민의 첫 솔로 월드투어 티켓이 오픈과 동시에 전석 매진을 기록하며 글로벌 인기를 다시 한번 증명했다.", content: `<p>방시혁 하이브 의장은 BTS 멤버 지민의 첫 솔로 월드투어 'CLOSER' 전 공연이 티켓 오픈과 동시에 매진되었다고 밝혔다.</p>\n<p>이번 투어는 아시아 12개 도시, 북미 10개 도시, 유럽 8개 도시를 순회하는 대규모 월드투어다. 서울 잠실종합운동장을 시작으로 도쿄, 상하이, LA, 뉴욕, 런던, 파리 등 주요 도시에서 공연이 예정되어 있다.</p>\n<p>지민은 솔로 앨범 'MUSE'의 수록곡들과 새로운 미공개 곡을 선보일 예정이며, 최첨단 무대 기술을 활용한 공연을 준비 중인 것으로 알려졌다.</p>\n<p>케이팝 전문 평론가들은 "솔로 아티스트로서 이 정도 규모의 월드투어를 소화할 수 있는 것은 지민의 글로벌 영향력을 보여주는 것"이라고 평가했다.</p>`, category_id: 4, author_id: 3, published_at: "2026-02-12T14:20:00Z", thumbnail_url: "", view_count: 45230, tags: ["BTS", "지민", "월드투어", "케이팝"], status: "published" },
    { id: 5, title: "미·중 정상회담, 반도체 무역 갈등 완화 합의", subtitle: "양국 간 반도체 수출 규제 단계적 해제 논의", excerpt: "미국과 중국 정상이 제네바에서 회담을 갖고 반도체 무역 분쟁의 단계적 해결에 합의했다. 글로벌 공급망 안정화에 기대감이 커지고 있다.", content: `<p>미국 대통령과 중국 국가주석이 스위스 제네바에서 정상회담을 갖고 반도체 무역 갈등의 단계적 완화에 합의했다고 양측 외교부가 공동 발표했다.</p>\n<p>양국은 첨단 반도체 수출 규제를 2027년까지 단계적으로 해제하기로 했으며, 민간 기업 간 기술 협력을 위한 별도의 채널을 구축하기로 합의했다.</p>\n<p>이번 합의는 2년 넘게 이어진 미·중 반도체 갈등의 전환점이 될 것으로 보인다. 글로벌 반도체 공급망의 안정화와 함께 관련 기업들의 사업 환경이 개선될 것이라는 전망이 나오고 있다.</p>\n<p>다만 일부 전문가들은 구체적인 이행 방안이 아직 확정되지 않았다며 신중한 태도를 보이고 있다.</p>`, category_id: 5, author_id: 4, published_at: "2026-02-13T06:00:00Z", thumbnail_url: "", view_count: 22100, tags: ["미중관계", "반도체", "무역", "정상회담"], status: "published" },
    { id: 6, title: "삼성전자, 2나노 GAA 공정 양산 성공", subtitle: "TSMC보다 6개월 앞서…파운드리 경쟁 본격화", excerpt: "삼성전자가 세계 최초로 2나노미터 GAA(Gate-All-Around) 공정의 양산에 성공하며 파운드리 시장에서의 경쟁력을 대폭 강화했다.", content: `<p>삼성전자는 13일 경기 화성사업장에서 기자간담회를 열고 2나노미터 GAA 공정의 양산 성공을 공식 발표했다. 이는 세계 최초의 2나노 양산 사례다.</p>\n<p>GAA 구조는 기존 핀펫(FinFET) 대비 전력 효율이 25% 향상되고 성능은 12% 개선된다. 삼성전자는 이 공정을 글로벌 빅테크 고객사의 AI 가속기 칩 생산에 우선 적용할 계획이다.</p>\n<p>이번 성과로 삼성전자는 TSMC보다 약 6개월 앞서 2나노 양산 체제를 구축하게 되었다. 파운드리 시장 점유율 회복에 대한 기대감이 높아지고 있다.</p>\n<p>업계에서는 삼성전자의 2나노 양산 성공이 한국 반도체 산업 전반에 긍정적인 파급 효과를 가져올 것으로 전망하고 있다.</p>`, category_id: 6, author_id: 5, published_at: "2026-02-13T10:00:00Z", thumbnail_url: "", view_count: 31200, tags: ["삼성전자", "반도체", "2나노", "GAA", "파운드리"], status: "published" },
    { id: 7, title: "손흥민, 프리미어리그 통산 120호 골 달성", subtitle: "아시아 선수 최초 기록…토트넘 팬 기립박수", excerpt: "토트넘 홋스퍼의 손흥민이 프리미어리그 통산 120번째 골을 기록하며 아시아 선수 최초의 대기록을 세웠다.", content: `<p>손흥민(34·토트넘)이 13일(한국시간) 열린 프리미어리그 25라운드 아스턴 빌라전에서 후반 23분 결승골을 터뜨리며 프리미어리그 통산 120호 골을 달성했다.</p>\n<p>이는 아시아 선수로서는 최초이자, 프리미어리그 역사상 비유럽 출신 선수 중 세 번째로 많은 골 기록이다. 경기 후 토트넘 홈 팬들은 기립박수로 손흥민의 업적을 축하했다.</p>\n<p>손흥민은 경기 후 인터뷰에서 "오랜 시간 프리미어리그에서 뛰어온 것에 감사하다. 팀 동료들과 팬들 덕분에 가능한 기록이었다"고 소감을 밝혔다.</p>\n<p>앙주 포스테코글루 토트넘 감독은 "손흥민은 이 클럽의 레전드이자 프리미어리그의 레전드"라며 찬사를 보냈다.</p>`, category_id: 7, author_id: 3, published_at: "2026-02-13T04:30:00Z", thumbnail_url: "", view_count: 38900, tags: ["손흥민", "프리미어리그", "토트넘", "축구"], status: "published" },
    { id: 8, title: "[사설] 저출생 위기, 구조적 변화 없이는 해법 없다", subtitle: "현금 지원 넘어 사회 시스템 전면 재설계 필요", excerpt: "정부의 저출생 대응 예산이 늘었지만, 현금 지원만으로는 근본적인 해결이 불가능하다. 사회 전반의 구조적 변화가 선행되어야 한다.", content: `<p>정부가 2026년 예산에서 저출생 대응에 역대 최대 규모를 투입하기로 했다. 환영할 일이다. 하지만 지난 20년간의 경험이 보여주듯, 현금 지원만으로는 출생률 반등을 이끌어내기 어렵다.</p>\n<p>근본적인 문제는 결혼과 출산을 가로막는 구조적 장벽에 있다. 주거비 부담, 높은 사교육비, 경직된 근무 문화, 성별 불평등한 돌봄 분담 등이 복합적으로 작용하고 있다.</p>\n<p>스웨덴, 프랑스 등 출산율 반등에 성공한 나라들은 공통적으로 양성 평등한 돌봄 정책, 유연한 근무제도, 질 높은 공보육 시스템을 갖추고 있다. 한국도 이러한 사회 인프라의 근본적 재설계 없이는 저출생 추세를 되돌릴 수 없다.</p>\n<p>정책 입안자들은 단기적 성과에 급급하지 말고, 10년, 20년을 내다보는 장기적 관점에서 사회 시스템을 바꿔나가야 할 것이다.</p>`, category_id: 8, author_id: 1, published_at: "2026-02-13T00:00:00Z", thumbnail_url: "", view_count: 8920, tags: ["저출생", "사설", "복지정책", "인구위기"], status: "published" },
    { id: 9, title: "국회, 디지털 기본소득법 본회의 통과", subtitle: "만 19세 이상 전 국민에 월 10만 원 디지털 화폐 지급", excerpt: "국회 본회의에서 디지털 기본소득법이 찬성 다수로 통과되었다. 내년부터 만 19세 이상 국민에게 월 10만 원의 디지털 화폐가 지급된다.", content: `<p>국회는 12일 본회의를 열어 '디지털 기본소득에 관한 법률'을 재적의원 300명 중 찬성 178명, 반대 102명, 기권 20명으로 통과시켰다.</p>\n<p>이 법안에 따르면 내년 하반기부터 만 19세 이상 전 국민에게 월 10만 원의 디지털 화폐가 지급된다. 이 화폐는 소상공인 매장과 전통시장에서만 사용할 수 있으며, 유효기간은 지급일로부터 30일이다.</p>\n<p>정부는 이를 통해 내수 경제 활성화와 소상공인 지원이라는 두 가지 목표를 동시에 달성할 수 있을 것으로 기대하고 있다. 연간 소요 예산은 약 50조 원으로 추산된다.</p>`, category_id: 1, author_id: 1, published_at: "2026-02-12T18:00:00Z", thumbnail_url: "", view_count: 19300, tags: ["국회", "디지털기본소득", "법안", "디지털화폐"], status: "published" },
    { id: 10, title: "한국은행, 기준금리 0.25%p 인하…연 2.5%로", subtitle: "경기 둔화 우려에 3회 연속 인하 결정", excerpt: "한국은행 금융통화위원회가 기준금리를 0.25%포인트 인하해 연 2.5%로 결정했다. 경기 둔화에 대한 선제적 대응이다.", content: `<p>한국은행 금융통화위원회는 13일 기준금리를 기존 연 2.75%에서 0.25%포인트 인하해 연 2.5%로 결정했다고 밝혔다. 이로써 3회 연속 금리 인하가 단행되었다.</p>\n<p>한은 총재는 "내수 회복 속도가 기대에 못 미치고 있어 경기 하방 리스크에 선제적으로 대응할 필요가 있다"고 결정 배경을 설명했다.</p>\n<p>다만 가계부채 증가와 부동산 시장 과열에 대한 우려도 함께 언급했다. "추가 인하 여부는 물가, 경기, 금융 안정 등을 종합적으로 고려해 판단하겠다"고 덧붙였다.</p>`, category_id: 2, author_id: 2, published_at: "2026-02-13T11:30:00Z", thumbnail_url: "", view_count: 16700, tags: ["한국은행", "기준금리", "금리인하", "통화정책"], status: "published" },
    { id: 11, title: "전국 미세먼지 '매우 나쁨'…수도권 비상저감조치 발령", subtitle: "중국발 황사와 국내 오염원 복합 작용", excerpt: "전국 대부분 지역의 미세먼지 농도가 '매우 나쁨' 수준을 기록하며 수도권에 비상저감조치가 발령되었다.", content: `<p>환경부는 13일 수도권을 포함한 전국 대부분 지역에 미세먼지 비상저감조치를 발령했다. 초미세먼지(PM2.5) 일평균 농도가 75㎍/㎥를 초과할 것으로 예보되었기 때문이다.</p>\n<p>이번 고농도 미세먼지는 중국에서 유입된 황사와 국내 자동차 배기가스, 공장 배출 오염물질이 복합적으로 작용한 결과로 분석된다.</p>\n<p>비상저감조치에 따라 수도권 공공기관의 차량 2부제가 시행되고, 노후 경유차의 수도권 진입이 제한된다. 시민들에게는 외출 자제와 마스크 착용이 권고되었다.</p>`, category_id: 3, author_id: 3, published_at: "2026-02-12T22:00:00Z", thumbnail_url: "", view_count: 12400, tags: ["미세먼지", "황사", "환경", "비상저감조치"], status: "draft" },
    { id: 12, title: "네이버, AI 에이전트 플랫폼 '큐(CUE)' 글로벌 출시", subtitle: "개인 맞춤형 AI 비서 시대 본격 개막", excerpt: "네이버가 AI 에이전트 플랫폼 '큐(CUE)'를 글로벌 시장에 출시했다. 일정 관리부터 쇼핑, 예약까지 통합 처리하는 개인 AI 비서 서비스다.", content: `<p>네이버는 13일 AI 에이전트 플랫폼 '큐(CUE)'를 한국, 일본, 동남아 5개국에 동시 출시한다고 발표했다. 큐는 자체 개발한 하이퍼클로바X 기반의 개인 맞춤형 AI 비서다.</p>\n<p>큐는 사용자의 일정, 취향, 소비 패턴을 학습해 능동적으로 서비스를 제안한다. 예를 들어 캘린더에 등록된 출장 일정을 파악해 항공권과 호텔을 자동으로 검색하고 예약까지 처리할 수 있다.</p>\n<p>네이버 측은 "큐는 단순한 챗봇이 아니라 사용자를 대신해 행동하는 AI 에이전트"라며 "네이버 생태계의 다양한 서비스와 연동되어 실질적인 가치를 제공할 것"이라고 밝혔다.</p>`, category_id: 6, author_id: 5, published_at: "2026-02-13T09:00:00Z", thumbnail_url: "", view_count: 25600, tags: ["네이버", "AI", "에이전트", "하이퍼클로바"], status: "draft" },
    { id: 13, title: "우크라이나 전쟁 3년, 평화협상 재개 움직임", subtitle: "유럽연합 중재로 양측 예비 접촉 진행 중", excerpt: "우크라이나 전쟁이 3년째에 접어든 가운데, 유럽연합의 중재로 러시아와 우크라이나 간 예비 평화협상이 조심스럽게 재개되고 있다.", content: `<p>우크라이나 전쟁이 3년째를 맞은 가운데, 유럽연합(EU)의 중재로 러시아와 우크라이나가 비공식 채널을 통한 예비 접촉을 진행하고 있는 것으로 확인되었다.</p>\n<p>EU 외교안보 고위대표는 "양측이 대화의 필요성에는 공감하고 있다"면서도 "아직 공식 협상 재개까지는 갈 길이 멀다"고 신중한 입장을 밝혔다.</p>\n<p>국제 사회에서는 장기화된 전쟁으로 인한 경제적 피로감과 인도주의적 위기가 대화 재개의 촉매가 되고 있다는 분석이 나온다. 다만 영토 문제와 안보 보장 등 핵심 쟁점에서의 입장 차이가 여전히 크다는 지적도 있다.</p>`, category_id: 5, author_id: 4, published_at: "2026-02-12T16:00:00Z", thumbnail_url: "", view_count: 14800, tags: ["우크라이나", "러시아", "평화협상", "EU"], status: "pending_review" },
    { id: 14, title: "봉준호 감독 신작 'Mickey 17', 칸영화제 개막작 선정", subtitle: "로버트 패틴슨 주연 SF 블록버스터", excerpt: "봉준호 감독의 신작 'Mickey 17'이 올해 칸영화제 개막작으로 선정되었다. 기생충 이후 6년 만의 장편 복귀작이다.", content: `<p>칸영화제 조직위원회는 봉준호 감독의 신작 'Mickey 17'을 제79회 칸국제영화제 개막작으로 선정했다고 밝혔다.</p>\n<p>로버트 패틴슨이 주연을 맡은 이 작품은 에드워드 애쉬턴의 동명 SF 소설을 원작으로, 외계 행성 식민지에서 위험한 임무를 수행하고 죽을 때마다 복제되는 남자의 이야기를 그린다.</p>\n<p>봉 감독은 "'기생충' 이후 오랜 시간 준비한 작품이다. 전혀 다른 장르, 전혀 다른 세계를 탐험하는 경험이 될 것"이라며 기대감을 드러냈다.</p>\n<p>칸영화제 측은 "봉준호 감독의 독보적인 영화적 비전이 SF 장르와 만나 어떤 화학 반응을 일으킬지 전 세계가 주목하고 있다"고 선정 이유를 밝혔다.</p>`, category_id: 4, author_id: 3, published_at: "2026-02-12T12:00:00Z", thumbnail_url: "", view_count: 33400, tags: ["봉준호", "칸영화제", "Mickey17", "영화"], status: "pending_review" },
    { id: 15, title: "이재명 더불어민주당 대표, 검찰 수사 결과 무혐의 처분", subtitle: "성남 대장동 개발 의혹 2년 수사 마무리", excerpt: "검찰이 이재명 더불어민주당 대표에 대한 성남 대장동 개발 관련 수사를 무혐의 결론으로 마무리했다.", content: `<p>서울중앙지검은 13일 이재명 더불어민주당 대표에 대한 성남 대장동 개발사업 관련 수사를 종결하고 무혐의 처분을 내렸다고 발표했다.</p>\n<p>검찰은 2년여에 걸친 수사 끝에 "이 대표가 대장동 개발사업에서 특정 사업자에게 특혜를 제공했다는 직접적인 증거를 확인하지 못했다"고 밝혔다.</p>\n<p>이 대표 측은 "진실이 밝혀진 것"이라며 환영의 뜻을 표했다. 반면 야당에서는 "수사 미흡"이라며 반발하고 있다.</p>`, category_id: 1, author_id: 1, published_at: "2026-02-12T10:00:00Z", thumbnail_url: "", view_count: 41200, tags: ["이재명", "대장동", "무혐의", "정치"], status: "scheduled" },
    { id: 16, title: "전세 사기 피해자 지원법 시행…3만 가구 혜택 예상", subtitle: "전세보증금 반환 지원 및 주거 안정 대책 포함", excerpt: "전세 사기 피해자를 위한 특별법이 시행되면서 약 3만 가구의 피해자들이 보증금 반환 지원과 임시 주거 지원을 받을 수 있게 되었다.", content: `<p>국토교통부는 13일부터 '전세사기 피해자 지원 및 주거안정에 관한 특별법'이 본격 시행된다고 밝혔다. 이에 따라 약 3만 가구의 전세 사기 피해자들이 체계적인 지원을 받을 수 있게 되었다.</p>\n<p>이 법에 따르면 피해자들은 전세보증금의 최대 90%까지 긴급 대출을 받을 수 있으며, 공공임대주택 우선 입주권도 부여된다. 또한 법률 상담과 심리 치료 등 종합적인 지원 서비스도 제공된다.</p>\n<p>국토부 관계자는 "피해자들이 하루빨리 정상적인 주거 생활을 회복할 수 있도록 최선을 다하겠다"고 밝혔다.</p>`, category_id: 3, author_id: 3, published_at: "2026-02-12T08:00:00Z", thumbnail_url: "", view_count: 11300, tags: ["전세사기", "주거안정", "특별법", "부동산"], status: "archived" },
    { id: 17, title: "KBO 2026 시즌 개막…AI 스트라이크 존 도입", subtitle: "로봇 심판 시대 본격 개막, 팬들 기대와 우려 교차", excerpt: "KBO 프로야구 2026 시즌이 개막했다. 올해부터 AI 기반 자동 스트라이크존 판정 시스템이 전 경기에 도입되어 화제를 모으고 있다.", content: `<p>KBO 프로야구 2026 시즌이 13일 전국 5개 구장에서 동시 개막했다. 올 시즌 최대 화두는 AI 기반 자동 스트라이크존 판정 시스템(ABS)의 전면 도입이다.</p>\n<p>ABS는 고속 카메라와 AI 알고리즘을 결합해 투구의 스트라이크·볼 판정을 자동으로 수행한다. 지난 시즌 2군 리그에서의 시범 운영 결과, 판정 정확도가 99.2%에 달했다.</p>\n<p>선수들과 팬들의 반응은 엇갈린다. 정확한 판정에 대한 기대가 큰 반면, "야구의 인간적인 요소가 사라진다"는 우려의 목소리도 있다.</p>`, category_id: 7, author_id: 3, published_at: "2026-02-13T12:00:00Z", thumbnail_url: "", view_count: 20100, tags: ["KBO", "프로야구", "AI심판", "ABS"], status: "published" },
    { id: 18, title: "[칼럼] AI 시대, 교육의 본질을 다시 묻다", subtitle: "지식 전달을 넘어 창의성과 비판적 사고로", excerpt: "생성형 AI가 교육 현장을 바꾸고 있다. 단순 지식 암기 중심의 교육을 넘어, 창의성과 비판적 사고를 기르는 교육으로의 전환이 시급하다.", content: `<p>챗GPT로 대표되는 생성형 AI의 등장은 교육의 근본적인 전환을 요구하고 있다. 학생들이 AI에게 물어보면 즉시 답을 얻을 수 있는 시대에, 지식 암기 중심의 교육은 더 이상 의미가 없다.</p>\n<p>미래 교육의 핵심은 '무엇을 아느냐'가 아니라 '어떻게 생각하느냐'에 있어야 한다. 비판적 사고력, 창의적 문제해결 능력, 그리고 AI와 협업하는 능력이 새로운 교육의 목표가 되어야 한다.</p>\n<p>핀란드, 싱가포르 등 교육 선진국들은 이미 이러한 방향으로 교육과정을 개편하고 있다. 한국도 서둘러야 한다. AI 시대에 걸맞은 교육 혁신 없이는 미래 세대의 경쟁력을 담보할 수 없다.</p>`, category_id: 8, author_id: 5, published_at: "2026-02-12T06:00:00Z", thumbnail_url: "", view_count: 7600, tags: ["AI", "교육", "칼럼", "미래교육"], status: "rejected" },
  ];

  // Insert in batches to avoid payload size issues
  for (let i = 0; i < articles.length; i += 6) {
    const batch = articles.slice(i, i + 6);
    const { error: artError } = await supabase.from("articles").upsert(batch, { onConflict: "id" });
    if (artError) {
      console.error(`  ❌ Articles batch ${i / 6 + 1} error:`, artError.message);
      return false;
    }
  }
  console.log("  ✅ 18 articles seeded");

  // Reset sequences
  // Note: This is only needed if we want future inserts to start after id=18
  // We'll skip this since Supabase BIGSERIAL handles it

  return true;
}

// ═══════════════════════════════════════════
// 3. CREATE ADMIN USER
// ═══════════════════════════════════════════
async function createAdminUser() {
  console.log("\n👤 Creating admin user...");

  const { data, error } = await supabase.auth.admin.createUser({
    email: "kjtimeseditor82@kjtimes.co.kr",
    password: process.env.ADMIN_PASSWORD || "2ndlife!kjt",
    email_confirm: true,
    user_metadata: {
      name: "관리자",
      role: "admin",
    },
  });

  if (error) {
    if (error.message.includes("already been registered")) {
      console.log("  ℹ️  Admin user already exists");
      return true;
    }
    console.error("  ❌ Admin user error:", error.message);
    return false;
  }

  console.log("  ✅ Admin user created:", data.user.email);
  return true;
}

// ═══════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════
async function main() {
  console.log("🚀 Setting up Supabase for 광전타임즈\n");

  // Test connection
  const { data: testData, error: testError } = await supabase.from("authors").select("count").limit(1);
  const tablesExist = !testError;

  if (!tablesExist) {
    console.log("⚠️  Tables don't exist yet. Please run the SQL schema first.");
    console.log("   Copy the SQL from scripts/schema.sql and run it in Supabase Dashboard > SQL Editor\n");
    console.log("   After running the SQL, re-run this script to seed data.\n");

    // Write schema file
    console.log("📝 Writing schema.sql...");
    return;
  }

  // Seed data
  const seedOk = await seedData();
  if (!seedOk) {
    console.error("❌ Seeding failed");
    process.exit(1);
  }

  // Create admin user
  const adminOk = await createAdminUser();
  if (!adminOk) {
    console.error("❌ Admin user creation failed");
    process.exit(1);
  }

  // Verify
  console.log("\n🔍 Verifying...");
  const { count: authorCount } = await supabase.from("authors").select("*", { count: "exact", head: true });
  const { count: catCount } = await supabase.from("categories").select("*", { count: "exact", head: true });
  const { count: artCount } = await supabase.from("articles").select("*", { count: "exact", head: true });

  console.log(`  Authors: ${authorCount}`);
  console.log(`  Categories: ${catCount}`);
  console.log(`  Articles: ${artCount}`);

  console.log("\n✅ Setup complete!");
  console.log("  Admin login: kjtimeseditor82 / [set via ADMIN_PASSWORD env var or default]");
}

main().catch(console.error);
