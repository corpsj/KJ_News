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

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MIN_IMAGE_BYTES = 5 * 1024;
const FETCH_TIMEOUT_MS = 15000;

async function uploadImageToStorage(url: string, supabase: any): Promise<string> {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return "";

  try {
    console.log(`    다운로드 중: ${trimmedUrl.substring(0, 60)}...`);
    const response = await fetch(trimmedUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) {
      console.log(`    ⚠️ 다운로드 실패: ${response.status}`);
      return "";
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log(`    다운로드 완료: ${arrayBuffer.byteLength} bytes`);
    
    if (arrayBuffer.byteLength > MAX_IMAGE_BYTES || arrayBuffer.byteLength < MIN_IMAGE_BYTES) {
      console.log(`    ⚠️ 크기 제한: ${arrayBuffer.byteLength} bytes`);
      return "";
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png") ? "png" : 
                contentType.includes("webp") ? "webp" : 
                contentType.includes("gif") ? "gif" : "jpg";
    
    const storagePath = `nf/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    console.log(`    업로드 중: ${storagePath}`);

    const { data, error } = await supabase.storage
      .from("press_image")
      .upload(storagePath, arrayBuffer, {
        contentType,
        cacheControl: "31536000",
        upsert: false,
      });

    if (error || !data?.path) {
      console.log(`    ❌ 업로드 실패: ${error?.message}`);
      return "";
    }

    const { data: { publicUrl } } = supabase.storage.from("press_image").getPublicUrl(data.path);
    console.log(`    ✅ 업로드 성공: ${publicUrl}`);
    return publicUrl || "";
  } catch (err) {
    console.log(`    ❌ 오류: ${err}`);
    return "";
  }
}

async function main() {
  const articleTitle = process.argv[2] || "함평 농업경연인회";
  
  console.log(`🔧 기사 복구: ${articleTitle}\n`);
  console.log("=" .repeat(80));

  const supabase = createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } },
  );

  console.log("\n📋 기사 검색 중...");
  
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, thumbnail_url, content')
    .ilike('title', `%${articleTitle}%`)
    .limit(5);

  if (error) {
    console.error("❌ 조회 실패:", error.message);
    process.exit(1);
  }

  if (!articles || articles.length === 0) {
    console.log("❌ 기사를 찾을 수 없습니다.");
    process.exit(1);
  }

  console.log(`\n🎯 ${articles.length}개 기사 발견:\n`);
  articles.forEach((art, i) => {
    console.log(`  ${i + 1}. ${art.title}`);
    console.log(`     현재 이미지: ${art.thumbnail_url?.substring(0, 60) || '없음'}...`);
  });

  const targetArticle = articles[0];
  
  console.log(`\n📄 '${targetArticle.title}' 처리 중...`);
  
  if (!targetArticle.thumbnail_url) {
    console.log("  ℹ️ 이미지 URL이 없습니다.");
    process.exit(0);
  }

  const oldUrl = targetArticle.thumbnail_url;
  
  if (oldUrl.includes('supabase.co')) {
    console.log("  ℹ️ 이미 Supabase URL입니다. 이미지 재업로드를 시도합니다...");
    
    console.log("\n  🖼️  새 이미지 업로드 시도...");
    const newUrl = await uploadImageToStorage(oldUrl, supabase);
    
    if (!newUrl) {
      console.log("  ❌ 이미지 업로드 실패. URL을 제거합니다.");
      const { error: updateError } = await supabase
        .from('articles')
        .update({ 
          thumbnail_url: '',
          updated_at: new Date().toISOString()
        })
        .eq('id', targetArticle.id);
      
      if (updateError) {
        console.log(`  ❌ 업데이트 실패: ${updateError.message}`);
      } else {
        console.log("  ✅ 이미지 URL 제거 완료");
      }
    } else {
      const { error: updateError } = await supabase
        .from('articles')
        .update({ 
          thumbnail_url: newUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetArticle.id);
      
      if (updateError) {
        console.log(`  ❌ 업데이트 실패: ${updateError.message}`);
      } else {
        console.log("  ✅ 새 이미지 URL 적용 완료");
        console.log(`     새 URL: ${newUrl}`);
      }
    }
  } else {
    console.log("  ⚠️ 외부 URL입니다. auto-fix-images.ts 스크립트를 사용하세요.");
  }

  console.log("\n" + "=".repeat(80));
  console.log("\n💡 확인: https://kjtimes.co.kr/article/" + targetArticle.id);
}

main().catch((err) => {
  console.error("스크립트 실패:", err);
  process.exit(1);
});
