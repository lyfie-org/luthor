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
import { EmbedAlignment } from "./IframeEmbedExtension";

export type YouTubeEmbedPayload = {
  src: string;
  width: number;
  height: number;
  alignment: EmbedAlignment;
  caption?: string;
  start?: number;
};

export interface YouTubeEmbedConfig extends BaseExtensionConfig {
  defaultWidth?: number;
  defaultHeight?: number;
  defaultAlignment?: EmbedAlignment;
  allowFullscreen?: boolean;
  autoplay?: boolean;
  controls?: boolean;
  nocookie?: boolean;
  rel?: number;
}

export type YouTubeEmbedCommands = {
  insertYouTubeEmbed: (inputUrl: string, width?: number, height?: number, start?: number) => void;
  setYouTubeEmbedAlignment: (alignment: EmbedAlignment) => void;
  resizeYouTubeEmbed: (width: number, height: number) => void;
  setYouTubeEmbedCaption: (caption: string) => void;
  getYouTubeEmbedCaption: () => Promise<string>;
  updateYouTubeEmbedUrl: (inputUrl: string) => boolean;
  getYouTubeEmbedUrl: () => Promise<string>;
};

export type YouTubeEmbedQueries = {
  isYouTubeEmbedSelected: () => Promise<boolean>;
  isYouTubeEmbedAlignedLeft: () => Promise<boolean>;
  isYouTubeEmbedAlignedCenter: () => Promise<boolean>;
  isYouTubeEmbedAlignedRight: () => Promise<boolean>;
};

type SerializedYouTubeEmbedNode = Spread<
  {
    type: "youtube-embed";
    version: 1;
    src: string;
    width: number;
    height: number;
    alignment: EmbedAlignment;
    caption?: string;
    start?: number;
  },
  SerializedLexicalNode
>;

const MIN_EMBED_WIDTH = 240;
const MIN_EMBED_HEIGHT = 140;
const MAX_EMBED_WIDTH = 1600;
const MAX_EMBED_HEIGHT = 1200;

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

function ensureProtocol(input: string): string {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function parseUrl(input: string): URL | null {
  try {
    return new URL(ensureProtocol(input));
  } catch {
    return null;
  }
}

function isValidYoutubeUrl(input: string): boolean {
  return /^((?:https?:)?\/\/)?((?:www|m|music)\.)?((?:youtube\.com|youtu\.be|youtube-nocookie\.com))(\/.*)?$/i.test(
    input,
  );
}

function isValidYouTubeToken(value?: string | null): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{3,}$/.test(value);
}

function getYouTubeTarget(url: URL): { videoId?: string; playlistId?: string } | null {
  const hostname = url.hostname.toLowerCase();
  const pathname = url.pathname;

  if (hostname === "youtu.be") {
    const id = pathname.split("/").filter(Boolean)[0];
    return isValidYouTubeToken(id) ? { videoId: id } : null;
  }

  if (pathname === "/playlist") {
    const list = url.searchParams.get("list");
    return isValidYouTubeToken(list) ? { playlistId: list } : null;
  }

  if (pathname.startsWith("/shorts/")) {
    const id = pathname.split("/")[2];
    return isValidYouTubeToken(id) ? { videoId: id } : null;
  }

  if (pathname.startsWith("/embed/")) {
    const segment = pathname.split("/")[2];
    if (!segment) {
      return null;
    }
    if (segment === "videoseries") {
      const list = url.searchParams.get("list");
      return isValidYouTubeToken(list) ? { playlistId: list } : null;
    }
    return isValidYouTubeToken(segment) ? { videoId: segment } : null;
  }

  if (pathname === "/watch") {
    const playlistId = url.searchParams.get("list");
    const videoId = url.searchParams.get("v");
    const result: { videoId?: string; playlistId?: string } = {};
    if (isValidYouTubeToken(videoId)) {
      result.videoId = videoId;
    }
    if (isValidYouTubeToken(playlistId)) {
      result.playlistId = playlistId;
    }
    return result.videoId || result.playlistId ? result : null;
  }

  const fallbackVideo = url.searchParams.get("v");
  const fallbackList = url.searchParams.get("list");
  if (isValidYouTubeToken(fallbackVideo) || isValidYouTubeToken(fallbackList)) {
    return {
      videoId: isValidYouTubeToken(fallbackVideo) ? fallbackVideo : undefined,
      playlistId: isValidYouTubeToken(fallbackList) ? fallbackList : undefined,
    };
  }

  return null;
}

