import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "유효하지 않은 이메일입니다." },
      { status: 400 }
    );
  }

  // TODO: Supabase DB에 저장하거나 이메일 서비스 연동

  return NextResponse.json({ message: "구독 신청이 완료되었습니다." });
}
