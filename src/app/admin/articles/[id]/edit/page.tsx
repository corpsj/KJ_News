"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAdmin } from "@/contexts/AdminContext";
import ArticleForm from "@/components/admin/ArticleForm";
import type { Article } from "@/lib/types";

export default function EditArticlePage() {
  const params = useParams();
  const id = params.id as string;
  const { fetchArticleById } = useAdmin();
  // undefined = loading, null = not found, Article = loaded
  const [article, setArticle] = useState<Article | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    fetchArticleById(id).then((a) => { if (active) setArticle(a); });
    return () => { active = false; };
  }, [id, fetchArticleById]);

  if (article === undefined) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" aria-label="불러오는 중" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <p className="text-gray-500 text-[14px] mb-4">기사를 찾을 수 없습니다.</p>
        <Link href="/admin/articles" className="admin-btn admin-btn-ghost">
          기사 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold text-gray-900 mb-6">기사 수정</h1>
      <ArticleForm article={article} />
    </div>
  );
}
