"use client";

import { useState, useEffect, useMemo } from "react";
import type { NfArticle } from "@/lib/types";
import { useAdmin } from "@/contexts/AdminContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { NF_CATEGORIES, NF_CATEGORY_MAP } from "@/lib/nf-constants";
import { formatDate } from "@/lib/utils";
import NfArticlePreview from "./NfArticlePreview";

export default function NfArticleExplorer() {
  const { importArticle, addArticle, authors } = useAdmin();
  const { user } = useAuth();
  const { toast } = useToast();

  const [articles, setArticles] = useState<NfArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [keyword, setKeyword] = useState("");
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set());
  const [previewArticle, setPreviewArticle] = useState<NfArticle | null>(null);

  useEffect(() => {
    fetch("/api/nf/articles")
      .then((r) => r.json())
      .then((data) => setArticles(data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const matchesKeyword = !keyword || a.title.toLowerCase().includes(keyword.toLowerCase()) || (a.summary || "").toLowerCase().includes(keyword.toLowerCase());
      const matchesCategory = !categoryFilter || a.category === categoryFilter;
      return matchesKeyword && matchesCategory;
    });
  }, [articles, keyword, categoryFilter]);

  function handleImport(e: React.MouseEvent | null, article: NfArticle) {
    if (e) e.stopPropagation();
    const categorySlug = NF_CATEGORY_MAP[article.category || ""] || "society";
    importArticle({
      title: article.title,
      content: article.content || article.summary || "",
      excerpt: article.summary || "",
      categorySlug,
      source: article.source,
      sourceUrl: article.source_url,
    });
    setImportedIds((prev) => new Set([...prev, article.id]));
    toast("기사를 가져왔습니다. (검토중)", "success");
  }

  function handlePublish(e: React.MouseEvent | null, article: NfArticle) {
    if (e) e.stopPropagation();
    const categorySlug = NF_CATEGORY_MAP[article.category || ""] || "society";
    addArticle({
      title: article.title,
      subtitle: "",
      content: article.content || article.summary || "",
      excerpt: article.summary || "",
      categorySlug,
      authorId: user?.id ?? authors[0]?.id ?? "",
      thumbnailUrl: article.images?.[0] || "",
      tags: article.category || "",
      status: "published",
    });
    setPublishedIds((prev) => new Set([...prev, article.id]));
    setImportedIds((prev) => new Set([...prev, article.id]));
    toast("기사가 바로 발행되었습니다.", "success");
  }

  const isProcessed = (id: string) => importedIds.has(id) || publishedIds.has(id);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            className="admin-input pl-9"
            placeholder="기사 검색..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setCategoryFilter("")}
            className={`nf-filter-chip flex-shrink-0 ${categoryFilter === "" ? "active" : ""}`}
          >
            전체
          </button>
          {NF_CATEGORIES.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setCategoryFilter(categoryFilter === c ? "" : c)}
              className={`nf-filter-chip flex-shrink-0 ${categoryFilter === c ? "active" : ""}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="nf-skeleton-card">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="nf-skeleton h-5 w-3/4 mb-3" />
                  <div className="nf-skeleton h-3 w-1/2 mb-2" />
                  <div className="nf-skeleton h-3 w-1/3" />
                </div>
                <div className="nf-skeleton h-8 w-20 flex-shrink-0" />
              </div>
            </div>
          ))}

        {!loading &&
          filtered.map((article) => {
            const processed = isProcessed(article.id);
            const wasPublished = publishedIds.has(article.id);
            return (
              <div
                key={article.id}
                onClick={() => setPreviewArticle(article)}
                className={`nf-article-card ${processed ? "processed" : ""}`}
              >
                <div className="flex items-start gap-3">
                  {article.images?.[0] && (
                    <img
                      src={article.images[0]}
                      alt={article.title}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0 hidden sm:block"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-medium text-gray-900 leading-snug line-clamp-2">{article.title}</h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {article.category && <span className="admin-badge">{article.category}</span>}
                      {article.source && <span className="nf-source-badge">{article.source}</span>}
                      {article.processed_at && <span className="nf-ai-badge-outline">AI 수집</span>}
                      {article.published_at && (
                        <span className="text-[11px] text-gray-400">{formatDate(article.published_at)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {processed ? (
                      <span className="text-[11px] text-gray-400 px-2">
                        {wasPublished ? "발행됨" : "가져옴"}
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handleImport(e, article)}
                          className="admin-btn admin-btn-ghost text-[11px] py-1 px-2.5"
                        >
                          가져오기
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handlePublish(e, article)}
                          className="admin-btn admin-btn-primary text-[11px] py-1 px-2.5"
                        >
                          바로 발행
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

        {!loading && filtered.length === 0 && (
          <div className="nf-empty-state">
            <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <p className="text-[14px] text-gray-400">검색 결과가 없습니다</p>
            <p className="text-[12px] text-gray-300 mt-1">다른 키워드로 검색해 보세요</p>
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-gray-400">
            AI가 자동 수집한 <span className="font-medium text-gray-500">{filtered.length}</span>건의 기사
          </p>
          <div className="flex items-center gap-1.5">
            <span className="nf-live-dot" />
            <span className="text-[11px] text-gray-400">실시간 수집중</span>
          </div>
        </div>
      )}

      {previewArticle && (
        <NfArticlePreview
          article={previewArticle}
          isImported={isProcessed(previewArticle.id)}
          isPublished={publishedIds.has(previewArticle.id)}
          onImport={() => handleImport(null, previewArticle)}
          onPublish={() => handlePublish(null, previewArticle)}
          onClose={() => setPreviewArticle(null)}
        />
      )}
    </div>
  );
}
