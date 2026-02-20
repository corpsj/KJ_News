"use client";

import { useState } from "react";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export default function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard API not available */
    }
  };

  const handleKakaoShare = () => {
    const kakaoUrl = `https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(url)}&appId=${process.env.NEXT_PUBLIC_KAKAO_APP_ID || ""}`;
    window.open(kakaoUrl, "kakao-share", "width=500,height=600");
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
    window.open(twitterUrl, "twitter-share", "width=550,height=420");
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, "facebook-share", "width=550,height=420");
  };

  return (
    <div className="flex items-center gap-1.5 md:gap-2">
      {process.env.NEXT_PUBLIC_KAKAO_APP_ID && (
        <button
          type="button"
          onClick={handleKakaoShare}
          className="flex items-center justify-center gap-1.5 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 md:px-3 md:py-1.5 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          aria-label="카카오톡 공유"
          title="카카오톡 공유"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            className="flex-shrink-0"
          >
            <path d="M12 2C6.48 2 2 5.58 2 10c0 2.54 1.19 4.85 3.15 6.37.08.5.33 1.52.88 2.88.15.38.74.42 1.01.08.27-.34 1.66-2.11 2.31-2.99.6.08 1.21.12 1.85.12 5.52 0 10-3.58 10-8s-4.48-8-10-8zm0 14c-.64 0-1.25-.04-1.85-.12l-1.89 2.4c-.3.38-.92.35-1.07-.05-.5-1.13-.7-1.95-.8-2.38C4.9 13.75 3.9 11.99 3.9 10c0-3.86 3.57-7 8.1-7s8.1 3.14 8.1 7-3.57 7-8.1 7z" />
          </svg>
          <span className="hidden md:inline">카카오톡</span>
        </button>
      )}

      <button
        type="button"
        onClick={handleTwitterShare}
        className="flex items-center justify-center gap-1.5 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 md:px-3 md:py-1.5 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
        aria-label="트위터 공유"
        title="트위터 공유"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className="flex-shrink-0"
        >
          <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 9-1 9-5.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
        </svg>
        <span className="hidden md:inline">트위터</span>
      </button>

      <button
        type="button"
        onClick={handleFacebookShare}
        className="flex items-center justify-center gap-1.5 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 md:px-3 md:py-1.5 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
        aria-label="페이스북 공유"
        title="페이스북 공유"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className="flex-shrink-0"
        >
          <path d="M18 2h-3a6 6 0 00-6 6v3H7v4h2v8h4v-8h3l1-4h-4V8a1 1 0 011-1h3z" />
        </svg>
        <span className="hidden md:inline">페이스북</span>
      </button>

      <button
        type="button"
        onClick={handleCopyLink}
        className="flex items-center justify-center gap-1.5 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 md:px-3 md:py-1.5 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
        aria-label="링크 복사"
        title="링크 복사"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
          className="flex-shrink-0"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        <span className="hidden md:inline">{copied ? "복사됨" : "링크"}</span>
      </button>
    </div>
  );
}
