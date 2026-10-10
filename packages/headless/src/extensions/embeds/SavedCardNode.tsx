/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  DecoratorNode,
  type DOMConversionMap,
  type DOMExportOutput,
  type ElementNode,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical";
import type { ElementTransformer } from "@lexical/markdown";
import { LexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { type CSSProperties, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import { ExtensionCategory } from "@lyfie/luthor-headless/extensions/types";
import { BaseExtension } from "@lyfie/luthor-headless/extensions/base";
import { type SavedCardMetadata, useEmbedResolvers } from "./EmbedResolverContext";
import { sanitizeUrlForAttribute } from "../../utils/urlSafety";
import {
  formatMediaDirectives,
  parseMediaDirectives,
  type MediaAlignment,
} from "../media/mediaGrammar";
import {
  moveSelectedNode,
  registerClickToSelect,
  removeSelectedNode,
  useIsEditable,
  useIsNodeSelected,
  type MoveDirection,
} from "../media/mediaSelection";
import { usePointerResize } from "../media/usePointerResize";
import { BlockDragGrip, useBlockDrag } from "../media/embedChrome";

/** Narrowest a card can be resized to (CSS px). */
const MIN_CARD_WIDTH = 240;
/** Widest a stored card width may be. */
const MAX_CARD_WIDTH = 4096;

/** How a saved card is laid out: its width (unset = the full column), alignment and caption. */
export interface SavedCardLayout {
  width?: number;
  align?: MediaAlignment;
  caption?: string;
  /** Trailing `<!-- k:v -->` directives this card doesn't own, kept verbatim. */
  directives?: string[];
}

/**
 * Serialized shape of a {@link SavedCardNode}. The verbatim `url`, the optional
 * author-supplied `title` and the card's layout are persisted; the archived
 * metadata (image, description, favicon, …) is resolved at render time, so the
 * stored data mirrors the markdown and the round-trip stays lossless.
 */
export type SerializedSavedCardNode = Spread<
  {
    url: string;
    title?: string;
    width?: number;
    align?: MediaAlignment;
    caption?: string;
    directives?: string[];
  },
  SerializedLexicalNode
>;

function validWidth(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 1
    ? Math.min(MAX_CARD_WIDTH, Math.round(value))
    : undefined;
}

function alignmentMargins(align: MediaAlignment | undefined): CSSProperties {
  if (align === "left") return { marginLeft: 0, marginRight: "auto" };
  if (align === "right") return { marginLeft: "auto", marginRight: 0 };
  return { marginLeft: "auto", marginRight: "auto" };
}

/**
 * React view for a saved web card. Resolves the URL to archived open-graph
 * metadata through the host {@link EmbedResolvers.resolveCard}; while it loads,
 * and when no resolver is wired or the host has no record, it renders a bare
 * link card showing the author title (or the URL).
 *
 * Read-only, the whole card is a link to the page. In an editable document it
 * behaves like any other embed: a click selects it (its toolbar aligns,
 * captions, moves and removes it), its edge resizes it, a press-and-drag moves
 * it, and the "open" link in its corner — or a Ctrl/⌘-click — opens the page.
 */
function SavedCardComponent({
  url,
  title,
  layout,
  nodeKey,
}: {
  url: string;
  title?: string;
  layout: SavedCardLayout;
  nodeKey: NodeKey;
}): ReactNode {
  const { resolveCard } = useEmbedResolvers();
  const composer = useContext(LexicalComposerContext);
  const editor: LexicalEditor | null = composer ? composer[0] : null;
  const isEditable = useIsEditable(editor);
  const isSelected = useIsNodeSelected(editor, nodeKey);
  const figureRef = useRef<HTMLElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const badgeRef = useRef<HTMLSpanElement | null>(null);
  const [meta, setMeta] = useState<SavedCardMetadata | null | undefined>(
    undefined,
  );

  useEffect(() => {
    if (typeof resolveCard !== "function") {
      setMeta(null);
      return;
    }

    let cancelled = false;
    resolveCard(url).then(
      (result) => {
        if (!cancelled) setMeta(result);
      },
      () => {
        if (!cancelled) setMeta(null);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [resolveCard, url]);

  const containerWidth = () =>
    figureRef.current?.parentElement?.getBoundingClientRect().width || Number.POSITIVE_INFINITY;

  const setWidth = (width: number | undefined) => {
    if (!editor) return;
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isSavedCardNode(node)) node.setLayout({ width });
    });
  };

  const { onPointerDown: onResizePointerDown, resizing } = usePointerResize({
    frameRef: figureRef,
    minWidth: MIN_CARD_WIDTH,
    maxWidth: containerWidth,
    centered: (layout.align ?? "center") === "center",
    onPreview: (w) => {
      if (badgeRef.current) badgeRef.current.textContent = w === null ? "" : `${w} px`;
    },
    // Dragged out to the column's edge: the card fills the column again.
    onCommit: (w) => setWidth(w >= containerWidth() - 2 ? undefined : w),
  });

  const drag = useBlockDrag({ editor, nodeKey, elementRef: figureRef, enabled: isEditable && !resizing });

  const heading = meta?.title ?? title ?? url;
  const source = meta?.siteName ?? url;
  const loading = meta === undefined;
  const width = validWidth(layout.width);
  const showHandles = isEditable && isSelected && !resizing;
  const cardClass = loading ? "luthor-saved-card luthor-saved-card--loading" : "luthor-saved-card";
  const content = (
    <>
      {meta?.image ? (
        <img
          className="luthor-saved-card__image"
          src={meta.image}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      ) : null}
      <span className="luthor-saved-card__body">
        <span className="luthor-saved-card__title">{heading}</span>
        {meta?.description ? (
          <span className="luthor-saved-card__description">
            {meta.description}
          </span>
        ) : null}
        <span className="luthor-saved-card__source">
          {meta?.favicon ? (
            <img
              className="luthor-saved-card__favicon"
              src={meta.favicon}
              alt=""
              aria-hidden="true"
              draggable={false}
            />
          ) : null}
          <span className="luthor-saved-card__source-text">{source}</span>
        </span>
      </span>
    </>
  );

  return (
    <figure
      ref={figureRef}
      className={[
        "luthor-saved-card-figure",
        `luthor-saved-card-figure--align-${layout.align ?? "center"}`,
        isEditable ? "is-interactive" : "",
        isSelected ? "is-selected" : "",
        resizing ? "is-resizing" : "",
      ].filter(Boolean).join(" ")}
      data-align={layout.align ?? "center"}
      style={{
        width: width ? `min(${width}px, 100%)` : "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        marginTop: "1rem",
        marginBottom: "1rem",
        ...alignmentMargins(layout.align),
      }}
    >
      <div
        ref={boxRef}
        className="luthor-saved-card-box"
        data-luthor-selection-anchor="true"
        // The page, for a host's hover preview (the way to open it from an
        // editable note, where a click selects the card).
        data-luthor-embed-url={url}
        style={{ position: "relative" }}
        onPointerDown={drag.onPointerDown}
        onDragStart={drag.onDragStart}
      >
        {isEditable ? (
          // Editable, the card is an object to select — not a link the editor
          // would follow on a click. The open link (or Ctrl/⌘-click) goes there.
          <div
            className={cardClass}
            data-luthor-saved-card-url={url}
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey) {
                window.open(sanitizeUrlForAttribute(url), "_blank", "noopener,noreferrer");
              }
            }}
          >
            {content}
          </div>
        ) : (
          <a
            className={cardClass}
            // The model keeps the URL verbatim for lossless `![[card:url]]`
            // round-trips; only the live anchor is scheme-gated.
            href={sanitizeUrlForAttribute(url)}
            target="_blank"
            rel="noopener noreferrer"
            draggable={false}
            data-luthor-saved-card-url={url}
            aria-label={heading}
          >
            {content}
          </a>
        )}
        {isEditable ? <BlockDragGrip onPointerDown={drag.onGripPointerDown} /> : null}
        {isEditable ? (
          <>
            <button
              type="button"
              className="luthor-media-embed-resize-handle-width"
              aria-label="Resize card"
              aria-hidden={!showHandles}
              tabIndex={showHandles ? 0 : -1}
              data-luthor-no-drag=""
              style={{ opacity: showHandles ? 1 : 0, pointerEvents: showHandles ? "auto" : "none", touchAction: "none" }}
              onPointerDown={onResizePointerDown("right")}
            />
            <span ref={badgeRef} className="luthor-media__size-badge" aria-live="polite" />
          </>
        ) : null}
      </div>
      {layout.caption ? (
        <figcaption className="luthor-saved-card__caption">{layout.caption}</figcaption>
      ) : null}
    </figure>
  );
}

