"use client";

import { useState, useEffect, useMemo } from "react";
import type { NfSyncLog } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  success: { label: "성공", className: "admin-badge-published" },
  failed: { label: "실패", className: "admin-badge-draft" },
  pending: { label: "대기", className: "admin-badge-scheduled" },
};

export default function NfDeliveryHistory() {
  const [logs, setLogs] = useState<NfSyncLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/nf/deliveries")
      .then((r) => r.json())
      .then((data) => setLogs(data))
      .finally(() => setLoading(false));
  }, []);

  const sorted = useMemo(
    () => [...logs].sort((a, b) => new Date(b.synced_at).getTime() - new Date(a.synced_at).getTime()),
    [logs]
  );

  const successCount = logs.filter((d) => d.status === "success").length;
  const totalArticles = logs.reduce((sum, d) => sum + d.article_count, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-semibold text-gray-900">수집 이력</p>
        {!loading && logs.length > 0 && (
          <div className="flex items-center gap-4 text-[12px] text-gray-400">
            <span>{successCount}/{logs.length} 성공</span>
            <span>·</span>
            <span>총 {totalArticles}건 수집</span>
          </div>
        )}
      </div>

      {loading && (
        <>
          <div className="admin-card overflow-hidden hidden md:block">
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={`dskel-${i}`} className="flex items-center gap-4">
                  <div className="nf-skeleton h-4 w-24" />
                  <div className="nf-skeleton h-4 w-32 flex-1" />
                  <div className="nf-skeleton h-5 w-14 rounded" />
                </div>
              ))}
            </div>
          </div>
          <div className="md:hidden space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`dskelm-${i}`} className="nf-skeleton-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="nf-skeleton h-4 w-32" />
                  <div className="nf-skeleton h-5 w-12 rounded" />
                </div>
                <div className="nf-skeleton h-3 w-40" />
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && sorted.length > 0 && (
        <>
          <div className="admin-card overflow-hidden hidden md:block">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="py-3 px-4 text-left text-[12px] font-semibold text-gray-500 uppercase tracking-wider">동기화 시간</th>
                  <th className="py-3 px-4 text-right text-[12px] font-semibold text-gray-500 uppercase tracking-wider">수집 기사</th>
                  <th className="py-3 px-4 text-left text-[12px] font-semibold text-gray-500 uppercase tracking-wider">상태</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((d) => {
                  const status = STATUS_MAP[d.status] || STATUS_MAP.pending;
                  return (
                    <tr key={d.id} className="border-b border-gray-100 nf-delivery-row">
                      <td className="py-3 px-4 text-gray-500">{formatDate(d.synced_at)}</td>
                      <td className="py-3 px-4 text-right text-gray-500">{d.article_count}건</td>
                      <td className="py-3 px-4">
                        <span className={status.className}>{status.label}</span>
                        {d.error_message && (
                          <span className="text-[11px] text-gray-400 ml-2">{d.error_message}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {sorted.map((d) => {
              const status = STATUS_MAP[d.status] || STATUS_MAP.pending;
              return (
                <div key={d.id} className="nf-subscription-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-medium text-gray-900">{formatDate(d.synced_at)}</span>
                    <span className={status.className}>{status.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[12px] text-gray-400">
                    <span>{d.article_count}건 수집</span>
                  </div>
                  {d.error_message && (
                    <p className="text-[11px] text-gray-400 mt-1">{d.error_message}</p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {!loading && sorted.length === 0 && (
        <div className="nf-empty-state">
          <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
          <p className="text-[14px] text-gray-400">아직 수집 이력이 없습니다</p>
          <p className="text-[12px] text-gray-300 mt-1">자동 수집을 활성화하면 이력이 여기에 표시됩니다</p>
        </div>
      )}
    </div>
  );
}
