/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { createRef } from "react";
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

    function renderWithReadyEditor(
      ref: React.RefObject<PapyraEditorRef | null>,
    ) {
      extensiveEditorMock.mockImplementation((props: ExtensiveEditorProps) => {
        props.onReady?.(stubMethods);
        return <div contentEditable suppressContentEditableWarning />;
      });
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

    it("exposes outline and block readers (stubbed until later sprints)", () => {
      const ref = createRef<PapyraEditorRef>();
      renderWithReadyEditor(ref);

      expect(ref.current?.getOutline()).toEqual([]);
      expect(ref.current?.getBlocks()).toEqual([]);
    });

    it("hands the Papyra ref to onReady", () => {
      const onReady = vi.fn();
      extensiveEditorMock.mockImplementation((props: ExtensiveEditorProps) => {
        props.onReady?.(stubMethods);
        return null;
      });

      render(<PapyraEditor showDefaultContent={false} onReady={onReady} />);

      expect(onReady).toHaveBeenCalledTimes(1);
      const handed = onReady.mock.calls[0][0] as PapyraEditorRef;
      expect(typeof handed.setMarkdown).toBe("function");
      expect(typeof handed.focus).toBe("function");
      expect(typeof handed.getOutline).toBe("function");
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