/**
 * A block-level `![[card:url]]` saved web card. The node stores the URL (and an
 * optional author title) verbatim and resolves archived metadata through the
 * {@link EmbedResolvers} context, so it is host-agnostic. Its layout — width,
 * alignment, caption — is part of the markdown too. The companion
 * {@link SAVED_CARD_MARKDOWN_TRANSFORMER} gives it a lossless round-trip.
 */
export class SavedCardNode extends DecoratorNode<ReactNode> {
  /** The card's target URL, as written inside `![[card:url]]`. */
  __url: string;
  /** The optional author title, as written after `|`. */
  __title?: string;
  /** Width, alignment and caption. */
  __layout: SavedCardLayout;

  static getType(): string {
    return "savedCard";
  }

  static clone(node: SavedCardNode): SavedCardNode {
    return new SavedCardNode(node.__url, node.__title, node.__layout, node.__key);
  }

  static importJSON(serialized: SerializedSavedCardNode): SavedCardNode {
    return $createSavedCardNode(serialized.url, serialized.title, {
      width: validWidth(serialized.width),
      align: serialized.align,
      caption: serialized.caption,
      directives: serialized.directives,
    });
  }

  // Saved cards are authored through markdown, not pasted HTML; the explicit
  // null import keeps Lexical from warning about the custom exportDOM.
  static importDOM(): DOMConversionMap | null {
    return null;
  }

