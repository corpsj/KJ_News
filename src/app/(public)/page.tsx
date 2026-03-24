import Link from "next/link";
import {
  getPublishedArticlesPaginated,
  getArticlesByCategorySlugs,
  getMostViewedArticles,
  getCategories,
} from "@/lib/db";
import { formatDate, formatDateShort } from "@/lib/utils";
import type { Article } from "@/lib/types";
import Pagination from "@/components/Pagination";
import MainNewsSection from "@/components/MainNewsSection";
import AdBanner from "@/components/AdBanner";
import YoutubeSection from "@/components/YoutubeSection";

export const revalidate = 60;


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

  /* 주요뉴스: 모든 최신 기사를 주요뉴스 섹션에서 표시 */
  const textArticles = latestArticles;

  /* 카테고리별 기사 (상위 6개 카테고리) */
  const displayCategories = categories.slice(0, 6);
  const categorySlugs = displayCategories.map((category) => category.slug);
  const categoryArticlesBySlug = await getArticlesByCategorySlugs(categorySlugs, 4);
  const categoryArticles = displayCategories.map((category) => ({
    category,
    articles: categoryArticlesBySlug[category.slug] || [],
  }));

  return (
    <>
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
          <MainNewsSection articles={textArticles} />
        </div>
      </section>

      {/* 광고 배너 1: 주요뉴스 하단 */}
      <AdBanner slot="main_news_below" />

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

            {/* 광고 배너 2: 카테고리별 뉴스 하단 */}
            <div className="mt-8">
              <AdBanner slot="category_below" />
            </div>

            {/* 영상 클립 섹션 */}
            <div className="mt-8 md:mt-10">
              <YoutubeSection />
            </div>

            {/* 광고 배너 3: 영상 섹션 하단 */}
            <div className="mt-8">
              <AdBanner slot="latest_below" />
            </div>
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
