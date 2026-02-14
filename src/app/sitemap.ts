import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/server";

const baseUrl = "https://kj-news.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createServiceClient();

  const [{ data: articleRows }, { data: categoryRows }] = await Promise.all([
    supabase.from("articles").select("id, updated_at").eq("status", "published"),
    supabase.from("categories").select("slug"),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${baseUrl}/special`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  const articleRoutes: MetadataRoute.Sitemap = (articleRows || []).map((article) => ({
    url: `${baseUrl}/article/${article.id}`,
    lastModified: article.updated_at ? new Date(article.updated_at) : new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = (categoryRows || []).map((category) => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [...staticRoutes, ...articleRoutes, ...categoryRoutes];
}
