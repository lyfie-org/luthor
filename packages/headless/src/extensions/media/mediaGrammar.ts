/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/*
 * The markdown grammar for sized, aligned, captioned media — pure functions, no
 * Lexical, so every node and host shares one definition of it.
 *
 *   ![[photo.png]]                          natural size
 *   ![[photo.png|480]]                      480px wide (Obsidian's syntax)
 *   ![[clip.mp4|640x360]]                   explicit box
 *   ![[photo.png|A sunset|480]]             alt text + width
 *   ![[report.pdf#page=3]]                  a fragment (PDF page, heading…)
 *   ![[photo.png|480]] <!-- align:center --> <!-- caption:Dusk -->
 *
 * Size is Obsidian's own `|W` / `|WxH`, so a vault stays portable. Alignment and
 * captions have no Obsidian syntax, so they ride in trailing HTML comments that
 * every other renderer ignores. Unknown pipe segments and unknown directives are
 * kept verbatim, in order: the grammar never drops what it doesn't understand.
 *
 * Byte-stability is the caller's other half: a node remembers the exact source
 * it was parsed from and exports that until something is actually edited — see
 * FileEmbedNode. `format*` here produce the canonical form used after an edit.
 */

export type MediaAlignment = "left" | "center" | "right";

/** A parsed `![[…]]` inner target. */
export interface EmbedTarget {
  /** The file reference, without fragment or pipe segments (`photo.png`). */
  target: string;
  /** Text after `#` (`page=3`, `Heading`), without the `#`; empty when absent. */
  fragment: string;
  /** The first non-size pipe segment, Obsidian's alias (used as alt text). */
  alt?: string;
  /** Width in CSS pixels from a `|W` or `|WxH` segment. */
  width?: number;
  /** Height in CSS pixels from a `|WxH` segment. */
  height?: number;
  /** Any further pipe segments, verbatim and in order. */
  extra: string[];
  /** The source used `\|` (inside a table cell); formatting keeps doing so. */
  escapedPipes: boolean;
}

/** Parsed trailing `<!-- key:value -->` directives. */
export interface MediaDirectives {
  align?: MediaAlignment;
  caption?: string;
  /** Directives this grammar doesn't own, verbatim (`<!-- foo:bar -->`), in order. */
  unknown: string[];
}

/** Bounds for a size segment — larger values are treated as plain text. */
export const MEDIA_MAX_DIMENSION = 16384;

const SIZE_SEGMENT = /^(\d{1,5})(?:x(\d{1,5}))?$/;
const DIRECTIVE = /<!--\s*([a-z][a-z0-9-]*)\s*:\s*([\s\S]*?)\s*-->/gi;

function parseSize(segment: string): { width: number; height?: number } | null {
  const match = SIZE_SEGMENT.exec(segment.trim());
  if (!match) {
    return null;
  }
  const width = Number(match[1]);
  const height = match[2] === undefined ? undefined : Number(match[2]);
  if (width < 1 || width > MEDIA_MAX_DIMENSION) {
    return null;
  }
  if (height !== undefined && (height < 1 || height > MEDIA_MAX_DIMENSION)) {
    return null;
  }
  return height === undefined ? { width } : { width, height };
}

/**
 * Split an embed's inner text on its pipes. `\|` (how a pipe is written inside a
 * markdown table cell) is a separator too; whether it was used is reported so a
 * reformat can keep the table intact.
 */
