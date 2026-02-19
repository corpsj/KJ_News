"use client";

import { useState, type FormEvent } from "react";

export default function NewsletterSubscribe() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "구독 신청에 실패했습니다.");
        return;
      }

      setStatus("success");
      setMessage("구독 신청이 완료되었습니다!");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("네트워크 오류가 발생했습니다.");
    }
  }

  return (
    <div className="w-full max-w-md">
      <h4 className="text-sm font-bold text-white mb-3">뉴스레터 구독</h4>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일을 입력하세요"
          required
          className="flex-1 px-3 py-2 text-sm bg-white text-gray-900 rounded placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-4 py-2 text-sm font-medium bg-black text-white border border-gray-600 rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {status === "loading" ? "전송 중..." : "구독"}
        </button>
      </form>
      {status === "success" && (
        <p className="mt-2 text-sm text-green-400">{message}</p>
      )}
      {status === "error" && (
        <p className="mt-2 text-sm text-red-400">{message}</p>
      )}
    </div>
  );
}
