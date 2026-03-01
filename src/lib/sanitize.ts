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
      img: ["src", "alt", "title"],
      "*": ["class"],
    },
    allowedSchemes: ["http", "https"],
  });
}

/**
 * 본문 HTML에서 첫 번째 <img> 태그를 제거한다.
 * 썸네일과 본문 첫 이미지가 동일할 때 중복 표시 방지용.
 */
export function removeFirstImage(html: string): string {
  return html.replace(/<img[^>]*>/, "");
}