  constructor(url: string, title?: string, layout: SavedCardLayout = {}, key?: NodeKey) {
    super(key);
    this.__url = url;
    this.__title = title;
    this.__layout = layout;
  }

  exportJSON(): SerializedSavedCardNode {
    const json: SerializedSavedCardNode = {
      type: "savedCard",
      version: 1,
      url: this.__url,
    };
    if (this.__title !== undefined) {
      json.title = this.__title;
    }
    const { width, align, caption, directives } = this.__layout;
    if (width !== undefined) json.width = width;
    if (align !== undefined) json.align = align;
    if (caption) json.caption = caption;
    if (directives?.length) json.directives = directives;
    return json;
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    div.className = "luthor-saved-card-shell";
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const anchor = document.createElement("a");
    anchor.className = "luthor-saved-card";
    anchor.href = sanitizeUrlForAttribute(this.__url);
    anchor.setAttribute("data-luthor-saved-card-url", this.__url);
    anchor.textContent = this.__title ?? this.__url;
    if (!this.__layout.caption) return { element: anchor };
    const figure = document.createElement("figure");
    figure.appendChild(anchor);
    const caption = document.createElement("figcaption");
    caption.textContent = this.__layout.caption;
    figure.appendChild(caption);
    return { element: figure };
  }

  isInline(): boolean {
    return false;
  }

  isKeyboardSelectable(): boolean {
    return true;
  }

  canBeEmpty(): boolean {
    return false;
  }

  getTextContent(): string {
    return this.getMarkdown();
  }

  getUrl(): string {
    return this.__url;
  }

  getTitle(): string | undefined {
    return this.__title;
  }

  getLayout(): SavedCardLayout {
    return this.getLatest().__layout;
  }

  /** Change the card's width, alignment or caption (`undefined` clears width). */
  setLayout(next: Partial<SavedCardLayout>): void {
    const writable = this.getWritable();
    writable.__layout = { ...writable.__layout, ...next };
    if ("width" in next) writable.__layout.width = validWidth(next.width);
    if ("caption" in next && !next.caption?.trim()) delete writable.__layout.caption;
  }

