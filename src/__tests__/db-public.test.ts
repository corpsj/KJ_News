import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getArticleById,
  normalizeSearchQuery,
  parseArticleId,
} from "@/lib/db";
import { parsePageNumber } from "@/lib/utils";
import { createServiceClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn(),
}));

function makeArticleRow() {
  return {
    id: 42,
    title: "공개 기사",
    subtitle: "",
    excerpt: "요약",
    content: "<p>본문</p>",
    category_id: 1,
    author_id: 1,
    published_at: "2026-06-10T00:00:00Z",
    thumbnail_url: "",
    view_count: 10,
    tags: ["함평"],
    status: "published",
    source: "",
    source_url: "",
    created_at: "2026-06-10T00:00:00Z",
    updated_at: "2026-06-10T00:00:00Z",
    categories: {
      id: 1,
      name: "사회",
      slug: "society",
      description: "",
      color: "#64748b",
    },
    authors: {
      id: 1,
      name: "기자",
      role: "기자",
    },
  };
}

describe("public article queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects non-canonical article IDs before querying", async () => {
    expect(parseArticleId("42")).toBe(42);
    expect(parseArticleId("0042")).toBe(42);
    expect(parseArticleId("42-preview")).toBeNull();
    expect(parseArticleId("0")).toBeNull();

    const article = await getArticleById("42-preview");
    expect(article).toBeNull();
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it("only fetches published articles for public detail pages", async () => {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.single.mockResolvedValue({ data: makeArticleRow(), error: null });

    const client = {
      from: vi.fn().mockReturnValue(query),
    };
    vi.mocked(createServiceClient).mockResolvedValue(client as never);

    const article = await getArticleById("42");

    expect(article?.id).toBe("42");
    expect(client.from).toHaveBeenCalledWith("articles");
    expect(query.eq).toHaveBeenNthCalledWith(1, "id", 42);
    expect(query.eq).toHaveBeenNthCalledWith(2, "status", "published");
  });
});

describe("public query normalization", () => {
  it("normalizes unsafe search separators", () => {
    expect(normalizeSearchQuery("  함평, 전남{뉴스}(속보)  ")).toBe(
      "함평 전남 뉴스 속보"
    );
  });

  it("falls back to page 1 for invalid pagination input", () => {
    expect(parsePageNumber(undefined)).toBe(1);
    expect(parsePageNumber("abc")).toBe(1);
    expect(parsePageNumber("0")).toBe(1);
    expect(parsePageNumber("3")).toBe(3);
  });
});
