"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { useToast } from "@/contexts/ToastContext";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import type { Author } from "@/lib/types";

interface NfSettings {
  nf_api_url: string;
  nf_api_key: string;
}

export default function SettingsPage() {
  const { authors, addAuthor, updateAuthor, deleteAuthor } = useAdmin();
  const { toast } = useToast();


  const [settings, setSettings] = useState<NfSettings>({ nf_api_url: "", nf_api_key: "" });
  const [saved, setSaved] = useState<NfSettings>({ nf_api_url: "", nf_api_key: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showKey, setShowKey] = useState(false);


  const [editingAuthor, setEditingAuthor] = useState<{ id: string; name: string; role: string } | null>(null);
  const [newAuthor, setNewAuthor] = useState<{ name: string; role: string } | null>(null);
  const [authorSaving, setAuthorSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Author | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        const s = {
          nf_api_url: data.settings?.nf_api_url || "",
          nf_api_key: data.settings?.nf_api_key || "",
        };
        setSettings(s);
        setSaved(s);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const isDirty = settings.nf_api_url !== saved.nf_api_url || settings.nf_api_key !== saved.nf_api_key;

  async function handleSave() {
    setSaving(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved({ ...settings });
        setTestResult({ ok: true, message: "저장되었습니다" });
      } else {
        const data = await res.json();
        setTestResult({ ok: false, message: data.error || "저장 실패" });
      }
    } catch {
      setTestResult({ ok: false, message: "네트워크 오류" });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: settings.nf_api_url, key: settings.nf_api_key }),
      });
      const data = await res.json();
      setTestResult({ ok: data.ok ?? false, message: data.message ?? "알 수 없는 오류" });
    } catch (err) {
      setTestResult({ ok: false, message: `요청 실패: ${err instanceof Error ? err.message : "알 수 없는 오류"}` });
    } finally {
      setTesting(false);
    }
  }

  function maskKey(key: string) {
    if (!key) return "";
    if (key.length <= 12) return "••••••••";
    return key.slice(0, 6) + "••••••••" + key.slice(-4);
  }


  async function handleAddAuthor() {
    if (!newAuthor || !newAuthor.name.trim() || !newAuthor.role.trim()) return;
    setAuthorSaving(true);
    const result = await addAuthor(newAuthor.name.trim(), newAuthor.role.trim());
    setAuthorSaving(false);
    if (result) {
      toast("발행인이 추가되었습니다.", "success");
      setNewAuthor(null);
    } else {
      toast("발행인 추가에 실패했습니다.", "error");
    }
  }

  async function handleUpdateAuthor() {
    if (!editingAuthor || !editingAuthor.name.trim() || !editingAuthor.role.trim()) return;
    setAuthorSaving(true);
    const result = await updateAuthor(editingAuthor.id, editingAuthor.name.trim(), editingAuthor.role.trim());
    setAuthorSaving(false);
    if (result) {
      toast("발행인 정보가 수정되었습니다.", "success");
      setEditingAuthor(null);
    } else {
      toast("발행인 수정에 실패했습니다.", "error");
    }
  }

  async function handleDeleteAuthor() {
    if (!deleteTarget) return;
    const ok = await deleteAuthor(deleteTarget.id);
    if (ok) {
      toast("발행인이 삭제되었습니다.", "success");
    } else {
      toast("발행인 삭제에 실패했습니다. 해당 발행인의 기사가 있는지 확인하세요.", "error");
    }
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">설정</h1>
        <p className="text-[13px] text-gray-500 mt-1">시스템 설정을 관리합니다</p>
      </div>

      {/* NF API Settings */}
      {loading ? (
        <div className="admin-card p-6 space-y-4">
          {["a", "b", "c"].map((k) => (
            <div key={k} className="space-y-2">
              <div className="nf-skeleton h-4 w-24" />
              <div className="nf-skeleton h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <svg className="w-5 h-5 text-gray-400" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 00-6.364-6.364L4.5 8.25" />
            </svg>
            <h2 className="text-[15px] font-semibold text-gray-900">뉴스팩토리 API</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="nf-url" className="block text-[13px] font-medium text-gray-700 mb-1.5">
                API URL
              </label>
              <input
                id="nf-url"
                type="url"
                className="admin-input"
                placeholder="https://news-factory-v2.vercel.app"
                value={settings.nf_api_url}
                onChange={(e) => setSettings((s) => ({ ...s, nf_api_url: e.target.value }))}
              />
              <p className="text-[11px] text-gray-400 mt-1">뉴스팩토리 서버 주소</p>
            </div>

            <div>
              <label htmlFor="nf-key" className="block text-[13px] font-medium text-gray-700 mb-1.5">
                API Key
              </label>
              <div className="relative">
                <input
                  id="nf-key"
                  type={showKey ? "text" : "password"}
                  className="admin-input pr-20"
                  placeholder="nf_live_..."
                  value={settings.nf_api_key}
                  onChange={(e) => setSettings((s) => ({ ...s, nf_api_key: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 hover:text-gray-600 px-2 py-1 transition-colors"
                >
                  {showKey ? "숨기기" : "보기"}
                </button>
              </div>
              {saved.nf_api_key && !showKey && settings.nf_api_key === saved.nf_api_key && (
                <p className="text-[11px] text-gray-400 mt-1">현재: {maskKey(saved.nf_api_key)}</p>
              )}
            </div>
          </div>

          {testResult && (
            <div className={`mt-4 px-3 py-2.5 rounded-lg text-[13px] ${testResult.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {testResult.message}
            </div>
          )}

          <div className="flex items-center gap-2 mt-6 pt-5 border-t border-gray-100">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !settings.nf_api_url || !settings.nf_api_key}
              className="admin-btn admin-btn-ghost text-[13px] px-4 py-2"
            >
              {testing ? "테스트 중..." : "연결 테스트"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="admin-btn admin-btn-primary text-[13px] px-4 py-2"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      )}

      {/* Author Management */}
      <div className="admin-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <h2 className="text-[15px] font-semibold text-gray-900">발행인 관리</h2>
          </div>
          {!newAuthor && (
            <button
              type="button"
              onClick={() => setNewAuthor({ name: "", role: "" })}
              className="admin-btn admin-btn-ghost text-[12px] px-3 py-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              추가
            </button>
          )}
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-2.5 px-4 font-semibold text-gray-600">이름</th>
                <th className="text-left py-2.5 px-4 font-semibold text-gray-600">직함</th>
                <th className="text-right py-2.5 px-4 font-semibold text-gray-600 w-28">액션</th>
              </tr>
            </thead>
            <tbody>
              {authors.map((author) => (
                <tr key={author.id} className="border-b border-gray-100 last:border-b-0">
                  {editingAuthor?.id === author.id ? (
                    <>
                      <td className="py-2 px-4">
                        <input
                          className="admin-input text-[13px] py-1.5"
                          value={editingAuthor.name}
                          onChange={(e) => setEditingAuthor((prev) => prev ? { ...prev, name: e.target.value } : prev)}
                          placeholder="이름"
                          autoFocus
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          className="admin-input text-[13px] py-1.5"
                          value={editingAuthor.role}
                          onChange={(e) => setEditingAuthor((prev) => prev ? { ...prev, role: e.target.value } : prev)}
                          placeholder="직함"
                        />
                      </td>
                      <td className="py-2 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingAuthor(null)}
                            className="admin-btn admin-btn-ghost text-[11px] py-1 px-2"
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            onClick={handleUpdateAuthor}
                            disabled={authorSaving || !editingAuthor.name.trim() || !editingAuthor.role.trim()}
                            className="admin-btn admin-btn-primary text-[11px] py-1 px-2"
                          >
                            {authorSaving ? "저장..." : "저장"}
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2.5 px-4 text-gray-900">{author.name}</td>
                      <td className="py-2.5 px-4 text-gray-500">{author.role}</td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingAuthor({ id: author.id, name: author.name, role: author.role })}
                            className="admin-btn admin-btn-ghost text-[11px] py-1 px-2"
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(author)}
                            className="admin-btn admin-btn-ghost text-[11px] py-1 px-2 text-red-500 hover:text-red-700"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}

              {/* New author inline form */}
              {newAuthor && (
                <tr className="border-b border-gray-100 last:border-b-0 bg-gray-50/50">
                  <td className="py-2 px-4">
                    <input
                      className="admin-input text-[13px] py-1.5"
                      value={newAuthor.name}
                      onChange={(e) => setNewAuthor((prev) => prev ? { ...prev, name: e.target.value } : prev)}
                      placeholder="이름"
                      autoFocus
                    />
                  </td>
                  <td className="py-2 px-4">
                    <input
                      className="admin-input text-[13px] py-1.5"
                      value={newAuthor.role}
                      onChange={(e) => setNewAuthor((prev) => prev ? { ...prev, role: e.target.value } : prev)}
                      placeholder="직함 (예: 기자, 편집인)"
                    />
                  </td>
                  <td className="py-2 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setNewAuthor(null)}
                        className="admin-btn admin-btn-ghost text-[11px] py-1 px-2"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={handleAddAuthor}
                        disabled={authorSaving || !newAuthor.name.trim() || !newAuthor.role.trim()}
                        className="admin-btn admin-btn-primary text-[11px] py-1 px-2"
                      >
                        {authorSaving ? "추가..." : "추가"}
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {authors.length === 0 && !newAuthor && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-[13px] text-gray-400">
                    등록된 발행인이 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-gray-400 mt-2">기사 작성 및 뉴스팩토리 발행 시 발행인으로 표시됩니다</p>
      </div>

      {/* Delete Confirm Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          title="발행인 삭제"
          message={`"${deleteTarget.name}" 발행인을 삭제하시겠습니까? 해당 발행인의 기사는 유지되지만, 작성자가 "알 수 없음"으로 표시됩니다.`}
          confirmLabel="삭제"
          cancelLabel="취소"
          onConfirm={handleDeleteAuthor}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
