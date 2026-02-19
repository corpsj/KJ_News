import { NextResponse } from "next/server";
import { nfConnection } from "@/lib/nf-mock-data";

export async function GET() {
  return NextResponse.json(nfConnection);
}
