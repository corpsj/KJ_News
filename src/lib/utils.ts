import { articles } from "./mock-data";
import type { Article } from "./types";

export function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${month}.${day}`;
}

export function getArticlesByCategory(slug: string): Article[] {
  return articles.filter((a) => a.category.slug === slug);
}

export function getArticleById(id: string): Article | undefined {
  return articles.find((a) => a.id === id);
}

export function searchArticles(query: string): Article[] {
  const q = query.toLowerCase();
  return articles.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.excerpt.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q))
  );
}

export function getRelatedArticles(article: Article, limit = 4): Article[] {
  return articles
    .filter(
      (a) => a.id !== article.id && a.category.slug === article.category.slug
    )
    .slice(0, limit);
}

export function getMostViewedArticles(limit = 5): Article[] {
  return [...articles].sort((a, b) => b.viewCount - a.viewCount).slice(0, limit);
}

export function getLatestArticles(limit = 10): Article[] {
  return [...articles]
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    .slice(0, limit);
}

export function getSpecialEditionArticles(): Article[] {
  return [...articles]
    .filter((a) => a.status === "published")
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
}

export function getSpecialRelatedArticles(
  article: Article,
  limit = 4
): Article[] {
  const published = articles.filter(
    (a) => a.id !== article.id && a.status === "published"
  );
  const sameCat = published.filter(
    (a) => a.category.slug === article.category.slug
  );
  if (sameCat.length >= limit) return sameCat.slice(0, limit);
  const rest = published.filter(
    (a) => a.category.slug !== article.category.slug
  );
  return [...sameCat, ...rest].slice(0, limit);
}
