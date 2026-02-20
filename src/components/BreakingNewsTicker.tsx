"use client";

import Link from "next/link";
import type { Article } from "@/lib/types";

export default function BreakingNewsTicker({
  articles,
}: {
  articles: Article[];
}) {
  if (articles.length === 0) return null;

  return (
    <div className="bg-gray-900 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center">
        <span className="flex-shrink-0 bg-red-600 px-3 md:px-4 py-2 text-xs md:text-sm font-bold tracking-wide">
          속보
        </span>
        <div className="overflow-hidden flex-1 py-2 px-3 md:px-4">
          <div className="animate-ticker flex whitespace-nowrap gap-16">
            {[...articles, ...articles].map((article, i) => (
              <Link
                key={`${article.id}-${i}`}
                href={`/article/${article.id}`}
                className="inline-block text-sm hover:text-gray-400 transition-colors"
              >
                <span className="text-gray-500 mr-2">·</span>
                {article.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
