/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { EmbedResolverProvider, markdownToJSON } from "@lyfie/luthor-headless";
import type { EmbedResolvers } from "@lyfie/luthor-headless";
import type {
  ExtensiveEditorProps,
  ExtensiveEditorRef,
  FeatureFlagOverrides,
} from "../extensive";
import { ExtensiveEditor } from "../extensive";
import { joinClassNames } from "../_shared";
import {
  PapyraAdapterContext,
  createFallbackPapyraAdapter,
  type PapyraEditorAdapter,
} from "./adapter";
import {
  PAPYRA_EMBED_EXTENSIONS,
  PAPYRA_EMBED_NODES,
  PAPYRA_EMBED_TRANSFORMERS,
  createPapyraEmbedResolvers,
} from "./embeds";
import { papyraFeaturePolicy } from "./features";
import {
  PAPYRA_COLORED_VARIANT_CLASS,
  createPapyraThemeOverrides,
} from "./theme";

/**
 * Modes Papyra ever exposes: the visual canvas and a raw markdown source view.
 * JSON/HTML are intentionally absent — markdown is the source of truth.
 */
export const PAPYRA_AVAILABLE_MODES = ["visual", "markdown"] as const;

const PAPYRA_DEFAULT_PLACEHOLDER = "Start writing…";

/**
 * One heading in the document outline. The shape matches what Papyra's TOC
 * scrollbar consumes. `getOutline()` returns these in document order.
 *
 * @remarks Stubbed (returns `[]`) until Sprint 1.4 wires the live outline.
 */
export interface PapyraOutlineHeading {
  /** Heading level, 1–6. */
  level: number;
  /** Plain-text heading content. */
  text: string;
  /** Stable node key, used by `scrollToHeading`. */
  key: string;
  /** Pixel offset of the heading from the top of the scroll container. */
  top: number;
}

/**
 * A trailing `^uuid` block anchor discovered in the body. Block anchors are
 * non-rendering and let Papyra address a specific block for transclusion.
 *
 * @remarks Stubbed (returns `[]`) until Sprint 1.3 ships the block-anchor node.
 */
export interface PapyraBlockAnchor {
  /** The anchor id (the part after `^`). */
  blockId: string;
  /** Stable node key of the anchored block. */
  key: string;
}

/**
 * Imperative handle a Papyra host captures through the React ref or `onReady`.
 * Extends {@link ExtensiveEditorRef} with the markdown-first surface Papyra
 * drives: `setMarkdown` (host-driven adopt), `focus`, and the outline/block
 * readers (stubbed here, filled in Sprints 1.3–1.4).
 */
export interface PapyraEditorRef extends ExtensiveEditorRef {
  /**
   * Replace the body with parsed markdown. This is an explicit, host-driven
   * imperative call (used for time-machine scrubbing and remote adoption), not a
   * controlled value path — it never fires on keystrokes. The caret stays sacred
   * because the host decides when to call it.
   */
  setMarkdown: (markdown: string) => void;
  /** Move focus into the editable surface. */
  focus: () => void;
  /** Current document outline in document order. */
  getOutline: () => PapyraOutlineHeading[];
  /** All trailing `^uuid` block anchors in the body. */
  getBlocks: () => PapyraBlockAnchor[];
}

/**
 * Props for {@link PapyraEditor}. This is {@link ExtensiveEditorProps} with the
 * locked contract removed — callers cannot reach the props Papyra owns:
 * `availableModes`, the view-tabs toggles, the pinned/enabled toolbar switches,
 * `markdownSourceOfTruth`, and `sourceMetadataMode`. `featureFlags` is re-opened
 * but routed through {@link papyraFeaturePolicy}, so the enforced restrictions
 * can never be switched back on. `onReady` is narrowed to the
 * {@link PapyraEditorRef}.
 *
 * Theming is token-driven: caller `editorThemeOverrides` are layered on top of
 * the Papyra token bridge (see {@link createPapyraThemeOverrides}), and the
 * `colored` flag light-locks tinted notes.
 */
export type PapyraEditorProps = Omit<
  ExtensiveEditorProps,
  | "availableModes"
  | "isEditorViewTabsVisible"
  | "isEditorViewsTabVisible"
  | "isToolbarEnabled"
  | "isToolbarPinned"
  | "markdownSourceOfTruth"
  | "sourceMetadataMode"
  | "extraExtensions"
  | "markdownExtraNodes"
  | "markdownExtraTransformers"
  | "onReady"
> & {
  onReady?: (methods: PapyraEditorRef) => void;
  /**
   * Light-lock for tinted ("colored") notes. When the host paints the note
   * paper with a per-note tint, set this so the editor stays on its light
   * editorial palette regardless of the ambient app theme — otherwise ink can
   * wash out on the tint. Forces `initialTheme="light"` and adds the colored
   * variant class. Defaults to `false`.
   */
  colored?: boolean;
  /**
   * The host seam. Supplies the editor with media resolution, uploads, note
   * search/navigation, and block resolution for the Papyra embeds
   * (`![[media]]`, `[[Note]]`, `![[Note#^id]]`). When omitted, the preset uses a
   * graceful no-op adapter (see {@link createFallbackPapyraAdapter}) so the
   * editor still renders and round-trips its markdown without a host. The
   * adapter is the only data path out of the editor, and its resolvers are where
   * the host's server-side authorization lives — the editor's blur/lock UX is
   * never the security boundary.
   */
  adapter?: PapyraEditorAdapter;
};