function toEmbedUrl(
  inputUrl: string,
  options: {
    allowFullscreen: boolean;
    autoplay: boolean;
    controls: boolean;
    nocookie: boolean;
    rel: number;
    start: number;
  },
): string | null {
  if (!isValidYoutubeUrl(inputUrl)) {
    return null;
  }

  const parsed = parseUrl(inputUrl);
  if (!parsed) {
    return null;
  }

  if (parsed.pathname.includes("/embed/")) {
    return parsed.toString();
  }

  const ids = getYouTubeTarget(parsed);
  if (!ids) {
    return null;
  }
  const base = options.nocookie
    ? "https://www.youtube-nocookie.com/embed/"
    : "https://www.youtube.com/embed/";

  let outputUrl = "";
  if (ids.playlistId && !ids.videoId) {
    outputUrl = `${base}videoseries?list=${encodeURIComponent(ids.playlistId)}`;
  } else if (ids.videoId) {
    outputUrl = `${base}${encodeURIComponent(ids.videoId)}`;
  }

  if (!outputUrl) {
    return null;
  }

  const params: string[] = [];

  if (!options.allowFullscreen) {
    params.push("fs=0");
  }
  if (options.autoplay) {
    params.push("autoplay=1");
  }
  if (!options.controls) {
    params.push("controls=0");
  }
  if (options.rel !== 1) {
    params.push(`rel=${options.rel}`);
  }
  if (options.start > 0) {
    params.push(`start=${Math.max(0, Math.floor(options.start))}`);
  }

  if (params.length === 0) {
    return outputUrl;
  }

  const separator = outputUrl.includes("?") ? "&" : "?";
  return `${outputUrl}${separator}${params.join("&")}`;
}

function updateEmbedUrlPreservingParams(currentEmbedUrl: string, inputUrl: string): string | null {
  const parsedCurrent = parseUrl(currentEmbedUrl);
  if (!parsedCurrent) {
    return null;
  }

  if (!isValidYoutubeUrl(inputUrl)) {
    return null;
  }

  const parsedInput = parseUrl(inputUrl);
  if (!parsedInput) {
    return null;
  }

  const target = getYouTubeTarget(parsedInput);
  if (!target || (!target.videoId && !target.playlistId)) {
    return null;
  }

  const preserveParams = new URLSearchParams(parsedCurrent.search);
  preserveParams.delete("v");
  preserveParams.delete("list");
  preserveParams.delete("index");

  if (target.playlistId) {
    preserveParams.set("list", target.playlistId);
  }

  const useNoCookie = parsedCurrent.hostname.toLowerCase().includes("youtube-nocookie.com");
  const base = useNoCookie ? "https://www.youtube-nocookie.com" : "https://www.youtube.com";
  const path = target.videoId ? `/embed/${encodeURIComponent(target.videoId)}` : "/embed/videoseries";

  const nextUrl = new URL(`${base}${path}`);
  nextUrl.search = preserveParams.toString();
  return nextUrl.toString();
}

export class YouTubeEmbedNode extends DecoratorNode<ReactNode> {
  __payload: YouTubeEmbedPayload;

  static getType(): string {
    return "youtube-embed";
  }

  static clone(node: YouTubeEmbedNode): YouTubeEmbedNode {
    return new YouTubeEmbedNode(node.__payload, node.__key);
  }

