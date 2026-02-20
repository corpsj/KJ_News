import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "창간특별호 - 광전타임즈",
  description:
    "광전타임즈 창간특별호. 전남 함평군 함평읍 영수길 148 2층.",
};

export default function SpecialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center h-14 md:h-20 gap-3 md:gap-4">
            <Link href="/special" className="flex items-center">
              <Image
                src="/brand/KJ_sloganLogo.png"
                alt="광전타임즈"
                width={180}
                height={50}
                className="h-9 md:h-14 w-auto"
                priority
              />
            </Link>
            <span className="text-[11px] md:text-xs font-bold text-gray-900 bg-gray-100 px-2.5 md:px-3 py-1 rounded tracking-wide">
              창간특별호
            </span>
          </div>
        </div>
      </header>

      <main className="min-h-screen">{children}</main>

      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 md:gap-6">
            <div>
              <Link href="/special" className="inline-block mb-3">
                <Image
                  src="/brand/KJ_Logo.png"
                  alt="광전타임즈"
                  width={140}
                  height={40}
                  className="h-7 md:h-8 w-auto brightness-0 invert"
                />
              </Link>
              <p className="text-xs md:text-sm leading-relaxed">
                전남 함평군 함평읍 영수길 148 2층
              </p>
            </div>
            <div className="text-xs md:text-sm space-y-1 md:text-right">
              <p>등록번호: 전남, 아00607</p>
              <p>대표·발행인: 선종인 · 편집인: 장혁훈</p>
              <p>전화·제보: 010-9428-5361</p>
              <p>이메일: jebo@kjtimes.co.kr</p>
            </div>
          </div>
          <div className="mt-6 md:mt-8 pt-5 md:pt-6 border-t border-gray-800 text-center">
            <p className="text-xs">
              &copy; {new Date().getFullYear()} 광전타임즈. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
