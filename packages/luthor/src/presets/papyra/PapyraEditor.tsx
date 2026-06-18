/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
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
  PAPYRA_EMBED_NODES,
  PAPYRA_EMBED_TRANSFORMERS,
  buildPapyraEmbedExtensions,
  createPapyraEmbedResolvers,
} from "./embeds";
import {
  PAPYRA_HEADING_OPTIONS,
  PAPYRA_SHORTCUT_CONFIG,
  PAPYRA_SLASH_COMMAND_VISIBILITY,
  createPapyraSlashCommands,
} from "./commands";
import { papyraFeaturePolicy } from "./features";
import {
  PAPYRA_OUTLINE_DEBOUNCE_MS,
  extractBlockAnchors,
  extractMentions,
  readOutline,
  scrollToOutlineHeading,
} from "./navigation";
import {
  PAPYRA_COLORED_VARIANT_CLASS,
  createPapyraThemeOverrides,
} from "./theme";
import { PAPYRA_TOOLBAR_LAYOUT, PAPYRA_TOOLBAR_VISIBILITY } from "./toolbar";

/**
 * Modes Papyra ever exposes: the visual canvas and a raw markdown source view.
 * JSON/HTML are intentionally absent — markdown is the source of truth.
 */
export const PAPYRA_AVAILABLE_MODES = ["visual", "markdown"] as const;

/**
 * Modes used while {@link PapyraEditorProps.readOnly | readOnly} is set. The
 * visual surface is mounted in `visual-only` (non-editable) so it can never
 * promote to an editable caret — there is no `visual-editor` mode to promote
 * into, and `editOnClick` is forced off — so the surface emits no edits. This is
 * what makes `readOnly` safe for time-machine scrubbing and revision previews.
 */
export const PAPYRA_READONLY_MODES = ["visual-only", "markdown"] as const;

/** Marker class the wrapper carries for the wide-measure focus variant. */
export const PAPYRA_FOCUS_VARIANT_CLASS = "luthor-preset-papyra--focus";

/** Marker class the wrapper carries while {@link PapyraEditorProps.locked}. */
export const PAPYRA_LOCKED_VARIANT_CLASS = "luthor-preset-papyra--locked";

/**
 * Reading-surface variant. `default` is the standard editorial measure;
 * `focus` widens to a centered, distraction-free column and keeps the only
 * chrome (the floating toolbar) hidden until there is a selection.
 */
export type PapyraEditorVariant = "default" | "focus";

const PAPYRA_DEFAULT_PLACEHOLDER = "Start writing…";

const PAPYRA_DEFAULT_LOCKED_LABEL = "This note is locked";

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
 * drives: `setMarkdown` (host-driven adopt), `focus`, the outline/block readers,
 * scroll-to-heading, and mention detection.
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
  /**
   * Current document outline in document order, read from the rendered editable
   * surface. Returns `[]` when no visual surface is mounted (e.g. the markdown
   * source view). Pair with {@link onOutlineChange} for a live table of contents.
   */
  getOutline: () => PapyraOutlineHeading[];
  /**
   * Scroll the heading addressed by `key` into view. Pass a `key` from a fresh
   * {@link getOutline} call (keys track document position).
   */
  scrollToHeading: (key: string) => void;
  /** All trailing `^uuid` block anchors in the body. */
  getBlocks: () => PapyraBlockAnchor[];
  /**
   * Distinct `@username` mentions in the body, in first-seen order. The host
   * routes these to its inbox via `adapter.onMentions` during its save
   * orchestration — the preset only detects, it never fires on keystrokes.
   */
  getMentions: () => string[];
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
  | "toolbarLayout"
  | "isListStyleDropdownEnabled"
  | "markdownSourceOfTruth"
  | "sourceMetadataMode"
  | "extraExtensions"
  | "markdownExtraNodes"
  | "markdownExtraTransformers"
  | "headingOptions"
  | "slashCommandVisibility"
  | "extraSlashCommands"
  | "shortcutConfig"
  | "toolbarVisibility"
  | "onReady"
