import Link from "next/link";
import type { Article } from "@/lib/types";

const RANK_CIRCLES = ["\u2460", "\u2461", "\u2462", "\u2463", "\u2464", "\u2465", "\u2466", "\u2467", "\u2468", "\u2469"];

export default function ArticleCardHorizontal({
  article,
  rank,
}: {
  article: Article;
  rank?: number;
}) {
  const isTop = rank !== undefined && rank <= 3;

  return (
    <article className="group flex items-start gap-2.5 px-4 py-2.5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
      {rank !== undefined && (
        <span
          className={`flex-shrink-0 text-base leading-snug pt-px ${
            isTop ? "font-bold text-gray-900" : "text-gray-400"
          }`}
        >
          {RANK_CIRCLES[rank - 1] || rank}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <Link href={`/article/${article.id}`}>
          <h4 className="text-[13px] leading-snug text-gray-700 group-hover:text-gray-500 line-clamp-2">
            {article.title}
          </h4>
        </Link>
      </div>
    </article>
  );
}
