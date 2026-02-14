// TODO: Replace mock data with actual News Factory API calls when service is deployed
import { NextRequest, NextResponse } from "next/server";
import { nfSubscriptions } from "@/lib/nf-mock-data";
import type { NfSubscription } from "@/lib/types";

export async function GET() {
  try {
    return NextResponse.json(nfSubscriptions);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newSubscription: NfSubscription = {
      id: `nf-sub-${Date.now()}`,
      name: body.name,
      filter_regions: body.filter_regions || [],
      filter_categories: body.filter_categories || [],
      filter_keywords: body.filter_keywords || [],
      schedule_cron: body.schedule_cron,
      schedule_tz: body.schedule_tz || "Asia/Seoul",
      max_articles: body.max_articles || 10,
      is_active: body.is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(newSubscription, { status: 201 });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}
