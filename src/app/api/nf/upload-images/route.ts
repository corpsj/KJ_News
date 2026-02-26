import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MIN_IMAGE_BYTES = 5 * 1024; // 5KB 미만 = 트래킹 픽셀/아이콘
const FETCH_TIMEOUT_MS = 15000;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

function isSupabaseUrl(url: string): boolean {
  return supabaseUrl !== "" && url.startsWith(supabaseUrl);
}

function getContentType(response: Response, url: string): string {
  const raw = response.headers.get("content-type");
  if (raw) {
    const base = raw.split(";")[0].trim().toLowerCase();
    if (base.startsWith("image/")) return base;
  }

  const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };
  return map[ext ?? ""] ?? "image/jpeg";
}

function getExtFromContentType(contentType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };
  return map[contentType] ?? "jpg";
}

async function uploadImageUrl(
  url: string,
  serviceClient: Awaited<ReturnType<typeof createServiceClient>>,
): Promise<string> {
  const trimmedUrl = url.trim();
  if (!trimmedUrl || isSupabaseUrl(trimmedUrl)) return url;

  try {
    const response = await fetch(trimmedUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) return url;

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_IMAGE_BYTES || arrayBuffer.byteLength < MIN_IMAGE_BYTES) return "";

    const contentType = getContentType(response, trimmedUrl);
    const ext = getExtFromContentType(contentType);
    const storagePath = `nf/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { data, error } = await serviceClient.storage
      .from("press_image")
      .upload(storagePath, arrayBuffer, {
        contentType,
        cacheControl: "31536000",
        upsert: false,
      });

    if (error || !data?.path) return url;

    const {
      data: { publicUrl },
    } = serviceClient.storage.from("press_image").getPublicUrl(data.path);

    return publicUrl || url;
  } catch {
    return url;
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userRole = user.user_metadata?.role as string | undefined;
  if (userRole !== undefined && userRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { urls } = body as { urls: string[] };
  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ urls: [] });
  }

  const sourceUrls = urls.filter((url): url is string => typeof url === "string");
  if (sourceUrls.length === 0) {
    return NextResponse.json({ urls: [] });
  }

  const serviceClient = await createServiceClient();
  const results = await Promise.allSettled(sourceUrls.map((url) => uploadImageUrl(url, serviceClient)));

  return NextResponse.json({
    urls: results.map((result, index) =>
      result.status === "fulfilled" ? result.value : sourceUrls[index],
    ),
  });
}
