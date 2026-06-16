import { getPublishedArticles } from "@/lib/db";
import { DEFAULT_OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/constants";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cdata(str: string): string {
  return `<![CDATA[${str.replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;
}

function getImageMimeType(url: string): string {
  const pathname = (() => {
    try {
      return new URL(url).pathname.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  })();

  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "image/jpeg";
  if (pathname.endsWith(".webp")) return "image/webp";
  if (pathname.endsWith(".gif")) return "image/gif";
  return "image/png";
}

export async function GET() {
  const articles = await getPublishedArticles(20);

  const items = articles
    .map((article) => {
      const link = `${SITE_URL}/article/${article.id}`;
      const pubDate = article.publishedAt
        ? new Date(article.publishedAt).toUTCString()
        : new Date().toUTCString();
      const imageUrl = article.thumbnailUrl || DEFAULT_OG_IMAGE;
      return `
    <item>
      <title>${cdata(article.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${cdata(article.excerpt)}</description>
      <category>${cdata(article.category.name)}</category>
      <dc:creator>${cdata(article.author.name)}</dc:creator>
      <pubDate>${pubDate}</pubDate>
      <enclosure url="${escapeXml(imageUrl)}" length="0" type="${getImageMimeType(imageUrl)}"/>
      ${article.sourceUrl ? `<source url="${escapeXml(article.sourceUrl)}">${cdata(article.source || SITE_NAME)}</source>` : ""}
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
