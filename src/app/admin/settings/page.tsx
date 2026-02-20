"use client";

import { useState, useEffect, useCallback } from "react";

interface NfSettings {
  nf_api_url: string;
  nf_api_key: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<NfSettings>({ nf_api_url: "", nf_api_key: "" });
  const [saved, setSaved] = useState<NfSettings>({ nf_api_url: "", nf_api_key: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showKey, setShowKey] = useState(false);

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

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">설정</h1>
        <p className="text-[13px] text-gray-500 mt-1">뉴스팩토리 API 연동 설정을 관리합니다</p>
      </div>

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
    </div>
  );
}
