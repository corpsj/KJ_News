import { nfContentToHtml } from "@/lib/nf-constants";
import { removeFirstImage } from "@/lib/sanitize";

describe("nfContentToHtml", () => {
  it("returns empty string when content is empty and no images", () => {
    const result = nfContentToHtml("", []);
    expect(result).toBe("");
  });

  it("returns empty string when content is empty and images array is undefined", () => {
    const result = nfContentToHtml("", undefined as any);
    expect(result).toBe("");
  });

  it("returns HTML paragraphs when content only, no images", () => {
    const content = "First paragraph\n\nSecond paragraph";
    const result = nfContentToHtml(content, []);
    expect(result).toContain("<p>First paragraph</p>");
    expect(result).toContain("<p>Second paragraph</p>");
    expect(result).not.toContain("<figure");
  });

  it("returns figure tags only when no content, images only", () => {
    const images = ["https://example.com/image1.jpg", "https://example.com/image2.jpg"];
    const result = nfContentToHtml("", images);
    expect(result).toContain('<figure class="img-figure">');
    expect(result).toContain('<img src="https://example.com/image1.jpg" alt="" />');
    expect(result).toContain('<img src="https://example.com/image2.jpg" alt="" />');
    expect(result).toContain('<figcaption class="img-caption"></figcaption>');
    expect(result).not.toContain("<p>");
  });

  it("returns images first, then paragraphs when content and images both present", () => {
    const content = "Some content here";
    const images = ["https://example.com/image.jpg"];
    const result = nfContentToHtml(content, images);
    const figureIndex = result.indexOf('<figure class="img-figure">');
    const paragraphIndex = result.indexOf("<p>");
    expect(figureIndex).toBeLessThan(paragraphIndex);
    expect(result).toContain('<img src="https://example.com/image.jpg" alt="" />');
    expect(result).toContain("<p>Some content here</p>");
  });

  it("wraps each image in proper figure structure", () => {
    const images = ["https://example.com/test.jpg"];
    const result = nfContentToHtml("", images);
    expect(result).toMatch(
      /<figure class="img-figure"><img src="https:\/\/example\.com\/test\.jpg" alt="" \/><figcaption class="img-caption"><\/figcaption><\/figure>/
    );
  });

  it("strips existing img tags from content before conversion", () => {
    const content = 'Some text<img src="https://example.com/old.jpg" alt="old"/>More text';
    const result = nfContentToHtml(content, []);
    expect(result).not.toContain("<img");
    expect(result).toContain("Some text");
    expect(result).toContain("More text");
  });

  it("filters out empty and whitespace URLs from images array", () => {
    const images = ["https://example.com/valid.jpg", "", "  ", "https://example.com/another.jpg"];
    const result = nfContentToHtml("", images);
    const figureCount = (result.match(/<figure class="img-figure">/g) || []).length;
    expect(figureCount).toBe(2);
    expect(result).toContain("https://example.com/valid.jpg");
    expect(result).toContain("https://example.com/another.jpg");
  });

  it("handles multiple paragraphs separated by double newlines", () => {
    const content = "Paragraph 1\n\nParagraph 2\n\nParagraph 3";
    const result = nfContentToHtml(content, []);
    expect(result).toContain("<p>Paragraph 1</p>");
    expect(result).toContain("<p>Paragraph 2</p>");
    expect(result).toContain("<p>Paragraph 3</p>");
  });

  it("handles single newlines within paragraphs as line breaks", () => {
    const content = "Line 1\nLine 2\n\nNew paragraph";
    const result = nfContentToHtml(content, []);
    expect(result).toContain("Line 1<br/>Line 2");
    expect(result).toContain("<p>New paragraph</p>");
  });
});

describe("removeFirstImage", () => {
  it("removes first figure tag with img inside", () => {
    const html =
      '<figure class="img-figure"><img src="https://example.com/image.jpg" alt="" /><figcaption class="img-caption"></figcaption></figure><p>Content</p>';
    const result = removeFirstImage(html);
    expect(result).not.toContain('<figure class="img-figure">');
    expect(result).toContain("<p>Content</p>");
  });

  it("removes standalone img tag if no figure exists", () => {
    const html = '<img src="https://example.com/image.jpg" alt="test" /><p>Content</p>';
    const result = removeFirstImage(html);
    expect(result).not.toContain("<img");
    expect(result).toContain("<p>Content</p>");
  });

  it("removes only first image, leaves subsequent images intact", () => {
    const html =
      '<figure class="img-figure"><img src="https://example.com/first.jpg" alt="" /><figcaption class="img-caption"></figcaption></figure><figure class="img-figure"><img src="https://example.com/second.jpg" alt="" /><figcaption class="img-caption"></figcaption></figure>';
    const result = removeFirstImage(html);
    expect(result).not.toContain("first.jpg");
    expect(result).toContain("second.jpg");
    expect(result).toContain('<figure class="img-figure">');
  });

  it("returns unchanged HTML if no images present", () => {
    const html = "<p>Just text</p><p>No images</p>";
    const result = removeFirstImage(html);
    expect(result).toBe(html);
  });

  it("handles figure with attributes like data-type", () => {
    const html =
      '<figure class="img-figure" data-type="figure"><img src="https://example.com/image.jpg" alt="" /><figcaption class="img-caption">Caption</figcaption></figure><p>Content</p>';
    const result = removeFirstImage(html);
    expect(result).not.toContain("data-type");
    expect(result).not.toContain("https://example.com/image.jpg");
    expect(result).toContain("<p>Content</p>");
  });

  it("removes img tag with various attributes", () => {
    const html = '<img src="https://example.com/image.jpg" alt="description" title="title" /><p>Content</p>';
    const result = removeFirstImage(html);
    expect(result).not.toContain("<img");
    expect(result).toContain("<p>Content</p>");
  });

  it("handles whitespace and newlines in figure tags", () => {
    const html = `<figure class="img-figure">
      <img src="https://example.com/image.jpg" alt="" />
      <figcaption class="img-caption"></figcaption>
    </figure>
    <p>Content</p>`;
    const result = removeFirstImage(html);
    expect(result).not.toContain("https://example.com/image.jpg");
    expect(result).toContain("<p>Content</p>");
  });
});
