"use client";

import { useMemo } from "react";
import { nfDeliveries, nfSubscriptions } from "@/lib/nf-mock-data";
import { formatDate } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  success: { label: "성공", className: "admin-badge-published" },
  failed: { label: "실패", className: "admin-badge-draft" },
  pending: { label: "대기", className: "admin-badge-scheduled" },
};

export default function NfDeliveryHistory() {
  const sorted = useMemo(
    () => [...nfDeliveries].sort((a, b) => new Date(b.delivered_at).getTime() - new Date(a.delivered_at).getTime()),
    []
  );

  function getSubName(id: string) {
    return nfSubscriptions.find((s) => s.id === id)?.name || "알 수 없음";
  }

  return (
    <div className="space-y-4">
      <p className="text-[15px] font-semibold text-gray-900">전송 이력</p>

      <div className="admin-card overflow-hidden hidden md:block">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="py-3 px-4 text-left font-semibold text-gray-600">날짜</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-600">구독명</th>
              <th className="py-3 px-4 text-right font-semibold text-gray-600">기사 수</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-600">상태</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d) => {
              const status = STATUS_MAP[d.status] || STATUS_MAP.pending;
              return (
                <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-500">{formatDate(d.delivered_at)}</td>
                  <td className="py-3 px-4 text-gray-900 font-medium">{getSubName(d.subscription_id)}</td>
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
            <div key={d.id} className="admin-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-medium text-gray-900">{getSubName(d.subscription_id)}</span>
                <span className={status.className}>{status.label}</span>
              </div>
              <div className="flex items-center gap-3 text-[12px] text-gray-400">
                <span>{formatDate(d.delivered_at)}</span>
                <span>·</span>
                <span>{d.article_count}건</span>
              </div>
              {d.error_message && (
                <p className="text-[11px] text-gray-400 mt-1">{d.error_message}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
