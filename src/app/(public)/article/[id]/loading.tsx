export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-pulse">
      <div className="flex gap-2 mb-6">
        <div className="h-4 bg-gray-200 rounded w-8" />
        <div className="h-4 bg-gray-200 rounded w-3" />
        <div className="h-4 bg-gray-200 rounded w-16" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
        <div>
          <div className="h-6 bg-gray-200 rounded w-16 mb-3" />
          <div className="h-9 bg-gray-200 rounded w-full mb-2" />
          <div className="h-9 bg-gray-200 rounded w-4/5 mb-3" />
          <div className="h-5 bg-gray-200 rounded w-full mb-5" />

          <div className="h-4 bg-gray-200 rounded w-80 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-40 mb-5" />

          <div className="h-0.5 bg-gray-300 mb-8" />

          <div className="aspect-[16/9] bg-gray-200 mb-8" />

          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`body-${i}`}
                className={`h-4 bg-gray-200 rounded ${i % 3 === 2 ? "w-3/4" : "w-full"}`}
              />
            ))}
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="border border-gray-200">
            <div className="h-10 bg-gray-100 border-b-2 border-gray-300" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={`rank-${i}`}
                className="flex gap-2.5 px-4 py-2.5 border-b border-gray-100"
              >
                <div className="w-4 h-4 bg-gray-200 rounded-full flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-full mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
