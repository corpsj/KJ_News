import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  getCategoryBySlug,
  getCategorySlugs,
  getArticlesByCategoryPaginated,
  getMostViewedArticles,
} from "@/lib/db";
import { formatDate, formatDateShort } from "@/lib/utils";
import CategoryBadge from "@/components/CategoryBadge";
import Pagination from "@/components/Pagination";
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from "@/lib/constants";

export const revalidate = 60;

function hasImage(url: string | undefined | null): boolean {
  return !!url && url.trim().length > 0;
}

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateStaticParams() {
  const slugs = await getCategorySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: category.name,
    description:
      category.description || `${SITE_NAME}의 ${category.name} 뉴스`,
    openGraph: {
      type: "website",
      locale: "ko_KR",
      siteName: SITE_NAME,
      title: `${category.name} - ${SITE_NAME}`,
      description:
        category.description || `${SITE_NAME}의 ${category.name} 뉴스`,
      url: `${SITE_URL}/category/${slug}`,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.name} - ${SITE_NAME}`,
      description:
        category.description || `${SITE_NAME}의 ${category.name} 뉴스`,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10));
  const perPage = 15;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [{ articles: allArticles, total }, mostViewed] = await Promise.all([
    getArticlesByCategoryPaginated(slug, page, perPage),
    getMostViewedArticles(5),
  ]);

  const totalPages = Math.ceil(total / perPage);

  if (allArticles.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-gray-800 transition-colors">홈</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{category.name}</span>
        </nav>
        <div className="pb-4 mb-6 border-b-2 border-gray-900">
          <h1 className="text-2xl font-extrabold text-gray-900">{category.name}</h1>
          {category.description && (
            <p className="text-sm text-gray-500 mt-1">{category.description}</p>
          )}
        </div>
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 border border-gray-100 mb-4">
            <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-500 mb-2">이 카테고리에 등록된 기사가 없습니다</p>
          <p className="text-sm text-gray-400 mb-6">곧 새로운 기사가 등록될 예정입니다.</p>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const withImages = allArticles.filter((a) => hasImage(a.thumbnailUrl));
  const heroArticle = withImages[0] || allArticles[0];
  const restArticles = allArticles.filter((a) => a.id !== heroArticle.id);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-800 transition-colors">
          홈
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{category.name}</span>
      </nav>

      <div className="pb-4 mb-6 border-b-2 border-gray-900">
        <h1 className="text-2xl font-extrabold text-gray-900">
          {category.name}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{category.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-9">
          <Link href={`/article/${heroArticle.id}`} className="group block">
            {hasImage(heroArticle.thumbnailUrl) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 mb-6 border-b border-gray-200">
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                  <Image
                    src={heroArticle.thumbnailUrl}
                    alt={heroArticle.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    priority
                    sizes="(max-width: 768px) 100vw, 45vw"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <h2 className="text-2xl md:text-[26px] font-extrabold text-gray-900 leading-tight group-hover:text-gray-500 transition-colors">
                    {heroArticle.title}
                  </h2>
                  <p className="text-[14px] text-gray-500 mt-3 leading-relaxed line-clamp-3">
                    {heroArticle.excerpt}
                  </p>
                  <div className="flex items-center gap-3 mt-4 text-xs text-gray-400">
                    <span>{heroArticle.author.name}</span>
                    <span>·</span>
                    <span>{formatDate(heroArticle.publishedAt)}</span>
                    <span>·</span>
                    <span>조회 {heroArticle.viewCount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pb-6 mb-6 border-b border-gray-200">
                <h2 className="text-2xl md:text-[26px] font-extrabold text-gray-900 leading-tight group-hover:text-gray-500 transition-colors">
                  {heroArticle.title}
                </h2>
                <p className="text-[15px] text-gray-500 mt-3 leading-relaxed line-clamp-3">
                  {heroArticle.excerpt}
                </p>
                <div className="flex items-center gap-3 mt-4 text-xs text-gray-400">
                  <span>{heroArticle.author.name}</span>
                  <span>·</span>
                  <span>{formatDate(heroArticle.publishedAt)}</span>
                  <span>·</span>
                  <span>조회 {heroArticle.viewCount.toLocaleString()}</span>
                </div>
              </div>
            )}
          </Link>

          {restArticles.length > 0 && (
            <div>
              {restArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/article/${article.id}`}
                  className="group flex gap-5 py-5 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-gray-500 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-[13px] text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>{article.author.name}</span>
                      <span>·</span>
                      <span>{formatDate(article.publishedAt)}</span>
                    </div>
                  </div>
                  {hasImage(article.thumbnailUrl) && (
                    <div className="flex-shrink-0 relative w-28 h-20 md:w-36 md:h-24 rounded-lg overflow-hidden">
                      <Image
                        src={article.thumbnailUrl}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="144px"
                      />
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}

          <Pagination currentPage={page} totalPages={totalPages} basePath={`/category/${slug}`} />
        </div>

        <aside className="lg:col-span-3">
          <div className="lg:sticky lg:top-36 space-y-6">
            <div className="bg-white rounded-lg border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-2 mb-2 border-b-2 border-gray-900">
                많이 본 뉴스
              </h3>
              <div>
                {mostViewed.map((article, i) => (
                  <Link
                    key={article.id}
                    href={`/article/${article.id}`}
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
        </aside>
      </div>
    </div>
  );
}
