import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  try {
    const envPath = resolve(".env.local");
    const envContent = readFileSync(envPath, "utf-8");
    const lines = envContent.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        const value = valueParts.join("=");
        if (key && value) {
          process.env[key] = value;
        }
      }
    }
  } catch {}
}

loadEnvLocal();

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

async function main() {
  const supabase = createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } },
  );

  console.log("🔧 엑스박스 기사 복구\n");
  console.log("=" .repeat(80));

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, thumbnail_url, content, created_at')
    .or('thumbnail_url.ilike.%.go.kr%,thumbnail_url.ilike.%.kr/%')
    .limit(50);

  if (error) {
    console.error("❌ 조회 실패:", error.message);
    process.exit(1);
  }

  if (!articles || articles.length === 0) {
    console.log("✅ 외부 URL을 사용하는 게시글이 없습니다.");
    process.exit(0);
  }

  console.log(`\n📊 총 ${articles.length}개의 외부 URL 기사 발견\n`);

  let fixed = 0;
  for (const article of articles) {
    console.log(`처리 중: ${article.title?.substring(0, 40)}...`);
    
    const { error: updateError } = await supabase
      .from('articles')
      .update({ 
        thumbnail_url: '',
        updated_at: new Date().toISOString()
      })
      .eq('id', article.id);
    
    if (updateError) {
      console.log(`  ❌ 실패: ${updateError.message}`);
    } else {
      console.log(`  ✅ thumbnail_url 제거 완료`);
      fixed++;
    }
  }

  console.log(`\n✅ 완료: ${fixed}/${articles.length}개 기사 처리`);
  console.log("\n💡 참고: 제거된 이미지는 관리자 페이지에서 직접 재업로드하거나,");
  console.log("   해당 기사를 삭제 후 뉴스팩토리에서 다시 가져오세요.");
}

main().catch((err) => {
  console.error("스크립트 실패:", err);
  process.exit(1);
});
