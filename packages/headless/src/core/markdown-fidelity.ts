/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/*
 * Lossless text through the markdown bridge.
 *
 * A host that stores markdown re-imports the editor's own output on every
 * open, so anything the exporter writes that the importer reads differently is
 * corrupted a little more each time. Lexical's markdown layer has several such
 * gaps, all of them things a person types:
 *
 * - Blank lines. An empty paragraph exports as nothing (one is always swallowed
 *   by the block separator) and the importer drops every empty line, so a
 *   blank line between two blocks vanished on reopen.
 * - Empty lines inside a paragraph (Shift+Enter twice, or at the end): the
 *   double newline reads back as a paragraph break, the trailing one is trimmed.
 * - Literal text that looks like syntax at the start of a line — "1. ", "- ",
 *   "# ", "> ", "| ", "---", "[ ] " — typed, pasted or left behind by undoing an
 *   autoformat, reopened as a list, heading, quote or table (a lone "| a |" row
 *   even imported as nothing at all). "[text](url)" typed as text became a
 *   link, and a typed "&#35;" became "#".
 * - Trailing spaces, trimmed on import — so the note changed on its second save.
 * - Inline code holding a backtick or edge spaces, and code blocks holding a
 *   ``` line, which the single-length fences Lexical writes can't enclose.
 * - Escapes inside bold/italic, which Lexical's importer decodes twice.
 *
 * Each is written as plain CommonMark any other renderer shows the same way —
 * extra blank lines, numeric character references, longer code fences — so the
 * .md file stays readable and portable. Export encodes on the Lexical JSON
 * (where the structure is still known) through private-use sentinels, then
 * turns the sentinels into markdown. Import turns those markdown forms back
 * into sentinels before Lexical parses (so it can't misread or double-decode
 * them) and restores the text afterwards.
 */

type Json = Record<string, unknown>;

// Private-use sentinels (U+F7xx; the bridge's code-whitespace guard uses U+E000/1).
const BLANK_BLOCK = ""; // a top-level empty paragraph
const BLANK_LINE = ""; // an empty line inside a paragraph
const CODE_TICK = ""; // a backtick inside code
const CODE_SPACE = ""; // an edge space inside inline code

const BLANK_LINE_REF = "&#8203;";

// Characters that are written as numeric references when they would otherwise
// be read as syntax. Sentinel ↔ character ↔ reference.
const ESCAPES: [sentinel: string, char: string, reference: string][] = [
  ["", "#", "&#35;"],
  ["", ".", "&#46;"],
  ["", ")", "&#41;"],
  ["", "-", "&#45;"],
  ["", "+", "&#43;"],
  ["", ">", "&#62;"],
  ["", "|", "&#124;"],
  ["", "[", "&#91;"],
  ["", "&", "&#38;"],
  ["", " ", "&#32;"],
  ["", "\t", "&#9;"],
  ["", "\\", "&#92;"],
];
const SENTINEL_FOR = new Map(ESCAPES.map(([sentinel, char]) => [char, sentinel]));
const CHAR_FOR = new Map(ESCAPES.map(([sentinel, char]) => [sentinel, char]));
const REFERENCE_FOR = new Map(ESCAPES.map(([sentinel, , reference]) => [sentinel, reference]));
const SENTINEL_FOR_REFERENCE = new Map(ESCAPES.map(([sentinel, , reference]) => [reference, sentinel]));
const esc = (char: string): string => SENTINEL_FOR.get(char) ?? char;

const ZERO_WIDTH_SPACE = "​";
const CODE_FORMAT = 16;

const isRecord = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const childrenOf = (node: Json): unknown[] =>
  Array.isArray(node.children) ? (node.children as unknown[]) : [];

const isText = (node: unknown): node is Json & { text: string } =>
  isRecord(node) && node.type === "text" && typeof node.text === "string";

const isLineBreak = (node: unknown): boolean => isRecord(node) && node.type === "linebreak";

const isCode = (node: Json): boolean =>
  typeof node.format === "number" && (node.format & CODE_FORMAT) !== 0;

const isPlain = (node: Json): boolean => !node.format;

const textNode = (text: string): Json => ({
  type: "text", version: 1, text, format: 0, detail: 0, mode: "normal", style: "",
});

// Nodes that hold blocks rather than text. Everything else with children (a
// link, a wikilink…) is part of the line it sits on.
const BLOCK_TYPES = new Set([
  "paragraph", "heading", "quote", "list", "listitem", "table", "tablerow", "tablecell",
  "code", "collapsible-container", "collapsible-content", "layout-container", "layout-item",
]);
const isBlock = (node: unknown): node is Json => isRecord(node) && BLOCK_TYPES.has(String(node.type));

