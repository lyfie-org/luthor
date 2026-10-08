/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/*
 * Formatting that survives the markdown round trip.
 *
 * Bold, italic, strikethrough, highlight and underline are written as
 * delimiters (`**`, `*`, `~~`, `==`, `++`), and a delimiter only counts when it
 * "flanks" its text the way CommonMark says. Lexical's importer applies that
 * rule; its exporter does not. So formatting that ends on punctuation right
 * before a letter — `<b>Mix:</b>60g`, which pasted AI answers are full of — was
 * written as `**Mix:**60g` and reopened as literal asterisks; one more save and
 * they were escaped (`\*\*`) for good.
 *
 * One rule, three places, all mirroring Lexical's importer exactly (ASCII
 * punctuation; only space, tab and line breaks are whitespace — not NBSP):
 *
 * - {@link registerMarkdownSafeFormats} keeps a live document representable,
 *   so what is shown is what is saved and reopens the same.
 * - {@link normalizeFormatBoundaries} applies it to a document on export, so
 *   the markdown is readable whoever produced the document.
 * - {@link repairEmphasis} reads files already written the broken way as the
 *   formatting they meant.
 *
 * The fix is always the smallest one: one punctuation mark (or the run of
 * spaces) at the inside edge of a run moves out of it. `**Mix**:60g` looks the
 * same and reopens as bold; `**Day 1 (Thu)**:` keeps its `)`.
 */

import {
  IS_BOLD,
  IS_CODE,
  IS_HIGHLIGHT,
  IS_ITALIC,
  IS_STRIKETHROUGH,
  IS_UNDERLINE,
  TextNode,
  type LexicalEditor,
} from "lexical";

