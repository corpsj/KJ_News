"use client";

import { useAdmin } from "@/contexts/AdminContext";
import { ARTICLE_STATUS_LABELS, type ArticleStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import StatCard from "@/components/admin/StatCard";
import Link from "next/link";

export default function AdminDashboard() {
  const { articles, categories } = useAdmin();

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = articles.filter((a) => a.publishedAt.slice(0, 10) === today).length;
  const totalViews = articles.reduce((sum, a) => sum + a.viewCount, 0);
  const pendingCount = articles.filter((a) => a.status === "pending_review").length;

  const statusCounts = articles.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topViewed = [...articles].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);
  const recentArticles = [...articles]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 5);

  const categoryDist = categories.map((c) => ({
    name: c.name,
    count: articles.filter((a) => a.category.slug === c.slug).length,
  }));
  const maxCount = Math.max(...categoryDist.map((c) => c.count), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-xl font-bold text-gray-900">대시보드</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="총 기사 수"
          value={articles.length}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
        />
        <StatCard
          label="오늘 등록"
          value={todayCount}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>}
        />
        <StatCard
          label="총 조회수"
          value={totalViews.toLocaleString()}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard
          label="검토 대기"
          value={pendingCount}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      <div className="admin-card p-4 flex flex-wrap gap-2">
         {(Object.keys(ARTICLE_STATUS_LABELS) as ArticleStatus[]).map((status) => (
           <span key={status} className={`admin-badge-${status}`}>
             {ARTICLE_STATUS_LABELS[status]} {statusCounts[status] || 0}
           </span>
         ))}
       </div>

       {articles.length === 0 && (
         <div className="admin-card p-8 text-center">
           <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 border border-gray-100 mb-4">
             <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
             </svg>
           </div>
           <h2 className="text-[15px] font-semibold text-gray-900 mb-1">첫 번째 기사를 작성해보세요</h2>
           <p className="text-[13px] text-gray-400 mb-5">기사를 등록하면 대시보드에서 통계와 현황을 확인할 수 있습니다.</p>
           <Link href="/admin/articles/new" className="admin-btn admin-btn-primary">
             새 기사 작성
           </Link>
         </div>
       )}

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="admin-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-semibold text-gray-900">최근 기사</h2>
            <Link href="/admin/articles" className="text-[12px] text-gray-400 hover:text-gray-700 transition-colors">
              전체보기 →
            </Link>
          </div>
           <div className="space-y-0">
             {recentArticles.length > 0 ? (
               recentArticles.map((a) => (
                 <div key={a.id} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-b-0">
                   <div className="flex-1 min-w-0">
                     <Link href={`/admin/articles/${a.id}/edit`} className="text-[13px] font-medium text-gray-800 hover:text-gray-900 truncate block">
                       {a.title}
                     </Link>
                     <span className="text-[11px] text-gray-400">{formatDate(a.publishedAt)}</span>
                   </div>
                   <span className="admin-badge flex-shrink-0">{a.category.name}</span>
                 </div>
               ))
             ) : (
               <div className="py-8 text-center">
                 <p className="text-[13px] text-gray-400">아직 등록된 기사가 없습니다.</p>
                 <Link href="/admin/articles/new" className="text-[12px] text-gray-500 hover:text-gray-900 mt-2 inline-block transition-colors">
                   기사 작성하기 →
                 </Link>
               </div>
             )}
           </div>
        </div>

         <div className="admin-card p-5">
           <h2 className="text-[14px] font-semibold text-gray-900 mb-4">카테고리 분포</h2>
           {articles.length > 0 ? (
             <div className="space-y-3">
               {categoryDist.map((c) => (
                 <div key={c.name} className="flex items-center gap-3">
                   <span className="text-[12px] text-gray-500 w-16 flex-shrink-0">{c.name}</span>
                   <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                     <div
                       className="bg-gray-400 h-full rounded-full transition-all duration-500"
                       style={{ width: `${(c.count / maxCount) * 100}%` }}
                     />
                   </div>
                   <span className="text-[12px] text-gray-500 w-6 text-right">{c.count}</span>
                 </div>
               ))}
             </div>
           ) : (
             <div className="py-6 text-center">
               <p className="text-[13px] text-gray-400">기사를 등록하면 카테고리별 분포가 표시됩니다.</p>
             </div>
           )}
         </div>
      </div>

       <div className="admin-card p-5">
         <h2 className="text-[14px] font-semibold text-gray-900 mb-4">조회수 TOP 5</h2>
         <div className="space-y-0">
           {topViewed.length > 0 ? (
             topViewed.map((a, i) => (
               <div key={a.id} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-b-0">
                 <span className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-500 flex-shrink-0">
                   {i + 1}
                 </span>
                 <div className="flex-1 min-w-0">
                   <Link href={`/admin/articles/${a.id}/edit`} className="text-[13px] font-medium text-gray-800 hover:text-gray-900 truncate block">
                     {a.title}
                   </Link>
                 </div>
                 <span className="text-[12px] text-gray-400 flex-shrink-0">
                   {a.viewCount.toLocaleString()}회
                 </span>
               </div>
             ))
           ) : (
             <div className="py-8 text-center">
               <p className="text-[13px] text-gray-400">기사가 등록되면 조회수 순위가 표시됩니다.</p>
             </div>
           )}
         </div>
       </div>
    </div>
  );
}
