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

import { PapyraEditor, type PapyraEditorRef } from "./PapyraEditor";
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
});
