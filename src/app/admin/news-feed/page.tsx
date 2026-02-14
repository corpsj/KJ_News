"use client";

import { useState, useRef } from "react";
import NfArticleExplorer from "@/components/admin/nf/NfArticleExplorer";
import NfSubscriptionManager from "@/components/admin/nf/NfSubscriptionManager";
import NfDeliveryHistory from "@/components/admin/nf/NfDeliveryHistory";

const tabs = [
  { key: "explore", label: "기사 탐색" },
  { key: "subscriptions", label: "구독 관리" },
  { key: "deliveries", label: "전송 이력" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function NewsFeedPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("explore");
  const touchStart = useRef<{ x: number; y: number } | null>(null);

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
      <h1 className="text-xl font-bold text-gray-900">뉴스 피드</h1>

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
