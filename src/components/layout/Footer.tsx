"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";

interface FooterProps {
  categories: Category[];
}

export default function Footer({ categories }: FooterProps) {
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
    <footer role="contentinfo" className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/brand/KJ_Logo.png"
                alt="광전타임즈"
                width={140}
                height={40}
                className="h-8 w-auto brightness-0 invert"
              />
            </Link>
            <p className="text-sm leading-relaxed">
              전남 함평군 함평읍 영수길 148 2층
            </p>
          </div>

          {/* Categories */}
          <nav aria-label="푸터 카테고리 메뉴">
            <div>
              <h4 className="text-sm font-bold text-white mb-4">카테고리</h4>
              <ul className="space-y-1">
                {categories.slice(0, 4).map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/category/${cat.slug}`}
                      className="inline-flex items-center min-h-[44px] text-sm hover:text-white transition-colors"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="h-5 mb-4 hidden md:block" aria-hidden="true" />
              <ul className="space-y-1">
                {categories.slice(4).map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/category/${cat.slug}`}
                      className="inline-flex items-center min-h-[44px] text-sm hover:text-white transition-colors"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Info */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4">회사 정보</h4>
            <ul className="space-y-2 text-sm">
              <li>등록번호: 전남, 아00607</li>
              <li>대표·발행인: 선종인</li>
              <li>편집인: 장혁훈</li>
              <li>전화·제보: 010-9428-5361</li>
              <li>팩스: 0504-255-5361</li>
              <li>이메일: jebo@kjtimes.co.kr</li>
              <li>사업자등록번호: 173-91-02454</li>
            </ul>
          </div>
        </div>

        <div className="md:hidden mt-6 pt-4 border-t border-gray-800 text-center">
          {isAdmin ? (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="관리자 아이콘">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              관리자
            </Link>
          ) : (
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="사용자 아이콘">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              로그인
            </Link>
          )}
        </div>

        <div className="mt-10 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs">
            &copy; {new Date().getFullYear()} 광전타임즈. All rights reserved.
          </p>
          <div className="flex items-center gap-2 md:gap-6 text-xs">
            <Link href="/terms" className="inline-flex items-center min-h-[44px] px-2 hover:text-white transition-colors">
              이용약관
            </Link>
            <Link href="/privacy" className="inline-flex items-center min-h-[44px] px-2 hover:text-white transition-colors">
              개인정보처리방침
            </Link>
            <a href="mailto:jebo@kjtimes.co.kr" className="inline-flex items-center min-h-[44px] px-2 hover:text-white transition-colors">
              광고문의
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
