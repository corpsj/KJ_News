"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { NfArticle, NfRegion, NfCategory } from "@/lib/types";
import { useAdmin } from "@/contexts/AdminContext";
import { useToast } from "@/contexts/ToastContext";
import { NF_TO_KJ_CATEGORY, NF_CATEGORY_LABELS, DEFAULT_NF_CATEGORY_SLUG, plainTextToHtml } from "@/lib/nf-constants";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 50;

export default function NfArticleExplorer() {
  const { importArticle, addArticle, deleteArticle, authors } = useAdmin();
  const { toast } = useToast();

  const [articles, setArticles] = useState<NfArticle[]>([]);
  const [regions, setRegions] = useState<NfRegion[]>([]);
  const [categories, setCategories] = useState<NfCategory[]>([]);
  const [importedMap, setImportedMap] = useState<Map<string, { importType: string; localId: number }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  const [regionFilter, setRegionFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [keyword, setKeyword] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const selectedArticle = articles.find(a => a.id === selectedId) ?? null;

  useEffect(() => {
    setSelectedIds(new Set());
    setSelectedId(null);
    setShowMobileDetail(false);
  }, [regionFilter, categoryFilter, keyword, dateFrom, dateTo, page]);

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
          const map = new Map<string, { importType: string; localId: number }>();
          for (const imp of impData.imports || []) {
            map.set(imp.nf_article_id, { importType: imp.import_type, localId: imp.local_article_id });
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

  const groupedArticles = useMemo(() => {
    const groups: { date: string; label: string; articles: NfArticle[] }[] = [];
    const map = new Map<string, NfArticle[]>();
    
    for (const article of articles) {
      const dateKey = article.published_at?.slice(0, 10) || "unknown";
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(article);
    }
    
    for (const [dateKey, arts] of map) {
      const d = new Date(dateKey + "T00:00:00");
      const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
      const label = dateKey === "unknown" 
        ? "날짜 없음" 
        : `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${weekday})`;
      groups.push({ date: dateKey, label, articles: arts });
    }
    
    return groups;
  }, [articles]);

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
      setImportedMap((prev) => new Map(prev).set(article.id, { importType: "imported", localId: Number(result.id) }));
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
      setImportedMap((prev) => new Map(prev).set(article.id, { importType: "published", localId: Number(result.id) }));
      toast("기사가 바로 발행되었습니다.", "success");
    } else {
      toast("기사 발행에 실패했습니다.", "error");
    }
  }

  function handleToggleSelect(e: React.MouseEvent, articleId: string) {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(articleId)) next.delete(articleId);
      else next.add(articleId);
      return next;
    });
  }

  function handleSelectAllPage() {
    const allIds = articles.map(a => a.id);
    const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        for (const id of allIds) next.delete(id);
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        for (const id of allIds) next.add(id);
        return next;
      });
    }
  }


  function handleSelectDateGroup(groupArticles: NfArticle[]) {
    const groupIds = groupArticles.map(a => a.id);
    if (groupIds.length === 0) return;
    const allSelected = groupIds.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      for (const id of groupIds) {
        if (allSelected) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }

  async function handleBatchImport() {
    const ids = [...selectedIds].filter(id => !importedMap.has(id));
    if (ids.length === 0) return;
    
    setBatchProcessing(true);
    setBatchProgress({ current: 0, total: ids.length });
    let successCount = 0;
    
    for (const id of ids) {
      const article = articles.find(a => a.id === id);
      if (!article) continue;
      await handleImport(null, article);
      successCount++;
      setBatchProgress(prev => ({ ...prev, current: prev.current + 1 }));
    }
    
    setBatchProcessing(false);
    setSelectedIds(new Set());
    toast(`${successCount}건의 기사를 가져왔습니다.`, "success");
  }

  async function handleBatchPublish() {
    const ids = [...selectedIds].filter(id => !importedMap.has(id));
    if (ids.length === 0) return;
    
    setBatchProcessing(true);
    setBatchProgress({ current: 0, total: ids.length });
    let successCount = 0;
    
    for (const id of ids) {
      const article = articles.find(a => a.id === id);
      if (!article) continue;
      await handlePublish(null, article);
      successCount++;
      setBatchProgress(prev => ({ ...prev, current: prev.current + 1 }));
    }
    
    setBatchProcessing(false);
    setSelectedIds(new Set());
    toast(`${successCount}건의 기사를 바로 발행했습니다.`, "success");
  }


  async function handleBatchDelete() {
    const ids = [...selectedIds].filter(id => importedMap.has(id));
    if (ids.length === 0) {
      toast("삭제할 발행/가져온 기사가 없습니다.", "error");
      return;
    }

    setBatchProcessing(true);
    setBatchProgress({ current: 0, total: ids.length });

    try {
      const res = await fetch("/api/nf/imports", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nf_article_ids: ids }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "삭제 실패");
      }

      // Remove from local AdminContext state
      for (const id of ids) {
        const info = importedMap.get(id);
        if (info?.localId) {
          await deleteArticle(String(info.localId));
        }
      }

      // Clear from importedMap
      setImportedMap(prev => {
        const next = new Map(prev);
        for (const id of ids) next.delete(id);
        return next;
      });

      setSelectedIds(new Set());
      toast(`${ids.length}건의 기사를 삭제했습니다.`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다.", "error");
    } finally {
      setBatchProcessing(false);
    }
  }

  function renderPageButtons() {
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const buttons: React.ReactNode[] = [];
    const current = page;

    const addBtn = (p: number) => {
      buttons.push(
        <button
          key={p}
          type="button"
          className={`nf-page-btn ${p === current ? "active" : ""}`}
          onClick={() => setPage(p)}
        >
          {p + 1}
        </button>
      );
    };
    const addEllipsis = (key: string) => {
      buttons.push(<span key={key} className="text-[11px] text-gray-400 px-1">&hellip;</span>);
    };

    buttons.push(
      <button
        key="prev"
        type="button"
        className="nf-page-btn"
        onClick={() => setPage(p => Math.max(0, p - 1))}
        disabled={page === 0}
      >
        &lsaquo;
      </button>
    );

    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) addBtn(i);
    } else {
      addBtn(0);
      if (current > 2) addEllipsis("el");
      for (let i = Math.max(1, current - 1); i <= Math.min(totalPages - 2, current + 1); i++) {
        addBtn(i);
      }
      if (current < totalPages - 3) addEllipsis("er");
      addBtn(totalPages - 1);
    }

    buttons.push(
      <button
        key="next"
        type="button"
        className="nf-page-btn"
        onClick={() => setPage(p => Math.min(Math.ceil(total / PAGE_SIZE) - 1, p + 1))}
        disabled={page >= totalPages - 1}
      >
        &rsaquo;
      </button>
    );

    return buttons;
  }

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

      {selectedIds.size > 0 && (
        <div className="nf-batch-toolbar">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-gray-900">
              {selectedIds.size}건 선택됨
            </span>
            <button onClick={() => setSelectedIds(new Set())}
              className="text-[12px] text-gray-400 hover:text-gray-600">
              선택 해제
            </button>
          </div>
          <div className="flex items-center gap-2">
            {batchProcessing ? (
              <div className="flex items-center gap-2 text-[12px] text-gray-500">
                <span className="nf-spinner" />
                <span>{batchProgress.current}/{batchProgress.total} 처리 중...</span>
              </div>
            ) : (
              <>
                <button onClick={handleBatchImport}
                  className="admin-btn admin-btn-ghost text-[12px] py-1.5 px-3">
                  일괄 가져오기
                </button>
                <button onClick={handleBatchPublish}
                  className="admin-btn admin-btn-primary text-[12px] py-1.5 px-3">
                  일괄 발행
                </button>
                <button onClick={() => setShowDeleteConfirm(true)}
                  className="admin-btn text-[12px] py-1.5 px-3 text-red-500 border border-red-200 hover:bg-red-50">
                  선택 삭제
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="nf-split-container">

        <div className="nf-list-panel">
          <div className="nf-list-header">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={articles.length > 0 && articles.every(a => selectedIds.has(a.id))}
                onChange={handleSelectAllPage}
                className="nf-checkbox"
                style={{ margin: 0 }}
              />
              <span className="text-[11px] text-gray-500">이 페이지 전체 선택</span>
            </label>
            <span className="text-[11px] text-gray-400">{total}건</span>
          </div>

          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-3 border-b border-gray-100">
                <div className="nf-skeleton h-4 w-3/4 mb-2" />
                <div className="nf-skeleton h-3 w-1/2" />
              </div>
            ))}

          {!loading && error && (
            <div className="nf-empty-state">
              <svg className="w-10 h-10 text-gray-300 mb-2" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="text-[13px] text-gray-400">{error}</p>
              <button type="button" onClick={fetchArticlesData} className="admin-btn admin-btn-ghost text-[11px] mt-2">
                다시 시도
              </button>
            </div>
          )}

          {!loading && !error && articles.length === 0 && (
            <div className="nf-empty-state">
              <svg className="w-10 h-10 text-gray-300 mb-2" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <p className="text-[13px] text-gray-400">검색 결과가 없습니다</p>
              <p className="text-[11px] text-gray-300 mt-1">다른 조건으로 검색해 보세요</p>
            </div>
          )}

          {!loading && !error &&
            groupedArticles.map((group) => (
              <div key={group.date}>
                <div className="nf-date-header">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="nf-checkbox"
                      style={{ margin: 0 }}
                      checked={(() => {
                        const ids = group.articles.map(a => a.id);
                        return ids.length > 0 && ids.every(id => selectedIds.has(id));
                      })()}
                      onChange={() => handleSelectDateGroup(group.articles)}
                    />
                    <span>{group.label}</span>
                  </label>
                  <span className="nf-date-count">{group.articles.length}건</span>
                </div>
                {group.articles.map((article) => {
                  const importInfo = importedMap.get(article.id);
                  const processed = !!importInfo;
                  const isSelected = article.id === selectedId;
                  return (
                    <div key={article.id} className="nf-list-item-wrapper">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(article.id)}
                        onChange={() => {}}
                        onClick={(e) => handleToggleSelect(e, article.id)}
                        className="nf-checkbox"
                      />
                      <div
                        onClick={() => { setSelectedId(article.id); setShowMobileDetail(true); }}
                        className={`nf-list-item ${isSelected ? "selected" : ""} ${processed ? "processed" : ""}`}
                      >
                        <h4 className="text-[13px] font-medium text-gray-900 leading-snug line-clamp-2">
                          {article.title}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {article.category && (
                            <span className="admin-badge text-[10px]">{NF_CATEGORY_LABELS[article.category] || article.category}</span>
                          )}
                          {article.source && <span className="nf-source-badge text-[10px]">{article.source}</span>}
                          {article.published_at && (
                            <span className="text-[10px] text-gray-400">{formatDate(article.published_at)}</span>
                          )}
                          {processed && (
                            <span className="text-[10px] text-gray-400 ml-auto">
                              {importInfo?.importType === "published" ? "발행됨" : "가져옴"}
                            </span>
                          )}
                        </div>
                      </div>
                      {!importedMap.has(article.id) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePublish(e, article); }}
                          className="nf-quick-publish"
                          title="바로 발행"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

          {!loading && total > 0 && (
            <div className="nf-list-pagination">
              <span className="text-[11px] text-gray-400">
                {total}건 중 {page * PAGE_SIZE + 1}&ndash;{Math.min((page + 1) * PAGE_SIZE, total)}
              </span>
              <div className="flex items-center gap-1">
                {renderPageButtons()}
              </div>
            </div>
          )}
        </div>


        <div className={`nf-detail-panel ${showMobileDetail ? "mobile-open" : ""}`}>
          {!selectedArticle ? (
            <div className="nf-detail-empty">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <p>기사를 선택하세요</p>
            </div>
          ) : (
            <>

              <button
                type="button"
                className="nf-mobile-back"
                onClick={() => setShowMobileDetail(false)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                목록으로
              </button>

              <div className="nf-detail-topbar">
                <div className="nf-detail-topbar-info">
                  <h3 className="text-[14px] font-semibold text-gray-900 line-clamp-1">
                    {selectedArticle.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    {selectedArticle.source && <span>{selectedArticle.source}</span>}
                    <span>·</span>
                    {selectedArticle.published_at && <span>{formatDate(selectedArticle.published_at)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {importedMap.has(selectedArticle.id) ? (
                    <span className="text-[12px] text-gray-400">
                      {importedMap.get(selectedArticle.id)?.importType === "published" ? "✓ 발행됨" : "✓ 가져옴"}
                    </span>
                  ) : (
                    <>
                      <button onClick={(e) => handleImport(e, selectedArticle)}
                        className="admin-btn admin-btn-ghost text-[12px] py-1.5 px-3">
                        가져오기
                      </button>
                      <button onClick={(e) => handlePublish(e, selectedArticle)}
                        className="admin-btn admin-btn-primary text-[12px] py-1.5 px-3">
                        바로 발행
                      </button>
                    </>
                  )}
                </div>
              </div>


              {selectedArticle.images?.[0] && (
                <div className="relative">
                  <img
                    src={selectedArticle.images[0]}
                    alt={selectedArticle.title}
                    className="w-full aspect-[2/1] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 flex items-center gap-1.5">
                    <span className="nf-ai-badge">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                      뉴스팩토리
                    </span>
                    {selectedArticle.category && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-white/20 backdrop-blur-sm text-white">
                        {NF_CATEGORY_LABELS[selectedArticle.category] || selectedArticle.category}
                      </span>
                    )}
                  </div>
                </div>
              )}


              <div className="nf-detail-content">
                <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-2">
                  {!selectedArticle.images?.[0] && (
                    <>
                      <span className="nf-ai-badge">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                        뉴스팩토리
                      </span>
                      {selectedArticle.category && (
                        <span className="admin-badge">{NF_CATEGORY_LABELS[selectedArticle.category] || selectedArticle.category}</span>
                      )}
                    </>
                  )}
                  {selectedArticle.source && <span className="nf-source-badge">{selectedArticle.source}</span>}
                  {selectedArticle.published_at && <span>{formatDate(selectedArticle.published_at)}</span>}
                  {selectedArticle.processed_at && <span className="nf-ai-badge-outline">AI 수집</span>}
                </div>

                <h2 className="text-[20px] md:text-[22px] font-bold text-gray-900 leading-tight">
                  {selectedArticle.title}
                </h2>

                {selectedArticle.summary && (
                  <p className="text-[14px] text-gray-500 leading-relaxed mt-3 border-l-2 border-gray-200 pl-3">
                    {selectedArticle.summary}
                  </p>
                )}

                {selectedArticle.content && (
                  <div
                    className="mt-5 text-[14px] md:text-[15px] leading-[1.8] text-gray-700 [&_p]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1"
                    dangerouslySetInnerHTML={{ __html: plainTextToHtml(selectedArticle.content) }}
                  />
                )}

                {selectedArticle.source_url && (
                  <a
                    href={selectedArticle.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 mt-4 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    원문 보기
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      {showDeleteConfirm && (
        <ConfirmDialog
          title="기사 삭제"
          message={`선택한 기사 중 발행/가져온 ${[...selectedIds].filter(id => importedMap.has(id)).length}건을 삭제합니다. 로컬 기사와 가져오기 기록이 모두 삭제됩니다.`}
          confirmLabel="삭제"
          cancelLabel="취소"
          onConfirm={() => { setShowDeleteConfirm(false); handleBatchDelete(); }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
