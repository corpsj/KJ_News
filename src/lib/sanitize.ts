import sanitize from "sanitize-html";

export function sanitizeHtml(html: string): string {
  return sanitize(html, {
    allowedTags: [
      "p", "br", "strong", "em", "u", "s",
      "h2", "h3", "h4",
      "ul", "ol", "li",
      "a", "img",
      "blockquote", "pre", "code",
      "table", "thead", "tbody", "tr", "th", "td",
      "div", "span",
      "figure", "figcaption",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title", "loading", "style"],
      figure: ["data-type"],
      "*": ["class"],
    },
    allowedSchemes: ["http", "https"],
    transformTags: {
      img: (tagName: string, attribs: Record<string, string>) => ({
        tagName,
        attribs: { ...attribs, loading: "lazy" },
      }),
    },
  });
}

/**
 * 본문 HTML에서 첫 번째 이미지(또는 figure로 감싼 이미지)를 제거한다.
 * 썸네일과 본문 첫 이미지가 동일할 때 중복 표시 방지용.
 */
export function removeFirstImage(html: string): string {
  // figure로 감싼 이미지가 있으면 figure 전체 제거
  const figureRemoved = html.replace(/<figure[^>]*>[\s\S]*?<img[^>]*>[\s\S]*?<\/figure>/, "");
  if (figureRemoved !== html) return figureRemoved;
  // 단독 img 태그 제거
  return html.replace(/<img[^>]*>/, "");
}
