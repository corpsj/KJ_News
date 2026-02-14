"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAdmin } from "@/contexts/AdminContext";
import { useToast } from "@/contexts/ToastContext";
import { categories } from "@/lib/mock-data";
import { ARTICLE_STATUS_LABELS, type ArticleStatus, type Article } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import ArticlePreview from "@/components/admin/ArticlePreview";

export default function ArticlesPage() {
  const { articles, deleteArticle } = useAdmin();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const matchesSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
      const matchesCat = !catFilter || a.category.slug === catFilter;
      const matchesStatus = !statusFilter || a.status === statusFilter;
      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [articles, search, catFilter, statusFilter]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((a) => a.id)));
    }
  }

  function handleBulkDelete() {
    if (!confirm(`${selected.size}개의 기사를 삭제하시겠습니까?`)) return;
    selected.forEach((id) => deleteArticle(id));
    toast(`${selected.size}개 기사가 삭제되었습니다.`, "success");
    setSelected(new Set());
  }

  function handleDelete(id: string, title: string) {
    if (!confirm(`"${title}" 기사를 삭제하시겠습니까?`)) return;
    deleteArticle(id);
    toast("기사가 삭제되었습니다.", "success");
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">기사 관리</h1>
        <Link href="/admin/articles/new" className="admin-btn admin-btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          새 기사 작성
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          className="admin-input flex-1"
          placeholder="기사 제목 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="admin-input sm:w-40"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
        >
          <option value="">전체 카테고리</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <select
          className="admin-input sm:w-36"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">전체 상태</option>
          {(Object.keys(ARTICLE_STATUS_LABELS) as ArticleStatus[]).map((s) => (
            <option key={s} value={s}>{ARTICLE_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 py-2 px-4 bg-gray-50 border border-gray-200 rounded-lg">
          <span className="text-[13px] text-gray-700 font-medium">{selected.size}개 선택</span>
          <button className="admin-btn admin-btn-danger text-[12px] py-1 px-3" onClick={handleBulkDelete}>
            선택 삭제
          </button>
          <button className="text-[12px] text-gray-400 hover:text-gray-700" onClick={() => setSelected(new Set())}>
            선택 해제
          </button>
        </div>
      )}

      <div className="admin-card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="w-10 py-3 px-3 text-left">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onChange={toggleAll}
                    className="accent-gray-900"
                  />
                </th>
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
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-3">
                    <input
                      type="checkbox"
                      checked={selected.has(a.id)}
                      onChange={() => toggleSelect(a.id)}
                      className="accent-gray-900"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Link href={`/admin/articles/${a.id}/edit`} className="font-medium text-gray-900 hover:underline">
                      {a.title}
                    </Link>
                  </td>
                  <td className="py-3 px-3"><span className="admin-badge">{a.category.name}</span></td>
                  <td className="py-3 px-3"><span className={`admin-badge-${a.status}`}>{ARTICLE_STATUS_LABELS[a.status]}</span></td>
                  <td className="py-3 px-3 text-gray-500">{a.author.name}</td>
                  <td className="py-3 px-3 text-gray-400">{formatDate(a.publishedAt)}</td>
                  <td className="py-3 px-3 text-right text-gray-500">{a.viewCount.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="admin-btn admin-btn-ghost text-[11px] py-1 px-2" onClick={() => setPreviewArticle(a)}>미리보기</button>
                      <Link href={`/admin/articles/${a.id}/edit`} className="admin-btn admin-btn-ghost text-[11px] py-1 px-2">수정</Link>
                      <button className="admin-btn admin-btn-ghost text-[11px] py-1 px-2" onClick={() => handleDelete(a.id, a.title)}>삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 text-[13px]">
                    기사가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-gray-100">
          {filtered.map((a) => (
            <div key={a.id} className="p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.has(a.id)}
                  onChange={() => toggleSelect(a.id)}
                  className="accent-gray-900 mt-1"
                />
                <div className="flex-1 min-w-0">
                  <Link href={`/admin/articles/${a.id}/edit`} className="text-[13px] font-medium text-gray-900 hover:underline block truncate">
                    {a.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="admin-badge">{a.category.name}</span>
                    <span className={`admin-badge-${a.status}`}>{ARTICLE_STATUS_LABELS[a.status]}</span>
                    <span className="text-[11px] text-gray-400">{a.author.name}</span>
                    <span className="text-[11px] text-gray-400">{a.viewCount.toLocaleString()}회</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Link href={`/admin/articles/${a.id}/edit`} className="admin-btn admin-btn-ghost text-[11px] py-1 px-2">수정</Link>
                    <button className="admin-btn admin-btn-ghost text-[11px] py-1 px-2" onClick={() => handleDelete(a.id, a.title)}>삭제</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-gray-400 text-[13px]">기사가 없습니다.</div>
          )}
        </div>
      </div>

      <p className="text-[12px] text-gray-400 text-right">총 {filtered.length}개의 기사</p>

      {previewArticle && (
        <ArticlePreview
          article={previewArticle}
          onClose={() => setPreviewArticle(null)}
        />
      )}
    </div>
  );
}
