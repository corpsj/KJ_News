"use client";

import { useState, useEffect } from "react";
import type { NfConnection } from "@/lib/types";
import { NF_CATEGORIES } from "@/lib/nf-constants";
import { formatDate } from "@/lib/utils";

function maskApiKey(key: string): string {
  if (key.length <= 16) return key;
  return `${key.slice(0, 8)}${"*".repeat(8)}...${key.slice(-4)}`;
}

export default function NfSubscriptionManager() {
  const [conn, setConn] = useState<NfConnection | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetch("/api/nf/connection")
      .then((r) => r.json())
      .then((data) => setConn(data))
      .finally(() => setLoading(false));
  }, []);

  function toggleActive() {
    if (!conn) return;
    const next = !conn.is_active;
    fetch("/api/nf/connection", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: next }),
    });
    setConn({ ...conn, is_active: next, updated_at: new Date().toISOString() });
  }

  function toggleCategory(cat: string) {
    if (!conn) return;
    const next = conn.collect_categories.includes(cat)
      ? conn.collect_categories.filter((c) => c !== cat)
      : [...conn.collect_categories, cat];
    fetch("/api/nf/connection", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collect_categories: next }),
    });
    setConn({ ...conn, collect_categories: next, updated_at: new Date().toISOString() });
  }



  if (loading) {
    return (
      <div className="space-y-4">
        <div className="admin-card p-5 space-y-4">
          <div className="nf-skeleton h-5 w-40" />
          <div className="nf-skeleton h-10 w-full rounded-lg" />
          <div className="nf-skeleton h-10 w-full rounded-lg" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={`cskel-${i}`} className="nf-skeleton h-8 w-16 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!conn) {
    return (
      <div className="nf-empty-state">
        <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 00-6.364-6.364L4.5 8.25" />
        </svg>
        <p className="text-[13px] text-gray-400 mb-1">연동 정보 없음</p>
        <p className="text-[12px] text-gray-300">뉴스팩토리 연동 설정을 불러올 수 없습니다</p>
      </div>
    );
  }

  const statusConfig = {
    connected: { label: "연결됨", className: "admin-badge-published" },
    disconnected: { label: "미연결", className: "admin-badge-draft" },
    error: { label: "오류", className: "admin-badge-draft" },
  };
  const st = statusConfig[conn.status];

  return (
    <div className="space-y-4">
      <p className="text-[15px] font-semibold text-gray-900">연동 설정</p>

      <div className="admin-card overflow-hidden divide-y divide-gray-100">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {conn.status === "connected" && <span className="nf-live-dot flex-shrink-0" />}
              <span className="text-[14px] font-medium text-gray-900">연결 상태</span>
              <span className={st.className}>{st.label}</span>
            </div>
            <button
              type="button"
              className="admin-btn admin-btn-ghost text-[12px]"
              disabled
            >
              준비 중
            </button>
          </div>

          <div className="flex items-center gap-3 text-[13px]">
            <span className="text-gray-400 flex-shrink-0">클라이언트</span>
            <span className="font-medium text-gray-900">{conn.client_name}</span>
          </div>

          <div className="flex items-center gap-3 text-[13px] mt-1.5">
            <span className="text-gray-400 flex-shrink-0">API Key</span>
            <code className="text-[12px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded font-mono">
              {maskApiKey(conn.api_key)}
            </code>
          </div>

          {conn.connected_at && (
            <p className="text-[11px] text-gray-300 mt-2">
              연결일 {formatDate(conn.connected_at)}
            </p>
          )}
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[14px] font-medium text-gray-900">자동 수집</span>
              <p className="text-[12px] text-gray-400 mt-0.5">{conn.collect_schedule}</p>
            </div>
            <button
              type="button"
              onClick={toggleActive}
              className={`admin-toggle flex-shrink-0 ${conn.is_active ? "active" : ""}`}
              aria-label={conn.is_active ? "자동 수집 비활성화" : "자동 수집 활성화"}
            />
          </div>

          {conn.last_synced_at && (
            <p className="text-[11px] text-gray-300 mt-2">
              마지막 동기화 {formatDate(conn.last_synced_at)}
            </p>
          )}
        </div>

        <div className="px-5 py-4">
          <p className="text-[14px] font-medium text-gray-900 mb-3">수집 카테고리</p>
          <div className="flex flex-wrap gap-1.5">
            {NF_CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`nf-filter-chip text-[12px] py-1 px-3 ${
                  conn.collect_categories.includes(cat) ? "active" : ""
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-300 mt-2">
            {conn.collect_categories.length}개 카테고리 수집 중
          </p>
        </div>
      </div>
    </div>
  );
}