  /**
   * The verbatim markdown this node serializes to:
   * `![[card:url|title|480]] <!-- align:left --> <!-- caption:… -->`. A width
   * with no title is written `![[card:url||480]]` — a lone `|480` has always
   * been a title, and still is.
   */
  getMarkdown(): string {
    const latest = this.getLatest();
    const { width, align, caption, directives } = latest.__layout;
    const size = validWidth(width);
    const title = latest.__title ?? "";
    const segments = size ? `|${title}|${size}` : title ? `|${title}` : "";
    return `![[card:${latest.__url}${segments}]]${formatMediaDirectives({
      align: align && align !== "center" ? align : undefined,
      caption,
      unknown: [...(directives ?? [])],
    })}`;
  }

  decorate(): ReactNode {
    return (
      <SavedCardComponent
        url={this.__url}
        title={this.__title}
        layout={this.__layout}
        nodeKey={this.__key}
      />
    );
  }
}

/** Create a {@link SavedCardNode}. */
export function $createSavedCardNode(
  url: string,
  title?: string,
  layout?: SavedCardLayout,
): SavedCardNode {
  return new SavedCardNode(url, title, layout ?? {});
}

/** Type guard for {@link SavedCardNode}. */
export function $isSavedCardNode(
  node: LexicalNode | null | undefined,
): node is SavedCardNode {
  return node instanceof SavedCardNode;
}

/** The one selected saved card, if the selection is exactly that. */
function $selectedCard(): SavedCardNode | null {
  const selection = $getSelection();
  if (!$isNodeSelection(selection)) return null;
  const card = selection.getNodes().find($isSavedCardNode);
  return card ?? null;
}

export type SavedCardCommands = {
  /** Align the selected card. On a card that fills the column it also narrows it, so the alignment shows. */
  setSavedCardAlignment: (alignment: MediaAlignment) => void;
  setSavedCardCaption: (caption: string) => void;
  getSavedCardCaption: () => Promise<string>;
  getSavedCardUrl: () => Promise<string>;
  /** Set the selected card's width in px; `null` fills the column. */
  resizeSavedCard: (width: number | null) => void;
  moveSavedCard: (direction: MoveDirection) => void;
  removeSavedCard: () => void;
};

export type SavedCardQueries = {
  isSavedCardSelected: () => Promise<boolean>;
  isSavedCardAlignedLeft: () => Promise<boolean>;
  isSavedCardAlignedCenter: () => Promise<boolean>;
  isSavedCardAlignedRight: () => Promise<boolean>;
};

/** Share of the column an aligned card takes when it had no width of its own. */
const ALIGNED_CARD_FRACTION = 2 / 3;

/**
 * Headless extension that registers {@link SavedCardNode} with the editor, makes
 * a click select it, and provides the commands its toolbar uses (align,
 * caption, resize, move, remove).
 */
export class SavedCardExtension extends BaseExtension<
  "savedCard",
  Record<string, never>,
  SavedCardCommands,
  SavedCardQueries,
  ReactNode[]
