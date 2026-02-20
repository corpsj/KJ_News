"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isLoading) return;
    setError(false);
    setIsLoading(true);

    const email = `${username}@kjtimes.co.kr`;
    const ok = await login(email, password);

    if (ok) {
      router.push("/");
    } else {
      setError(true);
      setIsLoading(false);
      setToastMessage("아이디 또는 비밀번호가 올바르지 않습니다.");
      window.setTimeout(() => setToastMessage(""), 2400);
    }
  }

  return (
    <div className="w-full max-w-[400px] animate-fade-in">
      <div className="flex justify-center mb-10">
        <Image
          src="/brand/KJ_sloganLogo.png"
          alt="광전타임즈"
          width={200}
          height={56}
          className="h-12 w-auto"
          priority
        />
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_24px_rgba(0,0,0,0.06)] border border-gray-100 p-8 md:p-10">
        <h1 className="text-[18px] font-bold text-gray-900 mb-1">로그인</h1>
        <p className="text-[13px] text-gray-400 mb-8">계정 정보를 입력해 주세요</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-[13px] font-medium text-gray-700 mb-1.5">
              아이디
            </label>
            <input
              id="username"
              className="admin-input disabled:bg-gray-50 disabled:cursor-not-allowed"
              type="text"
              placeholder="아이디를 입력하세요"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-[13px] font-medium text-gray-700 mb-1.5">
              비밀번호
            </label>
            <input
              id="password"
              className="admin-input disabled:bg-gray-50 disabled:cursor-not-allowed"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2.5 px-3.5 py-3 bg-gray-50 rounded-lg border border-gray-200">
              <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <title>오류</title>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span className="text-[13px] text-gray-700 font-medium">
                아이디 또는 비밀번호가 올바르지 않습니다.
              </span>
            </div>
          )}

          <button
            type="submit"
            className="admin-btn admin-btn-primary w-full h-11 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                로그인 중...
              </span>
            ) : (
              "로그인"
            )}
          </button>
        </form>
      </div>

      <p className="text-[11px] text-gray-400 mt-8 text-center">
        © 2026 광전타임즈. All rights reserved.
      </p>

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium shadow-md border bg-white text-gray-900 border-gray-200 animate-fade-in">
          <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <title>오류</title>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