/** A paragraph that renders as nothing: no children, or only whitespace text. */
function isBlankParagraph(node: unknown): boolean {
  if (!isRecord(node) || node.type !== "paragraph") return false;
  return childrenOf(node).every((child) => isText(child) && child.text.trim() === "");
}

// ── Export: JSON ────────────────────────────────────────────────────────────

// Line-start text that the importer would read as block syntax. Group 2 is
// the character to neutralise, after the leading part in group 1.
const PARAGRAPH_LINE_START: RegExp[] = [
  /^( {0,3})(#)(?=#{0,5}(?:[ \t]|$))/, // heading
  /^( {0,3}\d{1,9})([.)])(?=[ \t]|$)/, // ordered list
  /^( {0,3})([-+])(?=[ \t]|$)/, // bullet list
  /^( {0,3})(-)(?=(?:[ \t]*-){2,}[ \t]*$)/, // thematic break "---"
  /^( {0,3})(>)/, // quote
  /^( {0,3})(\|)/, // table row
  /^( {0,3})(\[)(?=[ xX]\](?:[ \t]|$))/, // checklist "[ ] "
];
// A list item's own text is only re-read as a checkbox.
const LIST_ITEM_START: RegExp[] = [/^( {0,3})(\[)(?=[ xX]\](?:[ \t]|$))/];

function escapeLineStart(text: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) {
      const [whole, lead = "", char = ""] = match;
      return lead + esc(char) + text.slice(whole.length);
    }
  }
  return text;
}

/** Text that must not be read back as a link, an image or a character reference. */
function escapeInline(text: string, formatted: boolean): string {
  let out = text
    .replace(/&(?=#)/g, esc("&"))
    .replace(/\[(?=[^\]\n]*\]\()/g, esc("["));
  // Lexical decodes escapes inside bold/italic twice; a reference survives.
  if (formatted) out = out.replace(/\\/g, esc("\\"));
  return out;
}

// Whitespace at the end of a line is invisible, and the importer trims it — so
// it is dropped on export, and a saved note reads back identical (and saves
// identically again) instead of losing it one save later.
function trimLineEnd(text: string): string {
  return text.replace(/[ \t]+$/, "");
}

function encodeInlineCode(value: string): string {
  let out = value.replace(/`/g, CODE_TICK);
  // CommonMark strips one space from each side of a padded span; Lexical
  // writes edge spaces as references it then can't read inside code.
  const lead = /^ +/.exec(out)?.[0].length ?? 0;
  const tail = /(?<! ) +$/.test(out) && out.trim() !== "" ? (/ +$/.exec(out)?.[0].length ?? 0) : 0;
  if (lead || tail) out = CODE_SPACE.repeat(lead) + out.slice(lead, out.length - tail) + CODE_SPACE.repeat(tail);
  return out;
}

/** Encode one element's inline children (a paragraph, heading, list item, quote). */
function encodeInline(node: Json, lineStart: RegExp[] | null): void {
  const children = childrenOf(node);
  if (children.length === 0) return;

  // An empty line inside a paragraph (a break at the very start, at the very
  // end, or two in a row) gets a placeholder so it survives as a line. A quote
  // already writes its empty lines as "> ".
  const emptyLines = node.type === "paragraph";
  const withLines: unknown[] = [];
  children.forEach((child, index) => {
    if (emptyLines && isLineBreak(child) && index === 0) withLines.push(textNode(BLANK_LINE));
    withLines.push(child);
    if (emptyLines && isLineBreak(child)) {
      const next = children[index + 1];
      if (next === undefined || isLineBreak(next)) withLines.push(textNode(BLANK_LINE));
    }
  });

  // Whitespace at the edges of a bold/italic/struck run moves outside it:
  // "**bold **line" is what a person means by "**bold** line", and a marker
  // can't hug a space (Lexical wrote "**bold&#32;**" instead).
  const hoisted: unknown[] = [];
  for (const child of withLines) {
    if (isText(child) && !isPlain(child) && !isCode(child) && child.text !== child.text.trim()) {
      const core = child.text.trim();
      const lead = child.text.slice(0, child.text.length - child.text.trimStart().length);
      const tail = child.text.slice(child.text.trimEnd().length);
      if (!core) {
        hoisted.push({ ...child, format: 0, text: child.text });
        continue;
      }
      if (lead) hoisted.push({ ...child, format: 0, style: "", text: lead });
      hoisted.push({ ...child, text: core });
      if (tail) hoisted.push({ ...child, format: 0, style: "", text: tail });
      continue;
    }
    hoisted.push(child);
  }
  withLines.splice(0, withLines.length, ...hoisted);

  withLines.forEach((child, index) => {
    if (!isText(child) || child.text === BLANK_LINE) return;
    if (isCode(child)) {
      child.text = encodeInlineCode(child.text);
      return;
    }
    const startsLine = index === 0 || isLineBreak(withLines[index - 1]);
    const endsLine = index === withLines.length - 1 || isLineBreak(withLines[index + 1]);
    let text = escapeInline(child.text, !isPlain(child));
    if (startsLine && lineStart && isPlain(child)) text = escapeLineStart(text, lineStart);
    if (endsLine && isPlain(child)) text = trimLineEnd(text);
    child.text = text;
  });

  node.children = withLines;
}

function encodeCodeBlock(node: Json): void {
  for (const child of childrenOf(node)) {
    // A line that is (or ends in) a fence would close the block early.
    if (isText(child) && /(^|\n)[ \t]*`{3,}|`{3,}[ \t]*(\n|$)/.test(child.text)) {
      child.text = child.text.replace(/`/g, CODE_TICK);
    }
  }
}

