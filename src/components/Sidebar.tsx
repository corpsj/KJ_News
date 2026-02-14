import { getMostViewedArticles } from "@/lib/utils";
import ArticleCardHorizontal from "./ArticleCardHorizontal";

export default function Sidebar() {
  const mostViewed = getMostViewedArticles(5);

  return (
    <aside className="space-y-8">
      <div className="bg-white rounded-lg border border-gray-100 p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b-2 border-gray-900">
          많이 본 뉴스
        </h3>
        <div>
          {mostViewed.map((article, i) => (
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
