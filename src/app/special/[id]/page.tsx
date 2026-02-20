import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getArticleById,
  getSpecialRelatedArticles,
  getPublishedArticleIds,
} from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";
import CategoryBadge from "@/components/CategoryBadge";

export const revalidate = 3600;

function hasImage(url: string | undefined | null): boolean {
  return !!url && url.trim().length > 0;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const ids = await getPublishedArticleIds();
  return ids.map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticleById(id);
  if (!article) return {};
  return {
    title: `${article.title} - 창간특별호 - 광전타임즈`,
    description: article.excerpt,
  };
}

export default async function SpecialArticlePage({ params }: PageProps) {
  const { id } = await params;
  const article = await getArticleById(id);
  if (!article) notFound();

  const related = await getSpecialRelatedArticles(article, 4);

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 md:py-8">
      <Link
        href="/special"
        className="inline-flex items-center gap-1 min-h-[44px] text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4 md:mb-6"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        목록으로
      </Link>

      <article>
        <div className="mb-4">
          <CategoryBadge category={article.category} size="md" />
        </div>

        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-3">
          {article.title}
        </h1>

        <p className="text-base md:text-lg text-gray-600 mb-5 md:mb-6">{article.subtitle}</p>

        <div className="pb-5 md:pb-6 mb-5 md:mb-6 border-b border-gray-200">
          <div className="flex items-center gap-3 md:gap-4">
            {hasImage(article.author.avatarUrl) ? (
              <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={article.author.avatarUrl}
                  alt={article.author.name}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-semibold">{article.author.name.charAt(0)}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {article.author.name}
              </p>
              <p className="text-xs text-gray-500">{article.author.role}</p>
            </div>
            <div className="text-right text-xs md:text-sm text-gray-400 flex-shrink-0">
              <p>{formatDate(article.publishedAt)}</p>
              <p>조회 {article.viewCount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {hasImage(article.thumbnailUrl) && (
          <div className="relative aspect-[16/9] rounded-lg overflow-hidden mb-8">
            <Image
              src={article.thumbnailUrl}
              alt={article.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 800px"
            />
          </div>
        )}

        <div
          className="prose prose-lg max-w-none text-gray-800 leading-relaxed [&_p]:mb-4 md:[&_p]:mb-5 [&_img]:rounded-lg [&_img]:max-w-full [&_img]:h-auto"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
        />

        {article.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 border-l-4 border-gray-900 pl-3">
            관련 기사
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {related.map((a) => (
              <Link
                key={a.id}
                href={`/special/${a.id}`}
                className="group block"
              >
                {hasImage(a.thumbnailUrl) && (
                  <div className="relative aspect-[16/10] rounded-lg overflow-hidden mb-2">
                    <Image
                      src={a.thumbnailUrl}
                      alt={a.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                )}
                <CategoryBadge category={a.category} />
                <h3 className="text-[15px] font-bold text-gray-900 mt-1.5 leading-snug group-hover:text-gray-500 transition-colors line-clamp-2">
                  {a.title}
                </h3>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  {a.author.name} · {formatDate(a.publishedAt)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