function encodeElement(node: Json, lineStart: RegExp[] | null): void {
  if (node.type === "code") {
    encodeCodeBlock(node);
    return;
  }
  const kids = childrenOf(node);
  if (!kids.some(isBlock)) {
    encodeInline(node, lineStart);
    return;
  }
  for (const child of kids) {
    if (isBlock(child)) encodeElement(child, child.type === "listitem" ? LIST_ITEM_START : null);
  }
  // Mixed text + nested blocks (a list item holding its text and a sub-list):
  // the text run is encoded in place; block children pass through untouched.
  if (kids.some((child) => !isBlock(child))) encodeInline(node, node.type === "listitem" ? LIST_ITEM_START : null);
}

/**
 * Export side, on the JSON: mark what markdown can't otherwise hold. Returns a
 * new document; the input is not modified.
 */
export function encodeDocumentForMarkdownExport<T>(document: T): T {
  if (!isRecord(document) || !isRecord(document.root)) return document;
  const copy = JSON.parse(JSON.stringify(document)) as Json;
  const root = copy.root as Json;
  root.children = childrenOf(root).map((child) => {
    if (isBlankParagraph(child)) {
      return { ...(child as Json), children: [textNode(BLANK_BLOCK)] };
    }
    if (isRecord(child) && Array.isArray(child.children)) {
      encodeElement(child, child.type === "paragraph" ? PARAGRAPH_LINE_START : null);
    }
    return child;
  });
  return copy as T;
}

// ── Export: markdown ────────────────────────────────────────────────────────

