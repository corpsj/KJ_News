"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const AUTOSAVE_KEY = `article-form-${article?.id || "new"}`;

  const [step, setStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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

  /* ── Auto-restore from localStorage (new articles only) ── */
  useEffect(() => {
    if (!isEdit) {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (confirm("이전에 저장된 작업을 복원하시겠습니까?")) {
            setForm(parsed);
          } else {
            localStorage.removeItem(AUTOSAVE_KEY);
          }
        } catch {
          // noop
        }
      }
    }
  }, [isEdit, AUTOSAVE_KEY]);

  /* ── Auto-save every 10 seconds ── */
  useEffect(() => {
    const timer = setInterval(() => {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(form));
    }, 10000);
    return () => clearInterval(timer);
  }, [form, AUTOSAVE_KEY]);

  /* ── Warn before leaving with unsaved changes ── */
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

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
    setIsDirty(true);
  }

  /* ── Step validation on forward navigation ── */
  function goToStep(target: number) {
    if (target > step) {
      if (step === 0 && !form.title.trim()) {
        toast("제목을 입력해주세요.", "error");
        return;
      }
      if (step === 1 && !form.content.trim()) {
        toast("본문을 입력해주세요.", "error");
        return;
      }
    }
    setStep(target);
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

    setIsSubmitting(true);
    try {
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
      localStorage.removeItem(AUTOSAVE_KEY);
      setIsDirty(false);
      router.push("/admin/articles");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleImageUpload(file: File | null) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast("이미지 파일 크기는 10MB 이하여야 합니다.", "error");
      return;
    }
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

  async function handleEditorImageUpload(file: File): Promise<string | null> {
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const filePath = `articles/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("press_image").upload(filePath, file);
    if (error) {
      toast("이미지 업로드에 실패했습니다.", "error");
      return null;
    }
    const { data } = supabase.storage.from("press_image").getPublicUrl(filePath);
    return data.publicUrl;
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center flex-1 last:flex-initial">
            <button
              type="button"
              onClick={() => goToStep(i)}
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
            <label htmlFor="article-title" className="block text-[13px] font-medium text-gray-700 mb-1.5">제목 *</label>
            <input
              id="article-title"
              className="admin-input"
              placeholder="기사 제목을 입력하세요"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="article-subtitle" className="block text-[13px] font-medium text-gray-700 mb-1.5">부제목</label>
            <input
              id="article-subtitle"
              className="admin-input"
              placeholder="부제목을 입력하세요"
              value={form.subtitle}
              onChange={(e) => update("subtitle", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="article-category" className="block text-[13px] font-medium text-gray-700 mb-1.5">카테고리</label>
              <select
                id="article-category"
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
              <label htmlFor="article-author" className="block text-[13px] font-medium text-gray-700 mb-1.5">작성자</label>
              <select
                id="article-author"
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
            <label htmlFor="article-thumbnail-url" className="block text-[13px] font-medium text-gray-700 mb-1.5">썸네일 URL</label>
            <input
              id="article-thumbnail-url"
              className="admin-input"
              placeholder="https://example.com/image.jpg (선택사항)"
              value={form.thumbnailUrl}
              onChange={(e) => update("thumbnailUrl", e.target.value)}
            />
            <label htmlFor="article-thumbnail-upload" className="block text-[13px] font-medium text-gray-700 mt-3 mb-1.5">이미지 업로드</label>
            <button
              type="button"
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file?.type.startsWith("image/")) handleImageUpload(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                isDragging ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="text-sm text-gray-500">
                {isUploadingImage ? "업로드 중..." : "이미지를 드래그하거나 클릭하여 업로드"}
              </p>
              <input
                ref={fileInputRef}
                id="article-thumbnail-upload"
                className="hidden"
                type="file"
                accept="image/*"
                onChange={(e) => { handleImageUpload(e.target.files?.[0] || null); e.target.value = ""; }}
                disabled={isUploadingImage}
              />
            </button>
            {form.thumbnailUrl && (
              <div className="mt-3 relative rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={form.thumbnailUrl}
                  alt="썸네일 미리보기"
                  className="w-full aspect-[16/9] object-cover"
                />
                <button
                  type="button"
                  onClick={() => update("thumbnailUrl", "")}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  aria-label="썸네일 삭제"
                >
                  ✕
                </button>
              </div>
            )}
            <p className="text-[11px] text-gray-400 mt-1">비워두면 텍스트 기사로 표시됩니다.</p>
          </div>
        </div>
      )}

      {/* Step 2: 본문 작성 */}
      {step === 1 && (
        <div className="space-y-5 animate-fade-in">
          <div className="admin-card p-6">
            <label htmlFor="article-excerpt" className="block text-[13px] font-medium text-gray-700 mb-1.5">요약</label>
            <textarea
              id="article-excerpt"
              className="admin-input resize-none"
              rows={3}
              placeholder="기사의 핵심 내용을 요약해주세요"
              value={form.excerpt}
              onChange={(e) => update("excerpt", e.target.value)}
            />
          </div>
          <div className="admin-card p-6">
            <label htmlFor="article-content" className="block text-[13px] font-medium text-gray-700 mb-1.5">본문</label>
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
            <label htmlFor="article-tags" className="block text-[13px] font-medium text-gray-700 mb-1.5">태그</label>
            <input
              id="article-tags"
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
          type="button"
          className="admin-btn admin-btn-ghost"
          onClick={() => goToStep(step - 1)}
          disabled={step === 0}
          style={{ opacity: step === 0 ? 0.4 : 1 }}
        >
          이전
        </button>
        {step < steps.length - 1 ? (
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={() => goToStep(step + 1)}
          >
            다음
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <button type="button" className="admin-btn admin-btn-ghost flex-1 sm:flex-initial" onClick={() => setShowPreview(true)} disabled={isSubmitting}>
              미리보기
            </button>
            <div className="flex items-center gap-2 flex-1 sm:flex-initial sm:ml-auto">
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => handleSubmit("draft")} disabled={isSubmitting}>
                {isSubmitting ? "처리 중..." : "임시저장"}
              </button>
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => handleSubmit("pending_review")} disabled={isSubmitting}>
                {isSubmitting ? "처리 중..." : "검토 요청"}
              </button>
              <button type="button" className="admin-btn admin-btn-primary" onClick={() => handleSubmit("published")} disabled={isSubmitting}>
                {isSubmitting ? "처리 중..." : "바로 발행"}
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
