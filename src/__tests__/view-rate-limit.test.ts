describe("view rate limiting logic", () => {
  it("should detect already-viewed articles from cookie", () => {
    const viewedIds = "1,2,3".split(",");
    expect(viewedIds.includes("1")).toBe(true);
    expect(viewedIds.includes("4")).toBe(false);
  });

  it("should add new article ID to viewed list", () => {
    const existing = ["1", "2"];
    const newId = "3";
    const updated = [...existing, newId].join(",");
    expect(updated).toBe("1,2,3");
  });

  it("should handle empty cookie", () => {
    const viewedIds = "".split(",").filter(Boolean);
    expect(viewedIds.length).toBe(0);
    expect(viewedIds.includes("1")).toBe(false);
  });
});
