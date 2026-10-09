/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/*
 * The media golden corpus: every way a note can embed media, through the exact
 * pipelines Papyra uses — the collaboration server's (papyraMarkdownToJSON →
 * papyraJSONToMarkdown) and the browser editor's (setMarkdown → getMarkdown).
 *
 * The rule under test is the one that keeps notes safe: opening and saving a
 * note never rewrites an embed nobody touched. Only an actual edit (a resize, a
 * caption, an alignment) changes its text, and then to the canonical form.
 */

import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  $isFileEmbedNode,
  $isYouTubeEmbedNode,
  FileEmbedNode,
} from "@lyfie/luthor-headless";
import { $getRoot, $isElementNode, createEditor, type LexicalNode } from "lexical";

const $isImageNode = (node: LexicalNode) => node.getType() === "image";

vi.hoisted(() => {
  const win = globalThis as {
    InputEvent?: { prototype: { getTargetRanges?: () => StaticRange[] } };
  };
  if (win.InputEvent && !win.InputEvent.prototype.getTargetRanges) {
    win.InputEvent.prototype.getTargetRanges = () => [];
  }
});

import { PapyraEditor, type PapyraEditorRef } from "./PapyraEditor";
import {
  getPapyraCollabNodes,
  papyraJSONToMarkdown,
  papyraMarkdownToJSON,
} from "../papyra-collab";

