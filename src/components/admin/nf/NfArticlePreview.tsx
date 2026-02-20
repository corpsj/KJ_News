"use client";

import { useEffect } from "react";
import type { NfArticle } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { plainTextToHtml, NF_CATEGORY_LABELS } from "@/lib/nf-constants";

interface NfArticlePreviewProps {
  article: NfArticle;
  isImported: boolean;
  isPublished?: boolean;
  onImport: () => void;
  onPublish?: () => void;
  onClose: () => void;
}

export default function NfArticlePreview({ article, isImported, isPublished, onImport, onPublish, onClose }: NfArticlePreviewProps) {
  const processed = isImported || isPublished;

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
      <button type="button" className="admin-overlay-backdrop animate-fade-backdrop" onClick={onClose} aria-label="닫기" />

      <div className="fixed inset-0 z-[70] md:flex md:items-center md:justify-center md:p-6">
        <div className="
          h-full w-full bg-white overflow-y-auto animate-nf-lightbox-mobile
          md:h-auto md:max-h-[calc(100vh-48px)] md:w-full md:max-w-2xl md:rounded-2xl md:shadow-2xl md:animate-nf-lightbox
        ">
          {article.images?.[0] && (
            <div className="relative">
              <img
                src={article.images[0]}
                alt={article.title}
                className="w-full aspect-[2/1] object-cover md:rounded-t-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent md:rounded-t-2xl" />

              <button
                type="button"
                onClick={onClose}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 text-white" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="absolute bottom-3 left-4 flex items-center gap-1.5">
                <span className="nf-ai-badge">
                  <svg className="w-3 h-3" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  뉴스팩토리
                </span>
                {article.category && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-white/20 backdrop-blur-sm text-white">
                    {NF_CATEGORY_LABELS[article.category] || article.category}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="px-5 pt-5 pb-4 md:px-8 md:pt-6">
            {!article.images?.[0] && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  <span className="nf-ai-badge">
                    <svg className="w-3 h-3" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    뉴스팩토리
                  </span>
                  {article.category && <span className="admin-badge">{NF_CATEGORY_LABELS[article.category] || article.category}</span>}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-400" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {article.images?.[0] && (
              <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-2">
                {article.source && <span>{article.source}</span>}
                {article.source && article.published_at && <span>·</span>}
                {article.published_at && <span>{formatDate(article.published_at)}</span>}
                {article.processed_at && <span className="nf-ai-badge-outline ml-1">AI 수집</span>}
              </div>
            )}

            <h2 className="text-[20px] md:text-[22px] font-bold text-gray-900 leading-tight">
              {article.title}
            </h2>

            {!article.images?.[0] && (
              <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-2">
                {article.source && <span className="nf-source-badge">{article.source}</span>}
                {article.published_at && <span>{formatDate(article.published_at)}</span>}
                {article.processed_at && <span className="nf-ai-badge-outline">AI 수집</span>}
              </div>
            )}

            {article.summary && (
              <p className="text-[14px] text-gray-500 leading-relaxed mt-3 border-l-2 border-gray-200 pl-3">
                {article.summary}
              </p>
            )}

            {article.content && (
              <div
                className="mt-5 text-[14px] md:text-[15px] leading-[1.8] text-gray-700 [&_p]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1"
                dangerouslySetInnerHTML={{ __html: plainTextToHtml(article.content) }}
              />
            )}

            {article.source_url && (
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 mt-4 transition-colors"
              >
                <svg className="w-3 h-3" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                원문 보기
              </a>
            )}
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-3 md:px-8 md:py-4 md:rounded-b-2xl">
            {processed ? (
              <div className="text-center text-[13px] text-gray-400 py-1">
                {isPublished ? "발행 완료" : "가져오기 완료"}
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onImport}
                  className="admin-btn admin-btn-ghost flex-1 py-2.5 text-[13px] font-medium"
                >
                  가져오기
                </button>
                {onPublish && (
                  <button
                    type="button"
                    onClick={onPublish}
                    className="admin-btn admin-btn-primary flex-1 py-2.5 text-[13px] font-medium"
                  >
                    바로 발행
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