  static importJSON(serialized: SerializedYouTubeEmbedNode): YouTubeEmbedNode {
    return new YouTubeEmbedNode({
      src: serialized.src,
      width: clampSize(serialized.width, MIN_EMBED_WIDTH, MAX_EMBED_WIDTH),
      height: clampSize(serialized.height, MIN_EMBED_HEIGHT, MAX_EMBED_HEIGHT),
      alignment: serialized.alignment,
      caption: serialized.caption ?? "",
      start: serialized.start,
    });
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        const isYoutubeEmbed =
          domNode.hasAttribute("data-lexical-youtube-embed") ||
          domNode.hasAttribute("data-youtube-video");

        if (!isYoutubeEmbed) {
          return null;
        }

        return {
          conversion: (element: HTMLElement): DOMConversionOutput => {
            const iframe = element.querySelector("iframe");
            if (!iframe) {
              return { node: null };
            }

            const src = iframe.getAttribute("src") ?? "";
            const width = Number(iframe.getAttribute("width") ?? "640");
            const height = Number(iframe.getAttribute("height") ?? "480");
            const alignment =
              (element.getAttribute("data-align") as EmbedAlignment | null) ??
              "center";
            const figcaption = element.querySelector("figcaption");
            const caption = figcaption?.textContent ?? element.getAttribute("data-caption") ?? "";
            const start = Number(iframe.getAttribute("data-start") ?? "0");

            return {
              node: new YouTubeEmbedNode({
                src,
                width: clampSize(width, MIN_EMBED_WIDTH, MAX_EMBED_WIDTH),
                height: clampSize(height, MIN_EMBED_HEIGHT, MAX_EMBED_HEIGHT),
                alignment,
                caption,
                start: Number.isFinite(start) ? start : 0,
              }),
            };
          },
          priority: 4,
        };
      },
      figure: (domNode: HTMLElement) => {
        const isYoutubeEmbed =
          domNode.hasAttribute("data-lexical-youtube-embed") ||
          domNode.hasAttribute("data-youtube-video");

        if (!isYoutubeEmbed) {
          return null;
        }

        return {
          conversion: (element: HTMLElement): DOMConversionOutput => {
            const iframe = element.querySelector("iframe");
            if (!iframe) {
              return { node: null };
            }

            const src = iframe.getAttribute("src") ?? "";
            const width = Number(iframe.getAttribute("width") ?? "640");
            const height = Number(iframe.getAttribute("height") ?? "480");
            const alignment =
              (element.getAttribute("data-align") as EmbedAlignment | null) ??
              "center";
            const figcaption = element.querySelector("figcaption");
            const caption = figcaption?.textContent ?? element.getAttribute("data-caption") ?? "";
            const start = Number(iframe.getAttribute("data-start") ?? "0");

            return {
              node: new YouTubeEmbedNode({
                src,
                width: clampSize(width, MIN_EMBED_WIDTH, MAX_EMBED_WIDTH),
                height: clampSize(height, MIN_EMBED_HEIGHT, MAX_EMBED_HEIGHT),
                alignment,
                caption,
                start: Number.isFinite(start) ? start : 0,
              }),
            };
          },
          priority: 4,
        };
      },
    };
  }

  constructor(payload: YouTubeEmbedPayload, key?: NodeKey) {
    super(key);
    this.__payload = payload;
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    div.setAttribute("data-lexical-youtube-embed", "true");
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  exportJSON(): SerializedYouTubeEmbedNode {
    return {
      type: "youtube-embed",
      version: 1,
      src: this.__payload.src,
      width: this.__payload.width,
      height: this.__payload.height,
      alignment: this.__payload.alignment,
      caption: this.__payload.caption,
      start: this.__payload.start,
    };
  }

  exportDOM(): { element: HTMLElement } {
    const element = document.createElement("figure");
    element.setAttribute("data-lexical-youtube-embed", "true");
    element.setAttribute("data-youtube-video", "");
    element.setAttribute("data-align", this.__payload.alignment);
    element.setAttribute("data-caption", this.__payload.caption ?? "");

    const iframe = document.createElement("iframe");
    iframe.setAttribute("src", this.__payload.src);
    iframe.setAttribute("width", String(this.__payload.width));
    iframe.setAttribute("height", String(this.__payload.height));
    iframe.setAttribute("title", "YouTube video player");
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    iframe.setAttribute(
      "allow",
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
    );
    iframe.setAttribute("allowfullscreen", "true");
    iframe.style.border = "0";

    if (this.__payload.start && this.__payload.start > 0) {
      iframe.setAttribute("data-start", String(this.__payload.start));
    }

    element.appendChild(iframe);
    if (this.__payload.caption) {
      const figcaption = document.createElement("figcaption");
      figcaption.textContent = this.__payload.caption;
      element.appendChild(figcaption);
    }

    return { element };
  }

  getPayload(): YouTubeEmbedPayload {
    return this.getLatest().__payload;
  }

  setPayload(payload: Partial<YouTubeEmbedPayload>): void {
    const writable = this.getWritable();
    writable.__payload = {
      ...writable.__payload,
      ...payload,
    };
  }

  decorate(): ReactNode {
    return <YouTubeEmbedComponent nodeKey={this.__key} payload={this.__payload} />;
  }

  isInline(): false {
    return false;
  }

  isKeyboardSelectable(): boolean {
    return true;
  }
}

