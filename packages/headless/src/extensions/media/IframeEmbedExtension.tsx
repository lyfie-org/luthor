import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  $createNodeSelection,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  $setSelection,
  DecoratorNode,
  DOMConversionMap,
  DOMConversionOutput,
  LexicalEditor,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { BaseExtension } from "../base/BaseExtension";
import { BaseExtensionConfig, ExtensionCategory } from "../types";

export type EmbedAlignment = "left" | "center" | "right";

export type IframeEmbedPayload = {
  src: string;
  width: number;
  height: number;
  alignment: EmbedAlignment;
  title?: string;
  caption?: string;
};

export interface IframeEmbedConfig extends BaseExtensionConfig {
  defaultWidth?: number;
  defaultHeight?: number;
  defaultAlignment?: EmbedAlignment;
}

export type IframeEmbedCommands = {
  insertIframeEmbed: (inputUrl: string, width?: number, height?: number, title?: string) => void;
  setIframeEmbedAlignment: (alignment: EmbedAlignment) => void;
  resizeIframeEmbed: (width: number, height: number) => void;
  setIframeEmbedCaption: (caption: string) => void;
  getIframeEmbedCaption: () => Promise<string>;
  updateIframeEmbedUrl: (inputUrl: string) => boolean;
  getIframeEmbedUrl: () => Promise<string>;
};

export type IframeEmbedQueries = {
  isIframeEmbedSelected: () => Promise<boolean>;
  isIframeEmbedAlignedLeft: () => Promise<boolean>;
  isIframeEmbedAlignedCenter: () => Promise<boolean>;
  isIframeEmbedAlignedRight: () => Promise<boolean>;
};

type SerializedIframeEmbedNode = Spread<
  {
    type: "iframe-embed";
    version: 1;
    src: string;
    width: number;
    height: number;
    alignment: EmbedAlignment;
    title?: string;
    caption?: string;
  },
  SerializedLexicalNode
>;

