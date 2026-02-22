import {
  DecoratorNode,
  NodeKey,
  EditorConfig,
  LexicalNode,
  ElementNode,
  createCommand,
  COMMAND_PRIORITY_EDITOR,
  $isNodeSelection,
  $getSelection,
  $getRoot,
  DOMConversionMap,
  DOMExportOutput,
  $isRangeSelection,
  $createParagraphNode,
  $getNodeByKey,
  $setSelection,
  $createNodeSelection,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  PASTE_COMMAND,
  COMMAND_PRIORITY_NORMAL,
} from "lexical";
import {
  ComponentType,
  CSSProperties,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalEditor } from "lexical";
import { BaseExtension } from "@lyfie/luthor-headless/extensions/base";
import {
  ExtensionCategory,
} from "@lyfie/luthor-headless/extensions/types";
import {
  ImagePayload,
  ImageComponentProps,
  SerializedImageNode,
  ImageExtensionConfig,
  ImageCommands,
  ImageStateQueries,
  Alignment,
} from "./types";
import {
  ImageTranslator,
} from "./ImageTranslator";

/**
 * Command used to insert images into the editor
 */
const INSERT_IMAGE_COMMAND = createCommand<ImagePayload>("insert-image");

/**
 * Default image component used for rendering in the editor
 */
let defaultImageComponent: ComponentType<ImageComponentProps> = ImageComponent;

const MIN_IMAGE_WIDTH = 50;
const MIN_IMAGE_HEIGHT = 50;
const MAX_IMAGE_WIDTH = 2400;
const MAX_IMAGE_HEIGHT = 2400;

