/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { createRef, useEffect, useRef } from "react";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ExtensiveEditorProps, ExtensiveEditorRef } from "../extensive";

const { extensiveEditorMock } = vi.hoisted(() => ({
  extensiveEditorMock: vi.fn((): React.ReactNode => null),
}));

vi.mock("../extensive", () => ({
  ExtensiveEditor: extensiveEditorMock,
}));

import {
  PapyraEditor,
  PAPYRA_READONLY_MODES,
  type PapyraEditorRef,
} from "./PapyraEditor";
import {
  createFallbackPapyraAdapter,
  usePapyraAdapter,
  type PapyraEditorAdapter,
} from "./adapter";

function lastProps(): ExtensiveEditorProps {
  return extensiveEditorMock.mock.calls.at(-1)?.[0] as ExtensiveEditorProps;
}

describe("PapyraEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("locks the markdown-native contract", () => {
    render(<PapyraEditor showDefaultContent={false} />);

    const props = lastProps();
    expect(props.availableModes).toEqual(["visual", "markdown"]);
    expect(props.isEditorViewTabsVisible).toBe(false);
    expect(props.isToolbarEnabled).toBe(false);
    expect(props.isToolbarPinned).toBe(false);
    expect(props.markdownSourceOfTruth).toBe(true);
    expect(props.sourceMetadataMode).toBe("none");
  });

  it("locks the curated command and toolbar surface", () => {
    render(<PapyraEditor showDefaultContent={false} />);

    const props = lastProps();
    expect(props.headingOptions).toEqual(["h1", "h2", "h3"]);
    expect(props.slashCommandVisibility).toEqual({
      allowlist: expect.arrayContaining([
        "block.heading1",
        "list.check",
        "block.quote",
        "insert.table",
        "insert.image",
      ]),
    });
    expect(props.shortcutConfig).toMatchObject({
      preventNativeConflicts: true,
      preventCollisions: true,
    });
    // Restricted toolbar items are pinned off.
    expect(props.toolbarVisibility).toMatchObject({
      fontFamily: false,
      underline: false,
      subscript: false,
      embed: false,
      themeToggle: false,
    });
  });

  it("applies the markdown-safe feature policy", () => {
    render(<PapyraEditor showDefaultContent={false} />);

    expect(lastProps().featureFlags).toEqual(
      expect.objectContaining({
        bold: true,
        italic: true,
        strikethrough: true,
        codeFormat: true,
        link: true,
        blockFormat: true,
        list: true,
        horizontalRule: true,
        table: true,
        image: true,
        code: true,
        codeIntelligence: true,
        history: true,
        floatingToolbar: true,
        contextMenu: true,
        commandPalette: true,
        slashCommand: true,
        emoji: true,
        customNode: true,
        underline: false,
        iframeEmbed: false,
        youTubeEmbed: false,
        fontFamily: false,
        fontSize: false,
        lineHeight: false,
        textColor: false,
        textHighlight: false,
        subscript: false,
        superscript: false,
        themeToggle: false,
        draggableBlock: false,
      }),
    );
  });

  it("never lets a caller re-enable an enforced restriction", () => {
    render(
      <PapyraEditor
        showDefaultContent={false}
        featureFlags={{
          fontFamily: true,
          themeToggle: true,
          draggableBlock: true,
          subscript: true,
          // A non-enforced default remains caller-overridable.
          table: false,
        }}
      />,
    );

    const flags = lastProps().featureFlags;
    expect(flags?.fontFamily).toBe(false);
    expect(flags?.themeToggle).toBe(false);
    expect(flags?.draggableBlock).toBe(false);
    expect(flags?.subscript).toBe(false);
    expect(flags?.table).toBe(false);
  });

  it("composes the preset class names", () => {
    render(
      <PapyraEditor
        showDefaultContent={false}
        className="outer"
        variantClassName="inner"
      />,
    );

    const props = lastProps();
    expect(props.className).toContain("luthor-preset-papyra");
    expect(props.className).toContain("outer");
    expect(props.variantClassName).toContain("luthor-preset-papyra__variant");
    expect(props.variantClassName).toContain("inner");
  });

  describe("render states", () => {
    it("keeps the editable visual surface by default", () => {
      render(<PapyraEditor showDefaultContent={false} />);

      const props = lastProps();
      expect(props.availableModes).toEqual(["visual", "markdown"]);
      // No forced read-only promotion lock when editing.
      expect(props.defaultEditorView).toBeUndefined();
      expect(props.editOnClick).toBeUndefined();
    });

    it("mounts a non-editable surface when readOnly", () => {
      render(<PapyraEditor showDefaultContent={false} readOnly />);

      const props = lastProps();
      // visual-only with promotion disabled = no editable caret, no edits.
      expect(props.availableModes).toEqual(PAPYRA_READONLY_MODES);
      expect(props.defaultEditorView).toBe("visual-only");
      expect(props.editOnClick).toBe(false);
    });

    it("widens the measure in the focus variant", () => {
      const { rerender } = render(<PapyraEditor showDefaultContent={false} />);
      expect(lastProps().className).not.toContain(
        "luthor-preset-papyra--focus",
      );

      rerender(<PapyraEditor showDefaultContent={false} variant="focus" />);
      expect(lastProps().className).toContain("luthor-preset-papyra--focus");
    });

    it("withholds the body and never mounts the editor when locked", () => {
      const { container } = render(
        <PapyraEditor
          showDefaultContent={false}
          locked
          defaultContent="classified body text"
        />,
      );

      // The editor is never mounted, so there is no plaintext to scrape.
      expect(extensiveEditorMock).not.toHaveBeenCalled();
      expect(container.textContent).not.toContain("classified");

      const root = container.querySelector("[data-papyra-locked='true']");
      expect(root).not.toBeNull();
      expect(root?.className).toContain("luthor-preset-papyra--locked");
    });

    it("renders a custom locked placeholder instead of the body", () => {
      const { container } = render(
        <PapyraEditor
          showDefaultContent={false}
          locked
          lockedPlaceholder={<p>Unlock to read this note</p>}
          defaultContent="classified body text"
        />,
      );

      expect(extensiveEditorMock).not.toHaveBeenCalled();
      expect(container.textContent).toContain("Unlock to read this note");
      expect(container.textContent).not.toContain("classified");
    });
  });

  describe("theming", () => {
    it("bridges editorial surfaces to Papyra tokens with no hardcoded hex", () => {
      render(<PapyraEditor showDefaultContent={false} />);

      const overrides = lastProps().editorThemeOverrides ?? {};
      // The bridge must cover the core editorial surfaces.
      expect(overrides["--luthor-fg"]).toContain("var(--papyra-text");
      expect(overrides["--luthor-link-color"]).toContain(
        "var(--papyra-accent-text",
      );
      expect(overrides["--luthor-quote-border"]).toContain(
        "var(--papyra-accent",
      );
      expect(overrides["--luthor-floating-bg"]).toContain(
        "var(--papyra-surface",
      );

      // Invariant: zero hardcoded color in the preset's theme bridge.
      for (const value of Object.values(overrides)) {
        expect(value).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      }
    });

    it("layers caller theme overrides on top of the bridge", () => {
      render(
        <PapyraEditor
          showDefaultContent={false}
          editorThemeOverrides={{ "--luthor-fg": "var(--brand-ink)" }}
        />,
      );

      const overrides = lastProps().editorThemeOverrides ?? {};
      // Caller override wins for the token it targets...
      expect(overrides["--luthor-fg"]).toBe("var(--brand-ink)");
      // ...while the rest of the bridge is preserved.
      expect(overrides["--luthor-link-color"]).toContain(
        "var(--papyra-accent-text",
      );
    });

    it("passes a caller initialTheme through when not colored", () => {
      render(<PapyraEditor showDefaultContent={false} initialTheme="dark" />);

      const props = lastProps();
      expect(props.initialTheme).toBe("dark");
      expect(props.className).not.toContain("luthor-preset-papyra--colored");
    });

    it("light-locks colored notes", () => {
      render(
        <PapyraEditor showDefaultContent={false} colored initialTheme="dark" />,
      );

      const props = lastProps();
      // colored forces the light editorial palette regardless of the request.
      expect(props.initialTheme).toBe("light");
      expect(props.className).toContain("luthor-preset-papyra--colored");
    });
  });

  describe("imperative ref", () => {
    const stubMethods: ExtensiveEditorRef = {
      injectJSON: vi.fn(),
      getJSON: vi.fn(() => "{}"),
      getMarkdown: vi.fn(() => "# Title\n\nBody"),
      getHTML: vi.fn(() => "<h1>Title</h1>"),
    };

    // Mirror the real editor, which fires onReady from an effect (never during
    // render), so the wrapper's readiness state settles after commit.
    function ReadyEditorMock({
      props,
      methods,
      innerHTML,
    }: {
      props: ExtensiveEditorProps;
      methods: ExtensiveEditorRef;
      innerHTML?: string;
    }) {
      // Fire onReady exactly once, mirroring the real editor's readyRef guard,
      // so wrapper re-renders don't re-invoke it.
      const fired = useRef(false);
      useEffect(() => {
        if (fired.current) {
          return;
        }
        fired.current = true;
        props.onReady?.(methods);
      });
      return (
        <div
          contentEditable
          suppressContentEditableWarning
          dangerouslySetInnerHTML={innerHTML ? { __html: innerHTML } : undefined}
        />
      );
    }

    function renderWithReadyEditor(
      ref: React.RefObject<PapyraEditorRef | null>,
      options?: { methods?: ExtensiveEditorRef; innerHTML?: string },
    ) {
      const methods = options?.methods ?? stubMethods;
      extensiveEditorMock.mockImplementation((props: ExtensiveEditorProps) => (
        <ReadyEditorMock
          props={props}
          methods={methods}
          innerHTML={options?.innerHTML}
        />
      ));
      render(<PapyraEditor ref={ref} showDefaultContent={false} />);
    }

    it("delegates getMarkdown to the underlying editor", () => {
      const ref = createRef<PapyraEditorRef>();
      renderWithReadyEditor(ref);
      expect(ref.current?.getMarkdown()).toBe("# Title\n\nBody");
    });

    it("routes setMarkdown through injectJSON without a controlled value path", () => {
      const ref = createRef<PapyraEditorRef>();
      renderWithReadyEditor(ref);

      ref.current?.setMarkdown("# Adopted\n\nRemote revision");

      expect(stubMethods.injectJSON).toHaveBeenCalledTimes(1);
      const payload = (stubMethods.injectJSON as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as string;
      // injectJSON always receives a serialized JSON document, never raw markdown.
      expect(() => JSON.parse(payload)).not.toThrow();
    });

    it("focuses the editable surface", () => {
      const ref = createRef<PapyraEditorRef>();
      renderWithReadyEditor(ref);

      ref.current?.focus();

      expect(document.activeElement?.getAttribute("contenteditable")).toBe(
        "true",
      );
    });

    it("returns an empty outline and no block anchors for a bare body", () => {
      const ref = createRef<PapyraEditorRef>();
      renderWithReadyEditor(ref);

      // No headings rendered, and the stub body carries no trailing `^anchor`.
      expect(ref.current?.getOutline()).toEqual([]);
      expect(ref.current?.getBlocks()).toEqual([]);
    });

    it("reads the outline from the rendered headings in document order", () => {
      const ref = createRef<PapyraEditorRef>();
      renderWithReadyEditor(ref, {
        innerHTML: "<h1>Intro</h1><p>x</p><h2>Details</h2><h3>Notes</h3>",
      });

      const outline = ref.current?.getOutline() ?? [];
      expect(outline.map((heading) => heading.level)).toEqual([1, 2, 3]);
      expect(outline.map((heading) => heading.text)).toEqual([
        "Intro",
        "Details",
        "Notes",
      ]);
      expect(outline[0]?.key).toBe("papyra-heading-0");
      expect(outline[2]?.key).toBe("papyra-heading-2");
    });

    it("scrolls the heading addressed by key into view", () => {
      // jsdom has no scrollIntoView; provide one to observe the call.
      const scrollIntoView = vi.fn();
      const original = HTMLElement.prototype.scrollIntoView;
      HTMLElement.prototype.scrollIntoView = scrollIntoView;

      try {
        const ref = createRef<PapyraEditorRef>();
        renderWithReadyEditor(ref, {
          innerHTML: "<h1>One</h1><h2>Two</h2>",
        });

        ref.current?.scrollToHeading("papyra-heading-1");
        expect(scrollIntoView).toHaveBeenCalledTimes(1);

        // An unknown key is a no-op, never a throw.
        ref.current?.scrollToHeading("papyra-heading-99");
        expect(scrollIntoView).toHaveBeenCalledTimes(1);
      } finally {
        HTMLElement.prototype.scrollIntoView = original;
      }
    });

    it("detects distinct @mentions from the body, skipping email locals", () => {
      const ref = createRef<PapyraEditorRef>();
      const mentionMethods: ExtensiveEditorRef = {
        ...stubMethods,
        getMarkdown: vi.fn(
          () => "Ping @alice and @bob, then @alice again. Mail me@example.com.",
        ),
      };
      renderWithReadyEditor(ref, { methods: mentionMethods });

      expect(ref.current?.getMentions()).toEqual(["alice", "bob"]);
    });

    it("extracts trailing block anchors from the body", () => {
      const ref = createRef<PapyraEditorRef>();
      const anchorMethods: ExtensiveEditorRef = {
        ...stubMethods,
        getMarkdown: vi.fn(() => "A paragraph. ^abc123\n\nAnother line. ^note-2"),
      };
      renderWithReadyEditor(ref, { methods: anchorMethods });

      expect(ref.current?.getBlocks()).toEqual([
        { blockId: "abc123", key: "abc123" },
        { blockId: "note-2", key: "note-2" },
      ]);
    });

    it("hands the Papyra ref to onReady", () => {
      const onReady = vi.fn();
      extensiveEditorMock.mockImplementation((props: ExtensiveEditorProps) => (
        <ReadyEditorMock props={props} methods={stubMethods} />
      ));

      render(<PapyraEditor showDefaultContent={false} onReady={onReady} />);

      expect(onReady).toHaveBeenCalledTimes(1);
      const handed = onReady.mock.calls[0][0] as PapyraEditorRef;
      expect(typeof handed.setMarkdown).toBe("function");
      expect(typeof handed.focus).toBe("function");
      expect(typeof handed.getOutline).toBe("function");
      expect(typeof handed.scrollToHeading).toBe("function");
      expect(typeof handed.getMentions).toBe("function");
    });

    it("emits the initial outline to onOutlineChange once ready", () => {
      const onOutlineChange = vi.fn();
      extensiveEditorMock.mockImplementation((props: ExtensiveEditorProps) => (
        <ReadyEditorMock
          props={props}
          methods={stubMethods}
          innerHTML="<h1>Heading</h1>"
        />
      ));

      render(
        <PapyraEditor
          showDefaultContent={false}
          onOutlineChange={onOutlineChange}
        />,
      );

      expect(onOutlineChange).toHaveBeenCalled();
      const firstOutline = onOutlineChange.mock.calls[0][0] as Array<{
        level: number;
        text: string;
      }>;
      expect(firstOutline).toEqual([
        expect.objectContaining({ level: 1, text: "Heading" }),
      ]);
    });

    // Caret safety (Sprint 1.6). The invariant: the editor is uncontrolled, so a
    // changed body prop never patches the mounted surface, and adopting a remote
    // revision is a host-driven remount — never a live-DOM write that could move
    // the caret. These pin the contract at the layer the preset owns; verifying
    // the rendered caret never physically moves needs a real editor instance and
    // is covered by the Phase 2 host's browser tests (like 1.2/1.3/1.5).
    describe("caret safety", () => {
      it("never re-injects content when defaultContent changes without a remount", () => {
        const injectJSON = vi.fn();
        const methods: ExtensiveEditorRef = { ...stubMethods, injectJSON };
        extensiveEditorMock.mockImplementation((props: ExtensiveEditorProps) => (
          <ReadyEditorMock props={props} methods={methods} />
        ));

        const { rerender } = render(
          <PapyraEditor showDefaultContent={false} defaultContent="# One" />,
        );
        rerender(
          <PapyraEditor showDefaultContent={false} defaultContent="# Two" />,
        );

        // Uncontrolled by contract: the wrapper reads defaultContent once and
        // never patches the live surface when the prop changes on re-render.
        expect(injectJSON).not.toHaveBeenCalled();
      });

      it("adopts a revision through remount, not a live patch", () => {
        const onReady = vi.fn();
        const injectJSON = vi.fn();
        const methods: ExtensiveEditorRef = { ...stubMethods, injectJSON };
        extensiveEditorMock.mockImplementation((props: ExtensiveEditorProps) => (
          <ReadyEditorMock props={props} methods={methods} />
        ));

        const { rerender } = render(
          <PapyraEditor
            key="rev-1"
            showDefaultContent={false}
            defaultContent="# One"
            onReady={onReady}
          />,
        );
        expect(onReady).toHaveBeenCalledTimes(1);

        // A new React key fully remounts the editor with the adopted body; the
        // wrapper re-runs onReady on the fresh instance and patches nothing.
        rerender(
          <PapyraEditor
            key="rev-2"
            showDefaultContent={false}
            defaultContent="# Two"
            onReady={onReady}
          />,
        );
        expect(onReady).toHaveBeenCalledTimes(2);
        expect(injectJSON).not.toHaveBeenCalled();
      });

      it("only mutates the body through the explicit setMarkdown ref call", () => {
        const ref = createRef<PapyraEditorRef>();
        const injectJSON = vi.fn();
        const methods: ExtensiveEditorRef = { ...stubMethods, injectJSON };
        renderWithReadyEditor(ref, { methods });

        // No imperative call yet: nothing has touched the mounted document.
        expect(injectJSON).not.toHaveBeenCalled();

        ref.current?.setMarkdown("# Adopted");
        expect(injectJSON).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("host adapter", () => {
    function AdapterProbe({
      onResolve,
    }: {
      onResolve: (adapter: PapyraEditorAdapter) => void;
    }) {
      onResolve(usePapyraAdapter());
      return null;
    }

    it("provides the injected adapter to embeds through context", () => {
      const adapter: PapyraEditorAdapter = {
        resolveMediaUrl: vi.fn((filename) => `/media/${filename}`),
        uploadMedia: vi.fn(() => Promise.resolve({ filename: "stored.png" })),
        openNote: vi.fn(),
        searchNotes: vi.fn(() => Promise.resolve([])),
      };
      const resolved = vi.fn();
      extensiveEditorMock.mockImplementation(() => (
        <AdapterProbe onResolve={resolved} />
      ));

      render(<PapyraEditor showDefaultContent={false} adapter={adapter} />);

      expect(resolved).toHaveBeenCalledWith(adapter);
    });

    it("falls back to a graceful no-op adapter when the host injects none", () => {
      const resolved = vi.fn();
      extensiveEditorMock.mockImplementation(() => (
        <AdapterProbe onResolve={resolved} />
      ));

      render(<PapyraEditor showDefaultContent={false} />);

      const adapter = resolved.mock.calls.at(-1)?.[0] as PapyraEditorAdapter;
      // The fallback echoes the filename and never throws, so embeds degrade to
      // plain references instead of breaking the markdown body.
      expect(adapter.resolveMediaUrl("photo.png")).toBe("photo.png");
      expect(adapter.openNote({ title: "Note" })).toBeUndefined();
    });

    it("exposes a fallback adapter that degrades every capability gracefully", async () => {
      const fallback = createFallbackPapyraAdapter();

      expect(fallback.resolveMediaUrl("clip.mp4")).toBe("clip.mp4");
      await expect(
        fallback.uploadMedia(new File(["x"], "drop.png")),
      ).resolves.toEqual({ filename: "drop.png" });
      await expect(fallback.searchNotes("anything")).resolves.toEqual([]);
      await expect(
        fallback.resolveBlock?.({ note: "Note", blockId: "abc" }),
      ).resolves.toBeNull();
    });
  });

  describe("custom slash commands", () => {
    it("contributes the curated Papyra slash commands", () => {
      render(<PapyraEditor showDefaultContent={false} />);

      const extra = lastProps().extraSlashCommands ?? [];
      expect(extra.map((command) => command.id)).toEqual([
        "papyra.link-note",
        "papyra.embed-media",
        "papyra.insert-date",
      ]);
      for (const command of extra) {
        expect(command.category).toBe("Insert");
        expect(typeof command.action).toBe("function");
      }
    });

    it("drops the [[ typeahead trigger for Link note", () => {
      render(<PapyraEditor showDefaultContent={false} />);

      const command = (lastProps().extraSlashCommands ?? []).find(
        (entry) => entry.id === "papyra.link-note",
      );
      const insertText = vi.fn();
      command?.action({ insertText });

      // The wikilink typeahead opens on the inserted `[[`; the adapter drives it.
      expect(insertText).toHaveBeenCalledWith("[[");
    });

    it("inserts today's date as YYYY-MM-DD for Insert date", () => {
      render(<PapyraEditor showDefaultContent={false} />);

      const command = (lastProps().extraSlashCommands ?? []).find(
        (entry) => entry.id === "papyra.insert-date",
      );
      const insertText = vi.fn();
      command?.action({ insertText });

      expect(insertText).toHaveBeenCalledTimes(1);
      expect(insertText.mock.calls[0]?.[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("uploads through the adapter and embeds the result for Embed media", async () => {
      const uploadMedia = vi.fn(() => Promise.resolve({ filename: "stored.png" }));
      const adapter: PapyraEditorAdapter = {
        resolveMediaUrl: (filename) => filename,
        uploadMedia,
        openNote: vi.fn(),
        searchNotes: () => Promise.resolve([]),
      };
      render(<PapyraEditor showDefaultContent={false} adapter={adapter} />);

      const command = (lastProps().extraSlashCommands ?? []).find(
        (entry) => entry.id === "papyra.embed-media",
      );

      // Stub the transient file picker: as soon as it "opens", feed it a file.
      const file = new File(["x"], "drop.png", { type: "image/png" });
      const realCreateElement = document.createElement.bind(document);
      const createSpy = vi
        .spyOn(document, "createElement")
        .mockImplementation((tagName: string) => {
          const element = realCreateElement(tagName);
          if (tagName === "input") {
            (element as HTMLInputElement).click = () => {
              Object.defineProperty(element, "files", {
                value: [file],
                configurable: true,
              });
              element.dispatchEvent(new Event("change"));
            };
          }
          return element;
        });

      try {
        const insertText = vi.fn();
        await command?.action({ insertText });

        expect(uploadMedia).toHaveBeenCalledWith(file);
        expect(insertText).toHaveBeenCalledWith("![[stored.png]]");
      } finally {
        createSpy.mockRestore();
      }
    });
  });
});