function ensureProtocol(input: string): string {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function parseUrl(input: string): URL | null {
  try {
    const parsed = new URL(ensureProtocol(input.trim()));
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    if (!parsed.hostname) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function clampSize(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function getAlignmentStyles(alignment: EmbedAlignment): React.CSSProperties {
  if (alignment === "center") {
    return {
      margin: "1rem auto",
      width: "fit-content",
      maxWidth: "100%",
    };
  }

  if (alignment === "left") {
    return {
      margin: "1rem auto 1rem 0",
      width: "fit-content",
      maxWidth: "100%",
    };
  }

  return {
    margin: "1rem 0 1rem auto",
    width: "fit-content",
    maxWidth: "100%",
  };
}

const MIN_EMBED_WIDTH = 240;
const MIN_EMBED_HEIGHT = 140;
const MAX_EMBED_WIDTH = 1600;
const MAX_EMBED_HEIGHT = 1200;

export class IframeEmbedNode extends DecoratorNode<ReactNode> {
  __payload: IframeEmbedPayload;

  static getType(): string {
    return "iframe-embed";
  }

  static clone(node: IframeEmbedNode): IframeEmbedNode {
    return new IframeEmbedNode(node.__payload, node.__key);
  }

  static importJSON(serialized: SerializedIframeEmbedNode): IframeEmbedNode {
    return new IframeEmbedNode({
      src: serialized.src,
      width: clampSize(serialized.width, MIN_EMBED_WIDTH, MAX_EMBED_WIDTH),
      height: clampSize(serialized.height, MIN_EMBED_HEIGHT, MAX_EMBED_HEIGHT),
      alignment: serialized.alignment,
      title: serialized.title,
      caption: serialized.caption ?? "",
    });
  }

  static importDOM(): DOMConversionMap | null {
    const conversion = (element: HTMLElement): DOMConversionOutput => {
      const iframe = element.querySelector("iframe");
      if (!iframe) {
        return { node: null };
      }

      const src = iframe.getAttribute("src") ?? "";
      const width = Number(iframe.getAttribute("width") ?? "640");
      const height = Number(iframe.getAttribute("height") ?? "360");
      const alignment =
        (element.getAttribute("data-align") as EmbedAlignment | null) ??
        "center";
      const figcaption = element.querySelector("figcaption");
      const caption = figcaption?.textContent ?? element.getAttribute("data-caption") ?? "";

      return {
        node: new IframeEmbedNode({
          src,
          width: clampSize(width, MIN_EMBED_WIDTH, MAX_EMBED_WIDTH),
          height: clampSize(height, MIN_EMBED_HEIGHT, MAX_EMBED_HEIGHT),
          alignment,
          title: iframe.getAttribute("title") ?? undefined,
          caption,
        }),
      };
    };

    return {
      div: (domNode: HTMLElement) => {
        const isIframeEmbed =
          domNode.hasAttribute("data-lexical-iframe-embed") ||
          domNode.hasAttribute("data-iframe-embed");

        if (!isIframeEmbed) {
          return null;
        }

        return {
          conversion,
          priority: 4,
        };
      },
      figure: (domNode: HTMLElement) => {
        const isIframeEmbed =
          domNode.hasAttribute("data-lexical-iframe-embed") ||
          domNode.hasAttribute("data-iframe-embed");

        if (!isIframeEmbed) {
          return null;
        }

        return {
          conversion,
          priority: 4,
        };
      },
    };
  }

  constructor(payload: IframeEmbedPayload, key?: NodeKey) {
    super(key);
    this.__payload = payload;
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    div.setAttribute("data-lexical-iframe-embed", "true");
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  exportJSON(): SerializedIframeEmbedNode {
    return {
      type: "iframe-embed",
      version: 1,
      src: this.__payload.src,
      width: this.__payload.width,
      height: this.__payload.height,
      alignment: this.__payload.alignment,
      title: this.__payload.title,
      caption: this.__payload.caption,
    };
  }

  exportDOM(): { element: HTMLElement } {
    const element = document.createElement("figure");
    element.setAttribute("data-lexical-iframe-embed", "true");
    element.setAttribute("data-iframe-embed", "");
    element.setAttribute("data-align", this.__payload.alignment);
    element.setAttribute("data-caption", this.__payload.caption ?? "");
    element.style.margin = "1rem 0";

    const iframe = document.createElement("iframe");
    iframe.setAttribute("src", this.__payload.src);
    iframe.setAttribute("width", String(this.__payload.width));
    iframe.setAttribute("height", String(this.__payload.height));
    iframe.setAttribute("title", this.__payload.title ?? "Embedded content");
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    iframe.setAttribute("allowfullscreen", "true");
    iframe.style.border = "0";

    element.appendChild(iframe);

    if (this.__payload.caption) {
      const figcaption = document.createElement("figcaption");
      figcaption.textContent = this.__payload.caption;
      element.appendChild(figcaption);
    }

    return { element };
  }

  getPayload(): IframeEmbedPayload {
    return this.getLatest().__payload;
  }

  setPayload(payload: Partial<IframeEmbedPayload>): void {
    const writable = this.getWritable();
    writable.__payload = {
      ...writable.__payload,
      ...payload,
    };
  }

  decorate(): ReactNode {
    return <IframeEmbedComponent nodeKey={this.__key} payload={this.__payload} />;
  }

  isInline(): false {
    return false;
  }

  isKeyboardSelectable(): boolean {
    return true;
  }
}

function IframeEmbedComponent({
  nodeKey,
  payload,
}: {
  nodeKey: NodeKey;
  payload: IframeEmbedPayload;
}) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setIsSelected] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [localWidth, setLocalWidth] = useState(payload.width);
  const [localHeight, setLocalHeight] = useState(payload.height);
  const widthRef = useRef(payload.width);
  const heightRef = useRef(payload.height);
  const shellRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const resizeFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setLocalWidth(payload.width);
    setLocalHeight(payload.height);
    widthRef.current = payload.width;
    heightRef.current = payload.height;
  }, [payload.width, payload.height]);

  useEffect(() => {
    return () => {
      if (resizeFrameRef.current != null) {
        window.cancelAnimationFrame(resizeFrameRef.current);
      }
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, []);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isNodeSelection(selection)) {
          setIsSelected(false);
          return;
        }
        const selected = selection.getNodes().some((node) => node.getKey() === nodeKey);
        setIsSelected(selected);
      });
    });
  }, [editor, nodeKey]);

  const updatePayload = (next: Partial<IframeEmbedPayload>) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node instanceof IframeEmbedNode) {
        node.setPayload(next);
      }
    });
  };

  const selectNode = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    editor.update(() => {
      const selection = $createNodeSelection();
      selection.add(nodeKey);
      $setSelection(selection);
    });
  };

  const resizeFromHandle =
    (axis: "width" | "height") =>
    (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const shell = shellRef.current;
    if (!shell) {
      return;
    }

    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = localWidth;
    const startHeight = localHeight;

    document.body.style.userSelect = "none";
    document.body.style.cursor = axis === "width" ? "ew-resize" : "ns-resize";
    setIsResizing(true);

    const applyPreviewSize = () => {
      resizeFrameRef.current = null;
      if (shellRef.current) {
        shellRef.current.style.width = `${widthRef.current}px`;
      }
      if (iframeRef.current) {
        iframeRef.current.style.height = `${heightRef.current}px`;
      }
    };

    const onMove = (moveEvent: MouseEvent) => {
      const nextWidth =
        axis === "width"
          ? clampSize(startWidth + (moveEvent.clientX - startX), MIN_EMBED_WIDTH, MAX_EMBED_WIDTH)
          : widthRef.current;
      const nextHeight =
        axis === "height"
          ? clampSize(startHeight + (moveEvent.clientY - startY), MIN_EMBED_HEIGHT, MAX_EMBED_HEIGHT)
          : heightRef.current;
      widthRef.current = nextWidth;
      heightRef.current = nextHeight;

      if (resizeFrameRef.current == null) {
        resizeFrameRef.current = window.requestAnimationFrame(applyPreviewSize);
      }
    };

    const onUp = () => {
      if (resizeFrameRef.current != null) {
        window.cancelAnimationFrame(resizeFrameRef.current);
        resizeFrameRef.current = null;
      }
      setIsResizing(false);
      setLocalWidth(widthRef.current);
      setLocalHeight(heightRef.current);
      updatePayload({ width: widthRef.current, height: heightRef.current });
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const wrapperStyle = useMemo(() => getAlignmentStyles(payload.alignment), [payload.alignment]);
  const captionStyle = useMemo<React.CSSProperties>(
    () => ({
      marginTop: "0.5rem",
      textAlign: "center",
      color: "#666",
      fontSize: "0.9em",
      fontStyle: "italic",
    }),
    [],
  );
  const showResizeHandles = isSelected && !isResizing;

  return (
    <div style={wrapperStyle}>
      <div
        ref={shellRef}
        className={`luthor-media-embed-shell${isSelected ? " is-selected" : ""}${isResizing ? " is-resizing" : ""}`}
        data-luthor-selection-anchor="true"
        style={{ width: localWidth, maxWidth: "100%" }}
        onClick={selectNode}
      >
        <iframe
          ref={iframeRef}
          src={payload.src}
          title={payload.title ?? "Embedded content"}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          style={{
            width: "100%",
            height: `${localHeight}px`,
            border: "0",
            display: "block",
            pointerEvents: isSelected && !isResizing ? "auto" : "none",
          }}
        />

        <button
          type="button"
          className="luthor-media-embed-resize-handle-width"
          aria-label="Resize iframe width"
          aria-hidden={!showResizeHandles}
          tabIndex={showResizeHandles ? 0 : -1}
          style={{ opacity: showResizeHandles ? 1 : 0, pointerEvents: showResizeHandles ? "auto" : "none" }}
          onMouseDown={resizeFromHandle("width")}
        />
        <button
          type="button"
          className="luthor-media-embed-resize-handle-height"
          aria-label="Resize iframe height"
          aria-hidden={!showResizeHandles}
          tabIndex={showResizeHandles ? 0 : -1}
          style={{ opacity: showResizeHandles ? 1 : 0, pointerEvents: showResizeHandles ? "auto" : "none" }}
          onMouseDown={resizeFromHandle("height")}
        />
      </div>
      {payload.caption ? <figcaption style={captionStyle}>{payload.caption}</figcaption> : null}
    </div>
  );
}

export class IframeEmbedExtension extends BaseExtension<
  "iframeEmbed",
  IframeEmbedConfig,
  IframeEmbedCommands,
  IframeEmbedQueries,
  ReactNode[]
> {
  constructor(config?: Partial<IframeEmbedConfig>) {
    super("iframeEmbed", [ExtensionCategory.Toolbar]);
    this.config = {
      defaultWidth: 640,
      defaultHeight: 360,
      defaultAlignment: "center",
      ...config,
    } as IframeEmbedConfig;
  }

  register(editor: LexicalEditor): () => void {
    void editor;
    return () => {};
  }

  getNodes(): any[] {
    return [IframeEmbedNode];
  }

  getPlugins(): ReactNode[] {
    return [];
  }

  getCommands(editor: LexicalEditor): IframeEmbedCommands {
    return {
      insertIframeEmbed: (inputUrl: string, width?: number, height?: number, title?: string) => {
        const parsedUrl = parseUrl(inputUrl);
        if (!parsedUrl) {
          return;
        }

        editor.update(() => {
          const node = new IframeEmbedNode({
            src: parsedUrl.toString(),
            width: clampSize(width ?? this.config.defaultWidth ?? 640, MIN_EMBED_WIDTH, MAX_EMBED_WIDTH),
            height: clampSize(height ?? this.config.defaultHeight ?? 360, MIN_EMBED_HEIGHT, MAX_EMBED_HEIGHT),
            alignment: this.config.defaultAlignment ?? "center",
            title,
            caption: "",
          });

          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertNodes([node]);
          } else {
            $getRoot().append(node);
          }
        });
      },
      setIframeEmbedAlignment: (alignment: EmbedAlignment) => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isNodeSelection(selection)) {
            return;
          }

          selection.getNodes().forEach((node) => {
            if (node instanceof IframeEmbedNode) {
              node.setPayload({ alignment });
            }
          });
        });
      },
      resizeIframeEmbed: (width: number, height: number) => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isNodeSelection(selection)) {
            return;
          }

          selection.getNodes().forEach((node) => {
            if (node instanceof IframeEmbedNode) {
              node.setPayload({
                width: clampSize(width, MIN_EMBED_WIDTH, MAX_EMBED_WIDTH),
                height: clampSize(height, MIN_EMBED_HEIGHT, MAX_EMBED_HEIGHT),
              });
            }
          });
        });
      },
      setIframeEmbedCaption: (caption: string) => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isNodeSelection(selection)) {
            return;
          }

          selection.getNodes().forEach((node) => {
            if (node instanceof IframeEmbedNode) {
              node.setPayload({ caption });
            }
          });
        });
      },
      getIframeEmbedCaption: () =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if (!$isNodeSelection(selection)) {
              resolve("");
              return;
            }

            const node = selection.getNodes().find((item) => item instanceof IframeEmbedNode) as IframeEmbedNode | undefined;
            resolve(node?.getPayload().caption ?? "");
          });
        }),
      updateIframeEmbedUrl: (inputUrl: string) => {
        const parsedUrl = parseUrl(inputUrl);
        if (!parsedUrl) {
          return false;
        }

        let updated = false;
        editor.update(() => {
          const selection = $getSelection();
          if (!$isNodeSelection(selection)) {
            return;
          }

          selection.getNodes().forEach((node) => {
            if (node instanceof IframeEmbedNode) {
              node.setPayload({ src: parsedUrl.toString() });
              updated = true;
            }
          });
        });
        return updated;
      },
      getIframeEmbedUrl: () =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if (!$isNodeSelection(selection)) {
              resolve("");
              return;
            }

            const node = selection.getNodes().find((item) => item instanceof IframeEmbedNode) as IframeEmbedNode | undefined;
            resolve(node?.getPayload().src ?? "");
          });
        }),
    };
  }

  getStateQueries(editor: LexicalEditor): IframeEmbedQueries {
    return {
      isIframeEmbedSelected: () =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if (!$isNodeSelection(selection)) {
              resolve(false);
              return;
            }

            resolve(selection.getNodes().some((node) => node instanceof IframeEmbedNode));
          });
        }),
      isIframeEmbedAlignedLeft: () =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if (!$isNodeSelection(selection)) {
              resolve(false);
              return;
            }

            const node = selection.getNodes().find((item) => item instanceof IframeEmbedNode) as IframeEmbedNode | undefined;
            resolve(node?.getPayload().alignment === "left");
          });
        }),
      isIframeEmbedAlignedCenter: () =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if (!$isNodeSelection(selection)) {
              resolve(false);
              return;
            }

            const node = selection.getNodes().find((item) => item instanceof IframeEmbedNode) as IframeEmbedNode | undefined;
            resolve(node?.getPayload().alignment === "center");
          });
        }),
      isIframeEmbedAlignedRight: () =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if (!$isNodeSelection(selection)) {
              resolve(false);
              return;
            }

            const node = selection.getNodes().find((item) => item instanceof IframeEmbedNode) as IframeEmbedNode | undefined;
            resolve(node?.getPayload().alignment === "right");
          });
        }),
    };
  }
}

export const iframeEmbedExtension = new IframeEmbedExtension();
