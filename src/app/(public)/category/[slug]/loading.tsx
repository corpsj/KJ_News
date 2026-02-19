export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      {/* 브레드크럼 */}
      <div className="flex gap-2 mb-6">
        <div className="h-4 bg-gray-200 rounded w-8" />
        <div className="h-4 bg-gray-200 rounded w-2" />
        <div className="h-4 bg-gray-200 rounded w-16" />
      </div>

      {/* 카테고리 헤더 */}
      <div className="pb-4 mb-6 border-b-2 border-gray-200">
        <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-48" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-9">
          {/* 히어로 기사 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 mb-6 border-b border-gray-200">
            <div className="aspect-[4/3] bg-gray-200 rounded-lg" />
            <div>
              <div className="h-7 bg-gray-200 rounded w-full mb-2" />
              <div className="h-7 bg-gray-200 rounded w-4/5 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-full mb-1" />
              <div className="h-4 bg-gray-200 rounded w-full mb-1" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          </div>

          {/* 기사 목록 */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`article-${i}`} className="flex gap-5 py-5 border-b border-gray-100">
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-full mb-2" />
                <div className="h-5 bg-gray-200 rounded w-4/5 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-32" />
              </div>
              <div className="w-28 h-20 bg-gray-200 rounded-lg flex-shrink-0" />
            </div>
          ))}
        </div>

        {/* 사이드바 */}
        <aside className="lg:col-span-3">
          <div className="h-5 bg-gray-200 rounded w-24 mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`sidebar-${i}`} className="flex gap-3 py-3 border-b border-gray-100">
              <div className="w-6 h-6 bg-gray-200 rounded flex-shrink-0" />
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded w-full mb-1" />
                <div className="h-3 bg-gray-200 rounded w-4/5" />
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
