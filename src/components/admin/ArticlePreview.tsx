"use client";

import { useEffect } from "react";
import { formatDate } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";

interface ArticlePreviewProps {
  article: {
    title: string;
    subtitle?: string;
    excerpt?: string;
    content: string;
    category?: { name: string };
    author?: { name: string; role?: string };
    publishedAt?: string;
    thumbnailUrl?: string;
    status?: string;
    source?: string;
  };
  onClose: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "임시저장",
  pending_review: "검토중",
  scheduled: "예약됨",
  published: "발행됨",
  archived: "보관됨",
  rejected: "반려됨",
};

export default function ArticlePreview({ article, onClose }: ArticlePreviewProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-backdrop"
        onClick={onClose}
      />

      <div className="relative z-[71] w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl md:my-8 bg-white md:rounded-xl md:border md:border-gray-200 overflow-y-auto animate-fade-in">
        <button
          type="button"
          onClick={onClose}
          className="sticky top-0 float-right m-3 w-10 h-10 rounded-lg bg-white/80 backdrop-blur border border-gray-200 flex items-center justify-center z-10 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 md:p-8 pt-2">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {article.source && (
              <span className="admin-badge">뉴스팩토리</span>
            )}
            {article.status && STATUS_LABEL[article.status] && (
              <span className={`admin-badge-${article.status}`}>
                {STATUS_LABEL[article.status]}
              </span>
            )}
            {article.category && (
              <span className="admin-badge">{article.category.name}</span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
            {article.title}
          </h1>

          {article.subtitle && (
            <p className="text-lg text-gray-500 mt-2">{article.subtitle}</p>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-400 mt-3">
            {article.author && <span>{article.author.name}</span>}
            {article.author && article.publishedAt && <span>·</span>}
            {article.publishedAt && <span>{formatDate(article.publishedAt)}</span>}
          </div>

          {article.thumbnailUrl && article.thumbnailUrl.trim() && (
            <div className="mt-6 rounded-lg overflow-hidden">
              <img
                src={article.thumbnailUrl}
                alt={article.title}
                className="w-full aspect-[16/9] object-cover"
              />
            </div>
          )}

          {article.excerpt && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <p className="text-[14px] text-gray-600 italic leading-relaxed">
                {article.excerpt}
              </p>
            </div>
          )}

           <div className="border-t border-gray-200 mt-6 pt-6">
             <div
               className="text-[15px] md:text-[16px] leading-[1.8] text-gray-700 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-4 [&_ul]:my-3 [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:pl-6 [&_li]:mb-1 [&_a]:text-gray-900 [&_a]:underline"
               dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
             />
           </div>
        </div>
      </div>
    </div>
  );
}
