"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Article, ArticleStatus } from "@/lib/types";
import { articles as initialArticles, categories, authors } from "@/lib/mock-data";

interface AdminContextValue {
  articles: Article[];
  addArticle: (data: ArticleFormData) => Article;
  updateArticle: (id: string, data: ArticleFormData) => Article | null;
  updateArticleStatus: (id: string, status: ArticleStatus) => void;
  deleteArticle: (id: string) => void;
  getArticle: (id: string) => Article | undefined;
  importArticle: (data: ImportArticleData) => Article;
}

export interface ArticleFormData {
  title: string;
  subtitle: string;
  excerpt: string;
  content: string;
  categorySlug: string;
  authorId: string;
  thumbnailUrl: string;
  tags: string;
  status?: ArticleStatus;
}

export interface ImportArticleData {
  title: string;
  content: string;
  excerpt: string;
  categorySlug: string;
  source?: string;
  sourceUrl?: string;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [articles, setArticles] = useState<Article[]>(() => [...initialArticles]);

  const getArticle = useCallback(
    (id: string) => articles.find((a) => a.id === id),
    [articles]
  );

  const addArticle = useCallback(
    (data: ArticleFormData): Article => {
      const category = categories.find((c) => c.slug === data.categorySlug) ?? categories[0];
      const author = authors.find((a) => a.id === data.authorId) ?? authors[0];
      const newArticle: Article = {
        id: String(Date.now()),
        title: data.title,
        subtitle: data.subtitle,
        excerpt: data.excerpt,
        content: data.content,
        category,
        author,
        publishedAt: data.status === "published" ? new Date().toISOString() : "",
        thumbnailUrl: data.thumbnailUrl || "",
        viewCount: 0,
        tags: data.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        status: data.status || "draft",
      };
      setArticles((prev) => [newArticle, ...prev]);
      return newArticle;
    },
    []
  );

  const updateArticle = useCallback(
    (id: string, data: ArticleFormData): Article | null => {
      let updated: Article | null = null;
      setArticles((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;
          const category = categories.find((c) => c.slug === data.categorySlug) ?? a.category;
          const author = authors.find((au) => au.id === data.authorId) ?? a.author;
          updated = {
            ...a,
            title: data.title,
            subtitle: data.subtitle,
            excerpt: data.excerpt,
            content: data.content,
            category,
            author,
            thumbnailUrl: data.thumbnailUrl || a.thumbnailUrl,
            tags: data.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            status: data.status || a.status,
            publishedAt: data.status === "published" && a.status !== "published"
              ? new Date().toISOString()
              : a.publishedAt,
          };
          return updated;
        })
      );
      return updated;
    },
    []
  );

  const updateArticleStatus = useCallback((id: string, status: ArticleStatus) => {
    setArticles((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        return {
          ...a,
          status,
          publishedAt: status === "published" && a.status !== "published"
            ? new Date().toISOString()
            : a.publishedAt,
        };
      })
    );
  }, []);

  const deleteArticle = useCallback((id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const importArticle = useCallback(
    (data: ImportArticleData): Article => {
      const category = categories.find((c) => c.slug === data.categorySlug) ?? categories[0];
      const author = authors[0];
      const newArticle: Article = {
        id: String(Date.now()),
        title: data.title,
        subtitle: "",
        excerpt: data.excerpt || data.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 160),
        content: data.content,
        category,
        author,
        publishedAt: new Date().toISOString(),
        thumbnailUrl: "",
        viewCount: 0,
        tags: [],
        status: "pending_review",
        source: data.source,
        sourceUrl: data.sourceUrl,
      };
      setArticles((prev) => [newArticle, ...prev]);
      return newArticle;
    },
    []
  );

  return (
    <AdminContext.Provider
      value={{ articles, addArticle, updateArticle, updateArticleStatus, deleteArticle, getArticle, importArticle }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
