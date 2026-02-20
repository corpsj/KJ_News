import type { Article } from "@/lib/types";
import ArticleCardHorizontal from "./ArticleCardHorizontal";

export default function Sidebar({ articles }: { articles: Article[] }) {
  return (
    <aside>
      <div className="border border-gray-200 bg-white">
        <h3 className="text-[15px] font-bold text-gray-900 px-4 py-3 border-b-2 border-gray-900 bg-gray-50">
          많이 본 기사
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
