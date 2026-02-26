export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* 속보 ticker placeholder */}
      <div className="h-9 bg-gray-100 border-b border-gray-200" />

      {/* 히어로 슬라이더 */}
      <div className="max-w-7xl mx-auto w-full relative h-[260px] md:h-[320px] lg:h-[420px] bg-gray-200 overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full p-4 md:p-8 lg:p-12">
          <div className="h-5 bg-gray-300 rounded w-16 mb-3" />
          <div className="h-8 bg-gray-300 rounded w-3/4 mb-2" />
          <div className="h-8 bg-gray-300 rounded w-1/2 mb-3" />
          <div className="h-4 bg-gray-300 rounded w-2/3 mb-2" />
          <div className="h-3 bg-gray-300 rounded w-40" />
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`dot-${i}`} className={`h-2 rounded-full bg-gray-300 ${i === 0 ? "w-6" : "w-2"}`} />
          ))}
        </div>
      </div>

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
