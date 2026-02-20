"use client";

export default function PrintButton() {
  const changeFontSize = (delta: number) => {
    const el = document.querySelector("[data-article-body]") as HTMLElement | null;
    if (!el) return;
    const current = parseFloat(getComputedStyle(el).fontSize);
    const next = Math.max(14, Math.min(24, current + delta));
    el.style.fontSize = `${next}px`;
  };

  return (
    <div className="print-button-container flex items-center gap-0 text-[13px] text-gray-500" data-print-hide>
      <button
        type="button"
        onClick={() => window.print()}
        className="hover:text-gray-900"
        aria-label="기사 인쇄"
      >
        인쇄
      </button>
      <span className="mx-2 text-gray-300">|</span>
      <span className="mr-1.5">글자크기</span>
      <button
        type="button"
        onClick={() => changeFontSize(2)}
        className="inline-flex items-center justify-center w-[22px] h-[22px] border border-gray-300 text-xs text-gray-500 hover:text-gray-900 hover:border-gray-500"
        aria-label="글자 크게"
      >
        +
      </button>
      <button
        type="button"
        onClick={() => changeFontSize(-2)}
        className="inline-flex items-center justify-center w-[22px] h-[22px] border border-gray-300 text-xs text-gray-500 hover:text-gray-900 hover:border-gray-500 ml-0.5"
        aria-label="글자 작게"
      >
        &minus;
      </button>
    </div>
  );
}