function clampSize(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

/**
 * ImageComponent - React component for rendering and interacting with images
 *
 * Provides a rich image editing experience:
 * - Displays images with alignment and styling
 * - Shared embed-style width/height scale controls
 * - Selection state management
 * - Mouse resizing support
 * - Caption support
 *
 * @param props - Image component props
 * @returns React element for the image
 */
function ImageComponent({
  src,
  alt,
  caption,
  alignment = "none",
  className = "",
  style,
  nodeKey,
  width,
  height,
  resizable = true,
  uploading = false,
}: ImageComponentProps): ReactNode {
  const [editor] = useLexicalComposerContext();
  const imageRef = useRef<HTMLImageElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const resizeFrameRef = useRef<number | null>(null);
  const widthRef = useRef<number>(0);
  const heightRef = useRef<number>(0);
  const [isSelected, setIsSelected] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState<number | "auto">(
    width || "auto",
  );
  const [currentHeight, setCurrentHeight] = useState<number | "auto">(
    height || "auto",
  );

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (src && src.startsWith("blob:")) {
        URL.revokeObjectURL(src);
      }
    };
  }, [src]);

  // Update dimensions when props change
  useEffect(() => {
    setCurrentWidth(width || "auto");
    setCurrentHeight(height || "auto");
    widthRef.current = typeof width === "number" ? width : 0;
    heightRef.current = typeof height === "number" ? height : 0;
  }, [width, height]);

  useEffect(() => {
    return () => {
      if (resizeFrameRef.current != null) {
        window.cancelAnimationFrame(resizeFrameRef.current);
      }
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, []);

  // Listen for selection changes
  useEffect(() => {
    if (!nodeKey) return;
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isNodeSelection(selection)) {
          const selectedNodes = selection.getNodes();
          setIsSelected(
            selectedNodes.some((node) => node.getKey() === nodeKey),
          );
        } else {
          setIsSelected(false);
        }
      });
    });
  }, [editor, nodeKey]);

  // Handle click to select
  const onClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!nodeKey) return;
    editor.update(() => {
      const selection = $createNodeSelection();
      selection.add(nodeKey);
      $setSelection(selection);
    });
  };

  const startResize =
    (axis: "width" | "height") =>
    (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!imageRef.current || !nodeKey) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setIsResizing(true);
    document.body.style.userSelect = "none";
    document.body.style.cursor = axis === "width" ? "ew-resize" : "ns-resize";

    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = imageRef.current.clientWidth || 100;
    const startHeight = imageRef.current.clientHeight || 100;

    widthRef.current = startWidth;
    heightRef.current = startHeight;

    const applyPreviewSize = () => {
      resizeFrameRef.current = null;
      if (shellRef.current) {
        shellRef.current.style.width = `${widthRef.current}px`;
      }
      if (imageRef.current) {
        imageRef.current.style.height = `${heightRef.current}px`;
      }
    };

    const onMove = (moveEvent: MouseEvent) => {
      const nextWidth =
        axis === "width"
          ? clampSize(startWidth + (moveEvent.clientX - startX), MIN_IMAGE_WIDTH, MAX_IMAGE_WIDTH)
          : widthRef.current;
      const nextHeight =
        axis === "height"
          ? clampSize(startHeight + (moveEvent.clientY - startY), MIN_IMAGE_HEIGHT, MAX_IMAGE_HEIGHT)
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
      setCurrentWidth(widthRef.current);
      setCurrentHeight(heightRef.current);
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (node instanceof ImageNode) {
          node.setWidthAndHeight(widthRef.current, heightRef.current);
        }
      });
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const figureStyle: React.CSSProperties = {
    margin: 0,
    display: "block",
    position: "relative",
    ...style,
  };

  const imgStyle: React.CSSProperties = {
    maxWidth: "100%",
    display: "block",
    borderRadius: "4px",
    width: typeof currentWidth === "number" ? "100%" : "auto",
    height: typeof currentHeight === "number" ? `${currentHeight}px` : currentHeight,
    margin: 0,
  };

  const captionStyle: React.CSSProperties = {
    fontSize: "0.9em",
    color: "#666",
    fontStyle: "italic",
    marginTop: "0.5rem",
    textAlign: "center",
  };

  const showResizeHandles = isSelected && resizable && !isResizing;

  return (
    <figure
      className={`lexical-image align-${alignment} ${className} ${isSelected ? "selected" : ""} ${isResizing ? "resizing" : ""} ${uploading ? "uploading" : ""}`}
      style={figureStyle}
    >
      <div
        ref={shellRef}
        className={`luthor-media-embed-shell${isSelected ? " is-selected" : ""}${isResizing ? " is-resizing" : ""}`}
        data-luthor-selection-anchor="true"
        style={{
          position: "relative",
          display: "inline-block",
          width: currentWidth,
          maxWidth: "100%",
          cursor: "pointer",
        }}
        onClick={onClick}
      >
        <img ref={imageRef} src={src} alt={alt} style={imgStyle} />
        {resizable ? (
          <>
            <button
              type="button"
              className="luthor-media-embed-resize-handle-width"
              aria-label="Resize image width"
              aria-hidden={!showResizeHandles}
              tabIndex={showResizeHandles ? 0 : -1}
              style={{ opacity: showResizeHandles ? 1 : 0, pointerEvents: showResizeHandles ? "auto" : "none" }}
              onMouseDown={startResize("width")}
            />
            <button
              type="button"
              className="luthor-media-embed-resize-handle-height"
              aria-label="Resize image height"
              aria-hidden={!showResizeHandles}
              tabIndex={showResizeHandles ? 0 : -1}
              style={{ opacity: showResizeHandles ? 1 : 0, pointerEvents: showResizeHandles ? "auto" : "none" }}
              onMouseDown={startResize("height")}
            />
          </>
        ) : null}
      </div>
      {caption && <figcaption style={captionStyle}>{caption}</figcaption>}
      <div style={{ clear: "both", height: 0, fontSize: 0 }} />
    </figure>
  );
}

