import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

/**
 * 관리자 기사 수정/생성 후 캐시 무효화 API
 * POST /api/revalidate  (관리자 전용)
 * body: { paths?: string[] }
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json().catch(() => ({}));
    const paths: string[] = body.paths || [];

    // 항상 메인 페이지 갱신
    revalidatePath("/");

    // 추가 경로가 있으면 함께 갱신
    for (const p of paths) {
      revalidatePath(p);
    }

    // 카테고리 페이지도 갱신
    revalidatePath("/category/[slug]", "page");

    return NextResponse.json({ revalidated: true });
  } catch {
    return NextResponse.json({ revalidated: false }, { status: 500 });
  }
}
