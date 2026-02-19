"use client";

import { useEffect, useRef } from "react";
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
  | { kind: "button"; key: string; label: React.ReactNode; onClick: () => void; isActive: boolean }
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

  async function handleImageInsert() {
    if (onImageUpload) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        const url = await onImageUpload(file);
        if (url) editor?.chain().focus().setImage({ src: url }).run();
      };
      input.click();
    } else {
      const url = prompt("이미지 URL을 입력하세요:");
      if (url) editor?.chain().focus().setImage({ src: url }).run();
    }
  }

  function handleLinkInsert() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href ?? "";
    const url = prompt("URL을 입력하세요:", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }

  function buildToolbar(): ToolbarItem[] {
    if (!editor) return [];
    return [
      { kind: "button", key: "bold", label: <IcoBold />, onClick: () => editor.chain().focus().toggleBold().run(), isActive: editor.isActive("bold") },
      { kind: "button", key: "italic", label: <IcoItalic />, onClick: () => editor.chain().focus().toggleItalic().run(), isActive: editor.isActive("italic") },
      { kind: "button", key: "underline", label: <IcoUnderline />, onClick: () => editor.chain().focus().toggleUnderline().run(), isActive: editor.isActive("underline") },
      { kind: "button", key: "strike", label: <IcoStrike />, onClick: () => editor.chain().focus().toggleStrike().run(), isActive: editor.isActive("strike") },
      { kind: "separator", key: "sep-format" },
      { kind: "button", key: "h2", label: <IcoH2 />, onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: editor.isActive("heading", { level: 2 }) },
      { kind: "button", key: "h3", label: <IcoH3 />, onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), isActive: editor.isActive("heading", { level: 3 }) },
      { kind: "separator", key: "sep-heading" },
      { kind: "button", key: "blockquote", label: <IcoQuote />, onClick: () => editor.chain().focus().toggleBlockquote().run(), isActive: editor.isActive("blockquote") },
      { kind: "button", key: "code", label: <IcoCode />, onClick: () => editor.chain().focus().toggleCode().run(), isActive: editor.isActive("code") },
      { kind: "separator", key: "sep-block" },
      { kind: "button", key: "bullet", label: <IcoBullet />, onClick: () => editor.chain().focus().toggleBulletList().run(), isActive: editor.isActive("bulletList") },
      { kind: "button", key: "ordered", label: <IcoOrdered />, onClick: () => editor.chain().focus().toggleOrderedList().run(), isActive: editor.isActive("orderedList") },
      { kind: "separator", key: "sep-list" },
      { kind: "button", key: "hr", label: <IcoHr />, onClick: () => editor.chain().focus().setHorizontalRule().run(), isActive: false },
      { kind: "button", key: "link", label: <IcoLink />, onClick: handleLinkInsert, isActive: editor.isActive("link") },
      { kind: "button", key: "image", label: <IcoImage />, onClick: handleImageInsert, isActive: false },
      { kind: "separator", key: "sep-insert" },
      { kind: "button", key: "undo", label: <IcoUndo />, onClick: () => editor.chain().focus().undo().run(), isActive: false },
      { kind: "button", key: "redo", label: <IcoRedo />, onClick: () => editor.chain().focus().redo().run(), isActive: false },
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
            >
              {item.label}
            </button>
          ),
        )}
      </div>

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
