import { searchArticles } from "@/lib/db";
import ArticleCard from "@/components/ArticleCard";
import SearchBar from "@/components/SearchBar";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps) {
  const { q } = await searchParams;
  return {
    title: q ? `"${q}" 검색 결과 - 광전타임즈` : "검색 - 광전타임즈",
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q || "";
  const results = query ? await searchArticles(query) : [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">기사 검색</h1>

      <div className="max-w-xl mb-8">
        <SearchBar defaultValue={query} />
      </div>

      {query && (
        <p className="text-sm text-gray-500 mb-6">
          &ldquo;{query}&rdquo; 검색 결과{" "}
          <span className="font-bold text-gray-900">{results.length}</span>건
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
