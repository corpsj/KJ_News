"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import type { Article, ArticleStatus, Author, Category } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

interface DbArticle {
  id: number;
  title: string;
  subtitle: string;
  excerpt: string;
  content: string;
  category_id: number | null;
  author_id: number | null;
  published_at: string | null;
  thumbnail_url: string;
  view_count: number;
  tags: string[];
  status: string;
  source: string;
  source_url: string;
  categories: { id: number; name: string; slug: string; description: string; color: string } | null;
  authors: { id: number; name: string; role: string; avatar_url: string } | null;
}

interface AdminContextValue {
  articles: Article[];
  categories: Category[];
  authors: Author[];
  addArticle: (data: ArticleFormData) => Promise<Article | null>;
  updateArticle: (id: string, data: ArticleFormData) => Promise<Article | null>;
  updateArticleStatus: (id: string, status: ArticleStatus) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  getArticle: (id: string) => Article | undefined;
  importArticle: (data: ImportArticleData) => Promise<Article | null>;
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

function mapCategory(row: {
  id: number;
  name: string;
  slug: string;
  description: string;
  color: string;
}): Category {
  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    description: row.description || "",
    color: row.color || "#64748b",
  };
}

function mapAuthor(row: { id: number; name: string; role: string; avatar_url: string }): Author {
  return {
    id: String(row.id),
    name: row.name,
    role: row.role,
    avatarUrl: row.avatar_url || "",
  };
}

