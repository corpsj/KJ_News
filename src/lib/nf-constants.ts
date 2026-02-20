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
