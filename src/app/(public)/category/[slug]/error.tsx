"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function CategoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-xl w-full border border-gray-200 rounded-xl bg-white p-10 text-center">
        <p className="text-xs tracking-[0.2em] text-gray-400 mb-3">오류</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">카테고리를 불러올 수 없습니다</h1>
        <p className="text-sm text-gray-500 mb-8">
          일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
