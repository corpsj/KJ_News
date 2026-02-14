import type { Article } from "@/lib/types";
import ArticleCardHorizontal from "./ArticleCardHorizontal";

export default function Sidebar({ articles }: { articles: Article[] }) {

  return (
    <aside className="space-y-8">
      <div className="bg-white rounded-lg border border-gray-100 p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b-2 border-gray-900">
          많이 본 뉴스
        </h3>
        <div>
          {articles.map((article, i) => (
            <ArticleCardHorizontal
              key={article.id}
              article={article}
              rank={i + 1}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
