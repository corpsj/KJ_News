"use client";

import { useState, useRef, useEffect } from "react";
import NfArticleExplorer from "@/components/admin/nf/NfArticleExplorer";
import NfSubscriptionManager from "@/components/admin/nf/NfSubscriptionManager";
import NfDeliveryHistory from "@/components/admin/nf/NfDeliveryHistory";

const tabs = [
  { key: "explore", label: "기사 탐색" },
  { key: "subscriptions", label: "연동 설정" },
  { key: "deliveries", label: "수집 이력" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function NewsFeedPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("explore");
  const [stats, setStats] = useState({ articles: 0, connected: false, syncs: 0 });
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/nf/articles").then((r) => r.json()),
      fetch("/api/nf/connection").then((r) => r.json()),
      fetch("/api/nf/deliveries").then((r) => r.json()),
    ]).then(([articles, connection, syncLogs]) => {
      setStats({
        articles: articles.length,
        connected: connection.status === "connected",
        syncs: syncLogs.length,
      });
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
    <div className="space-y-5 animate-fade-in">
      <div className="nf-header">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold nf-gradient-text">뉴스팩토리</h1>
              <span className="nf-ai-badge">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                AI Curation
              </span>
            </div>
            <p className="text-[13px] text-gray-500">AI가 큐레이션하는 지역 뉴스 자동 수집 시스템</p>
          </div>
          <span className="nf-ai-badge-outline">NF ENGINE v2</span>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="nf-stat-card">
            <svg className="w-5 h-5 text-gray-400 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
            </svg>
            <p className="text-2xl font-bold text-gray-900 animate-count-up">{stats.articles}</p>
            <p className="text-[12px] text-gray-400 mt-0.5">수집된 기사</p>
          </div>
          <div className="nf-stat-card">
            <svg className="w-5 h-5 text-gray-400 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 00-6.364-6.364L4.5 8.25" />
            </svg>
            <p className="text-2xl font-bold text-gray-900 animate-count-up">{stats.connected ? "ON" : "OFF"}</p>
            <p className="text-[12px] text-gray-400 mt-0.5">연결 상태</p>
          </div>
          <div className="nf-stat-card">
            <svg className="w-5 h-5 text-gray-400 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.183" />
            </svg>
            <p className="text-2xl font-bold text-gray-900 animate-count-up">{stats.syncs}</p>
            <p className="text-[12px] text-gray-400 mt-0.5">수집 이력</p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
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
        {activeTab === "subscriptions" && <NfSubscriptionManager />}
        {activeTab === "deliveries" && <NfDeliveryHistory />}
      </div>
    </div>
  );
}
