import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/types";
import { formatDateShort } from "@/lib/utils";

function hasImage(url: string | undefined | null): boolean {
  return !!url && url.trim().length > 0;
}

export default function ArticleCardHorizontal({
  article,
  rank,
}: {
  article: Article;
  rank?: number;
}) {
  const showImage = hasImage(article.thumbnailUrl);

  return (
    <article className="group flex gap-3 py-3 border-b border-gray-100 last:border-b-0">
      {rank !== undefined && (
        <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded bg-gray-900 text-white text-sm font-bold">
          {rank}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <Link href={`/article/${article.id}`}>
          <h4 className="text-sm font-semibold text-gray-800 leading-snug group-hover:text-gray-500 transition-colors line-clamp-2">
            {article.title}
          </h4>
        </Link>
        <span className="text-xs text-gray-400 mt-1 block">
          {formatDateShort(article.publishedAt)}
        </span>
      </div>
      {showImage && (
        <Link
          href={`/article/${article.id}`}
          className="flex-shrink-0 relative w-20 h-14 rounded overflow-hidden"
        >
          <Image
            src={article.thumbnailUrl}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="80px"
          />
        </Link>
      )}
    </article>
  );
}
