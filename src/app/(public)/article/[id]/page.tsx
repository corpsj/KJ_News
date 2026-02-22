import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getArticleById,
  getRelatedArticles,
  getPublishedArticleIds,
  getMostViewedArticles,
} from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";
import CategoryBadge from "@/components/CategoryBadge";
import ArticleCard from "@/components/ArticleCard";
import Sidebar from "@/components/Sidebar";
import ViewCounter from "@/components/ViewCounter";
import PrintButton from "@/components/PrintButton";
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from "@/lib/constants";

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

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const article = await getArticleById(id);
  if (!article) return {};

  const ogImage = article.thumbnailUrl || DEFAULT_OG_IMAGE;

  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      type: "article",
      locale: "ko_KR",
      siteName: SITE_NAME,
      title: article.title,
      description: article.excerpt,
      url: `${SITE_URL}/article/${id}`,
      images: [
        {
          url: ogImage,
          width: 800,
          height: 500,
          alt: article.title,
        },
      ],
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt || article.publishedAt,
      authors: [article.author.name],
      section: article.category.name,
      tags: article.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: [ogImage],
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { id } = await params;
  const article = await getArticleById(id);
  if (!article) notFound();

  const [related, mostViewed] = await Promise.all([
    getRelatedArticles(article, 4),
    getMostViewedArticles(5),
  ]);

  const publishedFormatted = formatDate(article.publishedAt);
  const updatedFormatted = article.updatedAt
    ? formatDate(article.updatedAt)
    : null;
  const showModified =
    updatedFormatted &&
    updatedFormatted !== "-" &&
    updatedFormatted !== publishedFormatted;

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
      <nav className="flex items-center gap-1.5 text-[13px] text-gray-500 mb-5 md:mb-6">
        <Link href="/" className="hover:text-gray-800">
          홈
        </Link>
        <span className="text-gray-300">&gt;</span>
        <Link
          href={`/category/${article.category.slug}`}
          className="hover:text-gray-800"
        >
          {article.category.name}
        </Link>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 lg:gap-10">
        <article aria-label={article.title}>
          <ViewCounter articleId={id} />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "NewsArticle",
                headline: article.title,
                description: article.excerpt,
                image: article.thumbnailUrl || DEFAULT_OG_IMAGE,
                datePublished: article.publishedAt,
                dateModified: article.updatedAt || article.publishedAt,
                author: {
                  "@type": "Person",
                  name: article.author.name,
                },
                publisher: {
                  "@type": "Organization",
                  name: SITE_NAME,
                  logo: {
                    "@type": "ImageObject",
                    url: `${SITE_URL}/brand/KJ_sloganLogo.png`,
                  },
                },
                mainEntityOfPage: {
                  "@type": "WebPage",
                  "@id": `${SITE_URL}/article/${id}`,
                },
              }),
            }}
          />

          <div className="mb-3">
            <CategoryBadge category={article.category} size="md" />
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-[32px] font-bold text-gray-900 leading-tight mb-2 md:mb-3">
            {article.title}
          </h1>

          {article.subtitle && (
            <p className="text-base md:text-[17px] text-gray-500 mb-4 md:mb-5 leading-relaxed">
              {article.subtitle}
            </p>
          )}

          <div className="text-[13px] text-gray-500 mb-2">
            <span className="text-gray-700 font-medium">
              {article.author.name}
              {article.author.role ? ` ${article.author.role}` : " 기자"}
            </span>
            <span className="mx-1.5 text-gray-300">|</span>
            <span>입력 {publishedFormatted}</span>
            {showModified && (
              <>
                <span className="mx-1.5 text-gray-300">|</span>
                <span>수정 {updatedFormatted}</span>
              </>
            )}
          </div>

          <div className="mb-5 md:mb-6">
            <PrintButton />
          </div>

          <hr className="border-t-2 border-gray-900 mb-6 md:mb-8" />

          {hasImage(article.thumbnailUrl) && (
            <figure className="mb-6 md:mb-8">
              <div className="overflow-hidden">
                <img
                  src={article.thumbnailUrl}
                  alt={article.title}
                  className="block mx-auto max-w-full max-h-[560px] w-auto h-auto"
                />
              </div>
              <figcaption className="text-xs text-gray-400 mt-2 text-center">
                {article.title}
              </figcaption>
            </figure>
          )}

          <div
            data-article-body
            className="article-body prose max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
          />

          {article.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap gap-1.5">
                {article.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/search?q=${encodeURIComponent(tag)}`}
                    className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 text-[13px] hover:bg-gray-200"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {related.length > 0 && (
            <section className="mt-10 md:mt-12 pt-8 border-t-2 border-gray-900">
              <h2 className="text-lg font-bold text-gray-900 mb-5">
                관련기사
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {related.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </section>
          )}
        </article>

        <div className="hidden lg:block print-hide" data-print-hide>
          <div className="lg:sticky lg:top-24">
            <Sidebar articles={mostViewed} />
          </div>
        </div>
      </div>
    </div>
  );
}
