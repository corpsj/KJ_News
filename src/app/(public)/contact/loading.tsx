export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 animate-pulse">
      {/* Page Title */}
      <div className="mb-8 md:mb-10">
        <div className="h-8 md:h-10 bg-gray-200 rounded w-32 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-64" />
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-lg border border-gray-100 p-6 md:p-8">
        {/* Name Field */}
        <div className="mb-6">
          <div className="h-4 bg-gray-200 rounded w-16 mb-2" />
          <div className="h-10 bg-gray-200 rounded w-full" />
        </div>

        {/* Email Field */}
        <div className="mb-6">
          <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
          <div className="h-10 bg-gray-200 rounded w-full" />
        </div>

        {/* Subject Field */}
        <div className="mb-6">
          <div className="h-4 bg-gray-200 rounded w-16 mb-2" />
          <div className="h-10 bg-gray-200 rounded w-full" />
        </div>

        {/* Message Field */}
        <div className="mb-6">
          <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
          <div className="h-32 bg-gray-200 rounded w-full" />
        </div>

        {/* Submit Button */}
        <div className="h-10 bg-gray-200 rounded w-32" />
      </div>
    </div>
  );
}
