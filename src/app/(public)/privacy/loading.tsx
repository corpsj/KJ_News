export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 animate-pulse">
      {/* Page Title */}
      <div className="mb-8 md:mb-10">
        <div className="h-8 md:h-10 bg-gray-200 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-72" />
      </div>

      {/* Last Updated */}
      <div className="mb-8 pb-6 border-b border-gray-200">
        <div className="h-3 bg-gray-200 rounded w-40" />
      </div>

      {/* Content Sections */}
      <div className="space-y-8">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={`section-${i}`}>
            {/* Section Title */}
            <div className="h-6 bg-gray-200 rounded w-40 mb-4" />

            {/* Section Content - Multiple paragraphs */}
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
