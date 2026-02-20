"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const nav = [
  {
    section: "콘텐츠",
    items: [
      {
        href: "/admin",
        label: "대시보드",
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" /></svg>,
      },
      {
        href: "/admin/articles",
        label: "기사 관리",
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
      },
      {
        href: "/admin/articles/new",
        label: "기사 작성",
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
      },
      {
        href: "/admin/news-feed",
        label: "뉴스팩토리",
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12.75 19.5v-.75a7.5 7.5 0 00-7.5-7.5H4.5m0-6.75h.75c7.87 0 14.25 6.38 14.25 14.25v.75M6 18.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>,
      },
    ],
  },
  {
    section: "커뮤니케이션",
    items: [
      {
        href: "/admin/mail",
        label: "메일",
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>,
      },
    ],
  },
];

function LogoutButton({ onMobileClose }: { onMobileClose?: () => void }) {
  const { logout } = useAuth();
  return (
    <button
      type="button"
      onClick={() => { onMobileClose?.(); logout(); }}
      className="flex items-center gap-2 w-full px-2.5 py-[7px] rounded-lg text-[13px] text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
      </svg>
      로그아웃
    </button>
  );
}

export default function AdminSidebar({ onMobileClose }: { onMobileClose?: () => void }) {
  const pathname = usePathname();

  const allHrefs = nav.flatMap((g) => g.items.map((i) => i.href));
  const activeHref = allHrefs
    .filter((h) => (h === "/admin" ? pathname === "/admin" : pathname.startsWith(h)))
    .sort((a, b) => b.length - a.length)[0] ?? "";

  function isActive(href: string) {
    return href === activeHref;
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-white border-r border-gray-200 z-50 flex flex-col">
      <div className="flex items-center h-14 px-5 border-b border-gray-100">
        <Link href="/admin" className="flex items-center gap-2" onClick={onMobileClose}>
          <span className="text-[15px] font-extrabold tracking-tight text-gray-900">광전타임즈</span>
          <span className="text-[10px] font-medium text-gray-400 border border-gray-200 rounded px-1.5 py-px">CMS</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3">
        {nav.map((group) => (
          <div key={group.section}>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-1.5">{group.section}</p>
            <nav className="space-y-px mb-4">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onMobileClose}
                    className={`flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] transition-colors relative ${
                      active
                        ? "bg-gray-100 text-gray-900 font-semibold before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:bg-gray-900 before:rounded-full"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <span className={active ? "text-gray-900" : "text-gray-400"}>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="px-3 py-3 border-t border-gray-100 space-y-px">
        <Link
          href="/"
          className="flex items-center gap-2 px-2.5 py-[7px] rounded-lg text-[13px] text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          사이트 보기
        </Link>
        <LogoutButton onMobileClose={onMobileClose} />
      </div>
    </aside>
  );
}