const PUNCTUATION = /[!"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~]/;
const WHITESPACE = /[ \t\n\r\f]/;

/** The formats written as delimiters (and so subject to flanking). */
export const DELIMITED_FORMATS = IS_BOLD | IS_ITALIC | IS_STRIKETHROUGH | IS_UNDERLINE | IS_HIGHLIGHT;

type Kind = "space" | "punct" | "word";

/** How Lexical's flanking rule sees a character; `undefined` is the line's edge. */
function kindOf(ch: string | undefined): Kind {
  if (ch === undefined || WHITESPACE.test(ch)) return "space";
  return PUNCTUATION.test(ch) ? "punct" : "word";
}

/** Can a delimiter between `before` and `first` open a span? (left-flanking) */
function canOpen(before: Kind, first: Kind): boolean {
  return first !== "space" && (first === "word" || before !== "word");
}

/** Can a delimiter between `last` and `after` close a span? (right-flanking) */
function canClose(last: Kind, after: Kind): boolean {
  return last !== "space" && (last === "word" || after !== "word");
}

/** The run of `kind` characters at one end of `text` (length). */
function edgeRun(text: string, kind: Kind, side: "first" | "last"): number {
  let n = 0;
  if (side === "last") {
    for (let i = text.length - 1; i >= 0 && kindOf(text[i]) === kind; i--) n++;
  } else {
    for (let i = 0; i < text.length && kindOf(text[i]) === kind; i++) n++;
  }
  return n;
}

/** Adjacent text, as the boundary rule sees it. */
export interface FormattedRun {
  text: string;
  format: number;
}

/**
 * What must move so the delimiters between two adjacent text runs read back:
 * `length` characters at the inside edge of the `left` run's end or the
 * `right` run's start lose the formats in `clear`. Null when the boundary is
 * already fine (or involves inline code, whose backticks are never flanked).
 */
export interface BoundaryFix {
  side: "left" | "right";
  length: number;
  clear: number;
}

export function boundaryFix(left: FormattedRun, right: FormattedRun): BoundaryFix | null {
  if (!left.text || !right.text) return null;
  if ((left.format | right.format) & IS_CODE) return null;

  const closing = left.format & ~right.format & DELIMITED_FORMATS;
  if (closing) {
    const last = kindOf(left.text[left.text.length - 1]);
    if (!canClose(last, kindOf(right.text[0]))) {
      const length = last === "space" ? edgeRun(left.text, "space", "last") : 1;
      return { side: "left", length, clear: closing };
    }
  }

  const opening = right.format & ~left.format & DELIMITED_FORMATS;
  if (opening) {
    const first = kindOf(right.text[0]);
    if (!canOpen(kindOf(left.text[left.text.length - 1]), first)) {
      const length = first === "space" ? edgeRun(right.text, "space", "first") : 1;
      return { side: "right", length, clear: opening };
    }
  }

  return null;
}

// ── Live: a node transform ──────────────────────────────────────────────────

function applyToNode(node: TextNode, side: "first" | "last", length: number, clear: number): void {
  const text = node.getTextContent();
  let target = node;
  if (length < text.length) {
    const parts = side === "last" ? node.splitText(text.length - length) : node.splitText(length);
    target = side === "last" ? parts[1]! : parts[0]!;
  }
  target.setFormat(target.getFormat() & ~clear);
}

const runOf = (node: TextNode): FormattedRun => ({ text: node.getTextContent(), format: node.getFormat() });

function $guardTextNode(node: TextNode): void {
  if (!node.isSimpleText()) return;
  // Only boundaries with real text on both sides are touched: the end of a
  // paragraph is where people are typing, and splitting there would drop the
  // format from the next keystroke.
  const next = node.getNextSibling();
  if (next instanceof TextNode && next.isSimpleText()) {
    const fix = boundaryFix(runOf(node), runOf(next));
    if (fix) {
      if (fix.side === "left") applyToNode(node, "last", fix.length, fix.clear);
      else applyToNode(next, "first", fix.length, fix.clear);
      return;
    }
  }
  const prev = node.getPreviousSibling();
  if (prev instanceof TextNode && prev.isSimpleText()) {
    const fix = boundaryFix(runOf(prev), runOf(node));
    if (fix) {
      if (fix.side === "left") applyToNode(prev, "last", fix.length, fix.clear);
      else applyToNode(node, "first", fix.length, fix.clear);
    }
  }
}

/**
 * Keeps every bold/italic/strike/highlight/underline boundary in a live editor
 * in a form markdown can hold. For editors whose source of truth is markdown.
 * Returns the unregister function.
 */
export function registerMarkdownSafeFormats(editor: LexicalEditor): () => void {
  return editor.registerNodeTransform(TextNode, $guardTextNode);
}

// ── Export: a serialized document ───────────────────────────────────────────

type Json = Record<string, unknown>;

const isRecord = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isSimpleTextJson = (node: unknown): node is Json & { text: string; format?: number } =>
  isRecord(node) && node.type === "text" && typeof node.text === "string"
  && (node.mode === undefined || node.mode === "normal");

function normalizeChildren(children: unknown[]): unknown[] {
  let out = children;
  let guard = children.length * 4 + 8;
  for (let i = 0; i + 1 < out.length && guard > 0; guard--) {
    const left = out[i];
    const right = out[i + 1];
    if (!isSimpleTextJson(left) || !isSimpleTextJson(right)) {
      i++;
      continue;
    }
    const fix = boundaryFix(
      { text: left.text, format: Number(left.format ?? 0) },
      { text: right.text, format: Number(right.format ?? 0) },
    );
    if (!fix) {
      i++;
      continue;
    }
    if (out === children) out = [...children];
    const node = fix.side === "left" ? left : right;
    const format = Number(node.format ?? 0);
    const text = node.text;
    const replaced: Json[] = [];
    if (fix.length >= text.length) {
      replaced.push({ ...node, format: format & ~fix.clear });
    } else if (fix.side === "left") {
      replaced.push({ ...node, text: text.slice(0, text.length - fix.length) });
      replaced.push({ ...node, text: text.slice(text.length - fix.length), format: format & ~fix.clear });
    } else {
      replaced.push({ ...node, text: text.slice(0, fix.length), format: format & ~fix.clear });
      replaced.push({ ...node, text: text.slice(fix.length) });
    }
    const at = fix.side === "left" ? i : i + 1;
    out.splice(at, 1, ...replaced);
    // The moved characters now border the run before them: look again there.
    i = Math.max(0, i - 1);
  }
  return out;
}

function normalizeNode(node: unknown): unknown {
  if (!isRecord(node) || !Array.isArray(node.children)) return node;
  const children = node.children as unknown[];
  let changed = false;
  const mapped = children.map((child) => {
    const next = normalizeNode(child);
    if (next !== child) changed = true;
    return next;
  });
  const normalized = normalizeChildren(changed ? mapped : children);
  if (!changed && normalized === children) return node;
  return { ...node, children: normalized };
}

/**
 * The same rule over a serialized Lexical document (`{ root }`): returns a
 * document whose format boundaries all export as readable markdown. The input
 * is not modified; an already-safe document is returned as is.
 */
export function normalizeFormatBoundaries<T>(document: T): T {
  if (!isRecord(document) || !isRecord(document.root)) return document;
  const root = normalizeNode(document.root);
  return root === document.root ? document : ({ ...document, root } as T);
}

// ── Import: repair what was already saved ──────────────────────────────────

// Longest first, so `***` is never read as `**` + `*`.
const DELIMITERS = ["***", "**", "~~", "==", "++", "*"] as const;

const escapeRe = (s: string) => s.replace(/[*+=~]/g, "\\$&");

function spanPattern(delim: string): RegExp {
  const c = escapeRe(delim[0]!);
  const d = escapeRe(delim);
  // An unescaped run of exactly this delimiter, text without the delimiter
  // character, and the same run again.
  return new RegExp(`(?<![\\\\${c}])${d}(?!${c})([^${c}\\n]+?)(?<![\\\\${c}])${d}(?!${c})`, "g");
}

const SPANS = DELIMITERS.map((delim) => ({ delim, re: spanPattern(delim) }));

/** `[start, end)` ranges of inline code on a line — never rewritten. */
function codeRanges(line: string): [number, number][] {
  const out: [number, number][] = [];
  // A span of N backticks closes at the next run of exactly N.
  const re = /(`+)(?!`).*?(?<!`)\1(?!`)/g;
  for (let m = re.exec(line); m; m = re.exec(line)) out.push([m.index, m.index + m[0].length]);
  return out;
}

function repairLine(line: string): string {
  if (!/[*~=+]/.test(line)) return line;
  let out = line;
  for (const { delim, re } of SPANS) {
    const code = codeRanges(out);
    out = out.replace(re, (whole: string, content: string, at: number, src: string) => {
      if (code.some(([s, e]) => at < e && at + whole.length > s)) return whole;
      if (WHITESPACE.test(content[0]!) || WHITESPACE.test(content[content.length - 1]!)) return whole;
      const before = kindOf(src[at - 1]);
      const after = kindOf(src[at + whole.length]);
      const opens = canOpen(before, kindOf(content[0]));
      const closes = canClose(kindOf(content[content.length - 1]), after);
      if (opens && closes) return whole;
      // A single `*` between letters is as likely a literal (`a*(b)*c`): only
      // repair it at a word boundary, the shape Lexical's writer produces.
      if (delim === "*" && !opens && !closes) return whole;
      if (delim === "*" && ((!closes && before === "word") || (!opens && after === "word"))) return whole;

      // One mark out is enough, as on export.
      let lead = "";
      let body = content;
      let trail = "";
      if (!closes) {
        if (kindOf(body[body.length - 1]) !== "punct") return whole;
        trail = body[body.length - 1]!;
        body = body.slice(0, -1);
      }
      if (!opens) {
        if (!body || kindOf(body[0]) !== "punct") return whole;
        lead = body[0]!;
        body = body.slice(1);
      }
      if (!body) return lead + trail;
      const fixed = canOpen(lead ? kindOf(lead[lead.length - 1]) : before, kindOf(body[0]))
        && canClose(kindOf(body[body.length - 1]), trail ? kindOf(trail[0]) : after);
      return fixed ? `${lead}${delim}${body}${delim}${trail}` : whole;
    });
  }
  return out;
}

/**
 * Rewrites formatting spans that Lexical's own writer produced but its reader
 * rejects (`**Mix:**60g` → `**Mix**:60g`), so markdown saved before this rule
 * existed opens as the formatting it was written with. Fenced and inline code
 * are left alone; well-formed input comes back unchanged.
 */
export function repairEmphasis(markdown: string): string {
  if (!/[*~=+]/.test(markdown)) return markdown;
  const lines = markdown.split("\n");
  let fence: string | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const open = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
    if (fence) {
      if (open && open[1]![0] === fence[0] && open[1]!.length >= fence.length) fence = null;
      continue;
    }
    if (open) {
      fence = open[1]!;
      continue;
    }
    lines[i] = repairLine(line);
  }
  return lines.join("\n");
}
