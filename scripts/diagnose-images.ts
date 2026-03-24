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

  console.log("🔍 KJ_News 이미지 시스템 진단\n");
  console.log("=" .repeat(80));

  console.log("\n📦 Storage 버킷 확인");
  console.log("-".repeat(80));
  
  try {
    const { data: buckets, error } = await supabase
      .from('buckets')
      .select('name, public, file_size_limit, allowed_mime_types');
    
    if (error) {
      console.log(`   ❌ 버킷 조회 실패: ${error.message}`);
    } else if (!buckets || buckets.length === 0) {
      console.log(`   ❌ 버킷이 존재하지 않습니다!`);
    } else {
      console.log(`   총 ${buckets.length}개 버킷:`);
      for (const bucket of buckets) {
        const isTarget = bucket.name === 'press_image' || bucket.name === 'press-images';
        console.log(`   ${isTarget ? '👉' : '  '} ${bucket.name} (public: ${bucket.public})`);
      }
      
      const pressImageBucket = buckets.find(b => b.name === 'press_image');
      const pressImagesBucket = buckets.find(b => b.name === 'press-images');
      
      if (pressImageBucket) {
        console.log(`\n   ✅ 'press_image' 버킷 존재 (API에서 사용)`);
        console.log(`      Public: ${pressImageBucket.public}`);
        if (!pressImageBucket.public) {
          console.log(`      ⚠️  버킷이 public이 아닙니다!`);
        }
      } else {
        console.log(`\n   ❌ 'press_image' 버킷이 없습니다!`);
        console.log(`      → API에서 사용하는 버킷을 생성해야 합니다.`);
      }
      
      if (pressImagesBucket) {
        console.log(`\n   ℹ️  'press-images' 버킷도 존재 (뉴스팩토리와 동일)`);
      }
    }
    
    const { count, error: countError } = await supabase
      .from('objects')
      .select('*', { count: 'exact', head: true })
      .eq('bucket_id', 'press_image');
    
    if (!countError && count !== null) {
      console.log(`\n   📊 'press_image' 버킷 객체 수: ${count}개`);
    }
    
  } catch (err) {
    console.log(`   ⚠️  오류: ${err}`);
  }

  console.log("\n\n🗄️  게시글 이미지 현황");
  console.log("-".repeat(80));
  
  try {
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, title, thumbnail_url, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.log(`   ❌ 조회 실패: ${error.message}`);
    } else if (!articles || articles.length === 0) {
      console.log(`   📭 게시글이 없습니다.`);
    } else {
      let withImages = 0;
      let withoutImages = 0;
      let externalUrls = 0;
      
      for (const article of articles) {
        if (article.thumbnail_url) {
          withImages++;
          if (!article.thumbnail_url.includes('supabase.co')) {
            externalUrls++;
          }
        } else {
          withoutImages++;
        }
      }
      
      console.log(`   최근 ${articles.length}개 게시글:`);
      console.log(`   - 이미지 있음: ${withImages}개`);
      console.log(`   - 이미지 없음: ${withoutImages}개`);
      console.log(`   - 외부 URL: ${externalUrls}개 (문제 가능성)`);
      
      if (externalUrls > 0) {
        console.log(`\n   🚨 외부 URL을 사용하는 게시글 (최대 5개):`);
        articles
          .filter(a => a.thumbnail_url && !a.thumbnail_url.includes('supabase.co'))
          .slice(0, 5)
          .forEach(a => {
            console.log(`      - ${a.title?.substring(0, 30)}...`);
            console.log(`        URL: ${a.thumbnail_url?.substring(0, 60)}...`);
          });
      }
    }
    
  } catch (err) {
    console.log(`   ⚠️  오류: ${err}`);
  }

  console.log("\n\n⚙️  환경 변수");
  console.log("-".repeat(80));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    console.log(`   ✅ NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`);
  } else {
    console.log(`   ❌ NEXT_PUBLIC_SUPABASE_URL 미설정`);
  }

  console.log("\n" + "=".repeat(80));
  console.log("\n💡 권장 조치:");
  console.log("   1. 'press_image' 버킷이 없으면 생성");
  console.log("   2. 버킷이 private이면 public으로 변경");
  console.log("   3. 외부 URL을 사용하는 게시글이 있으면 이미지 재업로드");
}

main().catch((err) => {
  console.error("스크립트 실패:", err);
  process.exit(1);
});
