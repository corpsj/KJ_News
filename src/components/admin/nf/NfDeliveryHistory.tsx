"use client";

import { useState, useEffect, useCallback } from "react";
import type { NfImportRecord } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;

const TYPE_MAP: Record<string, { label: string; className: string }> = {
  imported: { label: "가져옴", className: "admin-badge" },
  published: { label: "발행됨", className: "admin-badge-published" },
};

export default function NfImportHistory() {
  const [records, setRecords] = useState<NfImportRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams();
      sp.set("limit", String(PAGE_SIZE));
      sp.set("offset", String(page * PAGE_SIZE));
      const res = await fetch(`/api/nf/imports?${sp.toString()}`);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setRecords(Array.isArray(data.imports) ? data.imports : []);
      setTotal(data.total ?? 0);
    } catch {
      setError("가져오기 이력을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-semibold text-gray-900">가져오기 이력</p>
        {!loading && total > 0 && (
          <p className="text-[12px] text-gray-400">전체 {total}건</p>
        )}
      </div>

      {loading && (
        <>
          <div className="admin-card overflow-hidden hidden md:block">
            <div className="p-4 space-y-3">
              {["a", "b", "c", "d"].map((k) => (
                <div key={k} className="flex items-center gap-4">
                  <div className="nf-skeleton h-4 w-48 flex-1" />
                  <div className="nf-skeleton h-4 w-24" />
                  <div className="nf-skeleton h-5 w-14 rounded" />
                </div>
              ))}
            </div>
          </div>
          <div className="md:hidden space-y-3">
            {["a", "b", "c"].map((k) => (
              <div key={k} className="nf-skeleton-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="nf-skeleton h-4 w-48" />
                  <div className="nf-skeleton h-5 w-12 rounded" />
                </div>
                <div className="nf-skeleton h-3 w-32" />
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && !error && records.length > 0 && (
        <>
          <div className="admin-card overflow-hidden hidden md:block">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="py-3 px-4 text-left text-[12px] font-semibold text-gray-500 uppercase tracking-wider">기사 제목</th>
                  <th className="py-3 px-4 text-left text-[12px] font-semibold text-gray-500 uppercase tracking-wider">가져온 시간</th>
                  <th className="py-3 px-4 text-left text-[12px] font-semibold text-gray-500 uppercase tracking-wider">상태</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const typeInfo = TYPE_MAP[r.import_type] || TYPE_MAP.imported;
                  return (
                    <tr key={r.id} className="border-b border-gray-100 nf-delivery-row">
                      <td className="py-3 px-4 text-gray-700 max-w-xs truncate">
                        <a
                          href={`/admin/articles/${r.local_article_id}`}
                          className="hover:text-gray-900 hover:underline transition-colors"
                        >
                          {r.nf_title}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-gray-400 whitespace-nowrap">{formatDate(r.imported_at)}</td>
                      <td className="py-3 px-4">
                        <span className={typeInfo.className}>{typeInfo.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {records.map((r) => {
              const typeInfo = TYPE_MAP[r.import_type] || TYPE_MAP.imported;
              return (
                <div key={r.id} className="nf-subscription-card">
                  <div className="flex items-center justify-between mb-1.5">
                    <a
                      href={`/admin/articles/${r.local_article_id}`}
                      className="text-[13px] font-medium text-gray-900 truncate max-w-[75%] hover:underline"
                    >
                      {r.nf_title}
                    </a>
                    <span className={typeInfo.className}>{typeInfo.label}</span>
                  </div>
                  <span className="text-[12px] text-gray-400">{formatDate(r.imported_at)}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!loading && error && (
        <div className="nf-empty-state">
          <svg className="w-12 h-12 text-gray-300 mb-3" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-[14px] text-gray-400">{error}</p>
          <button type="button" onClick={fetchRecords} className="admin-btn admin-btn-ghost text-[12px] mt-3">
            다시 시도
          </button>
        </div>
      )}

      {!loading && !error && records.length === 0 && (
        <div className="nf-empty-state">
          <svg className="w-12 h-12 text-gray-300 mb-3" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <p className="text-[14px] text-gray-400">아직 가져온 기사가 없습니다</p>
          <p className="text-[12px] text-gray-300 mt-1">기사 탐색에서 기사를 가져오면 이력이 표시됩니다</p>
        </div>
      )}

      {!loading && total > PAGE_SIZE && (
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
    </div>
  );
}
