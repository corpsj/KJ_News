"use client";

import { useState } from "react";
import { useAdmin, type CategoryInput } from "@/contexts/AdminContext";
import { useToast } from "@/contexts/ToastContext";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import type { Category } from "@/lib/types";

const EMPTY: CategoryInput = { name: "", slug: "", description: "", color: "#64748b" };

export default function CategoriesPage() {
  const { categories, articles, addCategory, updateCategory, deleteCategory } = useAdmin();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryInput>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const count = (id: string) => articles.filter((a) => a.category.id === id).length;

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setShowForm(true);
  }
  function openEdit(c: Category) {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, description: c.description, color: c.color });
    setShowForm(true);
  }

  async function save() {
    if (!form.name.trim()) { toast("카테고리 이름을 입력하세요.", "error"); return; }
    if (!/^[a-z0-9-]+$/.test(form.slug)) { toast("슬러그는 영문 소문자·숫자·하이픈(-)만 사용할 수 있습니다.", "error"); return; }
    setSaving(true);
    try {
      const res = editing ? await updateCategory(editing.id, form) : await addCategory(form);
      if (!res) { toast("저장에 실패했습니다. 슬러그가 중복되지 않는지 확인하세요.", "error"); return; }
      toast(editing ? "카테고리가 수정되었습니다." : "카테고리가 추가되었습니다.", "success");
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const ok = await deleteCategory(deleteTarget.id);
    toast(ok ? "카테고리가 삭제되었습니다." : "삭제에 실패했습니다.", ok ? "success" : "error");
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">카테고리 관리</h1>
        <button type="button" className="admin-btn admin-btn-primary" onClick={openNew}>＋ 카테고리 추가</button>
      </div>

      <div className="admin-card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="py-3 px-4 text-left font-semibold text-gray-600">이름</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-600">슬러그</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-600 w-24">색상</th>
              <th className="py-3 px-4 text-right font-semibold text-gray-600 w-20">기사 수</th>
              <th className="py-3 px-4 text-right font-semibold text-gray-600 w-28">액션</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">{c.name}</td>
                <td className="py-3 px-4 text-gray-500">{c.slug}</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full border border-gray-200" style={{ backgroundColor: c.color }} />
                    <span className="text-gray-400 text-[11px]">{c.color}</span>
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-gray-500">{count(c.id)}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button type="button" className="admin-btn admin-btn-ghost text-[11px] py-1 px-2" onClick={() => openEdit(c)}>수정</button>
                    <button type="button" className="admin-btn admin-btn-ghost text-[11px] py-1 px-2" onClick={() => setDeleteTarget(c)}>삭제</button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={5} className="py-12 text-center text-gray-400 text-[13px]">카테고리가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[12px] text-gray-400">카테고리를 삭제하면 해당 카테고리의 기사는 &lsquo;미분류&rsquo;로 표시됩니다.</p>

      {showForm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="카테고리 편집" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-bold text-gray-900">{editing ? "카테고리 수정" : "카테고리 추가"}</h2>
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">이름 *</label>
              <input className="admin-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="예: 정치" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">슬러그 * (영문)</label>
              <input className="admin-input" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="예: politics" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">설명</label>
              <input className="admin-input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="(선택)" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">색상</label>
              <input type="color" className="h-9 w-16 rounded border border-gray-200 bg-white" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button type="button" className="admin-btn admin-btn-ghost text-[13px] px-4 py-2" onClick={() => setShowForm(false)}>취소</button>
              <button type="button" className="admin-btn admin-btn-primary text-[13px] px-4 py-2" onClick={save} disabled={saving}>{saving ? "저장 중..." : editing ? "수정" : "추가"}</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="카테고리 삭제"
          message={`"${deleteTarget.name}" 카테고리를 삭제하시겠습니까? 이 카테고리의 기사(${count(deleteTarget.id)}건)는 '미분류'로 표시됩니다.`}
          confirmLabel="삭제"
          cancelLabel="취소"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
