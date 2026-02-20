export interface NfApiArticle {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  category: string;
  source: string;
  source_url: string;
  images: string[];
  published_at: string;
  processed_at: string;
}

interface NfArticlesResponse {
  articles: NfApiArticle[];
  total: number;
  limit: number;
  offset: number;
}

interface NfFetchArticlesParams {
  region?: string;
  category?: string;
  keyword?: string;
  from?: string;
  to?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

function getConfig() {
  const url = process.env.NF_API_URL;
  const key = process.env.NF_API_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/+$/, ""), key };
}

export function isConfigured(): boolean {
  return getConfig() !== null;
}

export async function fetchArticles(
  params: NfFetchArticlesParams = {}
): Promise<NfArticlesResponse> {
  const config = getConfig();
  if (!config) throw new Error("NF_API_URL or NF_API_KEY not configured");

  const sp = new URLSearchParams();
  if (params.region) sp.set("region", params.region);
  if (params.category) sp.set("category", params.category);
  if (params.keyword) sp.set("keyword", params.keyword);
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);
  sp.set("status", params.status || "all");
  sp.set("limit", String(params.limit ?? 100));
  sp.set("offset", String(params.offset ?? 0));

  const res = await fetch(`${config.url}/api/v1/articles?${sp.toString()}`, {
    headers: { Authorization: `Bearer ${config.key}` },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`NF API ${res.status}: ${body}`);
  }

  return res.json() as Promise<NfArticlesResponse>;
}

export async function testConnection(): Promise<boolean> {
  try {
    const data = await fetchArticles({ limit: 1 });
    return Array.isArray(data.articles);
  } catch {
    return false;
  }
}

export function maskApiKey(key: string): string {
  if (!key || key.length <= 16) return key || "";
  return `${key.slice(0, 8)}${"*".repeat(8)}...${key.slice(-4)}`;
}
