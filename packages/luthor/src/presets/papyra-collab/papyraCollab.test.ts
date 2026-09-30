// @vitest-environment node
/**
 * Convergence + fidelity guarantees for Papyra's collaborative editing: every
 * replica bound through @lexical/yjs must end byte-identical, never lose a
 * concurrent edit, and serialize to the same markdown the browser would.
 */
import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isElementNode,
  $isTextNode,
  type LexicalNode,
} from "lexical";
import {
  createPapyraHeadlessCollab,
  getPapyraCollabNodes,
  papyraJSONToMarkdown,
  papyraMarkdownToJSON,
  type PapyraHeadlessCollab,
} from "./index";
import { UploadPlaceholderNode } from "@lyfie/luthor-headless";

const FIXTURES = [
  "Plain paragraph.",
  "# Heading\n\nBody with **bold**, *italic*, `code` and a [link](https://example.com).",
  "- one\n- two\n  - nested\n\n1. first\n2. second\n\n- [ ] todo\n- [x] done",
  "> A quote\n\n---\n\n```ts\nconst a = 1;\n```",
  "| a | b |\n| --- | --- |\n| 1 | 2 |",
  "See [[Project Plan]] and ![[Meeting#^abc123]].\n\nAnchored block ^keep0001",
  "![[diagram.png]]\n\nText after embed.",
  // Sized, aliased, aligned, captioned and inline media (the media grammar).
  "![[beach.jpg|Beach|640]] <!-- align:center --> <!-- caption:Dusk -->\n\nSee ![[ticket.pdf#page=2]] inline.\n\n![[youtube:https://www.youtube-nocookie.com/embed/xyz|Recap|800x450]]",
];

/** Normalize once through the bridge — the stable form every replica must hit. */
function normalized(markdown: string): string {
  return papyraJSONToMarkdown(papyraMarkdownToJSON(markdown));
}

function connect(a: Y.Doc, b: Y.Doc): void {
  Y.applyUpdate(b, Y.encodeStateAsUpdate(a, Y.encodeStateVector(b)));
  Y.applyUpdate(a, Y.encodeStateAsUpdate(b, Y.encodeStateVector(a)));
}

function replica(from?: Y.Doc): PapyraHeadlessCollab {
  const doc = new Y.Doc();
  if (from) {
    Y.applyUpdate(doc, Y.encodeStateAsUpdate(from));
  }
  return createPapyraHeadlessCollab(doc);
}

function firstText(node: LexicalNode | null): LexicalNode | null {
  if (!node) return null;
  if ($isTextNode(node)) return node;
  if ($isElementNode(node)) {
    for (const child of node.getChildren()) {
      const hit = firstText(child);
      if (hit) return hit;
    }
  }
  return null;
}

function insertIntoParagraph(r: PapyraHeadlessCollab, index: number, offset: number, text: string) {
  r.editor.update(
    () => {
      const block = $getRoot().getChildAtIndex(index);
      const leaf = firstText(block);
      if ($isTextNode(leaf)) {
        const content = leaf.getTextContent();
        const at = Math.min(offset, content.length);
        leaf.setTextContent(content.slice(0, at) + text + content.slice(at));
      }
    },
    { discrete: true },
  );
}

describe("papyra collab node parity", () => {
  it("registers every embed and rich-text node type the browser editor has", () => {
    const types = new Set(getPapyraCollabNodes().map((node) => node.getType()));
    for (const type of [
      "paragraph", "heading", "quote", "list", "listitem", "code", "table",
      "link", "image", "horizontalrule", "wikilink", "transclusion",
      "fileEmbed", "blockAnchor", "callout", "youtube-embed", "iframe-embed",
    ]) {
      expect(types.has(type), type).toBe(true);
    }
  });
});

