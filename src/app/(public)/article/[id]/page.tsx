import { notFound } from "next/navigation";
import Image from "next/image";
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
import ShareButtons from "@/components/ShareButtons";
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 md:py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4 md:mb-6 overflow-hidden">
        <Link href="/" className="flex-shrink-0 hover:text-gray-800 transition-colors">
          홈
        </Link>
        <span className="flex-shrink-0">/</span>
        <Link
          href={`/category/${article.category.slug}`}
          className="flex-shrink-0 hover:text-gray-800 transition-colors"
        >
          {article.category.name}
        </Link>
        <span className="flex-shrink-0 hidden md:inline">/</span>
        <span className="text-gray-900 font-medium line-clamp-1 hidden md:inline">
          {article.title}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
         <article aria-label={article.title} className="lg:col-span-2">
           <ViewCounter articleId={id} />
           <script
             type="application/ld+json"
             dangerouslySetInnerHTML={{
               __html: JSON.stringify({
                 "@context": "https://schema.org",
                 "@type": "NewsArticle",
                 "headline": article.title,
                 "description": article.excerpt,
                 "image": article.thumbnailUrl || DEFAULT_OG_IMAGE,
                 "datePublished": article.publishedAt,
                 "dateModified": article.publishedAt,
                 "author": {
                   "@type": "Person",
                   "name": article.author.name
                 },
                 "publisher": {
                   "@type": "Organization",
                   "name": SITE_NAME,
                   "logo": {
                     "@type": "ImageObject",
                     "url": `${SITE_URL}/brand/KJ_sloganLogo.png`
                   }
                 },
                 "mainEntityOfPage": {
                   "@type": "WebPage",
                   "@id": `${SITE_URL}/article/${id}`
                 }
               })
             }}
           />
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
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
              <PrintButton />
              <ShareButtons url={`${SITE_URL}/article/${id}`} title={article.title} />
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
                sizes="(max-width: 1024px) 100vw, 66vw"
              />
            </div>
          )}

          <div
            className="prose prose-lg max-w-none text-gray-800 leading-relaxed [&_p]:mb-4 md:[&_p]:mb-5 [&_img]:rounded-lg [&_img]:max-w-full [&_img]:h-auto"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
          />

          <div className="mt-6 md:mt-8 pt-5 md:pt-6 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  className="inline-flex items-center px-3 min-h-[36px] md:min-h-[32px] bg-gray-100 text-gray-600 text-sm rounded-full hover:bg-gray-200 transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>

          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold text-gray-900 mb-6 border-l-4 border-gray-900 pl-3">
                관련 기사
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {related.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </section>
          )}
        </article>

        <div className="lg:block">
          <div className="lg:sticky lg:top-36">
            <Sidebar articles={mostViewed} />
          </div>
        </div>
      </div>
    </div>
  );
}
