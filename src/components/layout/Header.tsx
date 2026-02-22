"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import type { Category } from "@/lib/types";
import SearchBar from "@/components/SearchBar";
import { createClient } from "@/lib/supabase/client";

function getTodayKorean() {
  const now = new Date();
  const dayNames = [
    "일요일",
    "월요일",
    "화요일",
    "수요일",
    "목요일",
    "금요일",
    "토요일",
  ];
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const day = dayNames[now.getDay()];
  return `${year}년 ${month}월 ${date}일 ${day}`;
}

export default function Header({ categories }: { categories: Category[] }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const toggleMenu = useCallback(() => {
    setMobileMenuOpen((prev) => {
      const next = !prev;
      if (next) {
        document.body.classList.add("menu-open");
        setSearchOpen(false);
      } else {
        document.body.classList.remove("menu-open");
      }
      return next;
    });
  }, []);

  const closeMenu = useCallback(() => {
    setMobileMenuOpen(false);
    document.body.classList.remove("menu-open");
  }, []);

  useEffect(() => {
    return () => {
      document.body.classList.remove("menu-open");
    };
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setIsAdmin(!!data.session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="bg-gray-50 border-b border-gray-100 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between text-xs text-gray-500">
          <span>{getTodayKorean()}</span>
          {isAdmin ? (
            <div className="flex items-center gap-3">
              <Link href="/admin" className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors">
                관리자
              </Link>
            </div>
          ) : (
            <Link href="/admin/login" className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors">
              로그인
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-20">
          <button
            type="button"
            className="md:hidden flex items-center justify-center w-11 h-11 -ml-2 rounded-lg active:bg-gray-100 transition-colors"
            onClick={toggleMenu}
            aria-label="메뉴"
            aria-expanded={mobileMenuOpen}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          <Link href="/" className="flex items-center" onClick={closeMenu}>
            <Image
              src="/brand/KJ_sloganLogo.png"
              alt="광전타임즈"
              width={180}
              height={50}
              className="h-9 md:h-14 w-auto"
              priority
            />
          </Link>

          <button
            type="button"
            className="md:hidden flex items-center justify-center w-11 h-11 -mr-2 rounded-lg active:bg-gray-100 transition-colors"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="검색"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>

          <div className="hidden md:block w-64">
            <SearchBar />
          </div>
        </div>
      </div>

      <nav aria-label="주 메뉴" className="hidden md:block bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center gap-1">
            <li>
              <Link
                href="/special"
                className="block px-4 py-3 text-sm font-bold text-white hover:bg-gray-800 transition-colors"
              >
                창간특별호
              </Link>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/category/${cat.slug}`}
                  className="block px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {searchOpen && (
        <div className="md:hidden border-t border-gray-100 p-3 bg-white">
          <SearchBar />
        </div>
      )}

      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 top-[57px] bg-black/40 z-40 animate-fade-backdrop"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      <div
        className="md:hidden fixed inset-0 top-[57px] z-50 pointer-events-none"
      >
        <nav
          aria-label="모바일 메뉴"
          className={`pointer-events-auto bg-white w-[280px] max-w-[80vw] h-full overflow-y-auto shadow-xl transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500">{getTodayKorean()}</span>
          </div>

          <div className="py-2">
            <Link
              href="/special"
              className="flex items-center px-5 min-h-[48px] text-[15px] font-bold text-gray-900 active:bg-gray-50 transition-colors"
              onClick={closeMenu}
            >
              창간특별호
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="flex items-center px-5 min-h-[48px] text-[15px] font-medium text-gray-700 active:bg-gray-50 transition-colors"
                onClick={closeMenu}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          <div className="border-t border-gray-100 py-2">
            {isAdmin ? (
              <>
                <Link
                  href="/admin"
                  className="flex items-center px-5 min-h-[48px] text-[15px] font-medium text-gray-500 active:bg-gray-50"
                  onClick={closeMenu}
                >
                  관리자 페이지
                </Link>
              </>
            ) : (
              <Link
                href="/admin/login"
                className="flex items-center px-5 min-h-[48px] text-[15px] font-medium text-gray-500 active:bg-gray-50"
                onClick={closeMenu}
              >
                로그인
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