const UNCHANGED: [string, string][] = [
  // ── Block file embeds ──
  ["plain", "![[a.png]]"],
  ["width", "![[a.png|300]]"],
  ["box", "![[a.png|300x200]]"],
  ["alt", "![[a.png|Alt]]"],
  ["alt + width", "![[a.png|Alt|300]]"],
  ["width + alt (non-canonical order)", "![[a.png|300|Alt]]"],
  ["padded alt", "![[a.png| spaced alt |300]]"],
  ["empty alt segment", "![[a.png||300]]"],
  ["aligned", "![[a.png|300]] <!-- align:center -->"],
  ["aligned + captioned", "![[a.png|300]] <!-- align:center --> <!-- caption:Dusk over the bay -->"],
  ["directives out of order", "![[a.png]] <!-- caption:Hi --> <!-- align:right -->"],
  ["unknown directive", "![[a.png]] <!-- foo:bar -->"],
  ["odd directive spacing", "![[a.png]]   <!--align:left-->"],
  ["pdf page", "![[a.pdf#page=3]]"],
  ["pdf page + alias", "![[a.pdf#page=3|Report]]"],
  ["docx", "![[doc.docx]]"],
  ["zip", "![[x.zip]]"],
  ["video box", "![[clip.mp4|640x360]]"],
  ["audio", "![[song.mp3]]"],
  ["spaces and parens", "![[my photo (1).png]]"],
  ["unicode name", "![[фото-снимок.png]]"],
  ["upper-case name", "![[A.PNG]]"],
  ["folder path", "![[attachments/sub/deep.png]]"],
  ["note embed", "![[My Note]]"],
  ["heading embed", "![[Note#Heading]]"],
  ["transclusion", "![[Note#^abcd1234]]"],
  ["oversize number is an alias", "![[a.png|999999]]"],
  // ── Inline ──
  ["mid-paragraph", "before ![[inline.gif]] after"],
  ["two inline", "two ![[a.png]] ![[b.png|40]] inline"],
  ["in a list item", "- item ![[a.png]]"],
  ["in a quote", "> quote ![[a.png]]"],
  ["in an ordered list", "1. step ![[a.png|120]]"],
  ["note embed mid-text stays text", "text ![[My Note]] text"],
  ["next to formatting", "**bold** ![[a.png]] *it*"],
  ["next to a wikilink", "see [[Other note]] and ![[a.png]]"],
  ["embed then text", "![[a.png]] trailing text"],
  ["in a heading", "# Title ![[a.png]]"],
  // Table cells import as plain text (as wikilinks there do); an Obsidian-style
  // escaped pipe must come back untouched.
  ["in a table cell", "| pic | note |\n| --- | --- |\n| ![[a.png\\|40]] | x |"],
  // ── Other embeds ──
  ["youtube", "![[youtube:https://www.youtube-nocookie.com/embed/abc123]]"],
  ["youtube caption", "![[youtube:https://www.youtube-nocookie.com/embed/abc123|My talk]]"],
  ["youtube caption + size", "![[youtube:https://www.youtube-nocookie.com/embed/abc123|My talk|800x450]]"],
  ["youtube size", "![[youtube:https://www.youtube-nocookie.com/embed/abc123|800x450]]"],
  ["iframe", "![[iframe:https://example.com/page]]"],
  ["iframe caption + size", "![[iframe:https://example.com/page|Docs|800x600]]"],
  ["saved card", "![[card:https://example.com/]]"],
  // Alignment on every kind of embed survives a save and reopen.
  ["iframe aligned right", "![[iframe:https://example.com/page]] <!-- align:right -->"],
  ["iframe aligned left, captioned and sized", "![[iframe:https://example.com/page|Map|800x450]] <!-- align:left -->"],
  ["iframe keeps a directive it doesn't own", "![[iframe:https://example.com/page]] <!-- align:right --> <!-- foo:bar -->"],
  ["youtube aligned right", "![[youtube:https://www.youtube-nocookie.com/embed/abc123]] <!-- align:right -->"],
  ["youtube aligned left + caption", "![[youtube:https://www.youtube-nocookie.com/embed/abc123|Talk]] <!-- align:left -->"],
  ["pdf aligned right", "![[a.pdf]] <!-- align:right -->"],
  ["video aligned left", "![[clip.mp4|640x360]] <!-- align:left -->"],
  ["link image aligned centre", "![](https://media.example.com/party.gif) <!-- align:center -->"],
  ["link image aligned right", "![alt|240](https://media.example.com/party.gif) <!-- align:right -->"],
  ["link image aligned left + caption", "![alt](https://example.com/a.png \"caption\") <!-- align:left -->"],
  // ── Markdown images ──
  ["api image", "![alt](/api/media/x.png)"],
  ["api image no alt", "![](/api/media/x.png)"],
  ["obsidian sized external", "![alt|300](https://example.com/a.png)"],
  ["obsidian boxed external", "![alt|300x200](https://example.com/a.png)"],
  ["captioned image", "![alt](https://example.com/a.png \"caption\")"],
  // ── Surroundings ──
  ["between paragraphs", "Intro\n\n![[a.png|480]] <!-- align:center -->\n\nOutro"],
  ["in a code fence", "```\n![[a.png]]\n```"],
  ["in inline code", "use `![[a.png]]` to embed"],
  ["empty embed stays text", "![[]]"],
  [
    "a whole note",
    [
      "# Trip",
      "",
      "Day one ![[ticket.pdf#page=2|ticket]] was long.",
      "",
      "![[beach.jpg|640]] <!-- align:center --> <!-- caption:The beach -->",
      "",
      "- packed ![[list.txt]]",
      "- watched ![[youtube:https://www.youtube-nocookie.com/embed/xyz|Recap]]",
      "",
      "![[clip.mov|640x360]]",
    ].join("\n"),
  ],
];

function serverRoundTrip(markdown: string): string {
  return papyraJSONToMarkdown(papyraMarkdownToJSON(markdown));
}

describe("media golden corpus — collaboration server pipeline", () => {
  it.each(UNCHANGED)("%s round-trips byte for byte", (_name, source) => {
    expect(serverRoundTrip(source)).toBe(source);
    // …and stays put on a second pass (save → reopen → save).
    expect(serverRoundTrip(serverRoundTrip(source))).toBe(source);
  });

  it("parses sizes, alt, fragments and directives into the node", () => {
    const doc = JSON.stringify(
      papyraMarkdownToJSON("![[a.pdf#page=3|Report|640x480]] <!-- align:right --> <!-- caption:Q3 -->"),
    );
    expect(doc).toContain('"type":"fileEmbed"');
    expect(doc).toContain('"target":"a.pdf"');
    expect(doc).toContain('"fragment":"page=3"');
    expect(doc).toContain('"alt":"Report"');
    expect(doc).toContain('"width":640');
    expect(doc).toContain('"height":480');
    expect(doc).toContain('"align":"right"');
    expect(doc).toContain('"caption":"Q3"');
  });

  it("claims mid-paragraph file embeds as inline nodes, keeping the text", () => {
    const doc = JSON.stringify(papyraMarkdownToJSON("before ![[inline.gif]] after"));
    expect(doc).toContain('"inline":true');
    expect(doc).toContain("before ");
    expect(doc).toContain(" after");
  });
});

