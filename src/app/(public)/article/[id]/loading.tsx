export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 animate-pulse">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[13px] text-gray-500 mb-5 md:mb-6">
        <div className="h-4 bg-gray-200 rounded w-8" />
        <span className="text-gray-300">&gt;</span>
        <div className="h-4 bg-gray-200 rounded w-16" />
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 lg:gap-10">
        {/* Main Article Content */}
        <article>
          {/* Category Badge */}
          <div className="mb-3">
            <div className="h-6 bg-gray-200 rounded w-20" />
          </div>

          {/* Title */}
          <div className="mb-2 md:mb-3">
            <div className="h-8 bg-gray-200 rounded w-full mb-2" />
            <div className="h-8 bg-gray-200 rounded w-5/6" />
          </div>

          {/* Subtitle */}
          <div className="mb-4 md:mb-5">
            <div className="h-5 bg-gray-200 rounded w-full mb-1" />
            <div className="h-5 bg-gray-200 rounded w-4/5" />
          </div>

          {/* Meta Info (Author, Date, etc.) */}
          <div className="text-[13px] text-gray-500 mb-2">
            <div className="h-4 bg-gray-200 rounded w-48" />
          </div>

          {/* Print Button */}
          <div className="mb-5 md:mb-6">
            <div className="h-8 bg-gray-200 rounded w-24" />
          </div>

          {/* Divider */}
          <hr className="border-t-2 border-gray-200 mb-6 md:mb-8" />

          {/* Thumbnail Image */}
          <div className="mb-6 md:mb-8">
            <div className="aspect-[16/9] bg-gray-200 rounded-lg" />
            <div className="h-3 bg-gray-200 rounded w-32 mt-2" />
          </div>

          {/* Article Body - Multiple paragraphs */}
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={`paragraph-${i}`}>
                <div className="h-4 bg-gray-200 rounded w-full mb-1" />
                <div className="h-4 bg-gray-200 rounded w-full mb-1" />
                <div className="h-4 bg-gray-200 rounded w-4/5" />
              </div>
            ))}
          </div>

          {/* Tags Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={`tag-${i}`} className="h-6 bg-gray-200 rounded w-16" />
              ))}
            </div>
          </div>

          {/* Related Articles Section */}
          <section className="mt-10 md:mt-12 pt-8 border-t-2 border-gray-200">
            <div className="h-6 bg-gray-200 rounded w-24 mb-5" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={`related-${i}`}>
                  <div className="aspect-[16/9] bg-gray-200 rounded-lg mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-16 mb-2" />
                  <div className="h-5 bg-gray-200 rounded w-full mb-1" />
                  <div className="h-5 bg-gray-200 rounded w-4/5 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-32" />
                </div>
              ))}
            </div>
          </section>
        </article>

        {/* Sidebar */}
        <div className="hidden lg:block">
          <div className="lg:sticky lg:top-24">
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
        </div>
      </div>
    </div>
  );
}
