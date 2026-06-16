"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAdmin } from "@/contexts/AdminContext";
import { useToast } from "@/contexts/ToastContext";
import { ARTICLE_STATUS_LABELS, type ArticleStatus, type Article } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import ArticlePreview from "@/components/admin/ArticlePreview";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

const PER_PAGE = 20;

export default function ArticlesPage() {
  const { categories, updateArticleStatus, fetchArticlesPage, fetchArticleById } = useAdmin();
  const { toast } = useToast();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState(""); // debounced
  const [catFilter, setCatFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "single" | "bulk"; id?: string; title?: string } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const categoryId = catFilter ? categories.find((c) => c.slug === catFilter)?.id : undefined;

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset to page 1 whenever a filter changes.
  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [search, catFilter, statusFilter]);

  const reload = useCallback(async () => {
    setLoading(true);
    const res = await fetchArticlesPage({ page, perPage: PER_PAGE, search, status: statusFilter, categoryId });
    setRows(res.articles);
    setTotal(res.total);
    setLoading(false);
  }, [page, search, statusFilter, categoryId, fetchArticlesPage]);

  useEffect(() => { reload(); }, [reload]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((a) => a.id)));
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "bulk") {
        await Promise.all(Array.from(selected).map((id) => updateArticleStatus(id, "archived")));
        toast(`${selected.size}개 기사를 휴지통으로 이동했습니다.`, "success");
        setSelected(new Set());
      } else if (deleteTarget.type === "single" && deleteTarget.id) {
        await updateArticleStatus(deleteTarget.id, "archived");
        toast("기사를 휴지통으로 이동했습니다.", "success");
      }
      await reload();
    } catch {
      toast("처리 중 오류가 발생했습니다.", "error");
    } finally {
      setDeleteTarget(null);
    }
  }

  async function handleApprove(id: string) {
    try {
      await updateArticleStatus(id, "published");
      toast("기사가 승인·발행되었습니다.", "success");
      await reload();
    } catch { toast("승인 중 오류가 발생했습니다.", "error"); }
  }

  async function confirmReject() {
    if (!rejectTarget) return;
    try {
      await updateArticleStatus(rejectTarget.id, "rejected", rejectReason.trim());
      toast("기사가 반려되었습니다.", "success");
      await reload();
    } catch { toast("반려 중 오류가 발생했습니다.", "error"); }
    finally { setRejectTarget(null); setRejectReason(""); }
  }

  async function openPreview(id: string) {
    const full = await fetchArticleById(id);
    if (full) setPreviewArticle(full);
    else toast("미리보기를 불러오지 못했습니다.", "error");
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">기사 관리</h1>
        <Link href="/admin/articles/new" className="admin-btn admin-btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          새 기사 작성
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input className="admin-input flex-1" placeholder="기사 제목 검색..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        <select className="admin-input sm:w-44 flex-shrink-0" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          <option value="">전체 카테고리</option>
          {categories.map((c) => (<option key={c.id} value={c.slug}>{c.name}</option>))}
        </select>
        <select className="admin-input sm:w-40 flex-shrink-0" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">전체 상태</option>
          {(Object.keys(ARTICLE_STATUS_LABELS) as ArticleStatus[]).map((s) => (<option key={s} value={s}>{ARTICLE_STATUS_LABELS[s]}</option>))}
        </select>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 py-2 px-4 bg-gray-50 border border-gray-200 rounded-lg">
          <span className="text-[13px] text-gray-700 font-medium">{selected.size}개 선택</span>
          <button type="button" className="admin-btn admin-btn-danger text-[12px] py-1 px-3" onClick={() => setDeleteTarget({ type: "bulk" })}>선택 삭제</button>
          <button type="button" className="text-[12px] text-gray-500 hover:text-gray-700" onClick={() => setSelected(new Set())}>선택 해제</button>
        </div>
      )}

      <div className="admin-card overflow-hidden relative">
        {loading && <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center"><div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" aria-label="불러오는 중" /></div>}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="w-10 py-3 px-3 text-left"><input type="checkbox" checked={rows.length > 0 && selected.size === rows.length} onChange={toggleAll} className="accent-gray-900" /></th>
                <th className="py-3 px-3 text-left font-semibold text-gray-600">제목</th>
                <th className="py-3 px-3 text-left font-semibold text-gray-600 w-24">카테고리</th>
                <th className="py-3 px-3 text-left font-semibold text-gray-600 w-20">상태</th>
                <th className="py-3 px-3 text-left font-semibold text-gray-600 w-20">작성자</th>
                <th className="py-3 px-3 text-left font-semibold text-gray-600 w-36">등록일</th>
                <th className="py-3 px-3 text-right font-semibold text-gray-600 w-20">조회수</th>
                <th className="py-3 px-3 text-right font-semibold text-gray-600 w-28">액션</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-3"><input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleSelect(a.id)} className="accent-gray-900" /></td>
                  <td className="py-3 px-3">
                    <Link href={`/admin/articles/${a.id}/edit`} className="font-medium text-gray-900 hover:underline">{a.title}</Link>
                    {a.status === "rejected" && a.rejectionReason && (<p className="text-[11px] text-red-500 mt-1">반려 사유: {a.rejectionReason}</p>)}
                  </td>
                  <td className="py-3 px-3"><span className="admin-badge">{a.category.name}</span></td>
                  <td className="py-3 px-3"><span className={`admin-badge-${a.status}`}>{ARTICLE_STATUS_LABELS[a.status]}</span></td>
                  <td className="py-3 px-3 text-gray-500">{a.author.name}</td>
                  <td className="py-3 px-3 text-gray-500">{formatDate(a.publishedAt)}</td>
                  <td className="py-3 px-3 text-right text-gray-500">{a.viewCount.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {a.status === "pending_review" && (
                        <>
                          <button type="button" className="admin-btn admin-btn-primary text-[11px] py-1 px-2" onClick={() => handleApprove(a.id)}>승인</button>
                          <button type="button" className="admin-btn admin-btn-ghost text-[11px] py-1 px-2 text-red-600" onClick={() => { setRejectReason(""); setRejectTarget({ id: a.id, title: a.title }); }}>반려</button>
                        </>
                      )}
                      <button type="button" className="admin-btn admin-btn-ghost text-[11px] py-1 px-2" onClick={() => openPreview(a.id)}>미리보기</button>
                      <Link href={`/admin/articles/${a.id}/edit`} className="admin-btn admin-btn-ghost text-[11px] py-1 px-2">수정</Link>
                      <button type="button" className="admin-btn admin-btn-ghost text-[11px] py-1 px-2" onClick={() => setDeleteTarget({ type: "single", id: a.id, title: a.title })}>삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={8} className="py-16 text-center text-[13px] text-gray-500">{search || catFilter || statusFilter ? "검색 조건에 맞는 기사가 없습니다." : "기사가 없습니다."}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-gray-100">
          {rows.map((a) => (
            <div key={a.id} className="p-4">
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleSelect(a.id)} className="accent-gray-900 mt-1" />
                <div className="flex-1 min-w-0">
                  <Link href={`/admin/articles/${a.id}/edit`} className="text-[13px] font-medium text-gray-900 hover:underline block truncate">{a.title}</Link>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="admin-badge">{a.category.name}</span>
                    <span className={`admin-badge-${a.status}`}>{ARTICLE_STATUS_LABELS[a.status]}</span>
                    <span className="text-[11px] text-gray-500">{a.author.name}</span>
                    <span className="text-[11px] text-gray-500">{a.viewCount.toLocaleString()}회</span>
                  </div>
                  {a.status === "rejected" && a.rejectionReason && (<p className="text-[11px] text-red-500 mt-1.5">반려 사유: {a.rejectionReason}</p>)}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {a.status === "pending_review" && (
                      <>
                        <button type="button" className="admin-btn admin-btn-primary text-[11px] py-1 px-2" onClick={() => handleApprove(a.id)}>승인</button>
                        <button type="button" className="admin-btn admin-btn-ghost text-[11px] py-1 px-2 text-red-600" onClick={() => { setRejectReason(""); setRejectTarget({ id: a.id, title: a.title }); }}>반려</button>
                      </>
                    )}
                    <Link href={`/admin/articles/${a.id}/edit`} className="admin-btn admin-btn-ghost text-[11px] py-1 px-2">수정</Link>
                    <button type="button" className="admin-btn admin-btn-ghost text-[11px] py-1 px-2" onClick={() => setDeleteTarget({ type: "single", id: a.id, title: a.title })}>삭제</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {!loading && rows.length === 0 && (<div className="py-16 text-center text-[13px] text-gray-500">{search || catFilter || statusFilter ? "검색 조건에 맞는 기사가 없습니다." : "기사가 없습니다."}</div>)}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[12px] text-gray-500">총 {total.toLocaleString()}개 · {page}/{totalPages} 페이지</p>
        <div className="flex items-center gap-1.5">
          <button type="button" className="admin-btn admin-btn-ghost text-[12px] py-1 px-3 disabled:opacity-40" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>이전</button>
          <button type="button" className="admin-btn admin-btn-ghost text-[12px] py-1 px-3 disabled:opacity-40" disabled={page >= totalPages || loading} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>다음</button>
        </div>
      </div>

      {previewArticle && <ArticlePreview article={previewArticle} onClose={() => setPreviewArticle(null)} />}

      {deleteTarget && (
        <ConfirmDialog
          title={deleteTarget.type === "bulk" ? "기사 일괄 휴지통 이동" : "기사 휴지통 이동"}
          message={deleteTarget.type === "bulk" ? `선택한 ${selected.size}개의 기사를 휴지통으로 이동하시겠습니까? 휴지통에서 복원하거나 영구 삭제할 수 있습니다.` : `"${deleteTarget.title}" 기사를 휴지통으로 이동하시겠습니까? 휴지통에서 복원하거나 영구 삭제할 수 있습니다.`}
          confirmLabel="휴지통으로" cancelLabel="취소" onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)}
        />
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="기사 반려" onClick={() => { setRejectTarget(null); setRejectReason(""); }}>
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-bold text-gray-900 mb-1">기사 반려</h2>
            <p className="text-[13px] text-gray-500 mb-3 truncate">&quot;{rejectTarget.title}&quot;</p>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">반려 사유 (작성자에게 전달)</label>
            <textarea className="admin-input min-h-[90px] w-full" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="반려 사유를 입력하세요" autoFocus />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button type="button" className="admin-btn admin-btn-ghost text-[13px] px-4 py-2" onClick={() => { setRejectTarget(null); setRejectReason(""); }}>취소</button>
              <button type="button" className="admin-btn admin-btn-danger text-[13px] px-4 py-2" onClick={confirmReject}>반려</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
