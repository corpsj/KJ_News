import { NextRequest, NextResponse } from "next/server";
import { nfConnection } from "@/lib/nf-mock-data";
import type { NfConnection } from "@/lib/types";

let connectionState: NfConnection = { ...nfConnection };

export async function GET() {
  try {
    return NextResponse.json(connectionState);
  } catch (error) {
    void error;
    return NextResponse.json(
      { error: "Failed to fetch connection" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    connectionState = {
      ...connectionState,
      ...(body.api_key !== undefined && { api_key: body.api_key }),
      ...(body.is_active !== undefined && { is_active: body.is_active }),
      ...(body.collect_categories !== undefined && { collect_categories: body.collect_categories }),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(connectionState);
  } catch (error) {
    void error;
    return NextResponse.json(
      { error: "Failed to update connection" },
      { status: 500 }
    );
  }
}
