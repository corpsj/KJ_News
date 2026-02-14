"use client";

import { useState } from "react";
import type { NfSubscription } from "@/lib/types";
import { nfSubscriptions as initialSubs, cronToKorean } from "@/lib/nf-mock-data";
import { formatDate } from "@/lib/utils";
import NfSubscriptionModal from "./NfSubscriptionModal";

export default function NfSubscriptionManager() {
  const [subscriptions, setSubscriptions] = useState<NfSubscription[]>(() => [...initialSubs]);
  const [showModal, setShowModal] = useState(false);
  const [editingSub, setEditingSub] = useState<NfSubscription | null>(null);

  function toggleActive(id: string) {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_active: !s.is_active } : s))
    );
  }

  function handleDelete(id: string) {
    if (!confirm("구독을 삭제하시겠습니까?")) return;
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
  }

  function handleEdit(sub: NfSubscription) {
    setEditingSub(sub);
    setShowModal(true);
  }

  function handleSave(data: Partial<NfSubscription>) {
    if (editingSub) {
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === editingSub.id ? { ...s, ...data, updated_at: new Date().toISOString() } : s))
      );
    } else {
      const newSub: NfSubscription = {
        id: `sub-${Date.now()}`,
        name: data.name || "",
        filter_regions: data.filter_regions || [],
        filter_categories: data.filter_categories || [],
        filter_keywords: data.filter_keywords || [],
        schedule_cron: data.schedule_cron || "0 9 * * *",
        max_articles: data.max_articles || 10,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setSubscriptions((prev) => [newSub, ...prev]);
    }
    setEditingSub(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-semibold text-gray-900">구독 관리</p>
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => { setEditingSub(null); setShowModal(true); }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          새 구독 추가
        </button>
      </div>

      <div className="space-y-3">
        {subscriptions.map((sub) => (
          <div key={sub.id} className="admin-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-medium text-gray-900">{sub.name}</h3>
              <button
                onClick={() => toggleActive(sub.id)}
                className={`admin-toggle ${sub.is_active ? "active" : ""}`}
                aria-label={sub.is_active ? "비활성화" : "활성화"}
              />
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {sub.filter_regions.map((r) => (
                <span key={r} className="admin-badge">{r}</span>
              ))}
              {sub.filter_categories.map((c) => (
                <span key={c} className="admin-badge">{c}</span>
              ))}
            </div>

            <div className="flex items-center gap-3 text-[12px] text-gray-400 mb-3">
              <span>{cronToKorean(sub.schedule_cron)}</span>
              <span>·</span>
              <span>최대 {sub.max_articles}건</span>
              {sub.last_delivered_at && (
                <>
                  <span>·</span>
                  <span>마지막 전송: {formatDate(sub.last_delivered_at)}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                className="admin-btn admin-btn-ghost text-[12px] py-1 px-3"
                onClick={() => handleEdit(sub)}
              >
                수정
              </button>
              <button
                className="admin-btn admin-btn-ghost text-[12px] py-1 px-3"
                onClick={() => handleDelete(sub.id)}
              >
                삭제
              </button>
            </div>
          </div>
        ))}

        {subscriptions.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-[13px]">구독이 없습니다.</div>
        )}
      </div>

      {showModal && (
        <NfSubscriptionModal
          subscription={editingSub || undefined}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingSub(null); }}
        />
      )}
    </div>
  );
}
