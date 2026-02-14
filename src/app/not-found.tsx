import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-xl w-full border border-gray-200 rounded-xl bg-white p-10 text-center">
        <p className="text-xs tracking-[0.2em] text-gray-400 mb-3">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">페이지를 찾을 수 없습니다</h1>
        <p className="text-sm text-gray-500 mb-8">요청하신 페이지가 없거나 이동되었습니다.</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
