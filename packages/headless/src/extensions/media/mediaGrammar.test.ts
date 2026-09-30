/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { describe, expect, it } from "vitest";
import {
  classifyMedia,
  formatEmbedTarget,
  formatMediaDirectives,
  formatSize,
  isFileTarget,
  parseEmbedTarget,
  parseMediaDirectives,
  splitCaptionAndSize,
  type EmbedTarget,
} from "./mediaGrammar";

describe("parseEmbedTarget", () => {
  it.each([
    ["a.png", { target: "a.png", fragment: "", extra: [] }],
    ["a.png|300", { target: "a.png", width: 300 }],
    ["a.png|300x200", { target: "a.png", width: 300, height: 200 }],
    ["a.png|Sunset", { target: "a.png", alt: "Sunset" }],
    ["a.png|Sunset|300", { target: "a.png", alt: "Sunset", width: 300 }],
    ["a.png|300|Sunset", { target: "a.png", alt: "Sunset", width: 300 }],
    ["doc.pdf#page=3", { target: "doc.pdf", fragment: "page=3" }],
    ["doc.pdf#page=3|Report", { target: "doc.pdf", fragment: "page=3", alt: "Report" }],
    ["a.png|0", { target: "a.png", alt: "0" }],
    ["a.png|99999", { target: "a.png", alt: "99999" }],
    ["a.png|16384", { target: "a.png", width: 16384 }],
    ["a.png|300x0", { target: "a.png", alt: "300x0" }],
    ["a.png|12|34", { target: "a.png", alt: "12", width: 34 }],
    ["a.png\\|40", { target: "a.png", width: 40, escapedPipes: true }],
  ])("%s", (inner, expected) => {
    expect(parseEmbedTarget(inner)).toMatchObject(expected);
  });

  it("keeps unknown segments in order", () => {
    expect(parseEmbedTarget("a.png|Alt|one|two|300")).toMatchObject({
      alt: "Alt",
      extra: ["one", "two"],
      width: 300,
    });
  });
});

describe("formatEmbedTarget", () => {
  it("puts the size last and keeps an escaped table pipe", () => {
    expect(formatEmbedTarget({ target: "a.png", fragment: "", alt: "Alt", width: 300, extra: [], escapedPipes: false })).toBe("a.png|Alt|300");
    expect(formatEmbedTarget({ target: "a.png", fragment: "", width: 40, extra: [], escapedPipes: true })).toBe("a.png\\|40");
  });

  it("never lets an alt break the embed", () => {
    expect(formatEmbedTarget({ target: "a.png", fragment: "", alt: "x|y]]z\nq", extra: [], escapedPipes: false })).toBe("a.png|x y z q");
  });
});

describe("formatSize", () => {
  it.each([
    [undefined, undefined, ""],
    [0, undefined, ""],
    [300.4, undefined, "300"],
    [300, 199.6, "300x200"],
    [99999, 99999, "16384x16384"],
  ])("%s × %s → %s", (w, h, out) => expect(formatSize(w, h)).toBe(out));
});

describe("directives", () => {
  it("parses align and caption, keeps unknown ones verbatim", () => {
    expect(parseMediaDirectives(" <!-- align:center --> <!-- caption:Hi &amp; bye --> <!-- foo:bar -->")).toEqual({
      align: "center",
      caption: "Hi & bye",
      unknown: ["<!-- foo:bar -->"],
    });
  });

  it("refuses a line with anything other than comments after the embed", () => {
    expect(parseMediaDirectives("<!-- align:center --> text")).toBeNull();
    expect(parseMediaDirectives("text")).toBeNull();
  });

  it("keeps an alignment it doesn't know verbatim rather than inventing one", () => {
    expect(parseMediaDirectives("<!-- align:justify -->")).toEqual({ unknown: ["<!-- align:justify -->"] });
  });

  it("encodes a caption so it can never close the comment early", () => {
    const text = formatMediaDirectives({ caption: "a --> b <c> & d\nnext", unknown: [] });
    expect(text).toBe(" <!-- caption:a --&gt; b &lt;c&gt; &amp; d next -->");
    expect(parseMediaDirectives(text)?.caption).toBe("a --> b <c> & d next");
  });
});

