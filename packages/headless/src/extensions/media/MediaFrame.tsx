/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { LexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { LexicalEditor } from "lexical";
import {
  useEmbedResolvers,
  type EmbedResolvers,
  type MediaEdit,
  type MediaMeta,
  type MediaToolbarContext,
  type MediaToolbarItem,
} from "../embeds/EmbedResolverContext";
import { useEditorPrompt } from "./EditorPromptContext";
import { uploadPreviews } from "../embeds/uploads";
import { classifyMedia, type MediaAlignment } from "./mediaGrammar";
import { useIsEditable, useIsNodeSelected } from "./mediaSelection";
import { usePointerResize } from "./usePointerResize";

/** Everything a media frame needs to draw an attachment. */
export interface MediaFrameProps {
  /** The file reference (`photo.png`), without fragment or pipes. */
  target: string;
  /** Text after `#` in the embed (`page=3`), or empty. */
  fragment?: string;
  /** Alt text; falls back to the file name. */
  alt?: string;
  /** Display width in CSS pixels (from `|W`); capped to the container. */
  width?: number;
  /** Display height in CSS pixels (from `|WxH`); only its ratio to width is used. */
  height?: number;
  align?: MediaAlignment;
  caption?: string;
  /** Rendered inside a line of text rather than as its own block. */
  inline?: boolean;
  /**
   * The Lexical node this frame draws. With it (inside an editable editor) the
   * frame becomes interactive: click to select, drag to resize, a toolbar.
   */
  nodeKey?: string;
  /** Apply an edit to the node (one `editor.update`). */
  onEdit?: (editor: LexicalEditor, edit: MediaEdit) => void;
  /** Remove the node. */
  onRemove?: (editor: LexicalEditor) => void;
}

const THUMB_WIDTHS = [320, 640, 1280];
const NO_SUBSCRIPTION = () => () => {};
const MIN_WIDTH = 48;

function useMediaMeta(resolvers: EmbedResolvers, target: string): MediaMeta | null | undefined {
  const subscribe = resolvers.subscribeMediaMeta ?? NO_SUBSCRIPTION;
  const read = useCallback(
    () => resolvers.getMediaMeta?.(target) ?? undefined,
    [resolvers, target],
  );
  return useSyncExternalStore(subscribe, read, read);
}

function positive(value: number | null | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

/** `12 KB`, `3.4 MB`. */
export function formatBytes(bytes: number | undefined): string {
  if (!bytes || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1).replace(/\.0$/, "")} GB`;
}

function formatDuration(ms: number | undefined): string {
  if (!ms) return "";
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function extensionLabel(target: string): string {
  const match = /\.([a-z0-9]{1,8})$/i.exec(target);
  return match ? match[1]!.toUpperCase() : "FILE";
}

function withRetry(url: string, attempt: number): string {
  if (attempt === 0) return url;
  return `${url}${url.includes("?") ? "&" : "?"}retry=${attempt}`;
}

// ── Icons (inline, currentColor, 16px grid) ──────────────────────────────────

function Icon({ d }: { d: string }): ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  );
}
const ICONS = {
  alignLeft: "M2.5 3.5h11M2.5 6.5h7M2.5 9.5h11M2.5 12.5h7",
  alignCenter: "M2.5 3.5h11M4.5 6.5h7M2.5 9.5h11M4.5 12.5h7",
  alignRight: "M2.5 3.5h11M6.5 6.5h7M2.5 9.5h11M6.5 12.5h7",
  caption: "M2.5 3.5h11v6h-11zM4.5 12.5h7",
  alt: "M3 12.5l2.5-9 2.5 9M3.8 9.5h3.4M10.5 3.5v9h3",
  open: "M9 2.5h4.5V7M13.5 2.5L7.5 8.5M12 9.5v4H2.5V4h4",
  remove: "M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.7 9h5.6l.7-9",
  reset: "M3 8a5 5 0 1 0 1.5-3.5M3 2.5v3h3",
};

// ── The frame ────────────────────────────────────────────────────────────────

/**
 * The shared view for an embedded attachment: pictures, video, audio, PDFs and
 * other files. It is built to never shift the page and never break:
 *
 * - **Its box is reserved before anything loads.** Width comes from the embed
 *   (`|480`) or the host's metadata, the shape from `|WxH` or the metadata; the
 *   element gets `aspect-ratio`, so text below doesn't jump when the file arrives.
 * - **It loads what it needs.** Pictures are lazy, decode off the main thread, and
 *   — when the host offers thumbnails — pick a right-sized rendition via `srcset`.
 *   Video loads only its metadata until played, behind its poster.
 * - **A failure is a card, not a broken-image glyph**, with Retry and a way to
 *   open the file. The markdown is never touched.
 *
 * Given a `nodeKey` inside an editable editor it is also interactive: a click
 * selects it; a selected attachment shows resize handles and a toolbar
 * (alignment, size, caption, alt text, open, remove, plus the host's items).
 * The toolbar lives inside the frame — anchored to the picture itself, mounted
 * only while it is selected — so it can't drift on scroll or blink on a click.
 */
export function MediaFrame(props: MediaFrameProps): ReactNode {
  const { target, fragment = "", alt, width, height, align, caption, inline = false, nodeKey, onEdit, onRemove } = props;
  const resolvers = useEmbedResolvers();
  const meta = useMediaMeta(resolvers, target);
  const composer = useContext(LexicalComposerContext);
  const editor: LexicalEditor | null = composer ? composer[0] : null;
  const isEditable = useIsEditable(editor);
  const isSelected = useIsNodeSelected(editor, nodeKey);
  const requestPrompt = useEditorPrompt();
  const [attempt, setAttempt] = useState(0);
  // Keyed by URL: replacing the file (a new target) starts clean.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  // The URL whose picture/video has drawn — until then the frame shows a
  // loading shimmer (or the local preview of a file just uploaded).
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const figureRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<HTMLElement | null>(null);
  const badgeRef = useRef<HTMLSpanElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const actionsRef = useRef<Map<string, () => void>>(new Map());
  // A small picture gets its toolbar underneath rather than covering it.
  const [compact, setCompact] = useState(false);

  const resolve = resolvers.resolveMediaUrl;
  const url = typeof resolve === "function" ? resolve(target) : "";
  const kind = classifyMedia(target);
  const label = alt?.trim() || target;
  const failed = failedUrl !== null && failedUrl === url;
  const setFailed = (value: boolean) => setFailedUrl(value ? url : null);
  const interactive = !!(editor && nodeKey && onEdit && isEditable);
  const isDocument = kind !== "image" && kind !== "video" && kind !== "audio";
  // The host's own look for a document (a file icon and its name), if it has one.
  const hostCard =
    url && isDocument && !failed && resolvers.renderFileCard
      ? resolvers.renderFileCard({
          target, fragment, url, kind, meta,
          label, alt: alt?.trim() || undefined, interactive, selected: isSelected,
        })
      : null;
  const hasHostCard = hostCard !== null && hostCard !== undefined;
  // Every block attachment sizes by its width: a picture or video keeps its
  // shape, a card (audio, a PDF, any other file) just gets narrower or wider —
  // except a host's card, which has a size of its own.
  const resizable = interactive && !inline && !failed && !hasHostCard;
  const loading = (kind === "image" || kind === "video") && !failed && !!url && loadedUrl !== url;
  const localPreview = loading && kind === "image" ? uploadPreviews.get(target) : undefined;

  const edit = useCallback(
    (change: MediaEdit) => {
      if (editor && onEdit) onEdit(editor, change);
    },
    [editor, onEdit],
  );

  const containerWidth = () =>
    figureRef.current?.parentElement?.getBoundingClientRect().width ||
    figureRef.current?.getBoundingClientRect().width ||
    Number.POSITIVE_INFINITY;

  const { onPointerDown, resizing } = usePointerResize({
    frameRef,
    minWidth: MIN_WIDTH,
    maxWidth: containerWidth,
    centered: align === "center",
    onPreview: (w) => {
      if (badgeRef.current) badgeRef.current.textContent = w === null ? "" : `${w} px`;
    },
    // Keep the box's shape when it has one of its own (`|WxH`); otherwise the
    // file's own ratio follows the new width.
    onCommit: (w) =>
      edit({ width: w, height: positive(width) && positive(height) ? Math.round((w * height!) / width!) : null }),
  });

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !isSelected || inline || typeof ResizeObserver === "undefined") return;
    const measure = () => setCompact(frame.getBoundingClientRect().width < 360);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [isSelected, inline]);

  // Toolbar buttons are handled natively: a click inside a decorator reaches
  // the editor's own root listeners before React sees it, and must neither
  // move the selection nor steal focus from the editor.
  useEffect(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar) return;
    const swallow = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    const onClick = (event: MouseEvent) => {
      swallow(event);
      const button = (event.target as Element | null)?.closest?.("[data-media-action]");
      const id = button?.getAttribute("data-media-action");
      if (id && !button?.hasAttribute("disabled")) actionsRef.current.get(id)?.();
    };
    toolbar.addEventListener("mousedown", swallow);
    toolbar.addEventListener("pointerdown", swallow);
    toolbar.addEventListener("click", onClick);
    return () => {
      toolbar.removeEventListener("mousedown", swallow);
      toolbar.removeEventListener("pointerdown", swallow);
      toolbar.removeEventListener("click", onClick);
    };
  });

  // No host to resolve the file: a reference chip, so the embed stays visible.
  if (!url) {
    return (
      <span
        className="luthor-file-embed luthor-file-embed--chip"
        data-luthor-file-embed-target={target}
        role="note"
        aria-label={`Embedded file: ${target}`}
      >
        {target}
      </span>
    );
  }

  const naturalWidth = positive(meta?.width);
  const naturalHeight = positive(meta?.height);
  const displayWidth = positive(width) ?? naturalWidth;
  // Shape: an explicit box wins, then the file's own; video defaults to 16:9.
  const ratio =
    positive(width) && positive(height)
      ? `${width} / ${height}`
      : naturalWidth && naturalHeight
        ? `${naturalWidth} / ${naturalHeight}`
        : kind === "video"
          ? "16 / 9"
          : undefined;

  // A known width fills its (capped) box; an unknown one shows the file at its
  // own size, never stretched past it.
  const frameStyle: CSSProperties = hasHostCard
    ? { width: "fit-content", maxWidth: "100%" }
    : displayWidth
      ? { width: `min(${Math.round(displayWidth)}px, 100%)` }
      : kind === "image"
        ? { width: "fit-content", maxWidth: "100%" }
        : {};
  if (localPreview) {
    frameStyle.backgroundImage = `url("${localPreview}")`;
  }
  const markLoaded = () => setLoadedUrl(url);
  const mediaStyle: CSSProperties = {
    width: displayWidth || kind !== "image" ? "100%" : "auto",
    maxWidth: "100%",
    height: "auto",
    ...(ratio ? { aspectRatio: ratio } : {}),
    objectFit: "contain",
  };

  const retry = () => {
    setFailed(false);
    setAttempt((n) => n + 1);
  };

  const failure = (
    <span className="luthor-media__error" role="group" aria-label={`Couldn't load ${label}`}>
      <span className="luthor-media__error-text">Couldn&rsquo;t load {label}</span>
      <span className="luthor-media__error-actions">
        <button type="button" className="luthor-media__button" onClick={retry}>
          Retry
        </button>
        <a className="luthor-media__button" href={url} target="_blank" rel="noopener noreferrer">
          Open file
        </a>
      </span>
    </span>
  );

  let body: ReactNode;
  if (failed) {
    body = failure;
  } else if (kind === "image") {
    // Right-sized renditions when the host has them — never for an animation
    // (a thumbnail is a still) and only when the intrinsic width is known.
    const thumbUrl =
      meta?.thumb && !meta.animated && naturalWidth && resolve
        ? (w: number) => resolve(target, { variant: "thumb", width: w })
        : null;
    const candidates =
      thumbUrl && thumbUrl(THUMB_WIDTHS[0]!) !== url
        ? THUMB_WIDTHS.filter((w) => w < naturalWidth!).map((w) => `${thumbUrl(w)} ${w}w`)
        : [];
    const srcSet = candidates.length > 0 ? [...candidates, `${url} ${naturalWidth}w`].join(", ") : undefined;
    body = (
      <img
        className="luthor-file-embed luthor-file-embed--image luthor-media__element"
        src={withRetry(url, attempt)}
        srcSet={srcSet}
        sizes={srcSet ? (displayWidth ? `min(${Math.round(displayWidth)}px, 100vw)` : "100vw") : undefined}
        alt={alt?.trim() || target}
        loading="lazy"
        decoding="async"
        width={naturalWidth}
        height={naturalHeight}
        style={mediaStyle}
        draggable={false}
        onLoad={markLoaded}
        onError={() => setFailed(true)}
        ref={(el) => {
          // Already in the cache: no load event will come.
          if (el?.complete && el.naturalWidth > 0 && loadedUrl !== url) markLoaded();
        }}
      />
    );
  } else if (kind === "video") {
    const poster =
      meta?.poster && resolve ? resolve(target, { variant: "poster", width: 1280 }) : undefined;
    body = (
      <video
        className="luthor-file-embed luthor-file-embed--video luthor-media__element"
        src={withRetry(url, attempt)}
        poster={poster && poster !== url ? poster : undefined}
        controls
        preload="metadata"
        playsInline
        aria-label={label}
        style={mediaStyle}
        onLoadedMetadata={markLoaded}
        onError={() => setFailed(true)}
      />
    );
  } else if (kind === "audio") {
    const duration = formatDuration(positive(meta?.durationMs));
    body = (
      <span className="luthor-media__card luthor-media__card--audio">
        <span className="luthor-media__card-title">
          <span className="luthor-media__card-name">{label}</span>
          {duration ? <span className="luthor-media__card-detail">{duration}</span> : null}
        </span>
        <audio
          className="luthor-file-embed luthor-file-embed--audio"
          src={withRetry(url, attempt)}
          controls
          preload="metadata"
          aria-label={label}
          onError={() => setFailed(true)}
        />
      </span>
    );
  } else if (hasHostCard) {
    const expansion = resolvers.renderFileExpansion?.({ target, fragment, url, kind, meta }) ?? null;
    body = (
      <span className="luthor-media__card luthor-media__card--host" data-luthor-file-embed-target={target}>
        {hostCard}
        {expansion}
      </span>
    );
  } else {
    const details = [extensionLabel(target), formatBytes(meta?.size)].filter(Boolean).join(" · ");
    const expansion = resolvers.renderFileExpansion?.({ target, fragment, url, kind, meta }) ?? null;
    body = (
      <span className="luthor-media__card luthor-media__card--file">
        <a
          className="luthor-file-embed luthor-media__card-link"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          data-luthor-file-embed-target={target}
          onClick={(event) => {
            // In an editable note the first click selects the card; opening it
            // is the toolbar's "Open" (or a modifier click).
            if (interactive && !event.metaKey && !event.ctrlKey) event.preventDefault();
          }}
        >
          <span className="luthor-media__card-icon" aria-hidden="true">
            {extensionLabel(target)}
          </span>
          <span className="luthor-media__card-title">
            <span className="luthor-media__card-name">{label}</span>
            {details ? <span className="luthor-media__card-detail">{details}</span> : null}
          </span>
        </a>
        {expansion}
      </span>
    );
  }

  // ── Toolbar ──
  let toolbar: ReactNode = null;
  if (interactive && isSelected && !inline && !resizing) {
    const context: MediaToolbarContext = {
      target, fragment, kind, url, meta, width, height, align, caption, alt,
      update: edit,
      remove: () => editor && onRemove?.(editor),
      requestInput: requestPrompt,
    };
    const items: MediaToolbarItem[] = [];
    if (resolvers.mediaToolbar?.builtIn !== false) {
      const setAlign = (next: MediaAlignment) => edit({ align: align === next ? null : next });
      items.push(
        { id: "align-left", label: "Align left", icon: <Icon d={ICONS.alignLeft} />, active: align === "left", onSelect: () => setAlign("left") },
        { id: "align-center", label: "Centre", icon: <Icon d={ICONS.alignCenter} />, active: align === "center", onSelect: () => setAlign("center") },
        { id: "align-right", label: "Align right", icon: <Icon d={ICONS.alignRight} />, active: align === "right", onSelect: () => setAlign("right") },
      );
      for (const [fraction, text] of [[0.25, "¼"], [0.5, "½"], [0.75, "¾"], [1, "Full"]] as const) {
        items.push({
          id: `size-${fraction}`,
          label: fraction === 1 ? "Full width" : `${text} width`,
          onSelect: () => {
            const full = containerWidth();
            if (Number.isFinite(full)) edit({ width: Math.max(MIN_WIDTH, Math.round(full * fraction)), height: null });
          },
        });
      }
      if (positive(width)) {
        items.push({ id: "size-reset", label: "Original size", icon: <Icon d={ICONS.reset} />, onSelect: () => edit({ width: null, height: null }) });
      }
      items.push({
        id: "caption",
        label: caption ? "Edit caption" : "Add caption",
        icon: <Icon d={ICONS.caption} />,
        active: !!caption,
        onSelect: () => {
          void requestPrompt({
            title: caption ? "Edit caption" : "Add caption",
            submitLabel: "Save",
            fields: [{ name: "caption", label: "Caption", value: caption ?? "", placeholder: "Shown under the file" }],
          }).then((values) => {
            if (values) edit({ caption: values.caption || null });
          });
        },
      });
      if (kind === "image") {
        items.push({
          id: "alt",
          label: "Alt text",
          icon: <Icon d={ICONS.alt} />,
          active: !!alt,
          onSelect: () => {
            void requestPrompt({
              title: "Alt text",
              submitLabel: "Save",
              fields: [{ name: "alt", label: "Describe the picture for screen readers", value: alt ?? "" }],
            }).then((values) => {
              if (values) edit({ alt: values.alt || null });
            });
          },
        });
      }
      items.push({
        id: "open",
        label: "Open in new tab",
        icon: <Icon d={ICONS.open} />,
        onSelect: () => window.open(url, "_blank", "noopener,noreferrer"),
      });
    }
    const hostItems = resolvers.mediaToolbar?.items?.(context) ?? [];
    items.push(...hostItems);
    if (resolvers.mediaToolbar?.builtIn !== false) {
      items.push({ id: "remove", label: "Remove", icon: <Icon d={ICONS.remove} />, onSelect: () => context.remove() });
    }

    actionsRef.current = new Map(
      items.filter((item) => item.variant !== "label").map((item) => [item.id, item.onSelect]),
    );
    toolbar = (
      <div ref={toolbarRef} className={`luthor-media__toolbar${compact ? " is-compact" : ""}`} role="toolbar" aria-label="Attachment" contentEditable={false}>
        {items.map((item) => item.variant === "label" ? (
          <span key={item.id} className="luthor-media__tool-label" data-media-label={item.id} title={item.label}>
            {item.icon}
            {item.label}
          </span>
        ) : (
          <button
            key={item.id}
            type="button"
            className={`luthor-media__tool${item.active ? " is-active" : ""}${item.icon ? "" : " luthor-media__tool--text"}`}
            data-media-action={item.id}
            aria-label={item.label}
            aria-pressed={item.active === undefined ? undefined : item.active}
            title={item.label}
            disabled={item.disabled}
          >
            {item.icon ?? item.label.replace(/ width$/, "")}
          </button>
        ))}
      </div>
    );
  }

  const handles = resizable && isSelected ? (
    <>
      <span
        className="luthor-media__handle luthor-media__handle--left"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize"
        onPointerDown={onPointerDown("left")}
      />
      <span
        className="luthor-media__handle luthor-media__handle--right"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize"
        onPointerDown={onPointerDown("right")}
      />
      <span ref={badgeRef} className="luthor-media__size-badge" aria-live="polite" />
    </>
  ) : null;

  const className = [
    "luthor-media",
    `luthor-media--${kind}`,
    inline ? "luthor-media--inline" : "luthor-media--block",
    align ? `luthor-media--align-${align}` : "",
    failed ? "luthor-media--failed" : "",
    hasHostCard ? "luthor-media--host-card" : "",
    interactive ? "is-interactive" : "",
    isSelected ? "is-selected" : "",
    resizing ? "is-resizing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (inline) {
    return (
      <span
        ref={(el) => {
          figureRef.current = el;
          frameRef.current = el;
        }}
        className={className}
        data-luthor-media-kind={kind}
        style={frameStyle}
      >
        {body}
      </span>
    );
  }

  return (
    <figure
      ref={(el) => {
        figureRef.current = el;
      }}
      className={className}
      data-luthor-media-kind={kind}
      data-align={align ?? "none"}
    >
      <div
        ref={(el) => {
          frameRef.current = el;
        }}
        className={`luthor-media__frame${loading ? " is-loading" : ""}${loading && !ratio ? " is-unsized" : ""}${localPreview ? " has-preview" : ""}`}
        style={frameStyle}
        aria-busy={loading || undefined}
      >
        {body}
        {handles}
        {toolbar}
      </div>
      {caption ? <figcaption className="luthor-media__caption">{caption}</figcaption> : null}
    </figure>
  );
}
