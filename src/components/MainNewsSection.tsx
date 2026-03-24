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

const MAX_ARTICLES = 6;
const AUTO_ROTATE_INTERVAL = 10000;

interface MainNewsSectionProps {
  articles: Article[];
}

export default function MainNewsSection({ articles }: MainNewsSectionProps) {
  const limitedArticles = articles.slice(0, MAX_ARTICLES);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const leftRef = useRef<HTMLDivElement>(null);

  const selected = limitedArticles[selectedIndex] || limitedArticles[0];

  useEffect(() => {
    if (limitedArticles.length <= 1 || isHovering) return;

    const interval = setInterval(() => {
      const nextIndex = (selectedIndex + 1) % limitedArticles.length;
      if (!isAnimating) {
        setIsAnimating(true);
        setSelectedIndex(nextIndex);
        setTimeout(() => setIsAnimating(false), 500);
      }
    }, AUTO_ROTATE_INTERVAL);

    return () => clearInterval(interval);
  }, [limitedArticles.length, isHovering, selectedIndex, isAnimating]);

  const handleSelect = (index: number) => {
    if (isAnimating || index === selectedIndex) return;
    setIsAnimating(true);
    setSelectedIndex(index);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleMouseEnter = (index: number) => {
    setIsHovering(true);
    handleSelect(index);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  if (limitedArticles.length === 0) return null;

  return (
    <div className="w-full">
      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-2 mb-3 border-b-2 border-gray-900">
        주요 뉴스
      </h2>
      <div className="flex flex-col lg:flex-row gap-5 lg:gap-6">
        <div ref={leftRef} className="lg:w-[58%] flex-shrink-0">
          <Link 
            href={`/article/${selected.id}`} 
            className="group block transition-all duration-500 ease-in-out"
            key={selected.id}
          >
            <div className="relative aspect-[16/9] md:aspect-[16/10] rounded-lg overflow-hidden mb-3">
              {hasImage(selected.thumbnailUrl) ? (
                <img
                  src={selected.thumbnailUrl}
                  alt={selected.title || "기사 이미지"}
                  className="object-cover w-full h-full group-hover:scale-105 transition-all duration-700 ease-out"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                    aria-label="이미지 없음"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div className="transition-all duration-500 ease-in-out">
              <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                {selected.category.name}
              </span>
              <h3 className="text-xl md:text-2xl lg:text-[28px] font-extrabold text-gray-900 mt-2 leading-tight group-hover:text-gray-500 transition-colors duration-300 line-clamp-2">
                {selected.title}
              </h3>
              <p className="text-[13px] md:text-[14px] text-gray-500 mt-2 line-clamp-3 leading-relaxed transition-opacity duration-500">
                {selected.excerpt}
              </p>
              <span className="text-xs text-gray-400 mt-2 block">
                {selected.author.name} · {formatDate(selected.publishedAt)}
              </span>
            </div>
          </Link>
        </div>

        <div className="lg:w-[42%] lg:border-l lg:border-gray-100 lg:pl-5 flex flex-col justify-center gap-1">
          {limitedArticles.map((article, index) => {
            const isActive = index === selectedIndex;
            return (
              <div
                key={article.id}
                className={`group flex gap-2 py-1.5 px-2 rounded-lg items-start transition-all duration-300 ease-out ${
                  isActive 
                    ? "bg-gray-100" 
                    : "hover:bg-gray-50"
                }`}
              >
                <Link
                  href={`/article/${article.id}`}
                  className="flex gap-2 w-full items-start cursor-pointer"
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div
                    className={`flex-shrink-0 w-1 rounded-full mt-1.5 h-4 transition-all duration-300 ${
                      isActive ? "bg-gray-900" : "bg-gray-300"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-medium px-1 py-0.5 rounded bg-gray-200 text-gray-600">
                        {article.category.name}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {formatDate(article.publishedAt)}
                      </span>
                    </div>
                    <h4
                      className={`text-[13px] font-semibold leading-snug line-clamp-2 transition-all duration-300 ${
                        isActive
                          ? "text-gray-900"
                          : "text-gray-700 group-hover:text-gray-500"
                      }`}
                    >
                      {article.title}
                    </h4>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