> {
  constructor() {
    super("savedCard", [ExtensionCategory.Floating]);
  }

  register(editor: LexicalEditor): () => void {
    return registerClickToSelect(editor, (node) => $isSavedCardNode(node));
  }

  getNodes(): Array<typeof SavedCardNode> {
    return [SavedCardNode];
  }

  getCommands(editor: LexicalEditor): SavedCardCommands {
    const isCard = (node: LexicalNode | null) => $isSavedCardNode(node);
    const readCard = <T,>(pick: (card: SavedCardNode) => T, fallback: T) =>
      new Promise<T>((resolve) => {
        editor.getEditorState().read(() => {
          const card = $selectedCard();
          resolve(card ? pick(card) : fallback);
        });
      });
    return {
      setSavedCardAlignment: (alignment) => {
        editor.update(() => {
          const card = $selectedCard();
          if (!card) return;
          const next: Partial<SavedCardLayout> = { align: alignment };
          if (card.getLayout().width === undefined) {
            const column = editor.getElementByKey(card.getKey())?.getBoundingClientRect().width ?? 0;
            if (column > 0) next.width = Math.max(MIN_CARD_WIDTH, Math.round(column * ALIGNED_CARD_FRACTION));
          }
          card.setLayout(next);
        });
      },
      setSavedCardCaption: (caption) => {
        editor.update(() => {
          $selectedCard()?.setLayout({ caption: caption.trim() || undefined });
        });
      },
      getSavedCardCaption: () => readCard((card) => card.getLayout().caption ?? "", ""),
      getSavedCardUrl: () => readCard((card) => card.getUrl(), ""),
      resizeSavedCard: (width) => {
        editor.update(() => {
          $selectedCard()?.setLayout({ width: width === null ? undefined : Math.max(MIN_CARD_WIDTH, width) });
        });
      },
      moveSavedCard: (direction) => moveSelectedNode(editor, isCard, direction),
      removeSavedCard: () => removeSelectedNode(editor, isCard),
    };
  }

  getStateQueries(editor: LexicalEditor): SavedCardQueries {
    const query = (test: (card: SavedCardNode) => boolean) => () =>
      new Promise<boolean>((resolve) => {
        editor.getEditorState().read(() => {
          const card = $selectedCard();
          resolve(card ? test(card) : false);
        });
      });
    return {
      isSavedCardSelected: query(() => true),
      isSavedCardAlignedLeft: query((card) => card.getLayout().align === "left"),
      isSavedCardAlignedCenter: query((card) => (card.getLayout().align ?? "center") === "center"),
      isSavedCardAlignedRight: query((card) => card.getLayout().align === "right"),
    };
  }
}

export const savedCardExtension = new SavedCardExtension();

/**
 * Lossless bidirectional markdown transformer for {@link SavedCardNode}.
 *
 * Import: a line that is exactly `![[card:url]]` (optionally
 * `![[card:url|title]]`, `![[card:url|title|480]]` or `![[card:url||480]]`, then
 * trailing `<!-- align:… -->` / `<!-- caption:… -->` directives) becomes a saved
 * card. Export: a saved card serializes back to the same syntax.
 *
 * This transformer **must** be ordered ahead of `FILE_EMBED_MARKDOWN_TRANSFORMER`
 * so the more specific `card:` prefix is matched before the general `![[…]]`
 * file-embed pattern (whose `[^\]]+` target would otherwise swallow it).
 */
export const SAVED_CARD_MARKDOWN_TRANSFORMER: ElementTransformer = {
  dependencies: [SavedCardNode],
  export: (node) => {
    if (!$isSavedCardNode(node)) {
      return null;
    }
    return node.getMarkdown();
  },
  regExp: /^!\[\[card:([^\]|]+)(?:\|([^\]]*))?\]\]((?:\s*<!--[\s\S]*?-->)*)\s*$/,
  replace: (parentNode: ElementNode, _children, match) => {
    const url = (match[1] ?? "").trim();
    if (!url) {
      return;
    }
    const directives = parseMediaDirectives(match[3] ?? "");
    if (!directives) {
      return;
    }
    // `title`, `title|480`, `|480`: a width is only ever a second segment.
    const segments = match[2] === undefined ? [] : match[2].split("|");
    let width: number | undefined;
    if (segments.length >= 2 && /^\d{1,5}$/.test(segments[segments.length - 1]!.trim())) {
      width = validWidth(Number(segments.pop()!.trim()));
    }
    const rawTitle = segments.join("|");
    const title = rawTitle.trim() !== "" ? rawTitle.trim() : undefined;
    parentNode.replace(
      $createSavedCardNode(url, title, {
        ...(width !== undefined ? { width } : {}),
        ...(directives.align ? { align: directives.align } : {}),
        ...(directives.caption ? { caption: directives.caption } : {}),
        ...(directives.unknown.length ? { directives: directives.unknown } : {}),
      }),
    );
  },
  type: "element",
};
