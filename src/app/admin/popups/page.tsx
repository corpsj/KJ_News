"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/contexts/ToastContext";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import Image from "next/image";

interface Popup {
  id: number;
  title: string;
  content: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  position: string;
  width: number;
}

const emptyPopup: Omit<Popup, "id"> = {
  title: "",
  content: "",
  image_url: "",
  link_url: "",
  is_active: false,
  position: "center",
  width: 480,
};

export default function PopupsPage() {
  const { toast } = useToast();
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Popup | null>(null);
  const [form, setForm] = useState(emptyPopup);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Popup | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewPopup, setPreviewPopup] = useState<Popup | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      position: popup.position,
      width: popup.width,
    });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setForm((f) => ({ ...f, image_url: data.url }));
        toast("이미지가 업로드되었습니다.", "success");
      } else {
        const data = await res.json();
        toast(data.error || "업로드 실패", "error");
      }
    } catch {
      toast("네트워크 오류", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
        setShowForm(false);
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

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
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
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 폼 영역 */}
          <div className="lg:col-span-3 admin-card p-6">
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
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">이미지</label>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="admin-btn admin-btn-ghost text-[13px] px-3 py-1.5"
                  >
                    {uploading ? "업로드 중..." : "파일 선택"}
                  </button>
                  <input
                    className="admin-input flex-1"
                    value={form.image_url}
                    onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                    placeholder="이미지 URL 직접 입력 또는 파일 업로드"
                  />
                </div>
                {form.image_url && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 max-w-[200px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.image_url} alt="미리보기" className="w-full object-cover" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">링크 URL</label>
                <input className="admin-input" value={form.link_url} onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))} placeholder="https://..." />
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
            </div>
            <div className="flex items-center gap-2 mt-6 pt-5 border-t border-gray-100">
              <button type="button" onClick={() => setShowForm(false)} className="admin-btn admin-btn-ghost text-[13px] px-4 py-2">취소</button>
              <button type="button" onClick={handleSave} disabled={saving} className="admin-btn admin-btn-primary text-[13px] px-4 py-2">
                {saving ? "저장 중..." : editing ? "수정" : "생성"}
              </button>
            </div>
          </div>

          {/* 미리보기 영역 */}
          <div className="lg:col-span-2">
            <div className="admin-card p-4">
              <h3 className="text-[13px] font-semibold text-gray-600 mb-3">미리보기</h3>
              <div className="bg-gray-100 rounded-lg p-4 min-h-[300px] flex items-start justify-center">
                <div
                  className="shadow-lg border border-gray-300 bg-white"
                  style={{ width: Math.min(form.width, 360), maxWidth: "100%" }}
                >
                  {/* 타이틀 바 */}
                  <div className="flex items-center justify-between bg-gray-700 px-3 py-2">
                    <span className="text-[12px] font-semibold text-white truncate">
                      {form.title || "팝업 제목"}
                    </span>
                    <span className="flex-shrink-0 ml-2 w-4 h-4 flex items-center justify-center text-gray-300">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                  </div>
                  {/* 본문 */}
                  <div>
                    {form.image_url && (
                      <div className="relative w-full aspect-[4/5]">
                        <Image
                          src={form.image_url}
                          alt={form.title || "미리보기"}
                          fill
                          className="object-cover"
                          sizes="360px"
                        />
                      </div>
                    )}
                    {form.content && (
                      <div className="px-3 py-2">
                        <div
                          className="text-[11px] text-gray-700 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: form.content }}
                        />
                      </div>
                    )}
                    {!form.image_url && !form.content && (
                      <div className="px-3 py-8 text-center">
                        <p className="text-[11px] text-gray-400">이미지 또는 내용을 입력하세요</p>
                      </div>
                    )}
                  </div>
                  {/* 하단 */}
                  <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-3 py-1.5">
                    <span className="text-[10px] text-gray-400">오늘 하루 열지 않음</span>
                    <span className="text-[10px] text-gray-400">닫기</span>
                  </div>
                </div>
              </div>
            </div>
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
                <th className="text-left py-2.5 px-4 font-semibold text-gray-600">팝업</th>
                <th className="text-center py-2.5 px-4 font-semibold text-gray-600 w-20">상태</th>
                <th className="text-center py-2.5 px-4 font-semibold text-gray-600 w-20">너비</th>
                <th className="text-right py-2.5 px-4 font-semibold text-gray-600 w-40">액션</th>
              </tr>
            </thead>
            <tbody>
              {popups.map((popup) => (
                <tr key={popup.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {popup.image_url && (
                        <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden border border-gray-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={popup.image_url} alt={popup.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{popup.title}</div>
                        {popup.content && <span className="text-[11px] text-gray-400">내용 포함</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button type="button" onClick={() => toggleActive(popup)} className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${popup.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {popup.is_active ? "활성" : "비활성"}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-500 text-[12px]">
                    {popup.width}px
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" onClick={() => setPreviewPopup(popup)} className="admin-btn admin-btn-ghost text-[11px] py-1 px-2">미리보기</button>
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

      {/* 팝업 미리보기 모달 */}
      {previewPopup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40" onClick={() => setPreviewPopup(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <div
              className="shadow-lg border border-gray-300 bg-white"
              style={{ width: previewPopup.width, maxWidth: "calc(100vw - 40px)" }}
            >
              {/* 타이틀 바 */}
              <div className="flex items-center justify-between bg-gray-700 px-3 py-2">
                <span className="text-[13px] font-semibold text-white truncate">
                  {previewPopup.title}
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewPopup(null)}
                  className="flex-shrink-0 ml-2 w-5 h-5 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* 본문 */}
              <div>
                {previewPopup.image_url && (
                  <div className="relative w-full aspect-[4/5]">
                    <Image
                      src={previewPopup.image_url}
                      alt={previewPopup.title}
                      fill
                      className="object-cover"
                      sizes={`${previewPopup.width}px`}
                    />
                  </div>
                )}
                {previewPopup.content && (
                  <div className="px-4 py-3">
                    <div
                      className="text-[13px] text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: previewPopup.content }}
                    />
                  </div>
                )}
              </div>
              {/* 하단 */}
              <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-3 py-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300" readOnly />
                  <span className="text-[12px] text-gray-500">오늘 하루 열지 않음</span>
                </label>
                <button
                  type="button"
                  onClick={() => setPreviewPopup(null)}
                  className="text-[12px] text-gray-500 hover:text-gray-800 font-medium px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
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
