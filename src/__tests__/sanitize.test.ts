import { sanitizeHtml } from "@/lib/sanitize";

describe("sanitizeHtml", () => {
  it("removes script tags", () => {
    const result = sanitizeHtml('<script>alert("xss")</script><p>safe</p>');
    expect(result).not.toContain("<script>");
    expect(result).toContain("safe");
  });

  it("removes onerror event handlers", () => {
    const result = sanitizeHtml('<img onerror="alert(1)" src="x">');
    expect(result).not.toContain("onerror");
  });

  it("removes javascript: protocol in href", () => {
    const result = sanitizeHtml('<a href="javascript:void(0)">click</a>');
    expect(result).not.toContain("javascript:");
  });
});
