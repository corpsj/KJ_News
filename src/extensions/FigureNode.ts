import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import FigureNodeView from "./FigureNodeView";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    figure: {
      insertFigure: (attrs: { src: string; alt?: string; caption?: string }) => ReturnType;
    };
  }
}

const FigureNode = Node.create({
  name: "figure",
  group: "block",
  draggable: true,
  selectable: true,
  isolating: true,
  atom: false,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: "",
      },
      caption: {
        default: "",
      },
      uploading: {
        default: false,
        rendered: false,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure",
        getAttrs: (el) => {
          const img = (el as HTMLElement).querySelector("img");
          if (!img) return false;
          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt") || "",
            caption: (el as HTMLElement).querySelector("figcaption")?.textContent || "",
          };
        },
      },
      {
        tag: "img[src]",
        getAttrs: (el) => {
          return {
            src: (el as HTMLElement).getAttribute("src"),
            alt: (el as HTMLElement).getAttribute("alt") || "",
            caption: "",
          };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const captionContent = node.attrs.caption || "";
    const figcaptionAttrs = { class: "img-caption" };

    return [
      "figure",
      mergeAttributes({ class: "img-figure", "data-type": "figure" }),
      ["img", { src: node.attrs.src, alt: node.attrs.alt || "" }],
      ...(captionContent ? [["figcaption", figcaptionAttrs, captionContent]] : []),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FigureNodeView);
  },

  addCommands() {
    return {
      insertFigure:
        (attrs: { src: string; alt?: string; caption?: string }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { src: attrs.src, alt: attrs.alt || "", caption: attrs.caption || "" },
          });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        if (!editor.isActive("figure")) return false;
        return editor
          .chain()
          .focus()
          .insertContentAt(editor.state.selection.to, { type: "paragraph" })
          .run();
      },
    };
  },
});

export default FigureNode;
