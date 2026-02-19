import { NextResponse } from "next/server";
import { nfSyncLogs } from "@/lib/nf-mock-data";

export async function GET() {
  try {
    return NextResponse.json(nfSyncLogs);
  } catch (error) {
    void error;
    return NextResponse.json(
      { error: "Failed to fetch sync logs" },
      { status: 500 }
    );
  }
}