function splitPipes(inner: string): { parts: string[]; escaped: boolean } {
  const parts: string[] = [];
  let current = "";
  let escaped = false;
  for (let i = 0; i < inner.length; i++) {
    const char = inner[i];
    if (char === "\\" && inner[i + 1] === "|") {
      parts.push(current);
      current = "";
      escaped = true;
      i++;
      continue;
    }
    if (char === "|") {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  parts.push(current);
  return { parts, escaped };
}

/** Parse the text between `![[` and `]]`. */
export function parseEmbedTarget(inner: string): EmbedTarget {
  const { parts, escaped } = splitPipes(inner);
  const head = (parts[0] ?? "").trim();
  const hash = head.indexOf("#");
  const target = hash >= 0 ? head.slice(0, hash).trim() : head;
  const fragment = hash >= 0 ? head.slice(hash + 1).trim() : "";

  const segments = parts.slice(1);
  // The LAST segment that reads as a size is the size (Obsidian's rule when an
  // alias and a size are both present); the first other one is the alias.
  let sizeIndex = -1;
  for (let i = segments.length - 1; i >= 0; i--) {
    if (parseSize(segments[i] ?? "")) {
      sizeIndex = i;
      break;
    }
  }
  const size = sizeIndex >= 0 ? parseSize(segments[sizeIndex] ?? "") : null;
  const others = segments.filter((_, i) => i !== sizeIndex);
  const [alt, ...extra] = others;

  return {
    target,
    fragment,
    ...(alt !== undefined && alt.trim() !== "" ? { alt: alt.trim() } : {}),
    ...(size ? { width: size.width } : {}),
    ...(size?.height !== undefined ? { height: size.height } : {}),
    extra: alt !== undefined && alt.trim() === "" ? ["", ...extra] : extra,
    escapedPipes: escaped,
  };
}

/** Canonical inner text for an embed (the part between `![[` and `]]`). */
export function formatEmbedTarget(value: EmbedTarget): string {
  const pipe = value.escapedPipes ? "\\|" : "|";
  let inner = value.target;
  if (value.fragment) {
    inner += `#${value.fragment}`;
  }
  const segments: string[] = [];
  if (value.alt) {
    segments.push(sanitizeSegment(value.alt));
  }
  segments.push(...value.extra);
  const size = formatSize(value.width, value.height);
  if (size) {
    segments.push(size);
  }
  for (const segment of segments) {
    inner += pipe + segment;
  }
  return inner;
}

/** `480`, `640x360`, or empty when there is no width. */
export function formatSize(width?: number, height?: number): string {
  if (!width || width < 1) {
    return "";
  }
  const w = Math.min(MEDIA_MAX_DIMENSION, Math.round(width));
  if (!height || height < 1) {
    return String(w);
  }
  return `${w}x${Math.min(MEDIA_MAX_DIMENSION, Math.round(height))}`;
}

/**
 * For `![[youtube:url|…]]` / `![[iframe:url|…]]`: everything after the URL is a
 * caption, except a trailing size segment (`|640x360`). Older notes carry only a
 * caption, so it keeps any pipes it had.
 */
export function splitCaptionAndSize(rest: string | undefined): {
  caption: string;
  width?: number;
  height?: number;
} {
  if (!rest) {
    return { caption: "" };
  }
  const segments = rest.split("|");
  const size = segments.length > 0 ? parseSize(segments[segments.length - 1] ?? "") : null;
  if (size) {
    segments.pop();
  }
  return {
    caption: segments.join("|").trim(),
    ...(size ? { width: size.width } : {}),
    ...(size?.height !== undefined ? { height: size.height } : {}),
  };
}

// A segment may not contain the characters that end it or the embed — nor end
// in a backslash, which would turn the next separator into an escaped `\|`.
function sanitizeSegment(value: string): string {
  return value.replace(/[|\]\r\n]+/g, " ").replace(/[\s\\]+$/, "").trim();
}

/**
 * Parse the whitespace-separated run of `<!-- key:value -->` comments after an
 * embed. Returns null when anything other than comments is there (then the line
 * isn't a media embed with directives at all).
 */
export function parseMediaDirectives(trailing: string): MediaDirectives | null {
  const result: MediaDirectives = { unknown: [] };
  const text = trailing.trim();
  if (!text) {
    return result;
  }
  DIRECTIVE.lastIndex = 0;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = DIRECTIVE.exec(text))) {
    if (text.slice(last, match.index).trim() !== "") {
      return null;
    }
    const key = (match[1] ?? "").toLowerCase();
    const value = match[2] ?? "";
    if (key === "align" && isAlignment(value.trim().toLowerCase())) {
      result.align = value.trim().toLowerCase() as MediaAlignment;
    } else if (key === "caption") {
      result.caption = decodeDirectiveValue(value);
    } else {
      result.unknown.push(match[0]);
    }
    last = DIRECTIVE.lastIndex;
  }
  return text.slice(last).trim() === "" ? result : null;
}

/** Canonical directive text (leading space included), or empty. */
export function formatMediaDirectives(value: MediaDirectives): string {
  const parts: string[] = [];
  if (value.align) {
    parts.push(`<!-- align:${value.align} -->`);
  }
  if (value.caption !== undefined && value.caption.trim() !== "") {
    parts.push(`<!-- caption:${encodeDirectiveValue(value.caption)} -->`);
  }
  parts.push(...value.unknown);
  return parts.length > 0 ? ` ${parts.join(" ")}` : "";
}

function isAlignment(value: string): value is MediaAlignment {
  return value === "left" || value === "center" || value === "right";
}

// A comment can't contain `-->` (or begin a new one): encode the few characters
// that would break it, and fold newlines — a caption is one line.
function encodeDirectiveValue(value: string): string {
  return value
    .replace(/[\r\n]+/g, " ")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .trim();
}

function decodeDirectiveValue(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

/**
 * The directives a framed embed (`![[iframe:…]]`, `![[youtube:…]]`) carries
 * after its `]]`: its alignment when it isn't the default centre, then any
 * directive it doesn't own, verbatim. Leading space included, or empty.
 */
export function formatFrameDirectives(align: MediaAlignment | undefined, extra: readonly string[] = []): string {
  return formatMediaDirectives({
    align: align && align !== "center" ? align : undefined,
    unknown: [...extra],
  });
}

/** Read a framed embed's trailing directives (see {@link formatFrameDirectives}). */
export function parseFrameDirectives(trailing: string | undefined): {
  align: MediaAlignment;
  caption?: string;
  extra: string[];
} {
  const parsed = parseMediaDirectives(trailing ?? "") ?? { unknown: [] };
  return {
    align: parsed.align ?? "center",
    ...(parsed.caption ? { caption: parsed.caption } : {}),
    extra: parsed.unknown,
  };
}

/** Coarse media family of a target, by extension. */
export type MediaKind = "image" | "video" | "audio" | "pdf" | "file";

const IMAGE = /\.(?:png|jpe?g|gif|webp|svg|avif|bmp|ico|heic|heif|tiff?)$/i;
const VIDEO = /\.(?:mp4|webm|mov|m4v|ogv|mkv|avi)$/i;
const AUDIO = /\.(?:mp3|wav|ogg|oga|opus|m4a|flac|aac|weba)$/i;
const PDF = /\.pdf$/i;
const HAS_EXTENSION = /\.[a-z0-9]{1,8}$/i;

/** Classify a target by its extension. */
export function classifyMedia(target: string): MediaKind {
  if (IMAGE.test(target)) return "image";
  if (VIDEO.test(target)) return "video";
  if (AUDIO.test(target)) return "audio";
  if (PDF.test(target)) return "pdf";
  return "file";
}

/**
 * Whether a target names a file (`x.ext`) rather than a note (`My Note`). Only
 * file targets become inline embeds mid-paragraph; a bare `![[Note]]` there is
 * left as text for the transclusion/wikilink syntaxes to own.
 */
export function isFileTarget(target: string): boolean {
  return HAS_EXTENSION.test(target.trim()) && !target.includes(":");
}