function focusEditableWithin(host: HTMLElement | null): void {
  host?.querySelector<HTMLElement>('[contenteditable="true"]')?.focus();
}

/**
 * `<PapyraEditor>` — the markdown-native note canvas Papyra ships.
 *
 * A thin wrapper over {@link ExtensiveEditor} that hard-locks Papyra's contract:
 * a visual + markdown-source surface, no view tabs, no pinned/persistent
 * toolbar (floating-on-selection only), markdown as the source of truth, and a
 * metadata-free source conversion (`sourceMetadataMode="none"`) so the body
 * never carries an envelope. Caller `featureFlags` are resolved through
 * {@link papyraFeaturePolicy}; the enforced restrictions cannot be re-enabled.
 *
 * **Uncontrolled by design.** The editor reads `defaultContent` once on mount
 * and never again — there is no `value`/`onChange` round-trip. Adopting a remote
 * revision is a host-driven remount (change the React `key`) or an explicit
 * `setMarkdown` call, never a live-DOM patch on keystroke. Read the body
 * imperatively through the ref (or the ref handed to `onReady`). This is what
 * keeps the caret sacred during Papyra's local-first sync.
 */
export const PapyraEditor = forwardRef<PapyraEditorRef, PapyraEditorProps>(
  (
    {
      className,
      variantClassName,
      placeholder,
      featureFlags,
      editorThemeOverrides,
      initialTheme,
      colored = false,
      adapter,
      onReady,
      ...props
    },
    ref,
  ) => {
    const innerRef = useRef<ExtensiveEditorRef | null>(null);
    const hostRef = useRef<HTMLDivElement | null>(null);

    const handle = useMemo<PapyraEditorRef>(
      () => ({
        injectJSON: (content) => innerRef.current?.injectJSON(content),
        getJSON: () => innerRef.current?.getJSON() ?? "",
        getHTML: () => innerRef.current?.getHTML() ?? "",
        getMarkdown: () => innerRef.current?.getMarkdown() ?? "",
        setMarkdown: (markdown) => {
          const document = markdownToJSON(markdown, {
            metadataMode: "none",
            extraNodes: PAPYRA_EMBED_NODES,
            extraTransformers: PAPYRA_EMBED_TRANSFORMERS,
          });
          innerRef.current?.injectJSON(JSON.stringify(document));
        },
        focus: () => focusEditableWithin(hostRef.current),
        getOutline: () => [],
        getBlocks: () => [],
      }),
      [],
    );

    useImperativeHandle(ref, () => handle, [handle]);

    const handleInnerReady = useCallback(
      (methods: ExtensiveEditorRef) => {
        innerRef.current = methods;
        onReady?.(handle);
      },
      [handle, onReady],
    );

    const resolvedFeatureFlags: FeatureFlagOverrides =
      papyraFeaturePolicy.resolve(featureFlags);

    const {
      editorThemeOverrides: resolvedThemeOverrides,
      initialTheme: lockedTheme,
    } = createPapyraThemeOverrides({
      colored,
      overrides: editorThemeOverrides,
    });

    // Resolve the host seam once per adapter identity. When the host injects no
    // adapter, fall back to the graceful no-op so the embed nodes always read a
    // usable adapter from context.
    const resolvedAdapter = useMemo<PapyraEditorAdapter>(
      () => adapter ?? createFallbackPapyraAdapter(),
      [adapter],
    );

    // Adapt the host adapter onto the generic embed-resolver contract the
    // headless wikilink/file-embed nodes read from context.
    const embedResolvers = useMemo<EmbedResolvers>(
      () => createPapyraEmbedResolvers(resolvedAdapter),
      [resolvedAdapter],
    );

    return (
      <div ref={hostRef} style={{ display: "contents" }}>
        <PapyraAdapterContext.Provider value={resolvedAdapter}>
          <EmbedResolverProvider resolvers={embedResolvers}>
            <ExtensiveEditor
              {...props}
              onReady={handleInnerReady}
              extraExtensions={PAPYRA_EMBED_EXTENSIONS}
              markdownExtraNodes={PAPYRA_EMBED_NODES}
              markdownExtraTransformers={PAPYRA_EMBED_TRANSFORMERS}
              className={joinClassNames(
                "luthor-preset-papyra",
                colored ? PAPYRA_COLORED_VARIANT_CLASS : undefined,
                className,
              )}
              variantClassName={joinClassNames(
                "luthor-preset-papyra__variant",
                variantClassName,
              )}
              placeholder={placeholder ?? PAPYRA_DEFAULT_PLACEHOLDER}
              availableModes={PAPYRA_AVAILABLE_MODES}
              isEditorViewTabsVisible={false}
              isToolbarEnabled={false}
              isToolbarPinned={false}
              markdownSourceOfTruth
              sourceMetadataMode="none"
              featureFlags={resolvedFeatureFlags}
              editorThemeOverrides={resolvedThemeOverrides}
              initialTheme={lockedTheme ?? initialTheme}
            />
          </EmbedResolverProvider>
        </PapyraAdapterContext.Provider>
      </div>
    );
  },
);

PapyraEditor.displayName = "PapyraEditor";
