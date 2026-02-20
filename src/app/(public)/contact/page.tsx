"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: name,
          senderEmail: email,
          subject,
          body,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "제보 전송에 실패했습니다.");
        setLoading(false);
        return;
      }

      setSubmitted(true);
      setName("");
      setEmail("");
      setSubject("");
      setBody("");
      setLoading(false);
    } catch (err) {
      setError("요청 처리 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <p className="text-green-800 font-medium mb-4">
            제보가 접수되었습니다. 감사합니다.
          </p>
          <Link
            href="/"
            className="inline-block bg-gray-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">제보/문의</h1>
      <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8">
        광전타임즈에 제보하거나 문의사항이 있으신 경우 아래 양식을 작성해주세요.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="text-red-600 text-sm font-medium">{error}</div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            이름 <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-3 md:py-2.5 border border-gray-200 rounded-lg text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            placeholder="이름을 입력하세요"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            이메일 <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-3 md:py-2.5 border border-gray-200 rounded-lg text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            placeholder="이메일을 입력하세요"
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            제목
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-3 md:py-2.5 border border-gray-200 rounded-lg text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            placeholder="제목을 입력하세요 (선택사항)"
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
            내용 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={6}
            className="w-full px-3 py-3 md:py-2.5 border border-gray-200 rounded-lg text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            placeholder="내용을 입력하세요"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white px-6 py-3 md:py-2.5 rounded-lg font-medium text-base md:text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "전송 중..." : "제보하기"}
        </button>
      </form>
    </div>
  );
}