> & {
  onReady?: (methods: PapyraEditorRef) => void;
  /**
   * Fired (debounced) whenever the document outline changes, with the current
   * outline in document order. Drives a host's live table-of-contents scrollbar.
   * Read-only observation of the rendered surface — it never touches the caret.
   * Omit it to skip outline tracking entirely.
   */
  onOutlineChange?: (outline: PapyraOutlineHeading[]) => void;
  /**
   * Light-lock for tinted ("colored") notes. When the host paints the note
   * paper with a per-note tint, set this so the editor stays on its light
   * editorial palette regardless of the ambient app theme — otherwise ink can
   * wash out on the tint. Forces `initialTheme="light"` and adds the colored
   * variant class. Defaults to `false`.
   */
  colored?: boolean;
  /**
   * Render the note as a non-editable surface. The host decides *when* (revision
   * preview, time-machine scrubbing, a read-only share); the preset decides
   * *how* — the visual surface mounts in `visual-only` mode with click-to-edit
   * promotion disabled, so it never produces an editable caret and emits no
   * change events. Pair with repeated `setMarkdown` calls for time-machine
   * scrubbing without arming autosave. Defaults to `false`.
   */
  readOnly?: boolean;
  /**
   * Reading-surface variant. `"focus"` widens the body to a centered,
   * distraction-free measure and keeps chrome out of the way until there is a
   * selection; `"default"` is the standard editorial measure. The host decides
   * when to enter focus mode. Defaults to `"default"`.
   */
  variant?: PapyraEditorVariant;
  /**
   * Show a persistent toolbar above the editor. By default Papyra ships
   * **chrome-light** — its only toolbar is the floating-on-selection one (plus
   * slash `/` and the command palette), per the preset's minimal-chrome
   * contract. Set this to opt into an always-visible toolbar restricted to
   * Papyra's markdown-safe actions (see {@link PAPYRA_TOOLBAR_LAYOUT}): history,
   * headings/paragraph, quote, bold/italic/strikethrough/inline-code/link,
   * lists + checklist, code block, horizontal rule, table, and image. The
   * restricted controls (typography pickers, color/highlight, sub/superscript,
   * alignment, theme toggle) can never appear — they stay pinned off by the
   * toolbar visibility contract and the enforced feature policy. The toolbar is
   * not pinned/sticky (the pinned toolbar stays enforced off) and only renders
   * in the editable visual surface, so `readOnly`/`locked` never show it.
   * Defaults to `false`.
   */
  toolbar?: boolean;
  /**
   * Withhold the body entirely. When `true`, the preset renders a blurred
   * placeholder and **never mounts the editor or the note's text** — there is no
   * plaintext in the DOM to scrape. This is the UX half of Papyra's secure
   * notes: the host keeps `locked` set while its server withholds the body
   * (`401`/`PathGuard`), then flips it off and remounts (new React `key`) with
   * the decrypted body once the note is unlocked. The lock is never the security
   * boundary — the server is — but it guarantees the editor leaks nothing.
   * Defaults to `false`.
   */
  locked?: boolean;
  /**
   * Custom content for the {@link locked} placeholder. Omit it for the default
   * blurred lock surface. Whatever is passed renders *instead of* the note body,
   * so it must not contain the note's plaintext.
   */
  lockedPlaceholder?: ReactNode;
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
      readOnly = false,
      variant = "default",
      toolbar = false,
      locked = false,
      lockedPlaceholder,
      adapter,
      onReady,
      onOutlineChange,
      ...props
    },
    ref,
  ) => {
    const innerRef = useRef<ExtensiveEditorRef | null>(null);
    const hostRef = useRef<HTMLDivElement | null>(null);
    const [isReady, setIsReady] = useState(false);

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
        getOutline: () => readOutline(hostRef.current),
        scrollToHeading: (key) => {
          scrollToOutlineHeading(hostRef.current, key);
        },
        getBlocks: () => extractBlockAnchors(innerRef.current?.getMarkdown() ?? ""),
        getMentions: () => extractMentions(innerRef.current?.getMarkdown() ?? ""),
      }),
      [],
    );

    useImperativeHandle(ref, () => handle, [handle]);

    const handleInnerReady = useCallback(
      (methods: ExtensiveEditorRef) => {
        innerRef.current = methods;
        setIsReady(true);
        onReady?.(handle);
      },
      [handle, onReady],
    );

    // Keep the latest outline listener in a ref so the observer effect only
    // re-attaches when the listener's presence toggles, not on every render.
    const hasOutlineListener = typeof onOutlineChange === "function";
    const outlineChangeRef = useRef(onOutlineChange);
    outlineChangeRef.current = onOutlineChange;

    // Debounced, read-only outline tracking. A MutationObserver over the host
    // subtree recomputes the outline after edits settle and hands it to the
    // listener — observation only, the caret is never touched. Guarded for SSR /
    // no-DOM environments.
    useEffect(() => {
      if (!isReady || !hasOutlineListener) {
        return;
      }

      const host = hostRef.current;
      if (!host || typeof MutationObserver === "undefined") {
        return;
      }

      let timer: ReturnType<typeof setTimeout> | undefined;
      const emit = () => outlineChangeRef.current?.(readOutline(host));
      const schedule = () => {
        if (timer) {
          clearTimeout(timer);
        }
        timer = setTimeout(emit, PAPYRA_OUTLINE_DEBOUNCE_MS);
      };

      // Emit the initial outline once the editable surface is mounted.
      emit();

      const observer = new MutationObserver(schedule);
      observer.observe(host, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      return () => {
        observer.disconnect();
        if (timer) {
          clearTimeout(timer);
        }
      };
    }, [isReady, hasOutlineListener]);

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

    // Papyra's curated note-taking slash commands (Link note / Embed media /
    // Insert date), bound to the active adapter. Appended to the built-in
    // catalogue through the extensive editor's extraSlashCommands seam.
    const slashCommands = useMemo(
      () => createPapyraSlashCommands(resolvedAdapter),
      [resolvedAdapter],
    );

    // Build extra extensions including the upload pipeline (adapter-dependent).
    const embedExtensions = useMemo(
      () => buildPapyraEmbedExtensions(adapter),
      [adapter],
    );

    // The preset class set is shared by the live editor and the locked
    // placeholder so theming (and the colored light-lock) applies to both.
    const presetClassName = joinClassNames(
      "luthor-preset-papyra",
      colored ? PAPYRA_COLORED_VARIANT_CLASS : undefined,
      variant === "focus" ? PAPYRA_FOCUS_VARIANT_CLASS : undefined,
      className,
    );

    // Locked: render a blurred placeholder and never mount the editor or the
    // note's text. The host flips `locked` off and remounts (new React `key`)
    // with the real body once its server releases it; until then there is no
    // plaintext in the DOM to leak. Hooks above still run unconditionally.
    if (locked) {
      return (
        <div
          ref={hostRef}
          className={joinClassNames(presetClassName, PAPYRA_LOCKED_VARIANT_CLASS)}
          data-papyra-locked="true"
          role="status"
          aria-label={PAPYRA_DEFAULT_LOCKED_LABEL}
        >
          {lockedPlaceholder ?? (
            <div className="luthor-preset-papyra__lock" aria-hidden="true">
              <span className="luthor-preset-papyra__lock-line" />
              <span className="luthor-preset-papyra__lock-line" />
              <span className="luthor-preset-papyra__lock-line" />
            </div>
          )}
        </div>
      );
    }

    // Read-only mounts the visual surface in `visual-only` (non-editable) with
    // click-to-edit promotion disabled, so it never arms a caret or emits edits.
    // These land after `{...props}` so they override any caller-supplied mode.
    const readStateProps = readOnly
      ? {
          availableModes: PAPYRA_READONLY_MODES,
          defaultEditorView: "visual-only" as const,
          editOnClick: false,
        }
      : { availableModes: PAPYRA_AVAILABLE_MODES };

    return (
      <div ref={hostRef} style={{ display: "contents" }}>
        <PapyraAdapterContext.Provider value={resolvedAdapter}>
          <EmbedResolverProvider resolvers={embedResolvers}>
            <ExtensiveEditor
              {...props}
              onReady={handleInnerReady}
              extraExtensions={embedExtensions}
              markdownExtraNodes={PAPYRA_EMBED_NODES}
              markdownExtraTransformers={PAPYRA_EMBED_TRANSFORMERS}
              className={presetClassName}
              variantClassName={joinClassNames(
                "luthor-preset-papyra__variant",
                variantClassName,
              )}
              placeholder={placeholder ?? PAPYRA_DEFAULT_PLACEHOLDER}
              {...readStateProps}
              isEditorViewTabsVisible={false}
              isToolbarEnabled={toolbar}
              isToolbarPinned={false}
              toolbarLayout={PAPYRA_TOOLBAR_LAYOUT}
              isListStyleDropdownEnabled={false}
              toolbarVisibility={PAPYRA_TOOLBAR_VISIBILITY}
              headingOptions={PAPYRA_HEADING_OPTIONS}
              slashCommandVisibility={PAPYRA_SLASH_COMMAND_VISIBILITY}
              extraSlashCommands={slashCommands}
              shortcutConfig={PAPYRA_SHORTCUT_CONFIG}
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