// ── Edits ─────────────────────────────────────────────────────────────────────

/** Parse into a headless editor, apply `edit` to the first matching node, export. */
function editFirst(markdown: string, match: (node: LexicalNode) => boolean, edit: (node: LexicalNode) => void): string {
  const editor = createEditor({ nodes: getPapyraCollabNodes(), onError: (e) => { throw e; } });
  editor.setEditorState(editor.parseEditorState(JSON.stringify(papyraMarkdownToJSON(markdown))));
  const walk = (node: LexicalNode): LexicalNode | undefined => {
    if (match(node)) return node;
    if ($isElementNode(node)) {
      for (const child of node.getChildren()) {
        const hit = walk(child);
        if (hit) return hit;
      }
    }
    return undefined;
  };
  editor.update(
    () => {
      const found = walk($getRoot());
      if (!found) throw new Error("no matching node");
      edit(found);
    },
    { discrete: true },
  );
  return papyraJSONToMarkdown(editor.getEditorState().toJSON());
}

describe("media golden corpus — edits produce the canonical form", () => {
  const file = (fn: (node: FileEmbedNode) => void) => (node: LexicalNode) => fn(node as FileEmbedNode);

  it("a resize writes Obsidian's width", () => {
    expect(editFirst("![[a.png]]", $isFileEmbedNode, file((n) => n.setSize(480)))).toBe("![[a.png|480]]");
  });

  it("a box resize writes WxH and keeps the alias", () => {
    expect(editFirst("![[a.png|Sunset]]", $isFileEmbedNode, file((n) => n.setSize(640, 360)))).toBe(
      "![[a.png|Sunset|640x360]]",
    );
  });

  it("alignment and caption land as trailing directives, canonically ordered", () => {
    const out = editFirst(
      "![[a.png]] <!-- caption:Old --> <!-- keep:me -->",
      $isFileEmbedNode,
      file((n) => {
        n.setAlign("center");
        n.setCaption("A --> tricky <caption> & more");
      }),
    );
    expect(out).toBe(
      "![[a.png]] <!-- align:center --> <!-- caption:A --&gt; tricky &lt;caption&gt; &amp; more --> <!-- keep:me -->",
    );
    // …and read back exactly.
    expect(JSON.stringify(papyraMarkdownToJSON(out))).toContain('"caption":"A --> tricky <caption> & more"');
  });

  it("clearing a size removes it", () => {
    expect(editFirst("![[a.png|300]]", $isFileEmbedNode, file((n) => n.setSize(undefined)))).toBe("![[a.png]]");
  });

  it("replacing the file keeps size and directives", () => {
    expect(
      editFirst("![[old.png|300]] <!-- align:right -->", $isFileEmbedNode, file((n) => n.setTarget("new.png"))),
    ).toBe("![[new.png|300]] <!-- align:right -->");
  });

  it("an inline embed resizes in place, without directives", () => {
    expect(
      editFirst("see ![[a.png]] here", $isFileEmbedNode, file((n) => {
        n.setSize(40);
        n.setAlign("center");
      })),
    ).toBe("see ![[a.png|40]] here");
  });

  it("a YouTube resize writes its size segment", () => {
    expect(
      editFirst(
        "![[youtube:https://www.youtube-nocookie.com/embed/abc123|Talk]]",
        $isYouTubeEmbedNode,
        (n) => (n as unknown as { setPayload(p: object): void }).setPayload({ width: 800, height: 450 }),
      ),
    ).toBe("![[youtube:https://www.youtube-nocookie.com/embed/abc123|Talk|800x450]]");
  });

  it("an image resize writes Obsidian's alt-size", () => {
    expect(
      editFirst("![alt](https://example.com/a.png)", $isImageNode, (n) =>
        (n as unknown as { setWidthAndHeight(w: number, h?: number): void }).setWidthAndHeight(300, undefined),
      ),
    ).toBe("![alt|300](https://example.com/a.png)");
  });

  it("an iframe's alignment is written as a directive, and centre (its default) is not", () => {
    const iframe = (node: LexicalNode) => node.getType() === "iframe-embed";
    const setAlign = (align: string) => (n: LexicalNode) =>
      (n as unknown as { setPayload(p: object): void }).setPayload({ alignment: align });
    expect(editFirst("![[iframe:https://example.com/page]]", iframe, setAlign("right"))).toBe(
      "![[iframe:https://example.com/page]] <!-- align:right -->",
    );
    expect(editFirst("![[iframe:https://example.com/page]] <!-- align:right -->", iframe, setAlign("center"))).toBe(
      "![[iframe:https://example.com/page]]",
    );
  });

  it("a YouTube embed's alignment is written as a directive", () => {
    expect(
      editFirst(
        "![[youtube:https://www.youtube-nocookie.com/embed/abc123]]",
        $isYouTubeEmbedNode,
        (n) => (n as unknown as { setPayload(p: object): void }).setPayload({ alignment: "left" }),
      ),
    ).toBe("![[youtube:https://www.youtube-nocookie.com/embed/abc123]] <!-- align:left -->");
  });

  it("an aligned picture from a link keeps luthor's directive, never GitHub's <p align> wrapper", () => {
    const out = editFirst("![](https://example.com/a.gif)", $isImageNode, (n) =>
      (n as unknown as { setAlignment(a: string): void }).setAlignment("right"),
    );
    expect(out).toBe("![](https://example.com/a.gif) <!-- align:right -->");
    expect(out).not.toContain("<p");
  });

  it("reads version-1 JSON (a live room from before sizes existed)", () => {
    const editor = createEditor({ nodes: getPapyraCollabNodes(), onError: (e) => { throw e; } });
    editor.update(
      () => {
        const node = FileEmbedNode.importJSON({ type: "fileEmbed", version: 1, target: "a.png|300" } as never);
        expect(node.__target).toBe("a.png");
        expect(node.__width).toBe(300);
        expect(node.getMarkdown()).toBe("![[a.png|300]]");
      },
      { discrete: true },
    );
  });
});

