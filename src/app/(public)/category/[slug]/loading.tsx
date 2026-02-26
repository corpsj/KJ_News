export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-5 md:py-8 animate-pulse">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4 md:mb-6">
        <div className="h-4 bg-gray-200 rounded w-8" />
        <span className="text-gray-300">/</span>
        <div className="h-4 bg-gray-200 rounded w-16" />
      </nav>

      {/* Category Header */}
      <div className="pb-3 md:pb-4 mb-5 md:mb-6 border-b-2 border-gray-200">
        <div className="h-7 md:h-8 bg-gray-200 rounded w-32 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-48" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-9">
          {/* Hero Article with Image */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 mb-6 border-b border-gray-200">
            <div className="aspect-[4/3] bg-gray-200 rounded-lg" />
            <div className="flex flex-col justify-center">
              <div className="h-7 bg-gray-200 rounded w-full mb-2" />
              <div className="h-7 bg-gray-200 rounded w-4/5 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-full mb-1" />
              <div className="h-4 bg-gray-200 rounded w-full mb-1" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-3 bg-gray-200 rounded w-40" />
            </div>
          </div>

          {/* Article List */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`article-${i}`} className="group flex gap-3 md:gap-5 py-4 md:py-5 border-b border-gray-100 last:border-b-0">
              <div className="flex-1 min-w-0">
                <div className="h-5 bg-gray-200 rounded w-full mb-2" />
                <div className="h-5 bg-gray-200 rounded w-4/5 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-40" />
              </div>
              <div className="flex-shrink-0 w-24 h-18 md:w-36 md:h-24 bg-gray-200 rounded-lg" />
            </div>
          ))}

          {/* Pagination */}
          <div className="mt-8 flex justify-center gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`page-${i}`} className="h-8 w-8 bg-gray-200 rounded" />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-3">
          <div className="lg:sticky lg:top-36 space-y-6">
            <div className="bg-white rounded-lg border border-gray-100 p-4 md:p-5">
              <div className="h-5 bg-gray-200 rounded w-24 mb-3" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={`sidebar-${i}`} className="flex gap-3 py-2">
                    <div className="h-6 w-6 bg-gray-200 rounded flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-full mb-1" />
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
