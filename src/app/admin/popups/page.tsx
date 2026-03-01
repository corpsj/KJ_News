"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/contexts/ToastContext";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

interface Popup {
  id: number;
  title: string;
  content: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  position: string;
  width: number;
}

const emptyPopup: Omit<Popup, "id"> = {
  title: "",
  content: "",
  image_url: "",
  link_url: "",
  is_active: false,
  start_date: null,
  end_date: null,
  position: "center",
  width: 480,
};

function toLocalDatetime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16);
}

export default function PopupsPage() {
  const { toast } = useToast();
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Popup | null>(null);
  const [form, setForm] = useState(emptyPopup);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Popup | null>(null);

  const fetchPopups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/popups");
      if (res.ok) {
        const data = await res.json();
        setPopups(data.popups || []);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPopups(); }, [fetchPopups]);

  function openNew() {
    setEditing(null);
    setForm(emptyPopup);
  }

  function openEdit(popup: Popup) {
    setEditing(popup);
    setForm({
      title: popup.title,
      content: popup.content,
      image_url: popup.image_url,
      link_url: popup.link_url,
      is_active: popup.is_active,
      start_date: popup.start_date,
      end_date: popup.end_date,
      position: popup.position,
      width: popup.width,
    });
  }

  async function handleSave() {
    if (!form.title.trim()) { toast("제목을 입력하세요.", "error"); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/popups/${editing.id}` : "/api/admin/popups";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast(editing ? "팝업이 수정되었습니다." : "팝업이 생성되었습니다.", "success");
        setEditing(null);
        setForm(emptyPopup);
        fetchPopups();
      } else {
        const data = await res.json();
        toast(data.error || "저장 실패", "error");
      }
    } catch {
      toast("네트워크 오류", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/popups/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        toast("팝업이 삭제되었습니다.", "success");
        fetchPopups();
      } else {
        toast("삭제 실패", "error");
      }
    } catch {
      toast("네트워크 오류", "error");
    }
    setDeleteTarget(null);
  }

  async function toggleActive(popup: Popup) {
    try {
      await fetch(`/api/admin/popups/${popup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...popup, is_active: !popup.is_active }),
      });
      fetchPopups();
    } catch { /* ignore */ }
  }

  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">팝업 관리</h1>
          <p className="text-[13px] text-gray-500 mt-1">랜딩페이지에 표시되는 팝업을 관리합니다</p>
        </div>
        <button
          type="button"
          onClick={() => { openNew(); setShowForm(true); }}
          className="admin-btn admin-btn-primary text-[13px] px-4 py-2"
        >
          + 새 팝업
        </button>
      </div>

      {/* 팝업 폼 */}
      {showForm && (
        <div className="admin-card p-6">
          <h2 className="text-[15px] font-semibold text-gray-900 mb-4">
            {editing ? "팝업 수정" : "새 팝업 생성"}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">제목 *</label>
              <input className="admin-input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="팝업 제목" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">내용 (HTML 지원)</label>
              <textarea className="admin-input min-h-[100px]" value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} placeholder="팝업 본문 내용" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">이미지 URL</label>
                <input className="admin-input" value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">링크 URL</label>
                <input className="admin-input" value={form.link_url} onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))} placeholder="https://..." />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">위치</label>
                <select className="admin-input" value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}>
                  <option value="center">중앙</option>
                  <option value="top">상단</option>
                  <option value="bottom">하단</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">너비 (px)</label>
                <input className="admin-input" type="number" value={form.width} onChange={(e) => setForm((f) => ({ ...f, width: Number(e.target.value) }))} />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 rounded border-gray-300" />
                  <span className="text-[13px] font-medium text-gray-700">활성화</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">시작일시</label>
                <input className="admin-input" type="datetime-local" value={toLocalDatetime(form.start_date)} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value ? new Date(e.target.value).toISOString() : null }))} />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">종료일시</label>
                <input className="admin-input" type="datetime-local" value={toLocalDatetime(form.end_date)} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value ? new Date(e.target.value).toISOString() : null }))} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-6 pt-5 border-t border-gray-100">
            <button type="button" onClick={() => setShowForm(false)} className="admin-btn admin-btn-ghost text-[13px] px-4 py-2">취소</button>
            <button type="button" onClick={handleSave} disabled={saving} className="admin-btn admin-btn-primary text-[13px] px-4 py-2">
              {saving ? "저장 중..." : editing ? "수정" : "생성"}
            </button>
          </div>
        </div>
      )}

      {/* 팝업 목록 */}
      {loading ? (
        <div className="admin-card p-6">
          {[1, 2, 3].map((k) => <div key={k} className="nf-skeleton h-16 w-full rounded-lg mb-3" />)}
        </div>
      ) : popups.length === 0 ? (
        <div className="admin-card p-8 text-center">
          <p className="text-[13px] text-gray-400">등록된 팝업이 없습니다</p>
        </div>
      ) : (
        <div className="admin-card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-2.5 px-4 font-semibold text-gray-600">제목</th>
                <th className="text-center py-2.5 px-4 font-semibold text-gray-600 w-20">상태</th>
                <th className="text-center py-2.5 px-4 font-semibold text-gray-600 w-20">위치</th>
                <th className="text-right py-2.5 px-4 font-semibold text-gray-600 w-32">액션</th>
              </tr>
            </thead>
            <tbody>
              {popups.map((popup) => (
                <tr key={popup.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{popup.title}</div>
                    {popup.image_url && <span className="text-[11px] text-gray-400">이미지 포함</span>}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button type="button" onClick={() => toggleActive(popup)} className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${popup.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {popup.is_active ? "활성" : "비활성"}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-500">
                    {{ center: "중앙", top: "상단", bottom: "하단" }[popup.position] || popup.position}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" onClick={() => { openEdit(popup); setShowForm(true); }} className="admin-btn admin-btn-ghost text-[11px] py-1 px-2">수정</button>
                      <button type="button" onClick={() => setDeleteTarget(popup)} className="admin-btn admin-btn-ghost text-[11px] py-1 px-2 text-red-500 hover:text-red-700">삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="팝업 삭제"
          message={`"${deleteTarget.title}" 팝업을 삭제하시겠습니까?`}
          confirmLabel="삭제"
          cancelLabel="취소"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
