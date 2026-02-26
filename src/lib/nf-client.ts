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

const CONFIG_TTL = 5 * 60 * 1000;
const REGIONS_TTL = 60 * 60 * 1000;
const CATEGORIES_TTL = 60 * 60 * 1000;

let configCache: { data: NfConfig | null; expiresAt: number } | null = null;
let regionsCache: { data: NfRegionsResponse; expiresAt: number } | null = null;
let categoriesCache: { data: NfCategoriesResponse; expiresAt: number } | null = null;

async function getConfig(): Promise<NfConfig | null> {
  const now = Date.now();
  if (configCache && now < configCache.expiresAt) {
    return configCache.data;
  }

  let result: NfConfig | null = null;

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
        result = { url: map.nf_api_url.replace(/\/+$/, ""), key: map.nf_api_key };
      }
    }
  } catch {
    // DB read failed, fall through to env
  }

  if (!result) {
    const url = process.env.NF_API_URL;
    const key = process.env.NF_API_KEY;
    if (url && key) {
      result = { url: url.replace(/\/+$/, ""), key };
    }
  }

  configCache = { data: result, expiresAt: now + CONFIG_TTL };
  return result;
}

export async function isConfigured(): Promise<boolean> {
  return (await getConfig()) !== null;
}

const MAX_RETRIES = 3;

async function fetchWithRetry(
  url: string,
  headers: Record<string, string>,
  revalidate = 0
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(url, { headers, next: { revalidate } });

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
    { Authorization: `Bearer ${config.key}` },
    30
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
  const now = Date.now();
  if (regionsCache && now < regionsCache.expiresAt) {
    return regionsCache.data;
  }

  const config = await requireConfig();

  const res = await fetchWithRetry(
    `${config.url}/api/v1/regions`,
    { Authorization: `Bearer ${config.key}` }
  );

  const data = (await res.json()) as NfRegionsResponse;
  regionsCache = { data, expiresAt: now + REGIONS_TTL };
  return data;
}

export async function fetchCategories(): Promise<NfCategoriesResponse> {
  const now = Date.now();
  if (categoriesCache && now < categoriesCache.expiresAt) {
    return categoriesCache.data;
  }

  const config = await requireConfig();

  const res = await fetchWithRetry(
    `${config.url}/api/v1/categories`,
    { Authorization: `Bearer ${config.key}` }
  );

  const data = (await res.json()) as NfCategoriesResponse;
  categoriesCache = { data, expiresAt: now + CATEGORIES_TTL };
  return data;
}