// ── The browser editor ────────────────────────────────────────────────────────

async function mount() {
  let handle: PapyraEditorRef | null = null;
  const onChange = vi.fn();
  render(
    <PapyraEditor
      defaultEditorView="visual"
      blockAnchors="on-demand"
      onChange={onChange}
      onReady={(m) => {
        handle = m;
      }}
    />,
  );
  await waitFor(() => expect(handle).not.toBeNull());
  return { handle: handle as unknown as PapyraEditorRef, onChange };
}

// The browser's code-highlight plugin labels a bare fence with a language on
// first render (a pre-existing, non-media behaviour tracked separately), so the
// fence case is covered by the server pipeline above only.
const BROWSER_CASES = UNCHANGED.filter(([name]) => name !== "in a code fence");

describe("media golden corpus — browser editor", () => {
  it.each(BROWSER_CASES)("%s survives setMarkdown → getMarkdown", async (_name, source) => {
    const { handle, onChange } = await mount();
    handle.setMarkdown(source);
    const baseline = handle.getMarkdown();
    expect(baseline).toBe(source);
    // Rendering the embeds (decorators mounting, media metadata arriving) is
    // never an edit: nothing reports a user change.
    await new Promise((r) => setTimeout(r, 20));
    const edits = onChange.mock.calls
      .map(([e]) => e as { source: string; markdown: string })
      .filter((e) => e.source === "user" && e.markdown !== baseline);
    expect(edits).toEqual([]);
  });
});