function YouTubeEmbedComponent({
  nodeKey,
  payload,
}: {
  nodeKey: NodeKey;
  payload: YouTubeEmbedPayload;
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

  const updatePayload = (next: Partial<YouTubeEmbedPayload>) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node instanceof YouTubeEmbedNode) {
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
  const showResizeHandles = isSelected && !isResizing;
  const captionStyle: React.CSSProperties = useMemo(
    () => ({
      fontSize: "0.9em",
      color: "#666",
      fontStyle: "italic",
      marginTop: "0.5rem",
      textAlign: "center",
    }),
    [],
  );

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
          title="YouTube video player"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
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
          aria-label="Resize YouTube embed width"
          aria-hidden={!showResizeHandles}
          tabIndex={showResizeHandles ? 0 : -1}
          style={{ opacity: showResizeHandles ? 1 : 0, pointerEvents: showResizeHandles ? "auto" : "none" }}
          onMouseDown={resizeFromHandle("width")}
        />
        <button
          type="button"
          className="luthor-media-embed-resize-handle-height"
          aria-label="Resize YouTube embed height"
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

export class YouTubeEmbedExtension extends BaseExtension<
  "youtubeEmbed",
  YouTubeEmbedConfig,
  YouTubeEmbedCommands,
  YouTubeEmbedQueries,
  ReactNode[]
> {
  private lastSelectedYouTubeNodeKey: NodeKey | null = null;

  constructor(config?: Partial<YouTubeEmbedConfig>) {
    super("youtubeEmbed", [ExtensionCategory.Toolbar]);
    this.config = {
      defaultWidth: 640,
      defaultHeight: 480,
      defaultAlignment: "center",
      allowFullscreen: true,
      autoplay: false,
      controls: true,
      nocookie: true,
      rel: 1,
      ...config,
    } as YouTubeEmbedConfig;
  }

  register(editor: LexicalEditor): () => void {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isNodeSelection(selection)) {
          return;
        }

        const node = selection.getNodes().find((current) => current instanceof YouTubeEmbedNode) as YouTubeEmbedNode | undefined;
        if (node) {
          this.lastSelectedYouTubeNodeKey = node.getKey();
        }
      });
    });
  }

  getNodes(): any[] {
    return [YouTubeEmbedNode];
  }

  getPlugins(): ReactNode[] {
    return [];
  }

  getCommands(editor: LexicalEditor): YouTubeEmbedCommands {
    return {
      insertYouTubeEmbed: (inputUrl: string, width?: number, height?: number, start?: number) => {
        const embedUrl = toEmbedUrl(inputUrl, {
          allowFullscreen: this.config.allowFullscreen ?? true,
          autoplay: this.config.autoplay ?? false,
          controls: this.config.controls ?? true,
          nocookie: this.config.nocookie ?? true,
          rel: this.config.rel ?? 1,
          start: Math.max(0, Math.floor(start ?? 0)),
        });

        if (!embedUrl) {
          return;
        }

        editor.update(() => {
          const node = new YouTubeEmbedNode({
            src: embedUrl,
            width: clampSize(width ?? this.config.defaultWidth ?? 640, MIN_EMBED_WIDTH, MAX_EMBED_WIDTH),
            height: clampSize(height ?? this.config.defaultHeight ?? 480, MIN_EMBED_HEIGHT, MAX_EMBED_HEIGHT),
            alignment: this.config.defaultAlignment ?? "center",
            caption: "",
            start,
          });

          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertNodes([node]);
          } else {
            $getRoot().append(node);
          }
        });
      },
      setYouTubeEmbedAlignment: (alignment: EmbedAlignment) => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isNodeSelection(selection)) {
            return;
          }

          selection.getNodes().forEach((node) => {
            if (node instanceof YouTubeEmbedNode) {
              node.setPayload({ alignment });
            }
          });
        });
      },
      resizeYouTubeEmbed: (width: number, height: number) => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isNodeSelection(selection)) {
            return;
          }

          selection.getNodes().forEach((node) => {
            if (node instanceof YouTubeEmbedNode) {
              node.setPayload({
                width: clampSize(width, MIN_EMBED_WIDTH, MAX_EMBED_WIDTH),
                height: clampSize(height, MIN_EMBED_HEIGHT, MAX_EMBED_HEIGHT),
              });
            }
          });
        });
      },
      setYouTubeEmbedCaption: (caption: string) => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isNodeSelection(selection)) {
            selection.getNodes().forEach((node) => {
              if (node instanceof YouTubeEmbedNode) {
                node.setPayload({ caption });
              }
            });
            return;
          }

          if (this.lastSelectedYouTubeNodeKey) {
            const fallbackNode = $getNodeByKey(this.lastSelectedYouTubeNodeKey);
            if (fallbackNode instanceof YouTubeEmbedNode) {
              fallbackNode.setPayload({ caption });
            } else {
              this.lastSelectedYouTubeNodeKey = null;
            }
          }
        });
      },
      getYouTubeEmbedCaption: () =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if ($isNodeSelection(selection)) {
              const node = selection.getNodes().find((item) => item instanceof YouTubeEmbedNode) as YouTubeEmbedNode | undefined;
              if (node) {
                resolve(node.getPayload().caption ?? "");
                return;
              }
            }

            if (this.lastSelectedYouTubeNodeKey) {
              const fallbackNode = $getNodeByKey(this.lastSelectedYouTubeNodeKey);
              if (fallbackNode instanceof YouTubeEmbedNode) {
                resolve(fallbackNode.getPayload().caption ?? "");
                return;
              }
            }

            resolve("");
          });
        }),
      updateYouTubeEmbedUrl: (inputUrl: string) => {
        let updated = false;
        editor.update(() => {
          const selection = $getSelection();
          if ($isNodeSelection(selection)) {
            selection.getNodes().forEach((node) => {
              if (node instanceof YouTubeEmbedNode) {
                const nextUrl = updateEmbedUrlPreservingParams(node.getPayload().src, inputUrl);
                if (!nextUrl) {
                  return;
                }
                node.setPayload({ src: nextUrl });
                updated = true;
              }
            });
            return;
          }

          if (this.lastSelectedYouTubeNodeKey) {
            const fallbackNode = $getNodeByKey(this.lastSelectedYouTubeNodeKey);
            if (fallbackNode instanceof YouTubeEmbedNode) {
              const nextUrl = updateEmbedUrlPreservingParams(fallbackNode.getPayload().src, inputUrl);
              if (nextUrl) {
                fallbackNode.setPayload({ src: nextUrl });
                updated = true;
              }
            } else {
              this.lastSelectedYouTubeNodeKey = null;
            }
          }
        });
        return updated;
      },
      getYouTubeEmbedUrl: () =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if ($isNodeSelection(selection)) {
              const node = selection.getNodes().find((item) => item instanceof YouTubeEmbedNode) as YouTubeEmbedNode | undefined;
              if (node) {
                resolve(node.getPayload().src ?? "");
                return;
              }
            }

            if (this.lastSelectedYouTubeNodeKey) {
              const fallbackNode = $getNodeByKey(this.lastSelectedYouTubeNodeKey);
              if (fallbackNode instanceof YouTubeEmbedNode) {
                resolve(fallbackNode.getPayload().src ?? "");
                return;
              }
            }

            resolve("");
          });
        }),
    };
  }

  getStateQueries(editor: LexicalEditor): YouTubeEmbedQueries {
    return {
      isYouTubeEmbedSelected: () =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if (!$isNodeSelection(selection)) {
              resolve(false);
              return;
            }

            resolve(selection.getNodes().some((node) => node instanceof YouTubeEmbedNode));
          });
        }),
      isYouTubeEmbedAlignedLeft: () =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if (!$isNodeSelection(selection)) {
              resolve(false);
              return;
            }

            const node = selection.getNodes().find((item) => item instanceof YouTubeEmbedNode) as YouTubeEmbedNode | undefined;
            resolve(node?.getPayload().alignment === "left");
          });
        }),
      isYouTubeEmbedAlignedCenter: () =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if (!$isNodeSelection(selection)) {
              resolve(false);
              return;
            }

            const node = selection.getNodes().find((item) => item instanceof YouTubeEmbedNode) as YouTubeEmbedNode | undefined;
            resolve(node?.getPayload().alignment === "center");
          });
        }),
      isYouTubeEmbedAlignedRight: () =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if (!$isNodeSelection(selection)) {
              resolve(false);
              return;
            }

            const node = selection.getNodes().find((item) => item instanceof YouTubeEmbedNode) as YouTubeEmbedNode | undefined;
            resolve(node?.getPayload().alignment === "right");
          });
        }),
    };
  }
}

export const youTubeEmbedExtension = new YouTubeEmbedExtension();
