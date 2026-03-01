import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userRole = user.user_metadata?.role as string | undefined;
  if (userRole !== undefined && userRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "파일 크기는 10MB 이하여야 합니다." }, { status: 400 });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "지원하지 않는 파일 형식입니다. (jpg, png, gif, webp)" }, { status: 400 });
  }

  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };
  const ext = extMap[file.type] || "jpg";
  const storagePath = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const serviceClient = await createServiceClient();

  const { data, error } = await serviceClient.storage
    .from("press_image")
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });

  if (error || !data?.path) {
    return NextResponse.json({ error: "업로드 실패: " + (error?.message || "unknown") }, { status: 500 });
  }

  const { data: { publicUrl } } = serviceClient.storage.from("press_image").getPublicUrl(data.path);

  return NextResponse.json({ url: publicUrl });
}
