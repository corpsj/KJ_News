
## Task 12: 소셜 공유 버튼 컴포넌트 생성 및 article page에 추가

### ✅ Completed

**Files Created:**
- `src/components/ShareButtons.tsx` (121 lines)

**Files Modified:**
- `src/app/(public)/article/[id]/page.tsx` (added import + component usage)

### Implementation Details

**ShareButtons Component Features:**
1. **"use client" directive** - Uses window.location and navigator.clipboard
2. **4 Share Buttons:**
   - 카카오톡: Opens Kakao Talk share dialog via `https://sharer.kakao.com/talk/friends/picker/link?url=`
   - 트위터(X): Opens Twitter intent via `https://twitter.com/intent/tweet?url=&text=`
   - 페이스북: Opens Facebook share dialog via `https://www.facebook.com/sharer/sharer.php?u=`
   - 링크 복사: Uses `navigator.clipboard.writeText()` with 1.5s feedback ("복사됨" → "링크")

3. **Styling:**
   - Matches PrintButton.tsx pattern exactly
   - Monochrome design: `text-gray-500 hover:text-gray-800 hover:bg-gray-100 border border-gray-200`
   - SVG icons (14x14) with proper accessibility attributes
   - Flex layout with 2px gap between buttons

4. **Props:**
   - `url: string` - Article URL (format: `${SITE_URL}/article/${id}`)
   - `title: string` - Article title for Twitter share text

**Integration:**
- Added to article page line 137, right after `<PrintButton />`
- Receives dynamic URL and title from article data
- No new npm packages required

### Build Status
✅ `npm run build` - Success (exit 0)
✅ No LSP diagnostics on ShareButtons.tsx
✅ All 49 static pages generated successfully

### Notes
- Kakao SDK not required (simple URL-based sharing)
- Window.open() used for social platform dialogs
- Copy feedback uses useState for 1.5s timeout
- All buttons use consistent styling and accessibility labels
