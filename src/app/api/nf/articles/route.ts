// TODO: Replace mock data with actual News Factory API calls when service is deployed
import { NextRequest, NextResponse } from "next/server";
import { nfArticles } from "@/lib/nf-mock-data";
import type { NfArticle } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const source = searchParams.get("source");
    const limit = searchParams.get("limit");

    let articles: NfArticle[] = [...nfArticles];

    // Filter by category
    if (category) {
      articles = articles.filter((article) => article.category === category);
    }

    // Filter by source
    if (source) {
      articles = articles.filter((article) => article.source === source);
    }

    // Apply limit
    const limitNum = limit ? parseInt(limit, 10) : articles.length;
    articles = articles.slice(0, limitNum);

    return NextResponse.json(articles);
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}
