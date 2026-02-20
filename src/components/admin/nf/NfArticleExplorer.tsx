"use client";

import { useState, useEffect, useCallback } from "react";
import type { NfArticle, NfRegion, NfCategory } from "@/lib/types";
import { useAdmin } from "@/contexts/AdminContext";
import { useToast } from "@/contexts/ToastContext";
import { NF_TO_KJ_CATEGORY, NF_CATEGORY_LABELS, DEFAULT_NF_CATEGORY_SLUG, plainTextToHtml } from "@/lib/nf-constants";
import { formatDate } from "@/lib/utils";
import NfArticlePreview from "./NfArticlePreview";

const PAGE_SIZE = 20;

export default function NfArticleExplorer() {
  const { importArticle, addArticle, authors } = useAdmin();
  const { toast } = useToast();

  const [articles, setArticles] = useState<NfArticle[]>([]);
  const [regions, setRegions] = useState<NfRegion[]>([]);
  const [categories, setCategories] = useState<NfCategory[]>([]);
  const [importedMap, setImportedMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [previewArticle, setPreviewArticle] = useState<NfArticle | null>(null);

  const [regionFilter, setRegionFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [keyword, setKeyword] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);

  const fetchArticlesData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams();
      if (regionFilter) sp.set("region", regionFilter);
      if (categoryFilter) sp.set("category", categoryFilter);
      if (keyword) sp.set("keyword", keyword);
      if (dateFrom) sp.set("from", dateFrom);
      if (dateTo) sp.set("to", dateTo);
      sp.set("limit", String(PAGE_SIZE));
      sp.set("offset", String(page * PAGE_SIZE));

      const res = await fetch(`/api/nf/articles?${sp.toString()}`);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      const arts: NfArticle[] = Array.isArray(data.articles) ? data.articles : [];
      setArticles(arts);
      setTotal(data.total ?? 0);

      const ids = arts.map((a) => a.id).join(",");
      if (ids) {
        const impRes = await fetch(`/api/nf/imports?nf_ids=${ids}`);
        if (impRes.ok) {
          const impData = await impRes.json();
          const map = new Map<string, string>();
          for (const imp of impData.imports || []) {
            map.set(imp.nf_article_id, imp.import_type);
          }
          setImportedMap(map);
        }
      } else {
        setImportedMap(new Map());
      }
    } catch {
      setError("데이터를 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, [regionFilter, categoryFilter, keyword, dateFrom, dateTo, page]);

  useEffect(() => {
    Promise.all([
      fetch("/api/nf/regions").then((r) => r.ok ? r.json() : { regions: [] }),
      fetch("/api/nf/categories").then((r) => r.ok ? r.json() : { categories: [] }),
    ]).then(([rData, cData]) => {
      setRegions(rData.regions || []);
      setCategories(cData.categories || []);
    });
  }, []);

  useEffect(() => { fetchArticlesData(); }, [fetchArticlesData]);

  function doSearch() {
    setPage(0);
  }

  async function handleImport(e: React.MouseEvent | null, article: NfArticle) {
    if (e) e.stopPropagation();
    const categorySlug = NF_TO_KJ_CATEGORY[article.category] || DEFAULT_NF_CATEGORY_SLUG;
    const result = await importArticle({
      title: article.title,
      content: plainTextToHtml(article.content),
      excerpt: article.summary || "",
      categorySlug,
      source: article.source,
      sourceUrl: article.source_url,
    });
    if (result) {
      await fetch("/api/nf/imports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nf_article_id: article.id,
          local_article_id: Number(result.id),
          nf_title: article.title,
          import_type: "imported",
        }),
      });
      setImportedMap((prev) => new Map(prev).set(article.id, "imported"));
      toast("기사를 가져왔습니다. (검토중)", "success");
    } else {
      toast("기사 가져오기에 실패했습니다.", "error");
    }
  }

  async function handlePublish(e: React.MouseEvent | null, article: NfArticle) {
    if (e) e.stopPropagation();
    const categorySlug = NF_TO_KJ_CATEGORY[article.category] || DEFAULT_NF_CATEGORY_SLUG;
    const result = await addArticle({
      title: article.title,
      subtitle: "",
      content: plainTextToHtml(article.content),
      excerpt: article.summary || "",
      categorySlug,
      authorId: authors[0]?.id ?? "",
      thumbnailUrl: article.images?.[0] || "",
      tags: "",
      status: "published",
    });
    if (result) {
      await fetch("/api/nf/imports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nf_article_id: article.id,
          local_article_id: Number(result.id),
          nf_title: article.title,
          import_type: "published",
        }),
      });
      setImportedMap((prev) => new Map(prev).set(article.id, "published"));
      toast("기사가 바로 발행되었습니다.", "success");
    } else {
      toast("기사 발행에 실패했습니다.", "error");
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            className="admin-input sm:w-48"
            value={regionFilter}
            onChange={(e) => { setRegionFilter(e.target.value); setPage(0); }}
          >
            <option value="">전체 지역</option>
            {regions.map((r) => (
              <option key={r.code} value={r.code}>{r.name}</option>
            ))}
          </select>
          <div className="flex gap-2 overflow-x-auto flex-1 [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => { setCategoryFilter(""); setPage(0); }}
              className={`nf-filter-chip flex-shrink-0 ${categoryFilter === "" ? "active" : ""}`}
            >
              전체
            </button>
            {categories.map((c) => (
              <button
                type="button"
                key={c.code}
                onClick={() => { setCategoryFilter(categoryFilter === c.code ? "" : c.code); setPage(0); }}
                className={`nf-filter-chip flex-shrink-0 ${categoryFilter === c.code ? "active" : ""}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              className="admin-input pl-9"
              placeholder="키워드 검색..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") doSearch(); }}
            />
          </div>
          <input type="date" className="admin-input sm:w-44" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <input type="date" className="admin-input sm:w-44" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <button type="button" className="admin-btn admin-btn-primary" onClick={doSearch}>
            검색
          </button>
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

        {!loading && error && (
          <div className="nf-empty-state">
            <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-[14px] text-gray-400">{error}</p>
            <button type="button" onClick={fetchArticlesData} className="admin-btn admin-btn-ghost text-[12px] mt-3">
              다시 시도
            </button>
          </div>
        )}

        {!loading && !error &&
          articles.map((article) => {
            const importType = importedMap.get(article.id);
            const processed = !!importType;
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
                      {article.category && (
                        <span className="admin-badge">{NF_CATEGORY_LABELS[article.category] || article.category}</span>
                      )}
                      {article.source && <span className="nf-source-badge">{article.source}</span>}
                      {article.published_at && (
                        <span className="text-[11px] text-gray-400">{formatDate(article.published_at)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {processed ? (
                      <span className="text-[11px] text-gray-400 px-2">
                        {importType === "published" ? "발행됨" : "가져옴"}
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

        {!loading && !error && articles.length === 0 && (
          <div className="nf-empty-state">
            <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <p className="text-[14px] text-gray-400">검색 결과가 없습니다</p>
            <p className="text-[12px] text-gray-300 mt-1">다른 조건으로 검색해 보세요</p>
          </div>
        )}
      </div>

      {!loading && total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-gray-400">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)}건 / 전체 <span className="font-medium text-gray-500">{total}</span>건
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="admin-btn admin-btn-ghost text-xs px-3 py-1.5"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              이전
            </button>
            <span className="text-[12px] text-gray-500 px-2">{page + 1} / {totalPages}</span>
            <button
              type="button"
              className="admin-btn admin-btn-ghost text-xs px-3 py-1.5"
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * PAGE_SIZE >= total}
            >
              다음
            </button>
          </div>
        </div>
      )}

      {previewArticle && (
        <NfArticlePreview
          article={previewArticle}
          isImported={importedMap.has(previewArticle.id)}
          isPublished={importedMap.get(previewArticle.id) === "published"}
          onImport={() => handleImport(null, previewArticle)}
          onPublish={() => handlePublish(null, previewArticle)}
          onClose={() => setPreviewArticle(null)}
        />
      )}
    </div>
  );
}
