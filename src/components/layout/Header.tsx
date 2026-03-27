"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

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
          <Link href="/" className="flex items-center">
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

      <nav aria-label="모바일 메뉴" className="md:hidden bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-2">
          <ul className="flex items-center justify-between">
            {categories.map((cat) => (
              <li key={cat.id} className="flex-1 text-center">
                <Link
                  href={`/category/${cat.slug}`}
                  className="block py-2.5 text-[11px] font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors whitespace-nowrap"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <nav aria-label="주 메뉴" className="hidden md:block bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center gap-1">
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
    </header>
  );
}
