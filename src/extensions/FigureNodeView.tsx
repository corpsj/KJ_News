import { useEffect, useState } from "react";
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
          onClick={() => deleteNode()}
          aria-label="이미지 삭제"
        >
          ✕
        </button>

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
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          </div>
        )}

        <input
          type="text"
          className="figure-caption-input"
          value={node.attrs.caption || ""}
          placeholder={captionFocused ? "" : "이미지 설명을 입력하세요"}
          onFocus={() => setCaptionFocused(true)}
          onBlur={() => setCaptionFocused(false)}
          onChange={(event) => updateAttributes({ caption: event.target.value })}
        />
      </div>
    </NodeViewWrapper>
  );
}
