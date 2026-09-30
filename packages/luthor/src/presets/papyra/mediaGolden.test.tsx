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
