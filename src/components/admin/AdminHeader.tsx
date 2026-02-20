"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const breadcrumbMap: Record<string, { label: string; href?: string }[]> = {
  "/admin": [{ label: "대시보드" }],
  "/admin/articles": [{ label: "기사 관리" }],
  "/admin/articles/new": [{ label: "기사 관리", href: "/admin/articles" }, { label: "새 기사 작성" }],
  "/admin/news-feed": [{ label: "뉴스 피드" }],
  "/admin/mail": [{ label: "메일" }],
};

export default function AdminHeader({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isEditPage = /^\/admin\/articles\/.+\/edit$/.test(pathname);
  const crumbs = isEditPage
    ? [{ label: "기사 관리", href: "/admin/articles" }, { label: "기사 수정" }]
    : breadcrumbMap[pathname] ?? [{ label: "관리자" }];
  const pageTitle = crumbs[crumbs.length - 1].label;

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-5 sticky top-0 z-30">
      <button type="button" onClick={onMenuToggle} className="p-1.5 -ml-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors lg:hidden mr-2" aria-label="메뉴">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
      </button>

      <div className="min-w-0">
        <nav className="flex items-center gap-1 text-[13px]">
          <Link href="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">홈</Link>
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="text-gray-300">/</span>
              {c.href ? (
                <Link href={c.href} className="text-gray-400 hover:text-gray-600 transition-colors">{c.label}</Link>
              ) : (
                <span className="text-gray-900 font-medium">{pageTitle}</span>
              )}
            </span>
          ))}
        </nav>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center" title={user?.email ?? ""}>
          <span className="text-white text-[10px] font-bold">
            {user?.email?.[0]?.toUpperCase() ?? "A"}
          </span>
        </div>
      </div>
    </header>
  );
}