function longestTickRun(value: string): number {
  return Math.max(0, ...(value.match(/`+/g) ?? []).map((run) => run.length));
}

/** Code blocks holding fence lines get a fence longer than any inside them. */
function finalizeCodeBlocks(md: string): string {
  if (!md.includes(CODE_TICK)) return md;
  const lines = md.split("\n");
  for (let open = 0; open < lines.length; open++) {
    const opener = /^([ \t]*)```(.*)$/.exec(lines[open] ?? "");
    if (!opener) continue;
    let close = open + 1;
    while (close < lines.length && (lines[close] ?? "").trim() !== "```") close++;
    if (close >= lines.length) break;
    const body = lines.slice(open + 1, close);
    if (body.some((line) => line.includes(CODE_TICK))) {
      const restored = body.map((line) => line.split(CODE_TICK).join("`"));
      const fence = "`".repeat(Math.max(3, longestTickRun(restored.join("\n")) + 1));
      lines[open] = `${opener[1] ?? ""}${fence}${opener[2] ?? ""}`;
      restored.forEach((line, i) => { lines[open + 1 + i] = line; });
      lines[close] = `${opener[1] ?? ""}${fence}`;
    }
    open = close;
  }
  return lines.join("\n");
}

/** Export side, on the markdown Lexical produced: turn sentinels into markdown. */
export function finalizeExportedMarkdown(markdown: string): string {
  let md = markdown;

  if (md.includes(BLANK_BLOCK)) {
    const blankOnly = new RegExp(`^(?:${BLANK_BLOCK}(?:\\n\\n|$))+$`);
    if (blankOnly.test(md)) {
      md = "";
    } else {
      // k blank blocks between two blocks → k extra blank lines after the usual
      // one; k leading → k leading newlines; k trailing → a newline plus k more.
      const leading = new RegExp(`^(?:${BLANK_BLOCK}\\n\\n)+`).exec(md);
      if (leading) md = "\n".repeat(leading[0].length / 3) + md.slice(leading[0].length);
      const trailing = new RegExp(`\\n\\n${BLANK_BLOCK}$`).test(md);
      md = md.replace(new RegExp(`\\n\\n${BLANK_BLOCK}(?=\\n\\n|$)`, "g"), "\n");
      if (trailing) md += "\n";
    }
  }

  md = md.split(BLANK_LINE).join(BLANK_LINE_REF);
  md = finalizeCodeBlocks(md);

  if (md.includes(CODE_TICK) || md.includes(CODE_SPACE)) {
    // Inline code holding backticks or edge spaces: fenced by a run longer than
    // any inside it, padded with one space each side (CommonMark strips them).
    md = md.replace(new RegExp(`\`([^\`\\n]*[${CODE_TICK}${CODE_SPACE}][^\`\\n]*)\``, "g"), (_, inner: string) => {
      const content = inner.split(CODE_TICK).join("`").split(CODE_SPACE).join(" ");
      const fence = "`".repeat(longestTickRun(content) + 1);
      return `${fence} ${content} ${fence}`;
    });
  }

  // Lexical writes a space that touches an emphasis marker as "&#32;"
  // ("a&#32;**b**"). Between two visible characters a plain space reads the
  // same, so the file gets the readable form. Code spans are left alone.
  if (md.includes("&#32;")) {
    md = md.split("\n").map((line) => line.split(/(`+[^`]*`+)/).map((part, i) =>
      i % 2 === 1 ? part : part.replace(/(?<=\S)&#32;(?=\S)/g, " ")).join("")).join("\n");
  }

  for (const [sentinel, reference] of REFERENCE_FOR) {
    if (md.includes(sentinel)) md = md.split(sentinel).join(reference);
  }
  return md;
}

// ── Import: markdown ────────────────────────────────────────────────────────

const FENCE = /^( {0,3})(`{3,}|~{3,})(.*)$/;

/**
 * Our references become sentinels before Lexical parses (so "&#35; x" can't be
 * re-read as a heading and nothing is decoded twice); code spans are left as
 * written.
 */
function sentinelsForReferences(segment: string): string {
  if (!segment.includes("&#")) return segment;
  return segment.replace(/&#(?:\d+|x[0-9a-fA-F]+);/g, (reference) => {
    if (reference === BLANK_LINE_REF) return BLANK_LINE;
    return SENTINEL_FOR_REFERENCE.get(reference) ?? reference;
  });
}

/**
 * Code spans of two or more backticks (which Lexical can't read) become
 * single-backtick spans holding sentinels; references outside code become
 * sentinels. CommonMark: a run of N backticks closes at the next run of N.
 */
function encodeLine(line: string): string {
  if (!line.includes("`")) return sentinelsForReferences(line);
  let out = "";
  let plain = "";
  let i = 0;
  const flush = () => { out += sentinelsForReferences(plain); plain = ""; };
  while (i < line.length) {
    if (line[i] !== "`") {
      plain += line[i];
      i++;
      continue;
    }
    let n = 0;
    while (line[i + n] === "`") n++;
    let close = -1;
    for (let j = i + n; j < line.length;) {
      if (line[j] !== "`") { j++; continue; }
      let m = 0;
      while (line[j + m] === "`") m++;
      if (m === n) { close = j; break; }
      j += m;
    }
    if (close < 0) {
      plain += line.slice(i, i + n);
      i += n;
      continue;
    }
    flush();
    let inner = line.slice(i + n, close);
    const padded = inner.length > 1 && inner.startsWith(" ") && inner.endsWith(" ") && inner.trim() !== "";
    if (padded) inner = inner.slice(1, -1);
    if (n >= 2 || padded) {
      const lead = /^ +/.exec(inner)?.[0].length ?? 0;
      const tail = inner.trim() === "" ? 0 : (/ +$/.exec(inner)?.[0].length ?? 0);
      const body = inner.slice(lead, inner.length - tail).split("`").join(CODE_TICK);
      out += `\`${CODE_SPACE.repeat(lead)}${body}${CODE_SPACE.repeat(tail)}\``;
    } else {
      out += line.slice(i, close + n);
    }
    i = close + n;
  }
  flush();
  return out;
}

/**
 * Import side, on the markdown: blank-line runs become placeholder paragraphs
 * the importer keeps; long code fences become ones it reads; our references
 * become sentinels. Code content is left as written.
 */
export function encodeMarkdownForImport(markdown: string): string {
  const lines = markdown.split("\n");
  const blank = (line: string | undefined) => line !== undefined && line.trim() === "";

  let first = 0;
  while (first < lines.length && blank(lines[first])) first++;
  if (first === lines.length) return "";
  let last = lines.length - 1;
  while (last > first && blank(lines[last])) last--;

  const out: string[] = [];
  for (let i = 0; i < first; i++) out.push(BLANK_BLOCK, "");

  for (let i = first; i <= last; i++) {
    const line = lines[i] ?? "";
    const opener = FENCE.exec(line);
    if (opener) {
      const [, indent = "", marker = "", info = ""] = opener;
      let close = i + 1;
      while (close < lines.length) {
        const candidate = FENCE.exec(lines[close] ?? "");
        if (candidate && candidate[2]?.[0] === marker[0] && (candidate[2]?.length ?? 0) >= marker.length
          && (candidate[3] ?? "").trim() === "") break;
        close++;
      }
      if (close >= lines.length) {
        // Unclosed: CommonMark runs it to the end; leave it for the importer.
        for (let k = i; k < lines.length; k++) out.push(lines[k] ?? "");
        break;
      }
      const body = lines.slice(i + 1, close);
      if (marker === "```") {
        out.push(line, ...body, lines[close] ?? "");
      } else {
        // A longer (or tilde) fence: the importer only knows ```, so the fence is
        // normalised and backticks inside are held by a sentinel.
        out.push(`${indent}\`\`\`${info.trim()}`, ...body.map((l) => l.split("`").join(CODE_TICK)), `${indent}\`\`\``);
      }
      i = close;
      continue;
    }
    if (blank(line)) {
      let run = 0;
      while (i + run <= last && blank(lines[i + run])) run++;
      out.push("");
      for (let k = 1; k < run; k++) out.push(BLANK_BLOCK, "");
      i += run - 1;
      continue;
    }
    out.push(encodeLine(line));
  }

  const trailingNewlines = lines.length - 1 - last;
  for (let k = 1; k < trailingNewlines; k++) out.push("", BLANK_BLOCK);
  return out.join("\n");
}

// ── Import: JSON ────────────────────────────────────────────────────────────

function restoreText(value: string): string {
  let out = value;
  if (out.includes(CODE_TICK)) out = out.split(CODE_TICK).join("`");
  if (out.includes(CODE_SPACE)) out = out.split(CODE_SPACE).join(" ");
  if (/[-]/.test(out)) out = out.replace(/[-]/g, (s) => CHAR_FOR.get(s) ?? s);
  return out;
}

function restoreNode(node: Json): void {
  if (node.type === "code") {
    for (const child of childrenOf(node)) {
      if (isText(child)) child.text = restoreText(child.text);
    }
    return;
  }
  const kids = childrenOf(node);
  const kept: unknown[] = [];
  kids.forEach((child, index) => {
    if (isText(child)) {
      // A line that held only the empty-line placeholder: drop the placeholder,
      // keep the line break(s) around it.
      const alone = (index === 0 || isLineBreak(kids[index - 1]))
        && (index === kids.length - 1 || isLineBreak(kids[index + 1]));
      if (alone && (child.text === BLANK_LINE || child.text === ZERO_WIDTH_SPACE)) return;
      child.text = restoreText(child.text);
    }
    if (isRecord(child) && Array.isArray(child.children)) restoreNode(child);
    kept.push(child);
  });
  node.children = kept;
}

/** Import side, on the JSON the importer produced: undo the placeholders. */
export function restoreDocumentAfterMarkdownImport<T>(document: T): T {
  if (!isRecord(document) || !isRecord(document.root)) return document;
  const root = document.root as Json;
  const restored = childrenOf(root).map((child) => {
    if (isRecord(child) && child.type === "paragraph") {
      const kids = childrenOf(child);
      if (kids.length === 1 && isText(kids[0]) && kids[0].text === BLANK_BLOCK) {
        return { ...child, children: [] };
      }
    }
    if (isRecord(child) && Array.isArray(child.children)) restoreNode(child);
    return child;
  });
  // The editor refuses an empty root; a document with nothing importable is
  // one empty paragraph, never a crash.
  root.children = restored.length > 0 ? restored : [{
    type: "paragraph", version: 1, format: "", indent: 0, direction: null,
    textFormat: 0, textStyle: "", children: [],
  }];
  return document;
}