export class ImageNode extends DecoratorNode<ReactNode> {
  /** Source URL for the image */
  __src: string;
  /** Accessible alt text */
  __alt: string;
  /** Optional caption */
  __caption?: string;
  /** Alignment */
  __alignment: Alignment;
  /** CSS class name */
  __className?: string;
  /** Inline style overrides */
  __style?: CSSProperties;
  /** Width in pixels */
  __width?: number;
  /** Height in pixels */
  __height?: number;
  /** Whether the image is uploading */
  __uploading?: boolean;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__alt,
      node.__caption,
      node.__alignment,
      node.__className,
      node.__style,
      node.__width,
      node.__height,
      node.__uploading,
      node.__key,
    );
  }

  // Use new translator
  static importDOM(): DOMConversionMap | null {
    return ImageTranslator.importDOM();
  }

  // Use new translator
  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return ImageTranslator.importJSON(serializedNode);
  }

  constructor(
    src: string = "",
    alt: string = "",
    caption?: string,
    alignment: Alignment = "none",
    className?: string,
    style?: CSSProperties,
    width?: number,
    height?: number,
    uploading?: boolean,
    key?: NodeKey,
  ) {
    super(key);
    // Ensure src is not empty
    this.__src = src && src.length > 0 ? src : "";
    this.__alt = alt;
    this.__caption = caption;
    this.__alignment = alignment;
    this.__className = className;
    this.__style = style;
    this.__width = width;
    this.__height = height;
    this.__uploading = uploading;
  }

  // Required for DecoratorNode: creates the DOM container for the React component
  createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement("div");
    const themeClass = config.theme?.image || "";
    const alignment = this.__alignment;

    div.className =
      `${themeClass} lexical-image-container align-${alignment}`.trim();

    // Key changes: Float the outer container, shrink-wrap width, handle display per alignment
    div.style.display = alignment === "center" ? "block" : "inline-block";
    div.style.float =
      alignment === "left" ? "left" : alignment === "right" ? "right" : "none";
    div.style.margin =
      alignment === "center"
        ? "1rem auto"
        : alignment === "left"
          ? "0 1rem 1rem 0"
          : alignment === "right"
            ? "0 0 1rem 1rem"
            : "1rem 0";
    div.style.textAlign = alignment === "center" ? "center" : "inherit";
    div.style.position = "relative";

    return div;
  }

  // Required for DecoratorNode: handles updates to the DOM container
  updateDOM(
    prevNode: ImageNode,
    dom: HTMLElement,
    config: EditorConfig,
  ): boolean {
    const alignment = this.__alignment;
    if (alignment !== prevNode.__alignment) {
      const themeClass = config.theme?.image || "";
      dom.className =
        `${themeClass} lexical-image-container align-${alignment}`.trim();
    }

    // Update styles on change
    dom.style.display = alignment === "center" ? "block" : "inline-block";
    dom.style.float =
      alignment === "left" ? "left" : alignment === "right" ? "right" : "none";
    dom.style.margin =
      alignment === "center"
        ? "1rem auto"
        : alignment === "left"
          ? "0 1rem 1rem 0"
          : alignment === "right"
            ? "0 0 1rem 1rem"
            : "1rem 0";
    dom.style.textAlign = alignment === "center" ? "center" : "inherit";
    dom.style.position = "relative";

    return false; // No full re-render needed
  }

  // Use new translator
  exportDOM(): DOMExportOutput {
    return ImageTranslator.exportDOM(this);
  }

  // Use new translator
  exportJSON(): SerializedImageNode {
    return ImageTranslator.exportJSON(this);
  }

  setSrc(src: string): void {
    if (!src || src.length === 0) {
      console.warn("Attempted to set empty src on ImageNode");
      return;
    }
    const writable = this.getWritable();
    writable.__src = src;
  }

  setAlt(alt: string): void {
    const writable = this.getWritable();
    writable.__alt = alt;
  }

  setCaption(caption?: string): void {
    const writable = this.getWritable();
    writable.__caption = caption;
  }

  setAlignment(alignment: Alignment): void {
    const writable = this.getWritable();
    writable.__alignment = alignment;
  }

  setClassName(className?: string): void {
    const writable = this.getWritable();
    writable.__className = className;
  }

  setStyle(style?: CSSProperties): void {
    const writable = this.getWritable();
    writable.__style = style;
  }

  getWidth(): number | undefined {
    return this.__width;
  }

  getHeight(): number | undefined {
    return this.__height;
  }

  setWidthAndHeight(width: number, height: number): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  // This is the key method - it determines if the node can be selected
  isInline(): boolean {
    return false;
  }

  // This ensures the image node is treated as a block element
  isBlockElement(): boolean {
    return true;
  }

  // This is critical - ensure the node is considered a top-level block
  canBeEmpty(): boolean {
    return false;
  }

  decorate(): ReactNode {
    // Ensure we have a valid src
    if (!this.__src || this.__src.length === 0) {
      console.error("❌ No src provided to ImageNode");
      return (
        <div
          style={{
            color: "red",
            border: "1px solid red",
            padding: "10px",
            backgroundColor: "#ffe6e6",
          }}
        >
          Image Error: No source URL provided
        </div>
      );
    }

    try {
      const Component = defaultImageComponent;
      return (
        <Component
          src={this.__src}
          alt={this.__alt}
          caption={this.__caption}
          alignment={this.__alignment}
          className={this.__className}
          style={this.__style}
          nodeKey={this.getKey()}
          width={this.__width}
          height={this.__height}
          resizable={true}
          uploading={this.__uploading}
        />
      );
    } catch (error) {
      console.error("❌ Error rendering ImageNode:", error);
      return (
        <div
          style={{
            color: "red",
            border: "1px solid red",
            padding: "10px",
            backgroundColor: "#ffe6e6",
          }}
        >
          Image Error: {String(error)}
        </div>
      );
    }
  }
}

