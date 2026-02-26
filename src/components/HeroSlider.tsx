"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/types";
import CategoryBadge from "@/components/CategoryBadge";
import { formatDate } from "@/lib/utils";

interface HeroSliderProps {
  articles: Article[];
}

export default function HeroSlider({ articles }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  // Check for prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % articles.length);
  }, [articles.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + articles.length) % articles.length);
  }, [articles.length]);

  // Auto-play
  useEffect(() => {
    if (isReducedMotion || isHovered || articles.length <= 1) return;
    const timer = setInterval(goToNext, 5000);
    return () => clearInterval(timer);
  }, [goToNext, isReducedMotion, isHovered, articles.length]);

  if (!articles || articles.length === 0) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToPrev();
    if (e.key === "ArrowRight") goToNext();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !touchStartY) return;
    const xDiff = Math.abs(e.targetTouches[0].clientX - touchStart);
    const yDiff = Math.abs(e.targetTouches[0].clientY - touchStartY);
    
    // Prevent tracking as swipe if vertical scrolling is dominant
    if (xDiff > yDiff) {
      setTouchEnd(e.targetTouches[0].clientX);
    }
  };

  const onTouchEndEvent = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;
    
    if (distance > minSwipeDistance) goToNext();
    if (distance < -minSwipeDistance) goToPrev();
  };

  return (
    <div
      className="max-w-7xl mx-auto w-full relative group overflow-hidden bg-gray-50 h-[260px] md:h-[320px] lg:h-[420px]"
      role="region"
      aria-label="주요 뉴스 슬라이더"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEndEvent}
      tabIndex={0}
    >
      <div className="w-full h-full relative" aria-live="polite">
        {articles.map((article, index) => {
          const isActive = index === currentIndex;
          const offset = index - currentIndex;

          return (
            <div
              key={article.id}
              className={`absolute inset-0 w-full h-full ${
                isReducedMotion
                  ? `transition-opacity duration-500 ease-in-out ${
                      isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                    }`
                  : `transition-transform duration-500 ease-in-out ${
                      isActive ? "z-10" : "z-0"
                    }`
              }`}
              style={
                !isReducedMotion
                  ? { transform: `translateX(${offset * 100}%)` }
                  : undefined
              }
              aria-hidden={!isActive}
            >
              <Link
                href={`/article/${article.id}`}
                className="block w-full h-full relative group/link focus:outline-none"
                tabIndex={isActive ? 0 : -1}
              >
                {article.thumbnailUrl ? (
                  <Image
                    src={article.thumbnailUrl}
                    alt={article.title}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 100vw, 1280px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />

                {/* Text area */}
                <div className="absolute bottom-0 left-0 w-full p-4 md:p-8 lg:p-12 text-left pointer-events-none">
                  <div className="mb-3 md:mb-4 inline-block shadow-sm ring-1 ring-white/20 rounded">
                    <CategoryBadge category={article.category} size="sm" />
                  </div>
                  <h2 className="text-white text-xl md:text-2xl lg:text-3xl font-extrabold line-clamp-2 leading-tight drop-shadow-md">
                    {article.title}
                  </h2>
                  <p className="text-white/80 text-sm md:text-base line-clamp-2 mt-2 max-w-3xl drop-shadow">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center text-white/60 text-xs md:text-sm mt-2 gap-3 drop-shadow">
                    <span className="font-medium text-white/80">{article.author.name}</span>
                    <span className="w-1 h-1 rounded-full bg-white/40" />
                    <span>{formatDate(article.publishedAt)}</span>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Arrow Navigation */}
      {articles.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              goToPrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm transition-all opacity-0 md:group-hover:opacity-100 hidden md:flex focus:opacity-100 outline-none ring-2 ring-transparent focus:ring-white/50"
            aria-label="이전 기사"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              goToNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm transition-all opacity-0 md:group-hover:opacity-100 hidden md:flex focus:opacity-100 outline-none ring-2 ring-transparent focus:ring-white/50"
            aria-label="다음 기사"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {articles.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {articles.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-1 focus:ring-offset-black/20 ${
                index === currentIndex ? "bg-white w-6" : "bg-white/50 hover:bg-white/80 w-2"
              }`}
              aria-label={`${index + 1}번째 기사로 이동`}
              aria-current={index === currentIndex ? "true" : "false"}
            />
          ))}
        </div>
      )}

      {/* Optional Slide Counter */}
      {articles.length > 1 && (
        <div className="absolute top-4 right-4 z-20 bg-black/40 backdrop-blur-md text-white/90 text-xs font-medium px-3 py-1.5 rounded-full pointer-events-none tracking-widest hidden md:block">
          {currentIndex + 1} / {articles.length}
        </div>
      )}
    </div>
  );
}
