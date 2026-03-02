export const NF_TO_KJ_CATEGORY: Record<string, string> = {
  press_release: "press_release",
};

export const NF_CATEGORY_LABELS: Record<string, string> = {
  press_release: "보도자료",
};

export const DEFAULT_NF_CATEGORY_SLUG = "press_release";

export function plainTextToHtml(text: string): string {
  if (!text) return "";
  return text
    .split("\n\n")
    .filter((p) => p.trim())
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
}

export function nfContentToHtml(content: string, images: string[], title?: string): string {
  if (!content && (!images || images.length === 0)) return "";

  const cleanedContent = content.replace(/<img[^>]*>/gi, "");
  const htmlBody = plainTextToHtml(cleanedContent);

  if (!images || images.length === 0) return htmlBody;

  const altText = title ? title.replace(/"/g, '&quot;') : "";
  const imageTags = images
    .filter((url) => url && url.trim())
    .map((url) => `<figure class="img-figure"><img src="${url}" alt="${altText}" /><figcaption class="img-caption"></figcaption></figure>`)
    .join("\n");

  return imageTags + "\n" + htmlBody;
}
