"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/contexts/ToastContext";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

interface Banner {
  id: number;
  title: string;
  image_url: string;
  link_url: string;
  slot: string;
  is_active: boolean;
  sort_order: number;
}

const SLOT_LABELS: Record<string, string> = {
  main_news_below: "주요뉴스 하단",
  category_below: "카테고리별 뉴스 하단",
  latest_below: "최신기사 하단",
};

const emptyBanner: Omit<Banner, "id"> = {
  title: "",
  image_url: "",
  link_url: "",
  slot: "main_news_below",
  is_active: false,
  sort_order: 0,
};

export default function BannersPage() {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState(emptyBanner);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterSlot, setFilterSlot] = useState<string>("all");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/banners");
      if (res.ok) {
        const data = await res.json();
        setBanners(data.banners || []);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  function openNew() {
    setEditing(null);
    setForm(emptyBanner);
  }

  function openEdit(banner: Banner) {
    setEditing(banner);
    setForm({
      title: banner.title,
      image_url: banner.image_url,
      link_url: banner.link_url,
      slot: banner.slot,
      is_active: banner.is_active,
      sort_order: banner.sort_order,
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
    if (!form.image_url.trim()) { toast("이미지를 업로드하세요.", "error"); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/banners/${editing.id}` : "/api/admin/banners";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast(editing ? "배너가 수정되었습니다." : "배너가 생성되었습니다.", "success");
        setEditing(null);
        setForm(emptyBanner);
        setShowForm(false);
        fetchBanners();
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
      const res = await fetch(`/api/admin/banners/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        toast("배너가 삭제되었습니다.", "success");
        fetchBanners();
      } else {
        toast("삭제 실패", "error");
      }
    } catch {
      toast("네트워크 오류", "error");
    }
    setDeleteTarget(null);
  }

  async function toggleActive(banner: Banner) {
    try {
      await fetch(`/api/admin/banners/${banner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...banner, is_active: !banner.is_active }),
      });
      fetchBanners();
    } catch { /* ignore */ }
  }

  const filteredBanners = filterSlot === "all" ? banners : banners.filter((b) => b.slot === filterSlot);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">광고 배너 관리</h1>
          <p className="text-[13px] text-gray-500 mt-1">메인페이지 광고 배너를 관리합니다 (비율 6:1)</p>
        </div>
        <button
          type="button"
          onClick={() => { openNew(); setShowForm(true); }}
          className="admin-btn admin-btn-primary text-[13px] px-4 py-2"
        >
          + 새 배너
        </button>
      </div>

      {/* 배너 폼 */}
      {showForm && (
        <div className="admin-card p-6">
          <h2 className="text-[15px] font-semibold text-gray-900 mb-4">
            {editing ? "배너 수정" : "새 배너 생성"}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">제목 *</label>
              <input className="admin-input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="배너 제목 (관리용)" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">이미지 * (권장 비율 6:1)</label>
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
                <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.image_url} alt="미리보기" className="w-full aspect-[6/1] object-cover" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">링크 URL</label>
                <input className="admin-input" value={form.link_url} onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">배치 위치 *</label>
                <select className="admin-input" value={form.slot} onChange={(e) => setForm((f) => ({ ...f, slot: e.target.value }))}>
                  {Object.entries(SLOT_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">정렬 순서</label>
                <input className="admin-input" type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} />
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
      )}

      {/* 필터 */}
      <div className="flex gap-2">
        <button type="button" onClick={() => setFilterSlot("all")} className={`text-[12px] px-3 py-1.5 rounded-full transition-colors ${filterSlot === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>전체</button>
        {Object.entries(SLOT_LABELS).map(([val, label]) => (
          <button key={val} type="button" onClick={() => setFilterSlot(val)} className={`text-[12px] px-3 py-1.5 rounded-full transition-colors ${filterSlot === val ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{label}</button>
        ))}
      </div>

      {/* 배너 목록 */}
      {loading ? (
        <div className="admin-card p-6">
          {[1, 2, 3].map((k) => <div key={k} className="nf-skeleton h-16 w-full rounded-lg mb-3" />)}
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="admin-card p-8 text-center">
          <p className="text-[13px] text-gray-400">등록된 배너가 없습니다</p>
        </div>
      ) : (
        <div className="admin-card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-2.5 px-4 font-semibold text-gray-600">배너</th>
                <th className="text-center py-2.5 px-4 font-semibold text-gray-600 w-28">위치</th>
                <th className="text-center py-2.5 px-4 font-semibold text-gray-600 w-20">상태</th>
                <th className="text-right py-2.5 px-4 font-semibold text-gray-600 w-32">액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredBanners.map((banner) => (
                <tr key={banner.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {banner.image_url && (
                        <div className="w-24 flex-shrink-0 rounded overflow-hidden border border-gray-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={banner.image_url} alt={banner.title} className="w-full aspect-[6/1] object-cover" />
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{banner.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-500 text-[12px]">
                    {SLOT_LABELS[banner.slot] || banner.slot}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button type="button" onClick={() => toggleActive(banner)} className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${banner.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {banner.is_active ? "활성" : "비활성"}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" onClick={() => { openEdit(banner); setShowForm(true); }} className="admin-btn admin-btn-ghost text-[11px] py-1 px-2">수정</button>
                      <button type="button" onClick={() => setDeleteTarget(banner)} className="admin-btn admin-btn-ghost text-[11px] py-1 px-2 text-red-500 hover:text-red-700">삭제</button>
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
          title="배너 삭제"
          message={`"${deleteTarget.title}" 배너를 삭제하시겠습니까?`}
          confirmLabel="삭제"
          cancelLabel="취소"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
