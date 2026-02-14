// TODO: Replace mock data with actual News Factory API calls when service is deployed
import { NextRequest, NextResponse } from "next/server";
import { nfDeliveries } from "@/lib/nf-mock-data";
import type { NfDelivery } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const subscriptionId = searchParams.get("subscription_id");

    let deliveries: NfDelivery[] = [...nfDeliveries];

    if (subscriptionId) {
      deliveries = deliveries.filter(
        (delivery) => delivery.subscription_id === subscriptionId
      );
    }

    return NextResponse.json(deliveries);
  } catch (error) {
    console.error("Error fetching deliveries:", error);
    return NextResponse.json(
      { error: "Failed to fetch deliveries" },
      { status: 500 }
    );
  }
}
