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

interface NfArticle {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  category: string;
  source: string;
  source_url: string;
  images: string[];
  published_at: string;
  processed_at: string;
}

function isExternalUrl(url: string): boolean {
  if (!url) return false;
  return !url.includes('supabase.co') && !url.startsWith('data:') && !url.startsWith('/');
}

function plainTextToHtml(text: string): string {
  if (!text) return "";
  return text
    .split("\n\n")
    .filter((p) => p.trim())
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
}

function nfContentToHtml(content: string, images: string[], title?: string): string {
  if (!content && (!images || images.length === 0)) return "";

  const cleanedContent = content.replace(/<img[^\u003e]*>/gi, "");
  const htmlBody = plainTextToHtml(cleanedContent);

  if (!images || images.length === 0) return htmlBody;

  const altText = title ? title.replace(/"/g, '&quot;') : "";
  const imageTags = images
    .filter((url) => url && url.trim())
    .map((url) => `\u003cfigure class="img-figure"\u003e\u003cimg src="${url}" alt="${altText}" /\u003e\u003cfigcaption class="img-caption"\u003e\u003c/figcaption\u003e\u003c/figure\u003e`)
    .join("\n");

  return imageTags + "\n" + htmlBody;
}

async function uploadImageToStorage(
  url: string,
  serviceClient: any
): Promise<string> {
  const trimmedUrl = url.trim();
  if (!trimmedUrl || trimmedUrl.includes('supabase.co')) return trimmedUrl;

  try {
    const response = await fetch(trimmedUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) {
      console.log(`    ⚠️ 이미지 다운로드 실패: ${response.status}`);
      return "";
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_IMAGE_BYTES || arrayBuffer.byteLength < MIN_IMAGE_BYTES) {
      console.log(`    ⚠️ 이미지 크기 제한 초과/미달: ${arrayBuffer.byteLength} bytes`);
      return "";
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png") ? "png" : 
                contentType.includes("webp") ? "webp" : 
                contentType.includes("gif") ? "gif" : "jpg";
    
    const storagePath = `nf/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { data, error } = await serviceClient.storage
      .from("press_image")
      .upload(storagePath, arrayBuffer, {
        contentType,
        cacheControl: "31536000",
        upsert: false,
      });

    if (error || !data?.path) {
      console.log(`    ❌ Storage 업로드 실패: ${error?.message}`);
      return "";
    }

    const { data: { publicUrl } } = serviceClient.storage.from("press_image").getPublicUrl(data.path);
    return publicUrl || "";
  } catch (err) {
    console.log(`    ❌ 이미지 처리 중 오류: ${err}`);
    return "";
  }
}

async function fetchNfArticle(nfArticleId: string): Promise<NfArticle | null> {
  const nfUrl = process.env.NF_API_URL;
  const nfKey = process.env.NF_API_KEY;
  
  if (!nfUrl || !nfKey) {
    console.error("NF_API_URL 또는 NF_API_KEY가 설정되지 않음");
    return null;
  }

  try {
    const res = await fetch(`${nfUrl}/api/v1/articles/${encodeURIComponent(nfArticleId)}`, {
      headers: { Authorization: `Bearer ${nfKey}` },
    });

    if (!res.ok) {
      console.log(`  ⚠️ NF API 오류: ${res.status}`);
      return null;
    }

    const data = await res.json() as { article: NfArticle };
    return data.article;
  } catch (err) {
    console.log(`  ❌ NF API 호출 실패: ${err}`);
    return null;
  }
}

async function main() {
  console.log("🔧 자동 이미지 복구 스크립트\n");
  console.log("=" .repeat(80));

  const supabase = createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } },
  );

  const nfUrl = process.env.NF_API_URL;
  const nfKey = process.env.NF_API_KEY;
  
  if (!nfUrl || !nfKey) {
    console.error("❌ NF_API_URL 또는 NF_API_KEY 환경 변수가 필요합니다.");
    console.log("   .env.local 파일에 다음을 추가하세요:");
    console.log("   NF_API_URL=https://news-factory-v2.vercel.app");
    console.log("   NF_API_KEY=your_api_key");
    process.exit(1);
  }

  console.log("\n📋 외부 URL을 사용하는 기사 검색 중...");
  
  const { data: articlesWithImports, error } = await supabase
    .from('articles')
    .select(`
      id,
      title,
      thumbnail_url,
      nf_imports!inner(nf_article_id)
    `)
    .or('thumbnail_url.ilike.%.go.kr%,thumbnail_url.ilike.%.kr/%,thumbnail_url.ilike.%.com%,thumbnail_url.ilike.%.org%')
    .not('thumbnail_url', 'ilike', '%supabase.co%')
    .limit(20);

  if (error) {
    console.error("❌ 기사 조회 실패:", error.message);
    process.exit(1);
  }

  if (!articlesWithImports || articlesWithImports.length === 0) {
    console.log("✅ 외부 URL을 사용하는 기사가 없습니다.");
    process.exit(0);
  }

  console.log(`\n🎯 총 ${articlesWithImports.length}개의 기사 발견`);
  console.log("\n⚠️  다음 기사들을 삭제 후 재가져옵니다:\n");
  
  articlesWithImports.forEach((art, i) => {
    console.log(`  ${i + 1}. ${art.title?.substring(0, 50)}...`);
    console.log(`     현재 URL: ${art.thumbnail_url?.substring(0, 60)}...`);
  });

  console.log("\n" + "-".repeat(80));
  console.log("위 기사들을 복구하시겠습니까? (y/n)");
  
  const args = process.argv.slice(2);
  const confirmed = args.includes('--yes') || args.includes('-y');
  
  if (!confirmed) {
    console.log("\n실행하려면: npx tsx scripts/auto-fix-images.ts --yes");
    console.log("또는 --dry-run으로 미리보기만");
    process.exit(0);
  }

  const dryRun = args.includes('--dry-run');
  
  if (dryRun) {
    console.log("\n🏃 DRY RUN 모드: 실제 변경은 하지 않습니다.\n");
  } else {
    console.log("\n🚀 실제 복구를 시작합니다...\n");
  }

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const article of articlesWithImports as any[]) {
    console.log(`\n📄 처리 중: ${article.title?.substring(0, 40)}...`);
    
    const nfArticleId = article.nf_imports?.[0]?.nf_article_id;
    if (!nfArticleId) {
      console.log("  ⚠️ NF 기사 ID를 찾을 수 없음 (뉴스팩토리 기사가 아님)");
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(`  📝 DRY RUN: ${nfArticleId} 재가져오기 예정`);
      continue;
    }

    const localArticleId = article.id;

    try {
      const nfArticle = await fetchNfArticle(nfArticleId);
      if (!nfArticle) {
        console.log("  ❌ 뉴스팩토리에서 기사를 가져올 수 없음");
        failed++;
        continue;
      }

      console.log(`  ✅ 뉴스팩토리 기사 로드 완료`);
      console.log(`  🖼️  ${nfArticle.images?.length || 0}개 이미지 업로드 중...`);

      const uploadedImages: string[] = [];
      for (const imgUrl of nfArticle.images || []) {
        const uploaded = await uploadImageToStorage(imgUrl, supabase);
        if (uploaded) {
          uploadedImages.push(uploaded);
          console.log(`    ✅ 업로드 완료`);
        } else {
          console.log(`    ❌ 업로드 실패`);
        }
      }

      if (uploadedImages.length === 0 && nfArticle.images?.length > 0) {
        console.log("  ⚠️ 모든 이미지 업로드 실패, 건 넘김");
        failed++;
        continue;
      }

      const thumbnailUrl = uploadedImages.find(url => url && url.trim()) || "";
      
      const content = nfContentToHtml(nfArticle.content, uploadedImages, nfArticle.title);

      console.log(`  📝 기사 내용 업데이트 중...`);

      const { error: updateError } = await supabase
        .from('articles')
        .update({
          thumbnail_url: thumbnailUrl,
          content: content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', localArticleId);

      if (updateError) {
        console.log(`  ❌ 업데이트 실패: ${updateError.message}`);
        failed++;
        continue;
      }

      console.log(`  ✅ 기사 업데이트 완료!`);
      console.log(`     새 이미지: ${thumbnailUrl?.substring(0, 60)}...`);
      success++;

      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (err) {
      console.log(`  ❌ 처리 중 오류: ${err}`);
      failed++;
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("📊 복구 결과:");
  console.log(`   ✅ 성공: ${success}개`);
  console.log(`   ❌ 실패: ${failed}개`);
  console.log(`   ⏭️ 건 넘김: ${skipped}개`);
  
  if (!dryRun && success > 0) {
    console.log("\n💡 복구된 기사들을 확인필요합니다.");
    console.log("   관리자 페이지에서 이미지가 정상적으로 표시되는지 확인하세요.");
  }
}

main().catch((err) => {
  console.error("스크립트 실패:", err);
  process.exit(1);
});
