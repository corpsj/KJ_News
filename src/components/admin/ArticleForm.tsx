"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin, type ArticleFormData } from "@/contexts/AdminContext";
import { useToast } from "@/contexts/ToastContext";
import { createClient } from "@/lib/supabase/client";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ArticlePreview from "@/components/admin/ArticlePreview";
import type { Article, ArticleStatus } from "@/lib/types";

const steps = ["기본 정보", "본문 작성", "태그 & 설정"];

export default function ArticleForm({ article }: { article?: Article }) {
  const router = useRouter();
  const { addArticle, updateArticle, categories, authors } = useAdmin();
  const { toast } = useToast();
  const isEdit = !!article;
  const supabase = useMemo(() => createClient(), []);

  const [step, setStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [form, setForm] = useState<ArticleFormData>({
    title: article?.title ?? "",
    subtitle: article?.subtitle ?? "",
    excerpt: article?.excerpt ?? "",
    content: article?.content ?? "",
    categorySlug: article?.category.slug ?? "",
    authorId: article?.author.id ?? "",
    thumbnailUrl: article?.thumbnailUrl ?? "",
    tags: article?.tags.join(", ") ?? "",
  });

  useEffect(() => {
    if (!form.categorySlug && categories.length > 0) {
      setForm((prev) => ({ ...prev, categorySlug: categories[0].slug }));
    }
    if (!form.authorId && authors.length > 0) {
      setForm((prev) => ({ ...prev, authorId: authors[0].id }));
    }
  }, [authors, categories, form.authorId, form.categorySlug]);

  function update(field: keyof ArticleFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(status: ArticleStatus = "draft") {
    if (!form.title.trim()) {
      toast("제목을 입력해주세요.", "error");
      setStep(0);
      return;
    }
    if (!form.content.trim()) {
      toast("본문을 입력해주세요.", "error");
      setStep(1);
      return;
    }

    if (isEdit && article) {
      const updated = await updateArticle(article.id, { ...form, status });
      if (!updated) {
        toast("기사 수정에 실패했습니다.", "error");
        return;
      }
      toast("기사가 수정되었습니다.", "success");
    } else {
      const created = await addArticle({ ...form, status });
      if (!created) {
        toast("기사 저장에 실패했습니다.", "error");
        return;
      }
      const msgs: Record<string, string> = {
        draft: "임시저장되었습니다.",
        pending_review: "검토 요청되었습니다.",
        published: "기사가 발행되었습니다.",
      };
      toast(msgs[status] || "저장되었습니다.", "success");
    }
    router.push("/admin/articles");
  }

  async function handleImageUpload(file: File | null) {
    if (!file) return;
    setIsUploadingImage(true);

    const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const filePath = `articles/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage.from("press_image").upload(filePath, file);

    if (error) {
      setIsUploadingImage(false);
      toast("이미지 업로드에 실패했습니다.", "error");
      return;
    }

    const { data } = supabase.storage.from("press_image").getPublicUrl(filePath);
    update("thumbnailUrl", data.publicUrl);
    setIsUploadingImage(false);
    toast("이미지가 업로드되었습니다.", "success");
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center flex-1 last:flex-initial">
            <button
              onClick={() => setStep(i)}
              className="flex items-center gap-2"
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  i <= step
                    ? "bg-gray-900 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`text-[13px] hidden sm:inline ${
                  i === step ? "text-gray-900 font-semibold" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-3 ${i < step ? "bg-gray-900" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: 기본 정보 */}
      {step === 0 && (
        <div className="admin-card p-6 space-y-5 animate-fade-in">
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">제목 *</label>
            <input
              className="admin-input"
              placeholder="기사 제목을 입력하세요"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">부제목</label>
            <input
              className="admin-input"
              placeholder="부제목을 입력하세요"
              value={form.subtitle}
              onChange={(e) => update("subtitle", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">카테고리</label>
              <select
                className="admin-input"
                value={form.categorySlug}
                onChange={(e) => update("categorySlug", e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">작성자</label>
              <select
                className="admin-input"
                value={form.authorId}
                onChange={(e) => update("authorId", e.target.value)}
              >
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">썸네일 URL</label>
            <input
              className="admin-input"
              placeholder="https://example.com/image.jpg (선택사항)"
              value={form.thumbnailUrl}
              onChange={(e) => update("thumbnailUrl", e.target.value)}
            />
            <label className="block text-[13px] font-medium text-gray-700 mt-3 mb-1.5">이미지 업로드</label>
            <input
              className="admin-input"
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files?.[0] || null)}
              disabled={isUploadingImage}
            />
            {isUploadingImage && <p className="text-[11px] text-gray-400 mt-1">업로드 중...</p>}
            <p className="text-[11px] text-gray-400 mt-1">비워두면 텍스트 기사로 표시됩니다.</p>
          </div>
        </div>
      )}

      {/* Step 2: 본문 작성 */}
      {step === 1 && (
        <div className="space-y-5 animate-fade-in">
          <div className="admin-card p-6">
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">요약</label>
            <textarea
              className="admin-input resize-none"
              rows={3}
              placeholder="기사의 핵심 내용을 요약해주세요"
              value={form.excerpt}
              onChange={(e) => update("excerpt", e.target.value)}
            />
          </div>
          <div className="admin-card p-6">
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">본문</label>
            <RichTextEditor
              value={form.content}
              onChange={(html) => update("content", html)}
              placeholder="기사 본문을 입력하세요..."
            />
          </div>
          {form.content.trim() && (
            <div className="admin-card p-6">
              <p className="text-[13px] font-medium text-gray-700 mb-3">미리보기</p>
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: form.content }}
              />
            </div>
          )}
        </div>
      )}

      {/* Step 3: 태그 & 설정 */}
      {step === 2 && (
        <div className="space-y-5 animate-fade-in">
          <div className="admin-card p-6">
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">태그</label>
            <input
              className="admin-input"
              placeholder="쉼표로 구분 (예: 정치, 국회, 법안)"
              value={form.tags}
              onChange={(e) => update("tags", e.target.value)}
            />
            {form.tags.trim() && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {form.tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((tag) => (
                    <span key={tag} className="admin-badge">
                      {tag}
                    </span>
                  ))}
              </div>
            )}
          </div>

          <div className="admin-card p-6">
            <p className="text-[13px] font-medium text-gray-700 mb-4">발행 요약</p>
            <dl className="space-y-2 text-[13px]">
              <div className="flex gap-2">
                <dt className="text-gray-400 w-16 flex-shrink-0">제목</dt>
                <dd className="text-gray-900 font-medium">{form.title || "—"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-gray-400 w-16 flex-shrink-0">카테고리</dt>
                <dd><span className="admin-badge">{categories.find((c) => c.slug === form.categorySlug)?.name}</span></dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-gray-400 w-16 flex-shrink-0">작성자</dt>
                <dd className="text-gray-700">{authors.find((a) => a.id === form.authorId)?.name}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-gray-400 w-16 flex-shrink-0">썸네일</dt>
                <dd className="text-gray-700 truncate">{form.thumbnailUrl || "없음 (텍스트 기사)"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-gray-400 w-16 flex-shrink-0">본문</dt>
                <dd className="text-gray-700">{form.content ? `${form.content.length}자` : "—"}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-6">
        <button
          className="admin-btn admin-btn-ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          style={{ opacity: step === 0 ? 0.4 : 1 }}
        >
          이전
        </button>
        {step < steps.length - 1 ? (
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
          >
            다음
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <button className="admin-btn admin-btn-ghost flex-1 sm:flex-initial" onClick={() => setShowPreview(true)}>
              미리보기
            </button>
            <div className="flex items-center gap-2 flex-1 sm:flex-initial sm:ml-auto">
              <button className="admin-btn admin-btn-ghost" onClick={() => handleSubmit("draft")}>
                임시저장
              </button>
              <button className="admin-btn admin-btn-ghost" onClick={() => handleSubmit("pending_review")}>
                검토 요청
              </button>
              <button className="admin-btn admin-btn-primary" onClick={() => handleSubmit("published")}>
                바로 발행
              </button>
            </div>
          </div>
        )}
      </div>

      {showPreview && (
        <ArticlePreview
          article={{
            title: form.title,
            subtitle: form.subtitle,
            excerpt: form.excerpt,
            content: form.content,
            category: categories.find((c) => c.slug === form.categorySlug),
            author: authors.find((a) => a.id === form.authorId),
            thumbnailUrl: form.thumbnailUrl,
          }}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
