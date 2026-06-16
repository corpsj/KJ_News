"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { useToast } from "@/contexts/ToastContext";
import { formatDate } from "@/lib/utils";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import type { Article } from "@/lib/types";

const PER_PAGE = 20;

export default function TrashPage() {
  const { deleteArticle, updateArticleStatus, fetchArticlesPage } = useAdmin();
  const { toast } = useToast();
  const [rows, setRows] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [purgeTarget, setPurgeTarget] = useState<Article | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const reload = useCallback(async () => {
    setLoading(true);
    const res = await fetchArticlesPage({ page, perPage: PER_PAGE, status: "archived" });
    setRows(res.articles);
    setTotal(res.total);
    setLoading(false);
  }, [page, fetchArticlesPage]);

  useEffect(() => { reload(); }, [reload]);

  async function restore(id: string) {
    try {
      await updateArticleStatus(id, "draft");
      toast("기사를 복원했습니다(임시저장 상태).", "success");
      await reload();
    } catch { toast("복원 중 오류가 발생했습니다.", "error"); }
  }

  async function confirmPurge() {
    if (!purgeTarget) return;
    try {
      await deleteArticle(purgeTarget.id);
      toast("기사를 영구 삭제했습니다.", "success");
      await reload();
    } catch { toast("삭제 중 오류가 발생했습니다.", "error"); }
    finally { setPurgeTarget(null); }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">휴지통</h1>
        <span className="text-[12px] text-gray-500">{total.toLocaleString()}개</span>
      </div>
      <p className="text-[12px] text-gray-500">휴지통의 기사는 공개되지 않습니다. 복원하면 임시저장 상태로 돌아가며, 영구 삭제는 되돌릴 수 없습니다.</p>

      <div className="admin-card overflow-hidden relative">
        {loading && <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center"><div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" aria-label="불러오는 중" /></div>}
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="py-3 px-4 text-left font-semibold text-gray-600">제목</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-600 w-24">카테고리</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-600 w-36">등록일</th>
              <th className="py-3 px-4 text-right font-semibold text-gray-600 w-40">액션</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">{a.title}</td>
                <td className="py-3 px-4"><span className="admin-badge">{a.category.name}</span></td>
                <td className="py-3 px-4 text-gray-500">{formatDate(a.publishedAt)}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button type="button" className="admin-btn admin-btn-ghost text-[11px] py-1 px-2" onClick={() => restore(a.id)}>복원</button>
                    <button type="button" className="admin-btn admin-btn-danger text-[11px] py-1 px-2" onClick={() => setPurgeTarget(a)}>영구 삭제</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (<tr><td colSpan={4} className="py-16 text-center text-[13px] text-gray-500">휴지통이 비어 있습니다.</td></tr>)}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-1.5">
        <button type="button" className="admin-btn admin-btn-ghost text-[12px] py-1 px-3 disabled:opacity-40" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>이전</button>
        <span className="text-[12px] text-gray-500 px-1">{page}/{totalPages}</span>
        <button type="button" className="admin-btn admin-btn-ghost text-[12px] py-1 px-3 disabled:opacity-40" disabled={page >= totalPages || loading} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>다음</button>
      </div>

      {purgeTarget && (
        <ConfirmDialog
          title="영구 삭제"
          message={`"${purgeTarget.title}" 기사를 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
          confirmLabel="영구 삭제" cancelLabel="취소" onConfirm={confirmPurge} onCancel={() => setPurgeTarget(null)}
        />
      )}
    </div>
  );
}
