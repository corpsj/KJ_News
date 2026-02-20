"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import CharacterCount from "@tiptap/extension-character-count";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  onImageUpload?: (file: File) => Promise<string | null>;
}

type ToolbarItem =
  | { kind: "button"; key: string; ariaLabel: string; label: React.ReactNode; onClick: () => void; isActive: boolean }
  | { kind: "separator"; key: string };

const ico = (d: string) => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const IcoBold      = () => <span className="font-bold text-[14px]">B</span>;
const IcoItalic    = () => <span className="italic text-[14px]">I</span>;
const IcoUnderline = () => <span className="underline text-[14px]">U</span>;
const IcoStrike    = () => <span className="line-through text-[14px]">S</span>;
const IcoH2        = () => <span className="text-[12px] font-bold">H2</span>;
const IcoH3        = () => <span className="text-[12px] font-bold">H3</span>;
const IcoQuote     = () => ico("M3 21c3 0 7-1 7-8V5c0-1.25-.76-2.017-2-2H5c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1M17 21c3 0 7-1 7-8V5c0-1.25-.76-2.017-2-2h-3c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1");
const IcoCode      = () => ico("M16 18l6-6-6-6M8 6l-6 6 6 6");
const IcoBullet    = () => ico("M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01");
const IcoOrdered   = () => <span className="text-[12px] font-bold">1.</span>;
const IcoHr        = () => ico("M5 12h14");
const IcoLink      = () => ico("M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71");
const IcoImage     = () => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);
const IcoUndo = () => ico("M3 7v6h6M3 13a9 9 0 0 1 15.36-6.36");
const IcoRedo = () => ico("M21 7v6h-6M21 13a9 9 0 0 0-15.36-6.36");

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "본문을 입력하세요...",
  onImageUpload,
}: RichTextEditorProps) {
  const isInternalChange = useRef(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      ImageExtension,
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
    ],
    content: value,
    onUpdate: ({ editor: ed }) => {
      isInternalChange.current = true;
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (editor && !isInternalChange.current && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
    isInternalChange.current = false;
  }, [value, editor]);

  function handleImageInsert() {
    setShowImageInput((prev) => !prev);
    setImageUrl("");
    setShowLinkInput(false);
  }

  function insertImageByUrl() {
    const url = imageUrl.trim();
    if (!url) return;
    editor?.chain().focus().setImage({ src: url }).run();
    setShowImageInput(false);
    setImageUrl("");
  }

  function insertImageByFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !onImageUpload) return;
      const url = await onImageUpload(file);
      if (url) editor?.chain().focus().setImage({ src: url }).run();
      setShowImageInput(false);
    };
    input.click();
  }

  function handleLinkInsert() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href ?? "";
    setLinkUrl(prev);
    setShowLinkInput((v) => !v);
    setShowImageInput(false);
  }

  function insertLink() {
    if (!editor) return;
    const url = linkUrl.trim();
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    setShowLinkInput(false);
    setLinkUrl("");
  }

  function removeLink() {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setShowLinkInput(false);
    setLinkUrl("");
  }

  function buildToolbar(): ToolbarItem[] {
    if (!editor) return [];
    return [
      { kind: "button", key: "bold", ariaLabel: "굵게", label: <IcoBold />, onClick: () => editor.chain().focus().toggleBold().run(), isActive: editor.isActive("bold") },
      { kind: "button", key: "italic", ariaLabel: "기울임", label: <IcoItalic />, onClick: () => editor.chain().focus().toggleItalic().run(), isActive: editor.isActive("italic") },
      { kind: "button", key: "underline", ariaLabel: "밑줄", label: <IcoUnderline />, onClick: () => editor.chain().focus().toggleUnderline().run(), isActive: editor.isActive("underline") },
      { kind: "button", key: "strike", ariaLabel: "취소선", label: <IcoStrike />, onClick: () => editor.chain().focus().toggleStrike().run(), isActive: editor.isActive("strike") },
      { kind: "separator", key: "sep-format" },
      { kind: "button", key: "h2", ariaLabel: "제목 2", label: <IcoH2 />, onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: editor.isActive("heading", { level: 2 }) },
      { kind: "button", key: "h3", ariaLabel: "제목 3", label: <IcoH3 />, onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), isActive: editor.isActive("heading", { level: 3 }) },
      { kind: "separator", key: "sep-heading" },
      { kind: "button", key: "blockquote", ariaLabel: "인용", label: <IcoQuote />, onClick: () => editor.chain().focus().toggleBlockquote().run(), isActive: editor.isActive("blockquote") },
      { kind: "button", key: "code", ariaLabel: "코드", label: <IcoCode />, onClick: () => editor.chain().focus().toggleCode().run(), isActive: editor.isActive("code") },
      { kind: "separator", key: "sep-block" },
      { kind: "button", key: "bullet", ariaLabel: "글머리 기호 목록", label: <IcoBullet />, onClick: () => editor.chain().focus().toggleBulletList().run(), isActive: editor.isActive("bulletList") },
      { kind: "button", key: "ordered", ariaLabel: "번호 목록", label: <IcoOrdered />, onClick: () => editor.chain().focus().toggleOrderedList().run(), isActive: editor.isActive("orderedList") },
      { kind: "separator", key: "sep-list" },
      { kind: "button", key: "hr", ariaLabel: "가로선 삽입", label: <IcoHr />, onClick: () => editor.chain().focus().setHorizontalRule().run(), isActive: false },
      { kind: "button", key: "link", ariaLabel: "링크", label: <IcoLink />, onClick: handleLinkInsert, isActive: editor.isActive("link") },
      { kind: "button", key: "image", ariaLabel: "이미지", label: <IcoImage />, onClick: handleImageInsert, isActive: false },
      { kind: "separator", key: "sep-insert" },
      { kind: "button", key: "undo", ariaLabel: "실행 취소", label: <IcoUndo />, onClick: () => editor.chain().focus().undo().run(), isActive: false },
      { kind: "button", key: "redo", ariaLabel: "다시 실행", label: <IcoRedo />, onClick: () => editor.chain().focus().redo().run(), isActive: false },
    ];
  }

  const items = buildToolbar();

  return (
    <div>
      <div className="admin-toolbar">
        {items.map((item) =>
          item.kind === "separator" ? (
            <span key={item.key} className="admin-toolbar-sep" />
          ) : (
            <button
              key={item.key}
              type="button"
              className={item.isActive ? "active" : ""}
              onMouseDown={(e) => e.preventDefault()}
              onClick={item.onClick}
              aria-label={item.ariaLabel}
              title={item.ariaLabel}
            >
              {item.label}
            </button>
          ),
        )}
      </div>

      {showImageInput && (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
          <input
            ref={(el) => el?.focus()}
            type="text"
            className="flex-1 text-sm px-2.5 py-1.5 border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-900"
            placeholder="이미지 URL을 입력하세요"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") insertImageByUrl(); }}
          />
          <button
            type="button"
            className="text-xs font-medium px-3 py-1.5 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
            onClick={insertImageByUrl}
          >
            삽입
          </button>
          {onImageUpload && (
            <button
              type="button"
              className="text-xs px-3 py-1.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={insertImageByFile}
            >
              파일 업로드
            </button>
          )}
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 p-1"
            onClick={() => setShowImageInput(false)}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
      )}

      {showLinkInput && (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
          <input
            ref={(el) => el?.focus()}
            type="text"
            className="flex-1 text-sm px-2.5 py-1.5 border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-900"
            placeholder="URL을 입력하세요 (예: https://...)"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") insertLink(); }}
          />
          <button
            type="button"
            className="text-xs font-medium px-3 py-1.5 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
            onClick={insertLink}
          >
            적용
          </button>
          {editor?.isActive("link") && (
            <button
              type="button"
              className="text-xs px-3 py-1.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={removeLink}
            >
              링크 제거
            </button>
          )}
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 p-1"
            onClick={() => setShowLinkInput(false)}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
      )}

      <div className="admin-editor">
        <EditorContent editor={editor} />
      </div>

      {editor && (
        <div className="flex justify-end gap-3 px-3 py-2 text-[11px] text-gray-400 border-t border-gray-200">
          <span>{editor.storage.characterCount.characters()}자</span>
          <span>{editor.storage.characterCount.words()}단어</span>
        </div>
      )}
    </div>
  );
}
