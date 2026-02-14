// TODO: Replace mock data with actual News Factory API calls when service is deployed
import { NextRequest, NextResponse } from "next/server";
import { nfSubscriptions } from "@/lib/nf-mock-data";
import type { NfSubscription } from "@/lib/types";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const subscriptionIndex = nfSubscriptions.findIndex((sub) => sub.id === id);
    if (subscriptionIndex === -1) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    const updatedSubscription: NfSubscription = {
      ...nfSubscriptions[subscriptionIndex],
      name: body.name ?? nfSubscriptions[subscriptionIndex].name,
      filter_regions: body.filter_regions ?? nfSubscriptions[subscriptionIndex].filter_regions,
      filter_categories: body.filter_categories ?? nfSubscriptions[subscriptionIndex].filter_categories,
      filter_keywords: body.filter_keywords ?? nfSubscriptions[subscriptionIndex].filter_keywords,
      schedule_cron: body.schedule_cron ?? nfSubscriptions[subscriptionIndex].schedule_cron,
      schedule_tz: body.schedule_tz ?? nfSubscriptions[subscriptionIndex].schedule_tz,
      max_articles: body.max_articles ?? nfSubscriptions[subscriptionIndex].max_articles,
      is_active: body.is_active ?? nfSubscriptions[subscriptionIndex].is_active,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(updatedSubscription);
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const subscriptionIndex = nfSubscriptions.findIndex((sub) => sub.id === id);
    if (subscriptionIndex === -1) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    const deletedSubscription = nfSubscriptions[subscriptionIndex];
    nfSubscriptions.splice(subscriptionIndex, 1);

    return NextResponse.json(deletedSubscription);
  } catch (error) {
    console.error("Error deleting subscription:", error);
    return NextResponse.json(
      { error: "Failed to delete subscription" },
      { status: 500 }
    );
  }
}
