import type { NfArticle, NfRegion, NfCategory } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

interface NfArticlesResponse {
  articles: NfArticle[];
  total: number;
  limit: number;
  offset: number;
}

interface NfArticleResponse {
  article: NfArticle;
}

interface NfRegionsResponse {
  regions: NfRegion[];
}

interface NfCategoriesResponse {
  categories: NfCategory[];
}

export interface NfFetchArticlesParams {
  region?: string;
  category?: string;
  keyword?: string;
  from?: string;
  to?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

interface NfConfig {
  url: string;
  key: string;
}

async function getConfig(): Promise<NfConfig | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["nf_api_url", "nf_api_key"]);

    if (data && data.length >= 2) {
      const map: Record<string, string> = {};
      for (const row of data) map[row.key] = row.value;
      if (map.nf_api_url && map.nf_api_key) {
        return { url: map.nf_api_url.replace(/\/+$/, ""), key: map.nf_api_key };
      }
    }
  } catch {
    // DB read failed, fall through to env
  }

  const url = process.env.NF_API_URL;
  const key = process.env.NF_API_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/+$/, ""), key };
}

export async function isConfigured(): Promise<boolean> {
  return (await getConfig()) !== null;
}

const MAX_RETRIES = 3;

async function fetchWithRetry(url: string, headers: Record<string, string>): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(url, { headers, next: { revalidate: 0 } });

    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("Retry-After") || "60");
      const waitMs = Math.min(retryAfter * 1000, 60_000);
      await new Promise((r) => setTimeout(r, waitMs));
      lastError = new Error(`NF API 429: Rate limit exceeded`);
      continue;
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`NF API ${res.status}: ${body}`);
    }

    return res;
  }

  throw lastError ?? new Error("NF API: max retries exceeded");
}

async function requireConfig(): Promise<NfConfig> {
  const config = await getConfig();
  if (!config) throw new Error("NF API not configured");
  return config;
}

export async function fetchArticles(
  params: NfFetchArticlesParams = {}
): Promise<NfArticlesResponse> {
  const config = await requireConfig();

  const sp = new URLSearchParams();
  if (params.region) sp.set("region", params.region);
  if (params.category) sp.set("category", params.category);
  if (params.keyword) sp.set("keyword", params.keyword);
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);
  sp.set("status", params.status || "all");
  sp.set("limit", String(params.limit ?? 20));
  sp.set("offset", String(params.offset ?? 0));

  const res = await fetchWithRetry(
    `${config.url}/api/v1/articles?${sp.toString()}`,
    { Authorization: `Bearer ${config.key}` }
  );

  return res.json() as Promise<NfArticlesResponse>;
}

export async function fetchArticle(id: string): Promise<NfArticleResponse> {
  const config = await requireConfig();

  const res = await fetchWithRetry(
    `${config.url}/api/v1/articles/${encodeURIComponent(id)}`,
    { Authorization: `Bearer ${config.key}` }
  );

  return res.json() as Promise<NfArticleResponse>;
}

export async function fetchRegions(): Promise<NfRegionsResponse> {
  const config = await requireConfig();

  const res = await fetchWithRetry(
    `${config.url}/api/v1/regions`,
    { Authorization: `Bearer ${config.key}` }
  );

  return res.json() as Promise<NfRegionsResponse>;
}

export async function fetchCategories(): Promise<NfCategoriesResponse> {
  const config = await requireConfig();

  const res = await fetchWithRetry(
    `${config.url}/api/v1/categories`,
    { Authorization: `Bearer ${config.key}` }
  );

  return res.json() as Promise<NfCategoriesResponse>;
}
