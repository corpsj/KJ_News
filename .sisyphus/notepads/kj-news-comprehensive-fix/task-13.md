# Task 13: 기사 인쇄 CSS + 인쇄 버튼 추가

## Status: ✅ COMPLETED

### Changes Made:

1. **src/app/globals.css** (lines 347-407)
   - Added `@media print` block with comprehensive print styles
   - Hides header, footer, nav, aside, and print-hide elements
   - Sets article to full width for printing
   - Configures body for print (white bg, black text, 12pt font)
   - Shows link URLs in print (except anchors and javascript links)
   - Configures images and page breaks
   - Hides print button during printing

2. **src/components/PrintButton.tsx** (NEW FILE)
   - Created client component with "use client" directive
   - Implements window.print() on button click
   - Styled with Tailwind classes (gray, hover effects, border)
   - Includes printer icon SVG
   - Accessible with aria-label

3. **src/app/(public)/article/[id]/page.tsx**
   - Added import: `import PrintButton from "@/components/PrintButton";`
   - Added `<PrintButton />` component at line 135 (in meta section with date/views)

### Verification:
- PrintButton.tsx: No LSP errors ✅
- globals.css: Print styles added correctly ✅
- article page: PrintButton imported and placed correctly ✅
- Build: Pre-existing error in home page (unrelated to this task)

### Notes:
- Print styles use standard CSS @media print (not Tailwind-specific)
- !important flags ensure Tailwind class override
- Button hidden during print via .print-button-container rule
