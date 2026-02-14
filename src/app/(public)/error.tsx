"use client";

export default function PublicError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-xl w-full border border-gray-200 rounded-xl bg-white p-10 text-center">
        <p className="text-xs tracking-[0.2em] text-gray-400 mb-3">ERROR</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">문제가 발생했습니다</h1>
        <p className="text-sm text-gray-500 mb-8">잠시 후 다시 시도해주세요.</p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
