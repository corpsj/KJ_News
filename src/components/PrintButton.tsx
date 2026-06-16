"use client";

import { useState, useEffect } from "react";

interface KakaoSDK {
  isInitialized: () => boolean;
  init: (key: string) => void;
  Share: { sendDefault: (settings: Record<string, unknown>) => void };
}
declare global {
  interface Window { Kakao?: KakaoSDK }
}

const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
const KAKAO_SDK_SRC = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js";

function metaContent(selector: string): string {
  return (document.querySelector(selector) as HTMLMetaElement | null)?.content || "";
}

export default function PrintButton() {
  const [copied, setCopied] = useState(false);
  const [kakaoReady, setKakaoReady] = useState(false);

  // Load + init the Kakao SDK only when a JS key is configured. Without the key
  // the button stays hidden (set NEXT_PUBLIC_KAKAO_JS_KEY to enable).
  useEffect(() => {
    if (!KAKAO_JS_KEY) return;
    const init = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) window.Kakao.init(KAKAO_JS_KEY);
      if (window.Kakao?.isInitialized()) setKakaoReady(true);
    };
    if (window.Kakao) { init(); return; }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${KAKAO_SDK_SRC}"]`);
    if (existing) { existing.addEventListener("load", init); return; }
    const script = document.createElement("script");
    script.src = KAKAO_SDK_SRC;
    script.async = true;
    script.onload = init;
    document.head.appendChild(script);
  }, []);

  const shareKakao = () => {
    if (!window.Kakao?.isInitialized()) return;
    const url = window.location.href;
    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: document.title,
        description: metaContent('meta[name="description"]') || metaContent('meta[property="og:description"]'),
        imageUrl: metaContent('meta[property="og:image"]'),
        link: { mobileWebUrl: url, webUrl: url },
      },
    });
  };

  const changeFontSize = (delta: number) => {
    const el = document.querySelector("[data-article-body]") as HTMLElement | null;
    if (!el) return;
    const current = parseFloat(getComputedStyle(el).fontSize);
    const next = Math.max(14, Math.min(24, current + delta));
    el.style.fontSize = `${next}px`;
  };

  const shareArticle = async () => {
    const title = document.title;
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }

      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="print-button-container flex items-center gap-0 text-[13px] text-gray-500" data-print-hide>
      <button
        type="button"
        onClick={shareArticle}
        className="hover:text-gray-900"
        aria-label="기사 공유"
      >
        {copied ? "복사됨" : "공유"}
      </button>
      {kakaoReady && (
        <>
          <span className="mx-2 text-gray-300">|</span>
          <button
            type="button"
            onClick={shareKakao}
            className="hover:text-gray-900"
            aria-label="카카오톡 공유"
          >
            카카오톡
          </button>
        </>
      )}
      <span className="mx-2 text-gray-300">|</span>
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
