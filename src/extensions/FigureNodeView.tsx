import { useEffect, useState, useRef } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

export default function FigureNodeView({
  node,
  updateAttributes,
  selected,
  deleteNode,
}: NodeViewProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [captionFocused, setCaptionFocused] = useState(false);
  const [localCaption, setLocalCaption] = useState(node.attrs.caption || "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const src = node.attrs.src;

  useEffect(() => {
    if (!src) {
      setImgError(true);
      setImgLoaded(false);
      return;
    }
    setImgError(false);
    setImgLoaded(false);
  }, [src]);

  useEffect(() => {
    if (!captionFocused) {
      setLocalCaption(node.attrs.caption || "");
    }
  }, [node.attrs.caption, captionFocused]);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  function onCaptionChange(value: string) {
    setLocalCaption(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateAttributes({ caption: value });
    }, 300);
  }

  return (
    <NodeViewWrapper
      as="figure"
      className={`img-figure ${selected ? "figure-selected ring-2 ring-blue-500" : ""}`}
      data-type="figure"
    >
      <div className="relative group rounded-lg">
        <button
          type="button"
          className="figure-delete-btn"
          onClick={() => { if (window.confirm("이미지를 삭제하시겠습니까?")) deleteNode(); }}
          aria-label="이미지 삭제"
        >
          ✕
        </button>

        {selected && (
          <div className="figure-resize-bar">
            {["25%", "50%", "75%", "100%"].map((w) => (
              <button
                key={w}
                type="button"
                className={`figure-resize-btn ${node.attrs.width === w || (!node.attrs.width && w === "100%") ? "active" : ""}`}
                onClick={() => updateAttributes({ width: w })}
              >
                {w}
              </button>
            ))}
          </div>
        )}

        {node.attrs.uploading ? (
          <div className="figure-loading animate-pulse">이미지 업로드 중...</div>
        ) : imgError ? (
          <div className="figure-error">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10" />
              <path d="m3 16 5-5 4 4" />
              <path d="m14 14 1-1 6 6" />
              <circle cx="9" cy="9" r="2" />
              <path d="m22 22-5-5" />
            </svg>
            <span>이미지를 불러올 수 없습니다</span>
          </div>
        ) : (
          <div className={`${imgLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-150`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={node.attrs.alt || ""}
              className="w-full h-auto rounded-lg"
              style={{ width: node.attrs.width || "100%", height: "auto", margin: "0 auto" }}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          </div>
        )}

        <input
          type="text"
          className="figure-caption-input"
          value={localCaption}
          placeholder={captionFocused ? "" : "이미지 설명을 입력하세요"}
          onFocus={() => setCaptionFocused(true)}
          onBlur={() => { setCaptionFocused(false); updateAttributes({ caption: localCaption }); }}
          onChange={(event) => onCaptionChange(event.target.value)}
        />
      </div>
    </NodeViewWrapper>
  );
}