describe("splitCaptionAndSize", () => {
  it.each([
    [undefined, { caption: "" }],
    ["My talk", { caption: "My talk" }],
    ["800x450", { caption: "", width: 800, height: 450 }],
    ["My talk|800x450", { caption: "My talk", width: 800, height: 450 }],
    ["a|b", { caption: "a|b" }],
  ])("%s", (rest, expected) => expect(splitCaptionAndSize(rest)).toEqual(expected));
});

describe("classification", () => {
  it.each([
    ["a.PNG", "image"],
    ["b.heic", "image"],
    ["c.mov", "video"],
    ["d.opus", "audio"],
    ["e.pdf", "pdf"],
    ["f.docx", "file"],
    ["My Note", "file"],
  ])("%s → %s", (target, kind) => expect(classifyMedia(target)).toBe(kind));

  it("tells file targets from note targets", () => {
    expect(isFileTarget("a.png")).toBe(true);
    expect(isFileTarget("archive.tar.gz")).toBe(true);
    expect(isFileTarget("My Note")).toBe(false);
    expect(isFileTarget("youtube:https://x.y/z.mp4")).toBe(false);
  });
});

// ── Fuzz: format → parse is the identity on anything the grammar can produce ──

function rng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

const ALPHABET = "abcXYZ019 -_.()#&<>é漢|]\\\n";

function word(next: () => number, max = 12): string {
  const length = Math.floor(next() * max);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[Math.floor(next() * ALPHABET.length)];
  return out;
}

describe("fuzz", () => {
  it("parse(format(x)) keeps every field (2000 random embeds)", () => {
    const next = rng(20260930);
    for (let i = 0; i < 2000; i++) {
      const value: EmbedTarget = {
        target: (word(next).replace(/[|#\]\\\n]/g, "") || "f") + ".png",
        fragment: next() < 0.3 ? word(next).replace(/[|\]\\\n]/g, "").trim() : "",
        alt: next() < 0.5 ? word(next) : undefined,
        width: next() < 0.6 ? 1 + Math.floor(next() * 5000) : undefined,
        height: undefined,
        extra: [],
        escapedPipes: next() < 0.2,
      };
      if (value.width && next() < 0.5) value.height = 1 + Math.floor(next() * 5000);
      const formatted = formatEmbedTarget(value);
      const parsed = parseEmbedTarget(formatted);
      const sanitizedAlt =
        value.alt?.replace(/[|\]\r\n]+/g, " ").replace(/[\s\\]+$/, "").trim() || undefined;
      expect(parsed.target, formatted).toBe(value.target.trim());
      expect(parsed.fragment, formatted).toBe(value.fragment);
      // An alt that itself reads as a size (`|9`) is indistinguishable from one —
      // Obsidian's own ambiguity, with no escape. Everything else must survive.
      if (sanitizedAlt && /^\d{1,5}(x\d{1,5})?$/.test(sanitizedAlt)) continue;
      expect(parsed.width, formatted).toBe(value.width);
      expect(parsed.height, formatted).toBe(value.width ? value.height : undefined);
      expect(parsed.alt, formatted).toBe(sanitizedAlt);
      // …and formatting what was parsed is stable.
      expect(formatEmbedTarget(parsed)).toBe(formatEmbedTarget(parseEmbedTarget(formatEmbedTarget(parsed))));
    }
  });

  it("parse never throws on arbitrary input (5000 random strings)", () => {
    const next = rng(7);
    for (let i = 0; i < 5000; i++) {
      const input = word(next, 40);
      expect(() => parseEmbedTarget(input)).not.toThrow();
      expect(() => parseMediaDirectives(input)).not.toThrow();
      expect(() => splitCaptionAndSize(input)).not.toThrow();
    }
  });

  it("captions survive any text (1000 random captions)", () => {
    const next = rng(99);
    for (let i = 0; i < 1000; i++) {
      const caption = word(next, 30);
      const parsed = parseMediaDirectives(formatMediaDirectives({ caption, unknown: [] }));
      const expected = caption.replace(/[\r\n]+/g, " ").trim();
      expect(parsed?.caption ?? "", JSON.stringify(caption)).toBe(expected);
    }
  });
});
