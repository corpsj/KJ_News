import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string>;
}

function buildUrl(
  basePath: string,
  page: number,
  searchParams?: Record<string, string>
): string {
  const params = new URLSearchParams({ ...searchParams, page: String(page) });
  return `${basePath}?${params.toString()}`;
}

export default function Pagination({
  currentPage,
  totalPages,
  basePath,
  searchParams,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <nav
      aria-label="페이지네이션"
      className="flex items-center justify-center gap-1 mt-8"
    >
      {currentPage > 1 && (
        <Link
          href={buildUrl(basePath, currentPage - 1, searchParams)}
          className="flex items-center justify-center min-w-[44px] min-h-[44px] text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="이전 페이지"
        >
          ←
        </Link>
      )}

      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-after-${pages[i - 1]}`} className="flex items-center justify-center min-w-[44px] min-h-[44px] text-sm text-gray-400">
            …
          </span>
        ) : (
          <Link
            key={page}
            href={buildUrl(basePath, page, searchParams)}
            className={`flex items-center justify-center min-w-[44px] min-h-[44px] text-sm rounded-lg transition-colors ${
              page === currentPage
                ? "bg-gray-900 text-white font-semibold"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </Link>
        )
      )}

      {currentPage < totalPages && (
        <Link
          href={buildUrl(basePath, currentPage + 1, searchParams)}
          className="flex items-center justify-center min-w-[44px] min-h-[44px] text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="다음 페이지"
        >
          →
        </Link>
      )}
    </nav>
  );
}
