"use client";

import { useEffect } from "react";
import type { NfArticle } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface NfArticlePreviewProps {
  article: NfArticle;
  isImported: boolean;
  isPublished?: boolean;
  onImport: () => void;
  onPublish?: () => void;
  onClose: () => void;
}

function PreviewContent({ article, isImported, isPublished, onImport, onPublish }: Omit<NfArticlePreviewProps, "onClose">) {
  const processed = isImported || isPublished;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="admin-badge">뉴스팩토리</span>
        {article.category && <span className="admin-badge">{article.category}</span>}
        {article.published_at && (
          <span className="text-[11px] text-gray-400">{formatDate(article.published_at)}</span>
        )}
      </div>

      <h2 className="text-xl font-bold text-gray-900 mt-3 leading-tight">{article.title}</h2>

      {article.summary && (
        <p className="text-[14px] text-gray-500 mt-2 leading-relaxed">{article.summary}</p>
      )}

      {article.images && article.images.length > 0 && (
        <img
          src={article.images[0]}
          alt={article.title}
          className="w-full rounded-lg mt-4 aspect-[16/9] object-cover"
        />
      )}

      {article.content && (
        <div
          className="mt-4 text-[14px] leading-[1.75] text-gray-700 [&_p]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      )}

      {article.source && (
        <p className="text-[12px] text-gray-400 mt-4">출처: {article.source}</p>
      )}

      <div className="sticky bottom-0 pt-4 pb-2 mt-4 bg-white">
        {processed ? (
          <div className="admin-btn w-full py-3 text-[15px] font-medium bg-gray-100 text-gray-400 cursor-not-allowed text-center">
            {isPublished ? "발행된 기사입니다 ✓" : "가져온 기사입니다 ✓"}
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={onImport}
              className="admin-btn admin-btn-ghost flex-1 py-3 text-[15px] font-medium"
            >
              가져오기
            </button>
            {onPublish && (
              <button
                onClick={onPublish}
                className="admin-btn admin-btn-primary flex-1 py-3 text-[15px] font-medium"
              >
                바로 발행
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function NfArticlePreview({ article, isImported, isPublished, onImport, onPublish, onClose }: NfArticlePreviewProps) {
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

  return (
    <>
      <div className="md:hidden">
        <div className="admin-overlay-backdrop animate-fade-backdrop" onClick={onClose} />
        <div className="admin-bottom-sheet animate-slide-up p-5" style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}>
          <PreviewContent article={article} isImported={isImported} isPublished={isPublished} onImport={onImport} onPublish={onPublish} />
        </div>
      </div>

      <div className="hidden md:block">
        <div className="admin-overlay-backdrop animate-fade-backdrop" onClick={onClose} />
        <div className="fixed top-0 right-0 bottom-0 w-[420px] z-[70] bg-white border-l border-gray-200 shadow-lg animate-slide-in-right overflow-y-auto p-6">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-10 h-10 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <PreviewContent article={article} isImported={isImported} isPublished={isPublished} onImport={onImport} onPublish={onPublish} />
        </div>
      </div>
    </>
  );
}