function mapArticle(row: DbArticle): Article {
  return {
    id: String(row.id),
    title: row.title,
    subtitle: row.subtitle || "",
    excerpt: row.excerpt || "",
    content: row.content || "",
    category: row.categories
      ? mapCategory(row.categories)
      : { id: "0", name: "미분류", slug: "uncategorized", description: "", color: "#64748b" },
    author: row.authors
      ? mapAuthor(row.authors)
      : { id: "0", name: "알 수 없음", role: "", avatarUrl: "" },
    publishedAt: row.published_at || "",
    thumbnailUrl: row.thumbnail_url || "",
    viewCount: row.view_count || 0,
    tags: row.tags || [],
    status: row.status as ArticleStatus,
    source: row.source || undefined,
    sourceUrl: row.source_url || undefined,
  };
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const [articleRes, categoryRes, authorRes] = await Promise.all([
        supabase
          .from("articles")
          .select("*, categories(*), authors(*)")
          .order("published_at", { ascending: false }),
        supabase.from("categories").select("*").order("id"),
        supabase.from("authors").select("*").order("id"),
      ]);

      if (!mounted) return;

      setArticles(((articleRes.data as unknown as DbArticle[] | null) || []).map(mapArticle));
      setCategories((categoryRes.data || []).map(mapCategory));
      setAuthors((authorRes.data || []).map(mapAuthor));
    }

    load();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const getArticle = useCallback(
    (id: string) => articles.find((a) => a.id === id),
    [articles]
  );

  const addArticle = useCallback(
    async (data: ArticleFormData): Promise<Article | null> => {
      const category = categories.find((c) => c.slug === data.categorySlug) ?? categories[0];
      const author = authors.find((a) => a.id === data.authorId) ?? authors[0];
      if (!category || !author) {
        console.error("[addArticle] 카테고리 또는 작성자 없음", { category: !!category, author: !!author, categories: categories.length, authors: authors.length });
        return null;
      }

      const status = data.status || "draft";
      const { data: row, error } = await supabase
        .from("articles")
        .insert({
          title: data.title,
          subtitle: data.subtitle,
          excerpt: data.excerpt,
          content: data.content,
          category_id: Number(category.id),
          author_id: Number(author.id),
          published_at: status === "published" ? new Date().toISOString() : null,
          thumbnail_url: data.thumbnailUrl || "",
          tags: data.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          status,
        })
        .select("*, categories(*), authors(*)")
        .single();

      if (error) {
        console.error("[addArticle]", error.message, error.details);
        return null;
      }
      if (!row) return null;

      const mapped = mapArticle(row as unknown as DbArticle);
      setArticles((prev) => [mapped, ...prev]);
      return mapped;
    },
    [authors, categories, supabase]
  );

  const updateArticle = useCallback(
    async (id: string, data: ArticleFormData): Promise<Article | null> => {
      const existing = articles.find((a) => a.id === id);
      if (!existing) return null;

      const category = categories.find((c) => c.slug === data.categorySlug) ?? existing.category;
      const author = authors.find((a) => a.id === data.authorId) ?? existing.author;
      const status = data.status || existing.status;

      const { data: row, error } = await supabase
        .from("articles")
        .update({
          title: data.title,
          subtitle: data.subtitle,
          excerpt: data.excerpt,
          content: data.content,
          category_id: Number(category.id),
          author_id: Number(author.id),
          thumbnail_url: data.thumbnailUrl || "",
          tags: data.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          status,
          published_at:
            status === "published" && existing.status !== "published"
              ? new Date().toISOString()
              : existing.publishedAt || null,
        })
        .eq("id", Number(id))
        .select("*, categories(*), authors(*)")
        .single();

      if (error) {
        console.error("[updateArticle]", error.message, error.details);
        return null;
      }
      if (!row) return null;

      const mapped = mapArticle(row as unknown as DbArticle);
      setArticles((prev) => prev.map((article) => (article.id === id ? mapped : article)));
      return mapped;
    },
    [articles, authors, categories, supabase]
  );

  const updateArticleStatus = useCallback(
    async (id: string, status: ArticleStatus) => {
      const existing = articles.find((a) => a.id === id);
      if (!existing) return;

      const { data: row, error } = await supabase
        .from("articles")
        .update({
          status,
          published_at:
            status === "published" && existing.status !== "published"
              ? new Date().toISOString()
              : existing.publishedAt || null,
        })
        .eq("id", Number(id))
        .select("*, categories(*), authors(*)")
        .single();

      if (error) {
        console.error("[updateArticleStatus]", error.message, error.details);
        return;
      }
      if (!row) return;

      const mapped = mapArticle(row as unknown as DbArticle);
      setArticles((prev) => prev.map((article) => (article.id === id ? mapped : article)));
    },
    [articles, supabase]
  );

  const deleteArticle = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("articles").delete().eq("id", Number(id));
      if (error) {
        console.error("[deleteArticle]", error.message, error.details);
        return;
      }
      setArticles((prev) => prev.filter((a) => a.id !== id));
    },
    [supabase]
  );

  const importArticle = useCallback(
    async (data: ImportArticleData): Promise<Article | null> => {
      const category = categories.find((c) => c.slug === data.categorySlug) ?? categories[0];
      const author = authors[0];
      if (!category || !author) {
        console.error("[importArticle] 카테고리 또는 작성자 없음", { category: !!category, author: !!author, categories: categories.length, authors: authors.length });
        return null;
      }

      const { data: row, error } = await supabase
        .from("articles")
        .insert({
          title: data.title,
          subtitle: "",
          excerpt:
            data.excerpt ||
            data.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 160),
          content: data.content,
          category_id: Number(category.id),
          author_id: Number(author.id),
          thumbnail_url: "",
          tags: [],
          status: "pending_review",
          source: data.source || "",
          source_url: data.sourceUrl || "",
          published_at: null,
        })
        .select("*, categories(*), authors(*)")
        .single();

      if (error) {
        console.error("[importArticle]", error.message, error.details);
        return null;
      }
      if (!row) return null;

      const mapped = mapArticle(row as unknown as DbArticle);
      setArticles((prev) => [mapped, ...prev]);
      return mapped;
    },
    [authors, categories, supabase]
  );

  return (
    <AdminContext.Provider
      value={{
        articles,
        categories,
        authors,
        addArticle,
        updateArticle,
        updateArticleStatus,
        deleteArticle,
        getArticle,
        importArticle,
      }}
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
