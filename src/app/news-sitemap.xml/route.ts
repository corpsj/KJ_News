import { createServiceClient } from "@/lib/supabase/server";
import { SITE_URL, SITE_NAME } from "@/lib/constants";

// Google News sitemap: published articles from the last 48 hours (max 1000).
// Eligibility signal for Google News / "Top stories".
export const revalidate = 300;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const supabase = await createServiceClient();
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data: rows } = await supabase
    .from("articles")
    .select("id, title, published_at")
    .eq("status", "published")
    .gte("published_at", cutoff)
    .order("published_at", { ascending: false })
    .limit(1000);

  const items = (rows || [])
    .map((a) => {
      const pubDate = a.published_at
        ? new Date(a.published_at).toISOString()
        : new Date().toISOString();
      return `  <url>
    <loc>${SITE_URL}/article/${a.id}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(SITE_NAME)}</news:name>
        <news:language>ko</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(a.title)}</news:title>
    </news:news>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
