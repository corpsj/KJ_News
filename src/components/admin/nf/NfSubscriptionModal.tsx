"use client";

import { useState, useEffect } from "react";
import type { NfSubscription } from "@/lib/types";
import { NF_REGIONS, NF_CATEGORIES, NF_CRON_PRESETS } from "@/lib/nf-mock-data";

interface NfSubscriptionModalProps {
  subscription?: NfSubscription;
  onSave: (data: Partial<NfSubscription>) => void;
  onClose: () => void;
}

export default function NfSubscriptionModal({ subscription, onSave, onClose }: NfSubscriptionModalProps) {
  const [name, setName] = useState(subscription?.name || "");
  const [regions, setRegions] = useState<string[]>(subscription?.filter_regions || []);
  const [cats, setCats] = useState<string[]>(subscription?.filter_categories || []);
  const [cron, setCron] = useState(subscription?.schedule_cron || NF_CRON_PRESETS[0].value);
  const [maxArticles, setMaxArticles] = useState(subscription?.max_articles || 10);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toggleRegion(r: string) {
    setRegions((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]);
  }

  function toggleCat(c: string) {
    setCats((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }

  function handleSave() {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      filter_regions: regions,
      filter_categories: cats,
      filter_keywords: [],
      schedule_cron: cron,
      max_articles: maxArticles,
      is_active: subscription?.is_active ?? true,
    });
    onClose();
  }

  return (
    <>
      <div className="admin-overlay-backdrop animate-fade-backdrop md:block hidden" onClick={onClose} />

      <div className="fixed inset-0 z-[70] bg-white md:bg-transparent md:flex md:items-start md:justify-center md:pt-16 overflow-y-auto">
        <div className="md:admin-card md:max-w-lg md:w-full md:mx-4 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[16px] font-bold text-gray-900">
              {subscription ? "구독 수정" : "새 구독 추가"}
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">구독명</label>
              <input
                className="admin-input"
                placeholder="예: 광주 행정 뉴스"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-2">지역 필터</label>
              <div className="flex flex-wrap gap-2">
                {NF_REGIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => toggleRegion(r)}
                    className={`min-h-[44px] md:min-h-[36px] rounded-full px-4 text-[13px] font-medium transition-colors ${
                      regions.includes(r) ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-2">카테고리 필터</label>
              <div className="flex flex-wrap gap-2">
                {NF_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => toggleCat(c)}
                    className={`min-h-[44px] md:min-h-[36px] rounded-full px-4 text-[13px] font-medium transition-colors ${
                      cats.includes(c) ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-2">수신 일정</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {NF_CRON_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setCron(p.value)}
                    className={`admin-card p-3 text-left text-[13px] transition-colors ${
                      cron === p.value
                        ? "border-gray-900 bg-gray-50 text-gray-900 font-medium"
                        : "text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">최대 기사 수</label>
              <input
                className="admin-input w-32"
                type="number"
                min={1}
                max={100}
                value={maxArticles}
                onChange={(e) => setMaxArticles(Number(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-6">
            <button className="admin-btn admin-btn-ghost flex-1" onClick={onClose}>취소</button>
            <button className="admin-btn admin-btn-primary flex-1" onClick={handleSave}>
              {subscription ? "수정" : "추가"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