export function $createImageNode(
  src: string,
  alt: string,
  caption?: string,
  alignment: Alignment = "none",
  className?: string,
  style?: CSSProperties,
  width?: number,
  height?: number,
  uploading?: boolean,
): ImageNode {
  if (!src || src.length === 0) {
    throw new Error("Cannot create ImageNode with empty src");
  }
  return new ImageNode(
    src,
    alt,
    caption,
    alignment,
    className,
    style,
    width,
    height,
    uploading,
  );
}

export class ImageExtension extends BaseExtension<
  "image",
  ImageExtensionConfig,
  ImageCommands,
  ImageStateQueries,
  ReactNode[]
> {
  /** Track recent image sources to avoid duplicate inserts */
  private recentImages: Set<string> = new Set();

  constructor() {
    super("image", [ExtensionCategory.Toolbar]);
    this.config = {
      // Set defaults
      ...this.config,
      resizable: true,
      pasteListener: { insert: true, replace: true },
      debug: false,
      forceUpload: false,
    };
  }

  configure(config: Partial<ImageExtensionConfig>): this {
    if (config.customRenderer) {
      defaultImageComponent = config.customRenderer;
    }
    if (config.uploadHandler) {
      this.config.uploadHandler = config.uploadHandler;
    }
    if (config.defaultAlignment) {
      this.config.defaultAlignment = config.defaultAlignment;
    }
    if (config.classNames) {
      this.config.classNames = config.classNames;
    }
    if (config.styles) {
      this.config.styles = config.styles;
    }
    // Merge pasteListener with defaults
    this.config.pasteListener = {
      insert:
        config.pasteListener?.insert ??
        this.config.pasteListener?.insert ??
        true,
      replace:
        config.pasteListener?.replace ??
        this.config.pasteListener?.replace ??
        true,
    };
    this.config.debug = config.debug ?? this.config.debug ?? false;
    this.config = {
      ...this.config,
      ...config,
      resizable: config.resizable ?? true,
    };
    return this;
  }

  register(editor: LexicalEditor): () => void {
    const removeCommand = editor.registerCommand<ImagePayload>(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        editor.update(() => {
          try {
            const src =
              payload.src ||
              (payload.file ? URL.createObjectURL(payload.file) : "");
            if (!src) throw new Error("No src for image");

            // Check for duplicates
            if (this.recentImages.has(src)) {
              return true;
            }
            this.recentImages.add(src);
            // Clear recent images after 1s to allow new insertions
            setTimeout(() => this.recentImages.delete(src), 1000);

            let uploading = false;
            if (
              payload.file &&
              this.config.uploadHandler &&
              this.config.forceUpload
            ) {
              uploading = true;
              // Async upload
              this.config
                .uploadHandler(payload.file)
                .then((uploadedSrc) => {
                  editor.update(() => {
                    const node = $getNodeByKey(imageNode.getKey());
                    if (node instanceof ImageNode) {
                      node.setSrc(uploadedSrc);
                      node.__uploading = false;
                    }
                  });
                })
                .catch((error) => {
                  console.error("Upload failed:", error);
                  // Keep blob URL, set uploading to false
                  editor.update(() => {
                    const node = $getNodeByKey(imageNode.getKey());
                    if (node instanceof ImageNode) {
                      node.__uploading = false;
                    }
                  });
                });
            }

            const imageNode = $createImageNode(
              src,
              payload.alt,
              payload.caption,
              payload.alignment || this.config.defaultAlignment || "none",
              payload.className,
              payload.style,
              undefined,
              undefined,
              uploading,
            );

            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              selection.insertNodes([imageNode]);
            } else {
              // Fallback: append to root in new paragraph
              const paragraph = $createParagraphNode();
              paragraph.append(imageNode);
              $getRoot().append(paragraph);
            }
          } catch (error) {
            console.error("❌ Insertion error:", error);
          }
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
    const removeDelete = editor.registerCommand(
      KEY_DELETE_COMMAND,
      () => {
        const selection = $getSelection();
        if ($isNodeSelection(selection)) {
          const nodes = selection.getNodes();
          if (nodes.some((node) => node instanceof ImageNode)) {
            editor.update(() => {
              nodes.forEach((node) => node.remove());
            });
            return true;
          }
        }
        return false;
      },
      COMMAND_PRIORITY_EDITOR,
    );
    const removeBackspace = editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      () => {
        const selection = $getSelection();
        if ($isNodeSelection(selection)) {
          const nodes = selection.getNodes();
          if (nodes.some((node) => node instanceof ImageNode)) {
            editor.update(() => {
              nodes.forEach((node) => node.remove());
            });
            return true;
          }
        }
        return false;
      },
      COMMAND_PRIORITY_EDITOR,
    );

    // New: Paste handler
    let removePaste: () => void = () => {};
    if (
      this.config.pasteListener?.insert ||
      this.config.pasteListener?.replace
    ) {
      const debugLog = this.config.debug ? console.log : () => {};
      removePaste = editor.registerCommand<ClipboardEvent>(
        PASTE_COMMAND,
        (event) => {
          const items = event.clipboardData?.items;
          if (!items) return false;

          let handled = false;
          const hasHtml = Array.from(items).some(
            (item) => item.type === "text/html",
          );
          for (const item of items) {
            if (item.type.startsWith("image/")) {
              if (hasHtml) {
                // Skip handling image file if HTML is present to avoid duplicate with importDOM
                continue;
              }
              event.preventDefault();
              const file = item.getAsFile();
              if (!file) continue;

              debugLog("📋 Pasting image:", file.name);

              // Get src (upload or local URL)
              const getSrc =
                this.config.uploadHandler && this.config.forceUpload
                  ? this.config.uploadHandler(file).catch((err) => {
                      console.error("Upload failed:", err);
                      return URL.createObjectURL(file); // Fallback
                    })
                  : Promise.resolve(URL.createObjectURL(file));

              getSrc.then((src) => {
                // Skip if recently inserted
                if (this.recentImages.has(src)) {
                  debugLog(
                    "🚫 Duplicate paste image src detected, skipping:",
                    src,
                  );
                  return;
                }
                this.recentImages.add(src);
                setTimeout(() => this.recentImages.delete(src), 1000);

                let uploading = false;
                let imageNode: ImageNode;
                if (
                  this.config.uploadHandler &&
                  this.config.forceUpload &&
                  file
                ) {
                  uploading = true;
                  // Async upload
                  this.config
                    .uploadHandler(file)
                    .then((uploadedSrc) => {
                      editor.update(() => {
                        const node = $getNodeByKey(imageNode.getKey());
                        if (node instanceof ImageNode) {
                          node.setSrc(uploadedSrc);
                          node.__uploading = false;
                        }
                      });
                    })
                    .catch((error) => {
                      console.error("Upload failed:", error);
                      editor.update(() => {
                        const node = $getNodeByKey(imageNode.getKey());
                        if (node instanceof ImageNode) {
                          node.__uploading = false;
                        }
                      });
                    });
                }

                editor.update(() => {
                  const selection = $getSelection();
                  const alt = file.name || "Pasted image";

                  if (
                    $isNodeSelection(selection) &&
                    this.config.pasteListener?.replace
                  ) {
                    const nodes = selection.getNodes();
                    const existingImageNode = nodes.find(
                      (node) => node instanceof ImageNode,
                    ) as ImageNode | undefined;
                    if (existingImageNode) {
                      debugLog("🔄 Replacing selected image src");
                      existingImageNode.setSrc(src);
                      existingImageNode.__uploading = uploading;
                      handled = true;
                      return;
                    }
                  }

                  if (this.config.pasteListener?.insert) {
                    debugLog("➕ Inserting new pasted image");
                    imageNode = $createImageNode(
                      src,
                      alt,
                      undefined,
                      "none",
                      undefined,
                      undefined,
                      undefined,
                      undefined,
                      uploading,
                    );
                    if ($isRangeSelection(selection)) {
                      selection.insertNodes([imageNode]);
                    } else {
                      $getRoot().append(
                        $createParagraphNode().append(imageNode),
                      );
                    }
                    handled = true;
                  }
                });
              });
              break; // Handle only first image
            }
          }
          return handled; // true if we handled it (stops other handlers)
        },
        COMMAND_PRIORITY_NORMAL, // Balanced priority
      );
    }

    return () => {
      removeCommand();
      removeDelete();
      removeBackspace();
      removePaste();
    };
  }

  getNodes(): any[] {
    return [ImageNode];
  }

  getCommands(editor: LexicalEditor): ImageCommands {
    return {
      insertImage: (payload: ImagePayload) => {
        editor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
      },
      setImageAlignment: (alignment: Alignment) => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isNodeSelection(selection)) {
            const nodes = selection.getNodes();
            for (const node of nodes) {
              if (node instanceof ImageNode) {
                node.setAlignment(alignment);
              }
            }
          }
        });
      },
      setImageCaption: (caption: string) => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isNodeSelection(selection)) {
            const nodes = selection.getNodes();
            for (const node of nodes) {
              if (node instanceof ImageNode) {
                node.setCaption(caption);
              }
            }
          }
        });
      },
      setImageClassName: (className: string) => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isNodeSelection(selection)) {
            const nodes = selection.getNodes();
            for (const node of nodes) {
              if (node instanceof ImageNode) {
                node.setClassName(className);
              }
            }
          }
        });
      },
      setImageStyle: (style: CSSProperties) => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isNodeSelection(selection)) {
            const nodes = selection.getNodes();
            for (const node of nodes) {
              if (node instanceof ImageNode) {
                node.setStyle(style);
              }
            }
          }
        });
      },
    };
  }

  getStateQueries(editor: LexicalEditor): ImageStateQueries {
    return {
      imageSelected: () =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if ($isNodeSelection(selection)) {
              const nodes = selection.getNodes();
              resolve(nodes.length === 1 && nodes[0] instanceof ImageNode);
            } else {
              resolve(false);
            }
          });
        }),
      isImageAlignedLeft: () =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if ($isNodeSelection(selection)) {
              const nodes = selection.getNodes();
              if (nodes.length === 1 && nodes[0] instanceof ImageNode) {
                resolve((nodes[0] as ImageNode).__alignment === "left");
                return;
              }
            }
            resolve(false);
          });
        }),
      isImageAlignedCenter: () =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if ($isNodeSelection(selection)) {
              const nodes = selection.getNodes();
              if (nodes.length === 1 && nodes[0] instanceof ImageNode) {
                resolve((nodes[0] as ImageNode).__alignment === "center");
                return;
              }
            }
            resolve(false);
          });
        }),
      isImageAlignedRight: () =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if ($isNodeSelection(selection)) {
              const nodes = selection.getNodes();
              if (nodes.length === 1 && nodes[0] instanceof ImageNode) {
                resolve((nodes[0] as ImageNode).__alignment === "right");
                return;
              }
            }
            resolve(false);
          });
        }),
      isImageAlignedNone: () =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if ($isNodeSelection(selection)) {
              const nodes = selection.getNodes();
              if (nodes.length === 1 && nodes[0] instanceof ImageNode) {
                resolve((nodes[0] as ImageNode).__alignment === "none");
                return;
              }
            }
            resolve(false);
          });
        }),
    };
  }
}

