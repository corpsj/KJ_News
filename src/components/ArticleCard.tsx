import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import CategoryBadge from "./CategoryBadge";

function hasImage(url: string | undefined | null): boolean {
  return !!url && url.trim().length > 0;
}

export default function ArticleCard({ article }: { article: Article }) {
  const showImage = hasImage(article.thumbnailUrl);

  if (!showImage) {
    return (
      <article className="group overflow-hidden rounded-lg bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="h-1 rounded-t-lg bg-gray-900" />
        <Link href={`/article/${article.id}`} className="block p-5">
          <div className="mb-3">
            <CategoryBadge category={article.category} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 leading-snug mb-3 group-hover:text-gray-600 transition-colors line-clamp-3">
            {article.title}
          </h3>
          <p className="text-[14px] text-gray-500 leading-relaxed line-clamp-3 mb-4">
            {article.excerpt}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
            <span>{article.author.name}</span>
            <span>{formatDate(article.publishedAt)}</span>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="group overflow-hidden rounded-lg bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <Link href={`/article/${article.id}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={article.thumbnailUrl}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </Link>
      <div className="p-4">
        <div className="mb-2">
          <CategoryBadge category={article.category} />
        </div>
        <Link href={`/article/${article.id}`} className="block">
          <h3 className="text-lg font-bold text-gray-900 leading-snug mb-2 group-hover:text-gray-500 transition-colors line-clamp-2">
            {article.title}
          </h3>
        </Link>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
          {article.excerpt}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{article.author.name}</span>
          <span>{formatDate(article.publishedAt)}</span>
        </div>
      </div>
    </article>
  );
}
