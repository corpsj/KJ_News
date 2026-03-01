"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const POPUP_WIDTH = 400;

interface PopupData {
  id: number;
  title: string;
  content: string;
  image_url: string;
  link_url: string;
}

export default function LandingPopup() {
  const [popups, setPopups] = useState<PopupData[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
  if (!mounted || visible.length === 0) return null;

  return (
    <>
      {visible.map((popup, idx) => (
        <div
          key={popup.id}
          className="fixed z-[100] shadow-lg border border-gray-300 bg-white"
          style={{
            left: 30 + idx * 24,
            top: 100 + idx * 24,
            width: POPUP_WIDTH,
            maxWidth: "calc(100vw - 40px)",
          }}
        >
          {/* 타이틀 바 */}
          <div className="flex items-center justify-between bg-gray-700 px-3 py-2">
            <span className="text-[13px] font-semibold text-white truncate">
              {popup.title}
            </span>
            <button
              type="button"
              onClick={() => dismiss(popup.id, false)}
              className="flex-shrink-0 ml-2 w-5 h-5 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
              aria-label="닫기"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 본문 */}
          <div>
            {popup.image_url && (
              popup.link_url ? (
                <a href={popup.link_url} target="_blank" rel="noopener noreferrer">
                  <div className="relative w-full aspect-[4/5]">
                    <Image
                      src={popup.image_url}
                      alt={popup.title}
                      fill
                      className="object-cover"
                      sizes={`${POPUP_WIDTH}px`}
                    />
                  </div>
                </a>
              ) : (
                <div className="relative w-full aspect-[4/5]">
                  <Image
                    src={popup.image_url}
                    alt={popup.title}
                    fill
                    className="object-cover"
                    sizes={`${POPUP_WIDTH}px`}
                  />
                </div>
              )
            )}

            {popup.content && (
              <div className="px-4 py-3">
                <div
                  className="text-[13px] text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: popup.content }}
                />
                {popup.link_url && !popup.image_url && (
                  <a
                    href={popup.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-[13px] text-blue-600 hover:underline"
                  >
                    자세히 보기 →
                  </a>
                )}
              </div>
            )}
          </div>

          {/* 하단 버튼 */}
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-3 py-2">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                className="w-3.5 h-3.5 rounded border-gray-300"
                onChange={() => dismiss(popup.id, true)}
              />
              <span className="text-[12px] text-gray-500">오늘 하루 열지 않음</span>
            </label>
            <button
              type="button"
              onClick={() => dismiss(popup.id, false)}
              className="text-[12px] text-gray-500 hover:text-gray-800 font-medium px-2 py-1 rounded hover:bg-gray-200 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
