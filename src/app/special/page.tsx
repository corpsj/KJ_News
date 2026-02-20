import Image from "next/image";
import Link from "next/link";
import {
  getSpecialEditionArticles,
  getMostViewedArticles,
  getCategories,
} from "@/lib/db";
import { formatDate, formatDateShort } from "@/lib/utils";
import type { Article } from "@/lib/types";
import CategoryBadge from "@/components/CategoryBadge";

export const revalidate = 60;

function hasImage(url: string | undefined | null): boolean {
  return !!url && url.trim().length > 0;
}

function HeadlineRow({
  article,
  showExcerpt = false,
}: {
  article: Article;
  showExcerpt?: boolean;
}) {
  return (
    <Link
      href={`/special/${article.id}`}
      className="group flex gap-3 py-3 md:py-3.5 border-b border-gray-100 last:border-b-0 min-h-[48px] items-start"
    >
      <div className="flex-shrink-0 w-1 rounded-full mt-2 self-start h-4 bg-gray-300" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
            {article.category.name}
          </span>
          <span className="text-[11px] text-gray-400">
            {formatDate(article.publishedAt)}
          </span>
        </div>
        <h3 className="text-[14px] md:text-[15px] font-bold text-gray-900 leading-snug group-hover:text-gray-500 transition-colors line-clamp-2">
          {article.title}
        </h3>
        {showExcerpt && (
          <p className="text-[13px] text-gray-500 mt-1 line-clamp-1">
            {article.excerpt}
          </p>
        )}
      </div>
    </Link>
  );
}

export default async function SpecialEditionPage() {
  const [allArticles, mostViewed, categories] = await Promise.all([
    getSpecialEditionArticles(),
    getMostViewedArticles(5),
    getCategories(),
  ]);

  const withImages = allArticles.filter((a) => hasImage(a.thumbnailUrl));
  const heroArticle = withImages[0];
  const subImageArticles = withImages.slice(1, 3);

  const heroIds = new Set([
    heroArticle?.id,
    ...subImageArticles.map((a) => a.id),
  ]);
  const textArticles = allArticles.filter((a) => !heroIds.has(a.id));

  const displayCategories = categories.slice(0, 6);

  return (
    <>
      {/* ═══════ 1면: 히어로 + 서브 이미지 + 주요 텍스트 헤드라인 ═══════ */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-5 md:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
            {heroArticle && (
              <div className="lg:col-span-5">
                <Link
                  href={`/special/${heroArticle.id}`}
                  className="group block"
                >
                  {hasImage(heroArticle.thumbnailUrl) && (
                    <div className="relative aspect-[16/9] md:aspect-[4/3] rounded-lg overflow-hidden mb-3">
                      <Image
                        src={heroArticle.thumbnailUrl}
                        alt={heroArticle.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 42vw"
                      />
                    </div>
                  )}
                  <CategoryBadge category={heroArticle.category} size="md" />
                  <h2 className="text-xl md:text-2xl lg:text-[28px] font-extrabold text-gray-900 mt-2 leading-tight group-hover:text-gray-500 transition-colors">
                    {heroArticle.title}
                  </h2>
                  <p className="text-[13px] md:text-[14px] text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                    {heroArticle.excerpt}
                  </p>
                  <span className="text-xs text-gray-400 mt-2 block">
                    {heroArticle.author.name} ·{" "}
                    {formatDate(heroArticle.publishedAt)}
                  </span>
                </Link>
              </div>
            )}

            <div className="lg:col-span-4 lg:border-l lg:border-r lg:border-gray-100 lg:px-5">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-2 mb-1 border-b-2 border-gray-900">
                주요 뉴스
              </h2>
              <div>
                {textArticles.slice(0, 7).map((article) => (
                  <HeadlineRow key={article.id} article={article} />
                ))}
              </div>
            </div>

            <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-5">
              {subImageArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/special/${article.id}`}
                  className="group block"
                >
                  {hasImage(article.thumbnailUrl) && (
                    <div className="relative aspect-[16/10] rounded-lg overflow-hidden mb-2">
                      <Image
                        src={article.thumbnailUrl}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    </div>
                  )}
                  <CategoryBadge category={article.category} />
                  <h3 className="text-[14px] md:text-[15px] font-bold text-gray-900 mt-1.5 leading-snug group-hover:text-gray-500 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    {article.author.name} · {formatDate(article.publishedAt)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ 하단: 카테고리별 텍스트 헤드라인 + 사이드바 ═══════ */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          <div className="lg:col-span-9">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8 md:gap-y-10">
              {displayCategories.map((category) => {
                const catArticles = allArticles.filter(
                  (a) => a.category.slug === category.slug
                );
                if (catArticles.length === 0) return null;
                return (
                  <section key={category.id}>
                    <div className="flex items-center justify-between pb-2 mb-1 border-b-2 border-gray-900">
                      <h2 className="text-sm font-bold text-gray-900 tracking-wide">
                        {category.name}
                      </h2>
                    </div>
                    <div>
                      {catArticles.slice(0, 4).map((article) => (
                        <HeadlineRow key={article.id} article={article} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>

            {textArticles.length > 7 && (
              <section className="mt-8 md:mt-10">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-2 mb-1 border-b-2 border-gray-900">
                  더 많은 기사
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  {textArticles.slice(7).map((article) => (
                    <HeadlineRow
                      key={article.id}
                      article={article}
                      showExcerpt
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── 우: 사이드바 (많이 본 뉴스) ── */}
          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-24 space-y-6">
              <div className="bg-white rounded-lg border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-2 mb-2 border-b-2 border-gray-900">
                  많이 본 뉴스
                </h3>
                <div>
                  {mostViewed.map((article, i) => (
                    <Link
                      key={article.id}
                      href={`/special/${article.id}`}
                      className="group flex gap-3 py-3 border-b border-gray-100 last:border-b-0"
                    >
                      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded bg-gray-900 text-white text-[11px] font-bold">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] font-semibold text-gray-800 leading-snug group-hover:text-gray-500 transition-colors line-clamp-2">
                          {article.title}
                        </h4>
                        <span className="text-[11px] text-gray-400 mt-0.5 block">
                          {formatDateShort(article.publishedAt)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
