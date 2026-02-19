import { createServiceClient } from "@/lib/supabase/server";
import type { Article, Category, Author } from "./types";

function escapeLikeQuery(query: string): string {
  return query.replace(/[%_\\]/g, (char) => `\\${char}`);
}

interface DbArticle {
  id: number;
  title: string;
  subtitle: string;
  excerpt: string;
  content: string;
  category_id: number;
  author_id: number;
  published_at: string;
  thumbnail_url: string;
  view_count: number;
  tags: string[];
  status: string;
  source: string;
  source_url: string;
  created_at: string;
  updated_at: string;
  categories: { id: number; name: string; slug: string; description: string; color: string } | null;
  authors: { id: number; name: string; role: string; avatar_url: string } | null;
}

function mapArticle(row: DbArticle): Article {
  return {
    id: String(row.id),
    title: row.title,
    subtitle: row.subtitle || "",
    excerpt: row.excerpt || "",
    content: row.content || "",
    category: row.categories
      ? {
          id: String(row.categories.id),
          name: row.categories.name,
          slug: row.categories.slug,
          description: row.categories.description || "",
          color: row.categories.color || "#64748b",
        }
      : { id: "0", name: "미분류", slug: "uncategorized", description: "", color: "#64748b" },
    author: row.authors
      ? {
          id: String(row.authors.id),
          name: row.authors.name,
          role: row.authors.role,
          avatarUrl: row.authors.avatar_url || "",
        }
      : { id: "0", name: "알 수 없음", role: "", avatarUrl: "" },
    publishedAt: row.published_at || "",
    thumbnailUrl: row.thumbnail_url || "",
    viewCount: row.view_count || 0,
    tags: row.tags || [],
    status: row.status as Article["status"],
    source: row.source || undefined,
    sourceUrl: row.source_url || undefined,
  };
}

const ARTICLE_SELECT = "*, categories(*), authors(*)";

export async function getPublishedArticles(limit = 20): Promise<Article[]> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as unknown as DbArticle[]).map(mapArticle);
}

export async function getArticleById(id: string): Promise<Article | null> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("id", parseInt(id, 10))
    .single();

  if (error || !data) return null;
  return mapArticle(data as unknown as DbArticle);
}

export async function getArticlesByCategory(slug: string): Promise<Article[]> {
  const supabase = await createServiceClient();

  const { data: cat } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!cat) return [];

  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("category_id", cat.id)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error || !data) return [];
  return (data as unknown as DbArticle[]).map(mapArticle);
}

export async function getMostViewedArticles(limit = 5): Promise<Article[]> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("status", "published")
    .order("view_count", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as unknown as DbArticle[]).map(mapArticle);
}

export async function searchArticles(query: string): Promise<Article[]> {
  const supabase = await createServiceClient();
  const escaped = escapeLikeQuery(query);
  const q = `%${escaped}%`;
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("status", "published")
    .or(`title.ilike.${q},excerpt.ilike.${q},tags.cs.{${escaped}}`)
    .order("published_at", { ascending: false });

  if (error || !data) return [];
  return (data as unknown as DbArticle[]).map(mapArticle);
}

export async function getRelatedArticles(article: Article, limit = 4): Promise<Article[]> {
  const supabase = await createServiceClient();
  const { data: cat } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", article.category.slug)
    .single();

  if (!cat) return [];

  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("status", "published")
    .eq("category_id", cat.id)
    .neq("id", parseInt(article.id, 10))
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as unknown as DbArticle[]).map(mapArticle);
}

export async function getSpecialEditionArticles(): Promise<Article[]> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error || !data) return [];
  return (data as unknown as DbArticle[]).map(mapArticle);
}

export async function getSpecialRelatedArticles(article: Article, limit = 4): Promise<Article[]> {
  const supabase = await createServiceClient();

  const { data: sameCatData } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("status", "published")
    .eq("category_id", parseInt(article.category.id, 10))
    .neq("id", parseInt(article.id, 10))
    .order("published_at", { ascending: false })
    .limit(limit);

  const sameCat = sameCatData
    ? (sameCatData as unknown as DbArticle[]).map(mapArticle)
    : [];

  if (sameCat.length >= limit) return sameCat;

  const { data: restData } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("status", "published")
    .neq("category_id", parseInt(article.category.id, 10))
    .neq("id", parseInt(article.id, 10))
    .order("published_at", { ascending: false })
    .limit(limit - sameCat.length);

  const rest = restData ? (restData as unknown as DbArticle[]).map(mapArticle) : [];
  return [...sameCat, ...rest];
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("id");

  if (error || !data) return [];
  return data.map((c) => ({
    id: String(c.id),
    name: c.name,
    slug: c.slug,
    description: c.description || "",
    color: c.color || "#64748b",
  }));
}

export async function getAuthors(): Promise<Author[]> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase.from("authors").select("*").order("id");

  if (error || !data) return [];
  return data.map((a) => ({
    id: String(a.id),
    name: a.name,
    role: a.role,
    avatarUrl: a.avatar_url || "",
  }));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return {
    id: String(data.id),
    name: data.name,
    slug: data.slug,
    description: data.description || "",
    color: data.color || "#64748b",
  };
}

export async function getAllArticles(): Promise<Article[]> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .order("published_at", { ascending: false });

  if (error || !data) return [];
  return (data as unknown as DbArticle[]).map(mapArticle);
}

export async function getPublishedArticleIds(): Promise<string[]> {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("articles")
    .select("id")
    .eq("status", "published");

  return (data || []).map((a) => String(a.id));
}

export async function getCategorySlugs(): Promise<string[]> {
  const supabase = await createServiceClient();
  const { data } = await supabase.from("categories").select("slug");
  return (data || []).map((c) => c.slug);
}

export async function getPublishedArticlesPaginated(
  page: number,
  perPage: number
): Promise<{ articles: Article[]; total: number }> {
  const supabase = await createServiceClient();
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, error, count } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT, { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(from, to);

  if (error || !data) return { articles: [], total: 0 };
  return {
    articles: (data as unknown as DbArticle[]).map(mapArticle),
    total: count || 0,
  };
}

export async function getArticlesByCategoryPaginated(
  slug: string,
  page: number,
  perPage: number
): Promise<{ articles: Article[]; total: number }> {
  const supabase = await createServiceClient();

  const { data: cat } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!cat) return { articles: [], total: 0 };

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, error, count } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT, { count: "exact" })
    .eq("category_id", cat.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(from, to);

  if (error || !data) return { articles: [], total: 0 };
  return {
    articles: (data as unknown as DbArticle[]).map(mapArticle),
    total: count || 0,
  };
}

export async function searchArticlesPaginated(
  query: string,
  page: number,
  perPage: number
): Promise<{ articles: Article[]; total: number }> {
  const supabase = await createServiceClient();
  const escaped = escapeLikeQuery(query);
  const q = `%${escaped}%`;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, error, count } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT, { count: "exact" })
    .eq("status", "published")
    .or(`title.ilike.${q},excerpt.ilike.${q},tags.cs.{${escaped}}`)
    .order("published_at", { ascending: false })
    .range(from, to);

  if (error || !data) return { articles: [], total: 0 };
  return {
    articles: (data as unknown as DbArticle[]).map(mapArticle),
    total: count || 0,
  };
}
