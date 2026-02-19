export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      {/* 브레드크럼 */}
      <div className="flex gap-2 mb-6">
        <div className="h-4 bg-gray-200 rounded w-8" />
        <div className="h-4 bg-gray-200 rounded w-2" />
        <div className="h-4 bg-gray-200 rounded w-16" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* 기사 본문 */}
        <article className="lg:col-span-2">
          <div className="h-5 bg-gray-200 rounded w-16 mb-4" />
          <div className="h-9 bg-gray-200 rounded w-full mb-2" />
          <div className="h-9 bg-gray-200 rounded w-4/5 mb-3" />
          <div className="h-5 bg-gray-200 rounded w-full mb-6" />

          {/* 저자 */}
          <div className="flex items-center gap-4 pb-6 mb-6 border-b border-gray-200">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-20 mb-1" />
              <div className="h-3 bg-gray-200 rounded w-28" />
            </div>
          </div>

          {/* 대표 이미지 */}
          <div className="aspect-[16/9] bg-gray-200 rounded-lg mb-8" />

          {/* 본문 */}
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={`para-${i}`} className={`h-4 bg-gray-200 rounded ${i % 3 === 2 ? "w-3/4" : "w-full"}`} />
            ))}
          </div>
        </article>

        {/* 사이드바 */}
        <div className="hidden lg:block">
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
        </div>
      </div>
    </div>
  );
}
