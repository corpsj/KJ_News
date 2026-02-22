"use client";

import { useState, useRef, useEffect } from "react";
import NfArticleExplorer from "@/components/admin/nf/NfArticleExplorer";
import NfImportHistory from "@/components/admin/nf/NfDeliveryHistory";

const tabs = [
  { key: "explore", label: "기사 탐색" },
  { key: "imports", label: "가져오기 이력" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function NewsFeedPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("explore");
  const [stats, setStats] = useState<{ available: number; imported: number } | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/nf/articles?limit=1").then((r) => r.ok ? r.json() : { total: 0 }),
      fetch("/api/nf/imports?limit=1").then((r) => r.ok ? r.json() : { total: 0 }),
    ]).then(([articlesData, importsData]) => {
      setStats({
        available: articlesData.total ?? 0,
        imported: importsData.total ?? 0,
      });
    }).catch(() => {
      setStats({ available: 0, imported: 0 });
    });
  }, []);

  function handleTouchStart(e: React.TouchEvent) {
    const t = e.changedTouches[0];
    if (t) touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;

    if (Math.abs(dx) > 50 && Math.abs(dy) < 30) {
      const currentIdx = tabs.findIndex((tab) => tab.key === activeTab);
      if (dx < 0 && currentIdx < tabs.length - 1) {
        setActiveTab(tabs[currentIdx + 1].key);
      } else if (dx > 0 && currentIdx > 0) {
        setActiveTab(tabs[currentIdx - 1].key);
      }
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="nf-header-compact">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold nf-gradient-text">뉴스팩토리</h1>
            <span className="nf-ai-badge">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              AI Curation
            </span>
            <span className="nf-ai-badge-outline">NF ENGINE v2</span>
          </div>
          <div className="flex items-center gap-4 text-[13px]">
            <span className="text-gray-500">수집 가능 <strong className="text-gray-900 ml-1">{stats?.available ?? "—"}</strong></span>
            <span className="w-px h-3 bg-gray-300" />
            <span className="text-gray-500">가져온 기사 <strong className="text-gray-900 ml-1">{stats?.imported ?? "—"}</strong></span>
          </div>
        </div>
      </div>

      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`admin-tab ${activeTab === tab.key ? "admin-tab-active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="animate-fade-in"
        key={activeTab}
      >
        {activeTab === "explore" && <NfArticleExplorer />}
        {activeTab === "imports" && <NfImportHistory />}
      </div>
    </div>
  );
}
