import { searchArticlesPaginated } from "@/lib/db";
import ArticleCard from "@/components/ArticleCard";
import SearchBar from "@/components/SearchBar";
import Pagination from "@/components/Pagination";
import { SITE_NAME, DEFAULT_OG_IMAGE } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const title = q ? `"${q}" 검색 결과` : "검색";
  const description = q
    ? `${SITE_NAME}에서 "${q}"로 검색한 결과입니다.`
    : `${SITE_NAME}에서 뉴스를 검색하세요.`;
  return {
    title,
    description,
    openGraph: {
      title: `${title} - ${SITE_NAME}`,
      description,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q, page: pageParam } = await searchParams;
  const query = q || "";
  const page = Math.max(1, parseInt(pageParam || "1", 10));
  const perPage = 12;

  const { articles: results, total } = query
    ? await searchArticlesPaginated(query, page, perPage)
    : { articles: [], total: 0 };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">기사 검색</h1>

      <div className="max-w-xl mb-8">
        <SearchBar defaultValue={query} />
      </div>

      {query && (
        <p className="text-sm text-gray-500 mb-6">
          &ldquo;{query}&rdquo; 검색 결과{" "}
          <span className="font-bold text-gray-900">{total}</span>건
        </p>
      )}

      {query && results.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg mb-2">
            검색 결과가 없습니다.
          </p>
          <p className="text-gray-400 text-sm">
            다른 키워드로 검색해 보세요.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} basePath="/search" searchParams={{ q: query }} />
        </>
      )}
    </div>
  );
}
