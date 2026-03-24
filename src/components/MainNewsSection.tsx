"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { Article } from "@/lib/types";

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

function hasImage(url: string | undefined | null): boolean {
  if (!url || url.trim().length === 0) return false;
  const trimmed = url.trim();
  return trimmed.startsWith("http://") || trimmed.startsWith("https://");
}

const PER_PAGE = 10;

interface MainNewsSectionProps {
  articles: Article[];
}

export default function MainNewsSection({ articles }: MainNewsSectionProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const leftRef = useRef<HTMLDivElement>(null);
  const [leftHeight, setLeftHeight] = useState<number | undefined>(undefined);

  const totalPages = Math.ceil(articles.length / PER_PAGE);
  const startIdx = (currentPage - 1) * PER_PAGE;
  const pageArticles = articles.slice(startIdx, startIdx + PER_PAGE);
  const selected = articles[selectedIndex] || articles[0];

  /* 좌측 높이가 바뀔 때마다 우측 높이를 동기화 */
  useEffect(() => {
    if (!leftRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setLeftHeight(entry.contentRect.height);
      }
    });
    ro.observe(leftRef.current);
    return () => ro.disconnect();
  }, []);

  const handleSelect = (globalIndex: number) => {
    setSelectedIndex(globalIndex);
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    const newStartIdx = (page - 1) * PER_PAGE;
    setSelectedIndex(newStartIdx);
  };

  if (articles.length === 0) return null;

  return (
    <div className="w-full">
      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-2 mb-3 border-b-2 border-gray-900">
        주요 뉴스
      </h2>
      <div className="flex flex-col lg:flex-row gap-5 lg:gap-6">
        {/* 좌측: 선택한 기사 상세 */}
        <div ref={leftRef} className="lg:w-[58%] flex-shrink-0">
          <Link href={`/article/${selected.id}`} className="group block">
            {hasImage(selected.thumbnailUrl) ? (
              <div className="relative aspect-[16/9] md:aspect-[16/10] rounded-lg overflow-hidden mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected.thumbnailUrl}
                  alt={selected.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ) : (
              <div className="aspect-[16/9] md:aspect-[16/10] rounded-lg overflow-hidden mb-3 bg-gray-100 flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z"
                  />
                </svg>
              </div>
            )}
            <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
              {selected.category.name}
            </span>
            <h3 className="text-xl md:text-2xl lg:text-[28px] font-extrabold text-gray-900 mt-2 leading-tight group-hover:text-gray-500 transition-colors line-clamp-2">
              {selected.title}
            </h3>
            <p className="text-[13px] md:text-[14px] text-gray-500 mt-2 line-clamp-3 leading-relaxed">
              {selected.excerpt}
            </p>
            <span className="text-xs text-gray-400 mt-2 block">
              {selected.author.name} · {formatDate(selected.publishedAt)}
            </span>
          </Link>
        </div>

        {/* 우측: 주요뉴스 리스트 + 페이지네이션 */}
        <div
          className="lg:w-[42%] lg:border-l lg:border-gray-100 lg:pl-5 flex flex-col"
          style={leftHeight ? { height: leftHeight } : undefined}
        >
          <div className="flex-1 overflow-y-auto min-h-0">
            {pageArticles.map((article, i) => {
              const globalIdx = startIdx + i;
              const isActive = globalIdx === selectedIndex;
              return (
                <button
                  key={article.id}
                  type="button"
                  onClick={() => handleSelect(globalIdx)}
                  className={`group flex gap-3 py-2 border-b border-gray-100 last:border-b-0 items-start w-full text-left transition-colors ${
                    isActive ? "bg-gray-50 -mx-2 px-2 rounded" : ""
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-1 rounded-full mt-1.5 self-start h-4 ${
                      isActive ? "bg-gray-900" : "bg-gray-300"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 whitespace-nowrap">
                        {article.category.name}
                      </span>
                      <span className="text-[11px] text-gray-400 whitespace-nowrap">
                        {formatDate(article.publishedAt)}
                      </span>
                    </div>
                    <h4
                      className={`text-[13px] md:text-[14px] font-bold leading-snug line-clamp-1 transition-colors ${
                        isActive
                          ? "text-gray-900"
                          : "text-gray-700 group-hover:text-gray-500"
                      }`}
                    >
                      {article.title}
                    </h4>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex-shrink-0 flex items-center justify-center gap-1 mt-auto pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center justify-center w-8 h-8 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="이전 페이지"
              >
                ←
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => goToPage(page)}
                    className={`flex items-center justify-center w-8 h-8 text-sm rounded-lg transition-colors ${
                      page === currentPage
                        ? "bg-gray-900 text-white font-semibold"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center w-8 h-8 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="다음 페이지"
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
