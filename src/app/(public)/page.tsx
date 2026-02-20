import Image from "next/image";
import Link from "next/link";
import {
  getPublishedArticlesPaginated,
  getArticlesByCategory,
  getMostViewedArticles,
  getCategories,
} from "@/lib/db";
import { formatDate, formatDateShort } from "@/lib/utils";
import type { Article } from "@/lib/types";
import CategoryBadge from "@/components/CategoryBadge";
import BreakingNewsTicker from "@/components/BreakingNewsTicker";
import Pagination from "@/components/Pagination";

export const revalidate = 60;

function hasImage(url: string | undefined | null): boolean {
  return !!url && url.trim().length > 0;
}

function HeadlineRow({ article, showExcerpt = false }: { article: Article; showExcerpt?: boolean }) {
  return (
    <Link
      href={`/article/${article.id}`}
      className="group flex gap-3 py-3 md:py-3.5 border-b border-gray-100 last:border-b-0 min-h-[48px] items-start"
    >
      <div
        className="flex-shrink-0 w-1 rounded-full mt-2 self-start h-4 bg-gray-300"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600"
          >
            {article.category.name}
          </span>
          <span className="text-[11px] text-gray-400">{formatDate(article.publishedAt)}</span>
        </div>
        <h3 className="text-[14px] md:text-[15px] font-bold text-gray-900 leading-snug group-hover:text-gray-500 transition-colors line-clamp-2">
          {article.title}
        </h3>
        {showExcerpt && (
          <p className="text-[13px] text-gray-500 mt-1 line-clamp-1">{article.excerpt}</p>
        )}
      </div>
    </Link>
  );
}

interface HomeProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10));
  const perPage = 18;

  const [{ articles: latestArticles, total }, mostViewed, categories] = await Promise.all([
    getPublishedArticlesPaginated(page, perPage),
    getMostViewedArticles(5),
    getCategories(),
  ]);

  const totalPages = Math.ceil(total / perPage);

  /* 1면 장식: 이미지 있는 기사 중 최신 3개만 선별 */
  const withImages = latestArticles.filter((a) => hasImage(a.thumbnailUrl));
  const heroArticle = withImages[0];
  const subImageArticles = withImages.slice(1, 3);

  /* 나머지 최신 기사 (1면 장식 제외) */
  const heroIds = new Set([heroArticle?.id, ...subImageArticles.map((a) => a.id)]);
  const textArticles = latestArticles.filter((a) => !heroIds.has(a.id));

  /* 카테고리별 기사 (상위 6개 카테고리) */
  const displayCategories = categories.slice(0, 6);
  const categoryArticles = await Promise.all(
    displayCategories.map(async (category) => ({
      category,
      articles: await getArticlesByCategory(category.slug),
    }))
  );

  return (
    <>
      <BreakingNewsTicker articles={latestArticles.slice(0, 5)} />

      {latestArticles.length === 0 ? (
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 border border-gray-100 mb-5">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">아직 등록된 기사가 없습니다</h2>
          <p className="text-[15px] text-gray-400">새로운 소식이 곧 업데이트됩니다.</p>
        </div>
      ) : (
        <>
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-5 md:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">

            {heroArticle && (
              <div className="lg:col-span-5">
                <Link href={`/article/${heroArticle.id}`} className="group block">
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
                    {heroArticle.author.name} · {formatDate(heroArticle.publishedAt)}
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
                  <HeadlineRow key={article.id} article={article} showExcerpt={false} />
                ))}
              </div>
            </div>

            <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-5">
              {subImageArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/article/${article.id}`}
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

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">

          <div className="lg:col-span-9">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8 md:gap-y-10">
              {categoryArticles.map(({ category, articles: catArticles }) => {
                if (catArticles.length === 0) return null;
                return (
                  <section key={category.id}>
                    <div className="flex items-center justify-between pb-2 mb-1 border-b-2 border-gray-900">
                      <h2 className="text-sm font-bold text-gray-900 tracking-wide">
                        {category.name}
                      </h2>
                      <Link
                        href={`/category/${category.slug}`}
                        className="inline-flex items-center min-h-[44px] text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
                      >
                        더보기 →
                      </Link>
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
                  최신 기사
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  {textArticles.slice(7).map((article) => (
                    <HeadlineRow key={article.id} article={article} showExcerpt />
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-36 space-y-6">
              <div className="bg-white rounded-lg border border-gray-100 p-4 md:p-5">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-2 mb-2 border-b-2 border-gray-900">
                  많이 본 뉴스
                </h3>
                <div>
                  {mostViewed.length > 0 ? (
                    mostViewed.map((article, i) => (
                      <Link
                        key={article.id}
                        href={`/article/${article.id}`}
                        className="group flex gap-3 py-3 border-b border-gray-100 last:border-b-0 min-h-[44px] items-start"
                      >
                        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded bg-gray-900 text-white text-[11px] font-bold mt-0.5">
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
                    ))
                  ) : (
                    <p className="text-[13px] text-gray-400 py-4 text-center">아직 뉴스가 없습니다.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Pagination currentPage={page} totalPages={totalPages} basePath="/" />
      </div>
        </>
      )}
    </>
  );
}
