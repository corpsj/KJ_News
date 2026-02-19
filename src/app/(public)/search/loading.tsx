export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-32 mb-6" />
      <div className="h-10 bg-gray-200 rounded max-w-xl mb-8" />
      <div className="h-4 bg-gray-200 rounded w-48 mb-6" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`result-${i}`}>
            <div className="aspect-[16/9] bg-gray-200 rounded-lg mb-3" />
            <div className="h-4 bg-gray-200 rounded w-16 mb-2" />
            <div className="h-5 bg-gray-200 rounded w-full mb-1" />
            <div className="h-5 bg-gray-200 rounded w-4/5 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}
