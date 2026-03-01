"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface PopupData {
  id: number;
  title: string;
  content: string;
  image_url: string;
  link_url: string;
  position: string;
  width: number;
}

export default function LandingPopup() {
  const [popups, setPopups] = useState<PopupData[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  useEffect(() => {
    // 오늘 하루 닫기 체크
    const todayKey = `popup_dismissed_${new Date().toISOString().slice(0, 10)}`;
    const stored = localStorage.getItem(todayKey);
    if (stored) {
      try { setDismissed(new Set(JSON.parse(stored))); } catch { /* ignore */ }
    }

    fetch("/api/popups")
      .then((r) => r.json())
      .then((data) => setPopups(data.popups || []))
      .catch(() => {});
  }, []);

  function dismiss(id: number, today: boolean) {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      if (today) {
        const todayKey = `popup_dismissed_${new Date().toISOString().slice(0, 10)}`;
        localStorage.setItem(todayKey, JSON.stringify([...next]));
      }
      return next;
    });
  }

  const visible = popups.filter((p) => !dismissed.has(p.id));
  if (visible.length === 0) return null;

  return (
    <>
      {visible.map((popup) => {
        const positionClass = popup.position === "top"
          ? "items-start pt-20"
          : popup.position === "bottom"
            ? "items-end pb-20"
            : "items-center";

        const content = (
          <div
            className="bg-white rounded-xl shadow-2xl overflow-hidden relative animate-fade-in"
            style={{ width: Math.min(popup.width, window.innerWidth - 32), maxWidth: "90vw" }}
          >
            {/* 닫기 버튼 */}
            <button
              type="button"
              onClick={() => dismiss(popup.id, false)}
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
              aria-label="닫기"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {popup.image_url && (
              <div className="relative w-full aspect-[16/9]">
                <Image
                  src={popup.image_url}
                  alt={popup.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 90vw, 480px"
                />
              </div>
            )}

            {(popup.content) && (
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{popup.title}</h3>
                <div className="text-[14px] text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: popup.content }} />
              </div>
            )}

            {popup.link_url && (
              <div className="px-5 pb-4">
                <a
                  href={popup.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full text-center bg-gray-900 text-white text-[14px] font-medium py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  자세히 보기
                </a>
              </div>
            )}

            <div className="border-t border-gray-100 px-5 py-3 flex justify-between items-center">
              <button
                type="button"
                onClick={() => dismiss(popup.id, true)}
                className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
              >
                오늘 하루 보지 않기
              </button>
              <button
                type="button"
                onClick={() => dismiss(popup.id, false)}
                className="text-[12px] text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        );

        return (
          <div
            key={popup.id}
            className={`fixed inset-0 z-[9999] flex justify-center ${positionClass}`}
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={(e) => { if (e.target === e.currentTarget) dismiss(popup.id, false); }}
          >
            {content}
          </div>
        );
      })}
    </>
  );
}
