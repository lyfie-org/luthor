/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import {
  useCallback,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  useEmbedResolvers,
  type EmbedResolvers,
  type MediaMeta,
} from "../embeds/EmbedResolverContext";
import { classifyMedia, type MediaAlignment } from "./mediaGrammar";

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
}

const THUMB_WIDTHS = [320, 640, 1280];
const NO_SUBSCRIPTION = () => () => {};

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
 */
export function MediaFrame(props: MediaFrameProps): ReactNode {
  const { target, fragment = "", alt, width, height, align, caption, inline = false } = props;
  const resolvers = useEmbedResolvers();
  const meta = useMediaMeta(resolvers, target);
  const [attempt, setAttempt] = useState(0);
  // Keyed by URL: replacing the file (a new target) starts clean.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const resolve = resolvers.resolveMediaUrl;
  const url = typeof resolve === "function" ? resolve(target) : "";
  const kind = classifyMedia(target);
  const label = alt?.trim() || target;
  const failed = failedUrl !== null && failedUrl === url;
  const setFailed = (value: boolean) => setFailedUrl(value ? url : null);

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

  const frameStyle: CSSProperties = {
    ...(displayWidth ? { width: `min(${Math.round(displayWidth)}px, 100%)` } : {}),
  };
  const mediaStyle: CSSProperties = {
    width: "100%",
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
        onError={() => setFailed(true)}
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

  const className = [
    "luthor-media",
    `luthor-media--${kind}`,
    inline ? "luthor-media--inline" : "luthor-media--block",
    align ? `luthor-media--align-${align}` : "",
    failed ? "luthor-media--failed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (inline) {
    return (
      <span className={className} data-luthor-media-kind={kind} style={frameStyle}>
        {body}
      </span>
    );
  }

  return (
    <figure className={className} data-luthor-media-kind={kind} data-align={align ?? "none"}>
      <div className="luthor-media__frame" style={frameStyle}>
        {body}
      </div>
      {caption ? <figcaption className="luthor-media__caption">{caption}</figcaption> : null}
    </figure>
  );
}
