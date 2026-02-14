"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setError(false);
    const ok = await login(email, password);
    if (ok) {
      router.push("/admin");
    } else {
      setError(true);
      setToastMessage("이메일 또는 비밀번호가 올바르지 않습니다.");
      window.setTimeout(() => setToastMessage(""), 2400);
    }
  }

  return (
    <div className="admin-card w-full max-w-sm p-8 animate-fade-in">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2">
          <span className="text-[18px] font-extrabold tracking-tight text-gray-900">
            광전타임즈
          </span>
          <span className="text-[10px] font-medium text-gray-400 border border-gray-200 rounded px-1.5 py-px">
            CMS
          </span>
        </div>
        <p className="text-[13px] text-gray-400 mt-1">콘텐츠 관리 시스템</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
            이메일
          </label>
          <input
            className="admin-input"
            type="email"
            placeholder="admin@kjtimes.co.kr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
            비밀번호
          </label>
          <input
            className="admin-input"
            type="password"
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-[12px] text-gray-900 font-medium">
            이메일 또는 비밀번호가 올바르지 않습니다.
          </p>
        )}

        <button type="submit" className="admin-btn admin-btn-primary w-full mt-6">
          로그인
        </button>
      </form>

      <p className="text-[11px] text-gray-400 mt-6 text-center">
        테스트 계정: admin@kjtimes.co.kr / kjtimes2026!
      </p>

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium shadow-sm border bg-white text-gray-900 border-gray-200">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