// ── Notes saved by the old alignment export ───────────────────────────────────
//
// Before 2.11.7 an aligned picture from a link was written as GitHub's
// `<p align>` wrapper. Reading that back turned it into internal
// `[[LUTHORALIGNSTART:…]]` lines that Papyra's `[[wikilink]]` transformer
// claimed first — "LUTHORALIGNSTART:center" showed up in the note as a link, and
// a save could write that text into the file. Every such form must read back
// as the aligned picture, with no marker text anywhere.

const HEALS: [string, string, string][] = [
  [
    "GitHub <p align> wrapper",
    "<p align=\"center\">\n![](https://media.example.com/party.gif)\n</p>",
    "![](https://media.example.com/party.gif) <!-- align:center -->",
  ],
  [
    "<div align> wrapper",
    "<div align=\"right\">\n![](https://media.example.com/party.gif)\n</div>",
    "![](https://media.example.com/party.gif) <!-- align:right -->",
  ],
  [
    "leaked marker lines",
    "[[LUTHORALIGNSTART:center]]\n\n![](https://media.example.com/party.gif)\n\n[[LUTHORALIGNEND]]",
    "![](https://media.example.com/party.gif) <!-- align:center -->",
  ],
  [
    "leaked marker lines, escaped",
    "[[LUTHOR\\_ALIGN\\_START:right]]\n\n![](https://media.example.com/party.gif)\n\n[[LUTHOR\\_ALIGN\\_END]]",
    "![](https://media.example.com/party.gif) <!-- align:right -->",
  ],
  [
    "wrapper between paragraphs",
    "Before\n\n<p align=\"center\">\n![](https://media.example.com/party.gif)\n</p>\n\nAfter",
    "Before\n\n![](https://media.example.com/party.gif) <!-- align:center -->\n\nAfter",
  ],
];

function allText(node: unknown): string[] {
  if (!node || typeof node !== "object") return [];
  const record = node as Record<string, unknown>;
  const own = typeof record.text === "string" ? [record.text] : [];
  const target = typeof record.target === "string" ? [record.target] : [];
  const children = Array.isArray(record.children) ? record.children.flatMap(allText) : [];
  return [...own, ...target, ...children];
}

describe("alignment written by older versions reads back as alignment", () => {
  it.each(HEALS)("%s (server pipeline)", (_name, source, healed) => {
    const doc = papyraMarkdownToJSON(source);
    expect(allText(doc.root).some((t) => /LUTHOR/i.test(t))).toBe(false);
    expect(papyraJSONToMarkdown(doc)).toBe(healed);
    expect(serverRoundTrip(healed)).toBe(healed);
  });

  it.each(HEALS)("%s (browser editor)", async (_name, source, healed) => {
    const { handle } = await mount();
    handle.setMarkdown(source);
    const root = handle.getLexicalEditor()?.getRootElement();
    expect(root?.textContent ?? "").not.toMatch(/LUTHOR/i);
    expect(handle.getMarkdown()).toBe(healed);
  });
});

describe("a picture from a link is never lost on save", () => {
  it("inside a paragraph (no caret when it was inserted) it is lifted out, not dropped", async () => {
    const { handle } = await mount();
    const editor = handle.getLexicalEditor()!;
    const { $createImageNode } = await import("@lyfie/luthor-headless/extensions/media/ImageExtension");
    const { $createParagraphNode, $createTextNode } = await import("lexical");
    editor.update(
      () => {
        const paragraph = $createParagraphNode();
        paragraph.append(
          $createTextNode("Hi "),
          $createImageNode("https://media.example.com/party.gif", "party", undefined, undefined, undefined, "right"),
          $createTextNode(" there"),
        );
        $getRoot().clear().append(paragraph);
      },
      { discrete: true },
    );
    const saved = handle.getMarkdown();
    expect(saved).toContain("![party](https://media.example.com/party.gif) <!-- align:right -->");
    expect(saved).toContain("Hi");
    expect(saved).toContain("there");
    handle.setMarkdown(saved);
    expect(handle.getMarkdown()).toBe(saved);
  });
});
