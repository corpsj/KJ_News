"use client";

import { useState, useMemo } from "react";
import type { NfArticle } from "@/lib/types";
import { useAdmin } from "@/contexts/AdminContext";
import { useToast } from "@/contexts/ToastContext";
import { nfArticles, NF_REGIONS, NF_CATEGORIES, NF_CATEGORY_MAP } from "@/lib/nf-mock-data";
import { formatDate } from "@/lib/utils";
import NfArticlePreview from "./NfArticlePreview";

export default function NfArticleExplorer() {
  const { importArticle, addArticle } = useAdmin();
  const { toast } = useToast();

  const [regionFilter, setRegionFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [keyword, setKeyword] = useState("");
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set());
  const [previewArticle, setPreviewArticle] = useState<NfArticle | null>(null);

  const filtered = useMemo(() => {
    return nfArticles.filter((a) => {
      const matchesKeyword = !keyword || a.title.toLowerCase().includes(keyword.toLowerCase()) || (a.summary || "").toLowerCase().includes(keyword.toLowerCase());
      const matchesCategory = !categoryFilter || a.category === categoryFilter;
      return matchesKeyword && matchesCategory;
    });
  }, [keyword, categoryFilter]);

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
      authorId: "a1",
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
      <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setRegionFilter("")}
          className={`flex-shrink-0 min-h-[44px] md:min-h-[36px] rounded-full px-4 text-[13px] font-medium transition-colors ${
            regionFilter === "" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          전체
        </button>
        {NF_REGIONS.map((r) => (
          <button
            key={r}
            onClick={() => setRegionFilter(regionFilter === r ? "" : r)}
            className={`flex-shrink-0 min-h-[44px] md:min-h-[36px] rounded-full px-4 text-[13px] font-medium transition-colors ${
              regionFilter === r ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

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
        <select
          className="admin-input sm:w-40"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">전체 카테고리</option>
          {NF_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {filtered.map((article) => {
          const processed = isProcessed(article.id);
          const wasPublished = publishedIds.has(article.id);
          return (
            <div
              key={article.id}
              onClick={() => setPreviewArticle(article)}
              className={`admin-card px-4 py-3 cursor-pointer transition-colors hover:border-gray-300 ${processed ? "opacity-60" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-medium text-gray-900 truncate">{article.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {article.category && <span className="admin-badge">{article.category}</span>}
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
                        onClick={(e) => handleImport(e, article)}
                        className="admin-btn admin-btn-ghost text-[11px] py-1 px-2.5"
                      >
                        가져오기
                      </button>
                      <button
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

        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-[13px]">검색 결과가 없습니다.</div>
        )}
      </div>

      <p className="text-[12px] text-gray-400 text-right">총 {filtered.length}건</p>

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
