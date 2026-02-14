"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { categories } from "@/lib/mock-data";
import SearchBar from "@/components/SearchBar";

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

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      {/* Top bar */}
      <div className="bg-gray-50 border-b border-gray-100 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between text-xs text-gray-500">
          <span>{getTodayKorean()}</span>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-gray-800 transition-colors">
              로그인
            </Link>
            <Link href="#" className="hover:text-gray-800 transition-colors">
              회원가입
            </Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 -ml-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="메뉴"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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

          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/brand/KJ_sloganLogo.png"
              alt="광전타임즈"
              width={180}
              height={50}
              className="h-10 md:h-14 w-auto"
              priority
            />
          </Link>

          {/* Search toggle */}
          <button
            className="p-2 -mr-2 md:hidden"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="검색"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>

          {/* Desktop search */}
          <div className="hidden md:block w-64">
            <SearchBar />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="hidden md:block bg-gray-900">
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

      {/* Mobile search */}
      {searchOpen && (
        <div className="md:hidden border-t border-gray-100 p-3 bg-white">
          <SearchBar />
        </div>
      )}

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <nav className="px-4 py-2">
            <Link
              href="/special"
              className="block py-3 text-sm font-bold text-gray-900 border-b border-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              창간특별호
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="block py-3 text-sm font-medium text-gray-700 border-b border-gray-50 hover:text-gray-900 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
