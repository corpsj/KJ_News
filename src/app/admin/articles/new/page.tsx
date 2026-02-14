"use client";

import ArticleForm from "@/components/admin/ArticleForm";

export default function NewArticlePage() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold text-gray-900 mb-6">기사 작성</h1>
      <ArticleForm />
    </div>
  );
}