describe("papyra headless collaboration", () => {
  it.each(FIXTURES)("seeds a room and syncs it to a client losslessly: %#", (markdown) => {
    const server = replica();
    expect(server.isEmpty()).toBe(true);
    server.setMarkdown(markdown);

    const client = replica(server.doc);
    expect(client.getMarkdown()).toBe(normalized(markdown));
    expect(server.getMarkdown()).toBe(normalized(markdown));
    expect(client.getMarkdown()).not.toContain("[Unsupported");
  });

  it("a peer's resize and caption reach every replica and the saved markdown", () => {
    const server = replica();
    server.setMarkdown("Intro\n\n![[beach.jpg]]\n\nOutro");
    const alice = replica(server.doc);
    const bob = replica(server.doc);

    alice.editor.update(
      () => {
        const embed = $getRoot().getChildren().find((n) => n.getType() === "fileEmbed") as unknown as {
          setSize(w: number): void;
          setCaption(c: string): void;
        };
        embed.setSize(480);
        embed.setCaption("Dusk");
      },
      { discrete: true },
    );
    connect(alice.doc, server.doc);
    connect(server.doc, bob.doc);

    const expected = "Intro\n\n![[beach.jpg|480]] <!-- caption:Dusk -->\n\nOutro";
    expect(alice.getMarkdown()).toBe(expected);
    expect(server.getMarkdown()).toBe(expected);
    expect(bob.getMarkdown()).toBe(expected);
  });

  it("an upload in progress reaches peers as a placeholder but never the saved markdown", () => {
    const server = replica();
    server.setMarkdown("Intro\n\nOutro");
    const alice = replica(server.doc);
    const bob = replica(server.doc);

    alice.editor.update(
      () => {
        const first = $getRoot().getFirstChild()!;
        first.insertAfter(
          new UploadPlaceholderNode({ uploadId: "up-x", name: "beach.png", size: 10, kind: "image", startedAt: 1 }),
        );
      },
      { discrete: true },
    );
    connect(alice.doc, server.doc);
    connect(server.doc, bob.doc);

    expect(bob.editor.getEditorState().read(() => $getRoot().getChildren().map((n) => n.getType()))).toContain(
      "uploadPlaceholder",
    );
    expect(JSON.stringify(bob.editor.getEditorState().toJSON())).not.toContain("blob:");
    // The server persists markdown: nothing for the in-flight upload.
    expect(server.getMarkdown()).not.toContain("beach.png");
    expect(server.getMarkdown()).toContain("Intro");
    expect(server.getMarkdown()).toContain("Outro");
  });

  it("reloads a persisted room state without changing the body", () => {
    const server = replica();
    server.setMarkdown(FIXTURES[1]!);
    const persisted = Y.encodeStateAsUpdate(server.doc);

    const reloaded = new Y.Doc();
    Y.applyUpdate(reloaded, persisted);
    expect(createPapyraHeadlessCollab(reloaded).getMarkdown()).toBe(
      normalized(FIXTURES[1]!),
    );
  });

  it("keeps both of two concurrent edits to the same paragraph", () => {
    const server = replica();
    server.setMarkdown("Hello world");
    const alice = replica(server.doc);
    const bob = replica(server.doc);

    // Offline from each other: both type into the same text run.
    insertIntoParagraph(alice, 0, 5, " brave");
    insertIntoParagraph(bob, 0, 11, "!");

    connect(alice.doc, server.doc);
    connect(bob.doc, server.doc);
    connect(alice.doc, server.doc);

    const result = server.getMarkdown();
    expect(result).toBe("Hello brave world!");
    expect(alice.getMarkdown()).toBe(result);
    expect(bob.getMarkdown()).toBe(result);
  });

  it.each([1, 7, 42, 99, 1234, 31337])("converges under randomized concurrent edits delivered out of order (seed %i)", (initialSeed) => {
    let seed = initialSeed;
    const random = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };

    const server = replica();
    server.setMarkdown("Alpha paragraph\n\nBeta paragraph\n\nGamma paragraph");
    const clients = [replica(server.doc), replica(server.doc), replica(server.doc)];

    for (let round = 0; round < 25; round += 1) {
      for (const client of clients) {
        const blocks = client.editor.getEditorState().read(() => $getRoot().getChildrenSize());
        const op = random();
        if (op < 0.6 || blocks === 0) {
          insertIntoParagraph(client, Math.floor(random() * Math.max(blocks, 1)), Math.floor(random() * 20), `x${round}`);
        } else if (op < 0.8) {
          client.editor.update(
            () => {
              $getRoot().append($createParagraphNode().append($createTextNode(`new ${round}`)));
            },
            { discrete: true },
          );
        } else if (blocks > 1) {
          client.editor.update(
            () => {
              $getRoot().getChildAtIndex(Math.floor(random() * blocks))?.remove();
            },
            { discrete: true },
          );
        }
      }
      // Deliver in a shuffled order, sometimes skipping a client this round.
      const order = [...clients].sort(() => random() - 0.5);
      for (const client of order) {
        if (random() < 0.8) connect(client.doc, server.doc);
      }
    }
    for (const client of clients) connect(client.doc, server.doc);
    for (const client of clients) connect(client.doc, server.doc);

    const result = server.getMarkdown();
    for (const client of clients) {
      expect(client.getMarkdown()).toBe(result);
    }
    expect(result).not.toContain("[Unsupported");
    // The persisted form is a fixed point: re-importing it changes nothing.
    expect(normalized(result)).toBe(result);
  });

  it("server anchor stamping yields one unique id per block on every replica", () => {
    const server = replica();
    server.setMarkdown("One\n\nTwo\n\nThree");
    const client = replica(server.doc);

    expect(server.ensureBlockAnchors()).toBe(true);
    connect(client.doc, server.doc);

    const markdown = client.getMarkdown();
    const ids = markdown.match(/\^[a-z0-9]{8}/g) ?? [];
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    expect(server.getMarkdown()).toBe(markdown);
    // Idempotent: a second pass is a no-op.
    expect(server.ensureBlockAnchors()).toBe(false);
  });

  it("adopts an external replacement as a normal remote update", () => {
    const server = replica();
    server.setMarkdown("Before");
    const client = replica(server.doc);

    server.setMarkdown("After external edit");
    connect(client.doc, server.doc);
    expect(client.getMarkdown()).toBe("After external edit");
  });
});
