"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(false);
    if (login(username, password)) {
      router.push("/admin");
    } else {
      setError(true);
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
            아이디
          </label>
          <input
            className="admin-input"
            placeholder="아이디 입력"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
            아이디 또는 비밀번호가 올바르지 않습니다.
          </p>
        )}

        <button type="submit" className="admin-btn admin-btn-primary w-full mt-6">
          로그인
        </button>
      </form>

      <p className="text-[11px] text-gray-400 mt-6 text-center">
        테스트 계정: admin / 1234
      </p>
    </div>
  );
}
