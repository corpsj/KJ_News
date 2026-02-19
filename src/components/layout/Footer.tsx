import Link from "next/link";
import Image from "next/image";
import { getCategories } from "@/lib/db";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";

export default async function Footer() {
  const categories = await getCategories();
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
              <ul className="space-y-2">
                {categories.slice(0, 4).map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/category/${cat.slug}`}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-4">&nbsp;</h4>
              <ul className="space-y-2">
                {categories.slice(4).map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/category/${cat.slug}`}
                      className="text-sm hover:text-white transition-colors"
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
              <li>대표: 선종인</li>
              <li>발행·편집인: 장혁훈</li>
              <li>전화·제보: 010-9428-5361</li>
              <li>팩스: 0504-255-5361</li>
              <li>이메일: jebo@kjtimes.co.kr</li>
              <li>사업자등록번호: 173-91-02454</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-800">
          <div className="mb-8 flex justify-center">
            <NewsletterSubscribe />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs">
            &copy; {new Date().getFullYear()} 광전타임즈. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs">
            <Link href="/terms" className="hover:text-white transition-colors">
              이용약관
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              개인정보처리방침
            </Link>
            <a href="mailto:jebo@kjtimes.co.kr" className="hover:text-white transition-colors">
              광고문의
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
