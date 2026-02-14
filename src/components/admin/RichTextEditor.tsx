"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

type ToolbarButton = {
  key: string;
  label: string;
  onClick: () => void;
  isActive: () => boolean;
  className?: string;
};

type LegacyDocument = {
  execCommand: (commandId: string, showUI?: boolean, value?: string) => boolean;
  queryCommandState: (commandId: string) => boolean;
  queryCommandValue: (commandId: string) => string;
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "본문을 입력하세요...",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const [, setForceUpdate] = useState(0);

  useEffect(() => {
    if (editorRef.current && !isInitialized.current) {
      editorRef.current.innerHTML = value;
      isInitialized.current = true;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const rerenderToolbar = useCallback(() => {
    setForceUpdate((n) => n + 1);
  }, []);

  function getLegacyDoc(): LegacyDocument | null {
    if (typeof document === "undefined") return null;
    return document as unknown as LegacyDocument;
  }

  function exec(command: string, val?: string) {
    const legacyDoc = getLegacyDoc();
    if (!legacyDoc) return;
    legacyDoc.execCommand(command, false, val);
    editorRef.current?.focus();
    handleInput();
    rerenderToolbar();
  }

  function isCommandActive(command: string): boolean {
    try {
      const legacyDoc = getLegacyDoc();
      if (!legacyDoc) return false;
      return legacyDoc.queryCommandState(command);
    } catch {
      return false;
    }
  }

  function isFormatActive(tag: "h2" | "h3"): boolean {
    try {
      const legacyDoc = getLegacyDoc();
      if (!legacyDoc) return false;
      const current = String(legacyDoc.queryCommandValue("formatBlock") || "")
        .toLowerCase()
        .replace(/[<>]/g, "");
      return current === tag;
    } catch {
      return false;
    }
  }

  function handleLink() {
    const url = prompt("URL을 입력하세요:");
    if (url) exec("createLink", url);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const legacyDoc = getLegacyDoc();
    if (!legacyDoc) return;
    const text = e.clipboardData.getData("text/plain");
    legacyDoc.execCommand("insertText", false, text);
    handleInput();
  }

  const toolbarButtons: ToolbarButton[] = [
    {
      key: "bold",
      label: "B",
      className: "font-bold",
      onClick: () => exec("bold"),
      isActive: () => isCommandActive("bold"),
    },
    {
      key: "italic",
      label: "I",
      className: "italic",
      onClick: () => exec("italic"),
      isActive: () => isCommandActive("italic"),
    },
    {
      key: "h2",
      label: "H2",
      onClick: () => exec("formatBlock", "<h2>"),
      isActive: () => isFormatActive("h2"),
    },
    {
      key: "h3",
      label: "H3",
      onClick: () => exec("formatBlock", "<h3>"),
      isActive: () => isFormatActive("h3"),
    },
    {
      key: "ul",
      label: "•",
      onClick: () => exec("insertUnorderedList"),
      isActive: () => isCommandActive("insertUnorderedList"),
    },
    {
      key: "ol",
      label: "1.",
      onClick: () => exec("insertOrderedList"),
      isActive: () => isCommandActive("insertOrderedList"),
    },
    {
      key: "link",
      label: "🔗",
      onClick: handleLink,
      isActive: () => isCommandActive("createLink"),
    },
  ];

  return (
    <div>
      <div className="admin-toolbar">
        {toolbarButtons.map((btn) => (
          <button
            key={btn.key}
            type="button"
            className={`${btn.isActive() ? "active" : ""} ${btn.className ?? ""}`.trim()}
            onMouseDown={(e) => e.preventDefault()}
            onClick={btn.onClick}
          >
            {btn.label}
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        className="admin-editor"
        contentEditable
        data-placeholder={placeholder}
        onInput={handleInput}
        onPaste={handlePaste}
        onMouseUp={rerenderToolbar}
        onKeyUp={rerenderToolbar}
        suppressContentEditableWarning
      />
    </div>
  );
}
