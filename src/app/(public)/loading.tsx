export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* 속보 ticker placeholder */}
      <div className="h-9 bg-gray-100 border-b border-gray-200" />

      {/* 히어로 섹션 */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 좌: 히어로 */}
            <div className="lg:col-span-5">
              <div className="aspect-[4/3] bg-gray-200 rounded-lg mb-3" />
              <div className="h-4 bg-gray-200 rounded w-16 mb-2" />
              <div className="h-7 bg-gray-200 rounded w-full mb-1" />
              <div className="h-7 bg-gray-200 rounded w-4/5 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-full mb-1" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>

            {/* 중앙: 헤드라인 목록 */}
            <div className="lg:col-span-4">
              <div className="h-5 bg-gray-200 rounded w-24 mb-3" />
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={`headline-${i}`} className="flex gap-3 py-3.5 border-b border-gray-100">
                  <div className="w-1 h-4 bg-gray-200 rounded-full mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 rounded w-16 mb-1.5" />
                    <div className="h-4 bg-gray-200 rounded w-full mb-1" />
                    <div className="h-4 bg-gray-200 rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>

            {/* 우: 서브 이미지 2개 */}
            <div className="lg:col-span-3 flex flex-col gap-5">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={`sub-image-${i}`}>
                  <div className="aspect-[16/10] bg-gray-200 rounded-lg mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-12 mb-1.5" />
                  <div className="h-4 bg-gray-200 rounded w-full mb-1" />
                  <div className="h-4 bg-gray-200 rounded w-4/5" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 하단 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`category-${i}`}>
              <div className="h-5 bg-gray-200 rounded w-24 mb-3" />
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={`item-${j}`} className="flex gap-3 py-3.5 border-b border-gray-100">
                  <div className="w-1 h-4 bg-gray-200 rounded-full mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-full mb-1" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