export const imageExtension = new ImageExtension();

/**
 * Image Markdown transformer
 * Supports standard Markdown image syntax with optional alignment
 *
 * Syntax examples:
 * - ![alt text](url)
 * - ![alt text](url "caption")
 * - ![alt text](url "caption") <!-- align:left -->
 * - ![alt text](url "caption") <!-- align:center -->
 * - ![alt text](url "caption") <!-- align:right -->
 */
export const IMAGE_MARKDOWN_TRANSFORMER = {
  dependencies: [ImageNode],
  export: (node: LexicalNode) => {
    if (!$isImageNode(node)) {
      return null;
    }

    const imageNode = node as ImageNode;
    const src = imageNode.__src || "";
    const alt = imageNode.__alt || "";
    const caption = imageNode.__caption || "";
    const alignment = imageNode.__alignment || "none";

    if (!src) {
      return null;
    }

    // Build markdown image syntax
    let markdown = `![${alt}](${src}`;
    
    // Add caption as title if present
    if (caption) {
      markdown += ` "${caption}"`;
    }
    
    markdown += ")";

    // Add alignment as HTML comment if not 'none'
    if (alignment && alignment !== "none") {
      markdown += ` <!-- align:${alignment} -->`;
    }

    return markdown;
  },
  regExp: /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)(?:\s*<!--\s*align:(left|center|right)\s*-->)?\s*$/,
  replace: (
    parentNode: ElementNode,
    _children: LexicalNode[],
    match: string[],
    isImport: boolean,
  ) => {
    void isImport;
    const [, alt, src, caption, alignment] = match;

    if (!src) return;

    const imageNode = $createImageNode(
      src,
      alt || "",
      caption || undefined,
      (alignment as "left" | "center" | "right" | "none") || "none",
      undefined,
      undefined,
      undefined,
      undefined,
      false,
    );

    parentNode.replace(imageNode);
  },
  type: "element" as const,
};

/**
 * Helper to check whether a node is an ImageNode
 */
export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}

