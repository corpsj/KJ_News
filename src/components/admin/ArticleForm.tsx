"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin, type ArticleFormData } from "@/contexts/AdminContext";
import { useToast } from "@/contexts/ToastContext";
import { createClient } from "@/lib/supabase/client";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ArticlePreview from "@/components/admin/ArticlePreview";
import type { Article, ArticleStatus } from "@/lib/types";

function extractFirstImageUrl(html: string): string {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/);
  return match?.[1] ?? "";
}

export default function ArticleForm({ article }: { article?: Article }) {
  const router = useRouter();
  const { addArticle, updateArticle, categories, authors } = useAdmin();
  const { toast } = useToast();
  const isEdit = !!article;
  const supabase = useMemo(() => createClient(), []);

  const AUTOSAVE_KEY = `article-form-${article?.id || "new"}`;

  const [showPreview, setShowPreview] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [thumbnailManual, setThumbnailManual] = useState(
    isEdit && !!article?.thumbnailUrl && article.thumbnailUrl !== extractFirstImageUrl(article?.content ?? "")
  );
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
    // Offer recovery for both new and edit (autosave only persists when dirty).
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (saved) {
      try {
        JSON.parse(saved);
        setHasSavedDraft(true);
      } catch {
        localStorage.removeItem(AUTOSAVE_KEY);
      }
    }
  }, [AUTOSAVE_KEY]);

  function restoreDraft() {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (!saved) return;
    try {
      setForm(JSON.parse(saved));
    } catch (err) {
      localStorage.removeItem(AUTOSAVE_KEY);
    }
    setHasSavedDraft(false);
  }

  function discardDraft() {
    localStorage.removeItem(AUTOSAVE_KEY);
    setHasSavedDraft(false);
  }

  /* ── Auto-save every 10 seconds (only when there are unsaved changes) ── */
  useEffect(() => {
    if (!isDirty) return;
    const timer = setInterval(() => {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(form));
    }, 10000);
    return () => clearInterval(timer);
  }, [form, isDirty, AUTOSAVE_KEY]);

  /* ── Warn before leaving with unsaved changes (tab close / refresh) ── */
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  /* ── Guard in-app (SPA) navigation: beforeunload doesn't fire on <Link> nav ── */
  useEffect(() => {
    if (!isDirty) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
        if (!window.confirm("저장하지 않은 변경사항이 있습니다. 이 페이지를 떠나시겠습니까?")) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
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

  const contentForThumbnail = form.content;
  useEffect(() => {
    if (thumbnailManual) return; // don't clobber an explicitly chosen thumbnail
    const url = extractFirstImageUrl(contentForThumbnail);
    setForm((prev) => {
      if (prev.thumbnailUrl === url) return prev;
      return { ...prev, thumbnailUrl: url };
    });
  }, [contentForThumbnail, thumbnailManual]);

  async function handleSubmit(status: ArticleStatus = "draft") {
    if (!form.title.trim()) {
      toast("제목을 입력해주세요.", "error");
      return;
    }
    if (!form.content.trim()) {
      toast("본문을 입력해주세요.", "error");
      return;
    }

    let scheduledIso: string | undefined;
    if (status === "scheduled") {
      if (!scheduledAt) {
        toast("예약 발행 시각을 선택해주세요.", "error");
        return;
      }
      const d = new Date(scheduledAt);
      if (isNaN(d.getTime())) {
        toast("예약 시각이 올바르지 않습니다.", "error");
        return;
      }
      if (d.getTime() <= Date.now()) {
        toast("예약 시각은 현재 이후여야 합니다.", "error");
        return;
      }
      scheduledIso = d.toISOString();
    }

    const payload: ArticleFormData = {
      ...form,
      status,
      ...(scheduledIso ? { scheduledAt: scheduledIso } : {}),
    };

    setIsSubmitting(true);
    try {
      if (isEdit && article) {
        const updated = await updateArticle(article.id, payload);
        if (!updated) {
          toast("기사 수정에 실패했습니다. 브라우저 콘솔에서 상세 오류를 확인하세요.", "error");
          return;
        }
        toast("기사가 수정되었습니다.", "success");
      } else {
        const created = await addArticle(payload);
        if (!created) {
          toast("기사 저장에 실패했습니다. 브라우저 콘솔에서 상세 오류를 확인하세요.", "error");
          return;
        }
        const msgs: Record<string, string> = {
          draft: "임시저장되었습니다.",
          pending_review: "검토 요청되었습니다.",
          published: "기사가 발행되었습니다.",
          scheduled: "예약 발행되었습니다.",
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
    <div className="max-w-3xl mx-auto pb-24">
      {hasSavedDraft && (
        <div className="admin-card p-4 flex items-center justify-between mb-5">
          <span className="text-[13px] text-gray-600">임시저장된 작업이 있습니다.</span>
          <div className="flex items-center gap-2">
            <button type="button" className="admin-btn admin-btn-ghost text-xs" onClick={discardDraft}>삭제</button>
            <button type="button" className="admin-btn admin-btn-primary text-xs" onClick={restoreDraft}>불러오기</button>
          </div>
        </div>
      )}
      <section className="admin-card p-6 space-y-5">
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
                <option key={c.id} value={c.slug}>{c.name}</option>
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
                <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        <div>
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
        <div>
          <label htmlFor="article-content" className="block text-[13px] font-medium text-gray-700 mb-1.5">본문 *</label>
          <RichTextEditor
            value={form.content}
            onChange={(html) => update("content", html)}
            placeholder="기사 본문을 입력하세요..."
            onImageUpload={handleEditorImageUpload}
          />
        </div>

        <div>
          <label htmlFor="article-thumbnail" className="block text-[13px] font-medium text-gray-700 mb-1.5">
            대표 이미지 (썸네일 · 선택)
          </label>
          <div className="flex items-center gap-2">
            <input
              id="article-thumbnail"
              className="admin-input flex-1"
              placeholder="https://... (미지정 시 본문 첫 이미지 사용)"
              value={form.thumbnailUrl}
              onChange={(e) => { setThumbnailManual(true); update("thumbnailUrl", e.target.value); }}
            />
            <label className="admin-btn admin-btn-ghost text-[13px] cursor-pointer whitespace-nowrap">
              업로드
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const url = await handleEditorImageUpload(f);
                  if (url) { setThumbnailManual(true); update("thumbnailUrl", url); }
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <div className="flex items-center gap-3 mt-2">
            {form.thumbnailUrl ? (
              <Image src={form.thumbnailUrl} alt="대표 이미지 미리보기" width={80} height={50} className="object-cover rounded border border-gray-200" />
            ) : (
              <span className="text-[11px] text-gray-400">미지정 시 본문의 첫 번째 이미지가 썸네일로 사용됩니다.</span>
            )}
            {thumbnailManual && (
              <button
                type="button"
                className="text-[11px] text-gray-500 hover:text-gray-800 underline"
                onClick={() => { setThumbnailManual(false); update("thumbnailUrl", extractFirstImageUrl(form.content)); }}
              >
                본문 첫 이미지로 되돌리기
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100" />

        <div>
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
                  <span key={tag} className="admin-badge">{tag}</span>
                ))}
            </div>
          )}
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            className="admin-btn admin-btn-ghost"
            onClick={() => setShowPreview(true)}
            disabled={isSubmitting}
          >
            미리보기
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="admin-btn admin-btn-ghost" onClick={() => handleSubmit("draft")} disabled={isSubmitting}>
              {isSubmitting ? "처리 중..." : "임시저장"}
            </button>
            <button type="button" className="admin-btn admin-btn-ghost" onClick={() => handleSubmit("pending_review")} disabled={isSubmitting}>
              {isSubmitting ? "처리 중..." : "검토 요청"}
            </button>
            <div className="flex items-center gap-1.5">
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="admin-input text-[13px] py-1.5"
                aria-label="예약 발행 시각 (KST)"
                title="예약 발행 시각 (KST)"
              />
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => handleSubmit("scheduled")} disabled={isSubmitting}>
                {isSubmitting ? "처리 중..." : "예약 발행"}
              </button>
            </div>
            <button type="button" className="admin-btn admin-btn-primary" onClick={() => handleSubmit("published")} disabled={isSubmitting}>
              {isSubmitting ? "처리 중..." : "바로 발행"}
            </button>
          </div>
        </div>
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
