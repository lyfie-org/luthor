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
import {
  EmbedResolverProvider,
  ensureBlockAnchors,
  markdownToJSON,
} from "@lyfie/luthor-headless";
import type { EmbedResolvers } from "@lyfie/luthor-headless";
// Type-only: the preset never loads the Yjs stack unless the host passes one.
import type { CollaborationExtension } from "@lyfie/luthor-headless/collab";
import type { ToolbarLayout } from "../../core";
import type {
  ExtensiveEditorProps,
  ExtensiveEditorRef,
  ExtensiveToolbarItem,
  FeatureFlagOverrides,
  MentionSuggestionProvider,
  WikilinkSuggestionProvider,
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
  PAPYRA_IMAGE_ALIGNMENT,
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
import type { PapyraTypeaheadConfig } from "./typeahead";
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
import { createPapyraToolbarItems } from "./toolbarItems";

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

/**
 * Modes used while {@link PapyraEditorProps.collaboration | collaboration} is
 * set. The markdown source view is withheld: it round-trips the whole document
 * through a full replace, which would discard concurrent peer edits.
 */
export const PAPYRA_COLLAB_MODES = ["visual"] as const;
export const PAPYRA_COLLAB_READONLY_MODES = ["visual-only"] as const;

/**
 * Live multi-user editing for {@link PapyraEditorProps.collaboration}: a
 * `CollaborationExtension` from `@lyfie/luthor-headless/collab`. The shared Yjs
 * document is the body: `defaultContent` is ignored, `setMarkdown` /
 * `injectJSON` throw, block anchors are never stamped client-side (the server
 * that persists the doc owns them), and undo only reverts this user's edits.
 */
export type PapyraCollaboration = CollaborationExtension;

const COLLAB_ADOPT_ERROR =
  "PapyraEditor: the body is owned by the collaboration document; setMarkdown/injectJSON are disabled while `collaboration` is set.";

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
 * The block's own text and markdown offsets ride along so a host can resolve
 * a `#^id` reference without re-parsing the document.
 */
export interface PapyraBlockAnchor {
  /** The anchor id (the part after `^`). */
  blockId: string;
  /** Stable node key of the anchored block. */
  key: string;
  /** The anchored line's markdown, without the trailing ` ^id` suffix. */
  text: string;
  /** Zero-based line index of the anchored line in the markdown body. */
  line: number;
  /** Character offset of the anchored line's start in the markdown body. */
  start: number;
  /** Character offset of the anchored line's end (incl. the anchor suffix). */
  end: number;
}

/**
 * Block-anchor assignment policy.
 *
 * - `"off"` (default): the preset parses, renders, and round-trips anchors
 *   that already exist in the text, but never creates one.
 * - `"on-demand"`: nothing stamps automatically; the host calls
 *   {@link PapyraEditorRef.ensureBlockAnchors} (typically at save time).
 * - `"auto"`: every eligible top-level block (paragraph, heading, quote) gets
 *   a stable `^id` appended on commit. Anchors are invisible in the visual
 *   surface and survive markdown round-trips losslessly.
 */
export type PapyraBlockAnchorMode = "off" | "on-demand" | "auto";

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
   * Stamp a stable `^id` anchor onto every eligible top-level block that does
   * not already carry one, and return the resulting markdown. Existing ids are
   * kept; the pass is synchronous, so the returned string is the stamped body.
   * For hosts that assign anchors only at save time (the `"on-demand"`
   * {@link PapyraEditorProps.blockAnchors | blockAnchors} mode) — though it
   * works in any mode when called explicitly.
   */
  ensureBlockAnchors: () => string;
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
  | "markdownImageAlignment"
  | "headingOptions"
  | "slashCommandVisibility"
  | "extraSlashCommands"
  | "shortcutConfig"
  | "toolbarVisibility"
  | "onReady"
  | "presetId"
  | "wikilinkSuggestionProvider"
  | "mentionSuggestionProvider"
  | "wikilinkSuggestionLabels"
  | "mentionSuggestionLabels"
  | "typeaheadSearchDebounceMs"
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
   * Papyra's markdown-safe actions (see {@link PAPYRA_TOOLBAR_LAYOUT}):
   * headings/paragraph, quote, bold/italic/strikethrough/inline-code/link,
   * lists + checklist, code block, horizontal rule, table, and image — then
   * Papyra's own inserts (link a note, mention someone, attach file, YouTube /
   * web page embed, today's date; see {@link createPapyraToolbarItems}). The
   * prop is live: toggling it shows or hides the toolbar without remounting the
   * editor, so the caret and undo history survive. The restricted controls (typography pickers, color/highlight, sub/superscript,
   * alignment, theme toggle) can never appear — they stay pinned off by the
   * toolbar visibility contract and the enforced feature policy. The toolbar is
   * not pinned/sticky (the pinned toolbar stays enforced off) and only renders
   * in the editable visual surface, so `readOnly`/`locked` never show it.
   * Defaults to `false`.
   */
  toolbar?: boolean;
  /**
   * The persistent toolbar's layout — order, sections, and which sections
   * collapse behind one button (`group`). Defaults to
   * {@link PAPYRA_TOOLBAR_LAYOUT}. Restricted items (typography pickers,
   * colours, alignment, …) are still stripped by the toolbar visibility
   * contract, so a host layout cannot bring them back. Place host controls
   * with `"customComponent"` (all of them) or `"custom:<id>"` (one).
   */
  toolbarLayout?: ToolbarLayout;
  /**
   * Host controls for the persistent toolbar, rendered where the layout places
   * them. Defaults to the preset's own inserts ({@link createPapyraToolbarItems});
   * pass your own to replace them — with the host's icons, grouping and
   * behaviour. Memoize the array.
   */
  toolbarItems?: readonly ExtensiveToolbarItem[];
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
   * Block-anchor assignment policy. Defaults to `"off"` so existing consumers
   * are untouched: anchors already present in the text keep parsing,
   * rendering, and round-tripping, but nothing creates one. `"on-demand"`
   * leaves stamping to {@link PapyraEditorRef.ensureBlockAnchors}; `"auto"`
   * stamps every eligible block on commit. See {@link PapyraBlockAnchorMode}.
   */
  blockAnchors?: PapyraBlockAnchorMode;
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
  /**
   * Host tuning for the two trigger menus — the `@` people trigger and the
   * `[[` note-link trigger. Covers how eagerly each opens
   * (`minQueryLength`, `0` by default so a bare trigger opens the menu), where
   * it sits relative to the caret (`offset`), its copy (`title`,
   * `emptyLabel`), whether it exists at all (`disabled`), and the search
   * debounce both share (`searchDebounceMs`).
   *
   * Every field is optional and defaults to today's behaviour, so omitting the
   * prop changes nothing. See {@link PapyraTypeaheadConfig}.
   *
   * The `@` trigger additionally requires `adapter.searchUsers`: no people
   * search, no menu, regardless of this config.
   */
  typeahead?: PapyraTypeaheadConfig;
  /**
   * Bind the editor to a shared Yjs document for live multi-cursor editing —
   * pass a `new CollaborationExtension({...})` from
   * `@lyfie/luthor-headless/collab`, memoized per room (a new instance, or a
   * different room, needs a remount via a new React `key`). See
   * {@link PapyraCollaboration}. Omit for the classic uncontrolled,
   * autosave-driven editor.
   */
  collaboration?: PapyraCollaboration;
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
      toolbarLayout,
      toolbarItems: hostToolbarItems,
      locked = false,
      lockedPlaceholder,
      blockAnchors = "off",
      adapter,
      typeahead,
      collaboration,
      onReady,
      onOutlineChange,
      ...props
    },
    ref,
  ) => {
    const innerRef = useRef<ExtensiveEditorRef | null>(null);
    const hostRef = useRef<HTMLDivElement | null>(null);
    const [isReady, setIsReady] = useState(false);
    const isCollaborative = collaboration !== undefined;
    const isCollaborativeRef = useRef(isCollaborative);
    isCollaborativeRef.current = isCollaborative;

    const handle = useMemo<PapyraEditorRef>(
      () => ({
        injectJSON: (content) => {
          if (isCollaborativeRef.current) {
            throw new Error(COLLAB_ADOPT_ERROR);
          }
          innerRef.current?.injectJSON(content);
        },
        getLexicalEditor: () => innerRef.current?.getLexicalEditor() ?? null,
        getJSON: () => innerRef.current?.getJSON() ?? "",
        getHTML: () => innerRef.current?.getHTML() ?? "",
        getMarkdown: () => innerRef.current?.getMarkdown() ?? "",
        setMarkdown: (markdown) => {
          if (isCollaborativeRef.current) {
            throw new Error(COLLAB_ADOPT_ERROR);
          }
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
        ensureBlockAnchors: () => {
          const editor = innerRef.current?.getLexicalEditor();
          // Collaborative docs are stamped by their single persisting authority;
          // concurrent client stamping would give one block several ids.
          if (editor && !isCollaborativeRef.current) {
            ensureBlockAnchors(editor);
          }
          return innerRef.current?.getMarkdown() ?? "";
        },
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

    // Memoised: a fresh object every render re-registered the content guards
    // (see ExtensiveEditor), and each registration is an editor update that
    // writes the retained selection back to the DOM — pulling focus into the
    // body while the host's title field was being typed in.
    const resolvedFeatureFlags = useMemo<FeatureFlagOverrides>(
      () => papyraFeaturePolicy.resolve(featureFlags),
      [featureFlags],
    );

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

    // The persistent toolbar's Papyra inserts. Mention and attach only appear
    // when the host wired what they need — mirrors how buildPapyraEmbedExtensions
    // registers the `@` typeahead and the upload pipeline.
    const mentionEnabled = Boolean(adapter?.searchUsers) && !typeahead?.mention?.disabled;
    const defaultToolbarItems = useMemo(
      () => createPapyraToolbarItems({ mention: mentionEnabled, attach: Boolean(adapter) }),
      [mentionEnabled, adapter],
    );
    const toolbarItems = hostToolbarItems ?? defaultToolbarItems;

    // The typeahead dropdowns are host-driven: the headless `[[` and `@`
    // triggers own detection and insertion, the host owns the data. Both
    // providers are gated on a real adapter (never the no-op fallback) so a
    // hostless editor shows no menu instead of an empty one — and on the host's
    // own `disabled` switch, which drops the trigger extension too.
    const isNoteLinkDisabled = typeahead?.noteLink?.disabled === true;
    const isMentionDisabled = typeahead?.mention?.disabled === true;

    const wikilinkSuggestionProvider = useMemo<
      WikilinkSuggestionProvider | undefined
    >(() => {
      if (!adapter || isNoteLinkDisabled) {
        return undefined;
      }
      return (query) => adapter.searchNotes(query);
    }, [adapter, isNoteLinkDisabled]);

    const mentionSuggestionProvider = useMemo<
      MentionSuggestionProvider | undefined
    >(() => {
      if (!adapter?.searchUsers || isMentionDisabled) {
        return undefined;
      }
      return (query) => adapter.searchUsers!(query);
    }, [adapter, isMentionDisabled]);

    // Build extra extensions including the upload pipeline (adapter-dependent),
    // the host-tuned typeahead triggers, and — in `blockAnchors: "auto"` — the
    // auto-stamping anchor extension.
    const autoStampBlockAnchors = blockAnchors === "auto" && !isCollaborative;
    const collaborationExtension = collaboration;
    // Uploads read the adapter live (see buildPapyraEmbedExtensions).
    const adapterRef = useRef(adapter);
    adapterRef.current = adapter;
    const embedExtensions = useMemo(() => {
      const extensions = buildPapyraEmbedExtensions(adapter, {
        autoStampBlockAnchors,
        typeahead,
        liveAdapter: () => adapterRef.current,
      });
      return collaborationExtension
        ? [...extensions, collaborationExtension]
        : extensions;
    }, [adapter, autoStampBlockAnchors, typeahead, collaborationExtension]);

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
          availableModes: isCollaborative
            ? PAPYRA_COLLAB_READONLY_MODES
            : PAPYRA_READONLY_MODES,
          defaultEditorView: "visual-only" as const,
          editOnClick: false,
        }
      : {
          availableModes: isCollaborative
            ? PAPYRA_COLLAB_MODES
            : PAPYRA_AVAILABLE_MODES,
        };

    return (
      <div ref={hostRef} style={{ display: "contents" }}>
        <PapyraAdapterContext.Provider value={resolvedAdapter}>
          <EmbedResolverProvider resolvers={embedResolvers}>
            <ExtensiveEditor
              {...props}
              presetId="papyra"
              onReady={handleInnerReady}
              extraExtensions={embedExtensions}
              markdownExtraNodes={PAPYRA_EMBED_NODES}
              markdownExtraTransformers={PAPYRA_EMBED_TRANSFORMERS}
              markdownImageAlignment={PAPYRA_IMAGE_ALIGNMENT}
              wikilinkSuggestionProvider={wikilinkSuggestionProvider}
              mentionSuggestionProvider={mentionSuggestionProvider}
              wikilinkSuggestionLabels={typeahead?.noteLink}
              mentionSuggestionLabels={typeahead?.mention}
              typeaheadSearchDebounceMs={typeahead?.searchDebounceMs}
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
              toolbarLayout={toolbarLayout ?? PAPYRA_TOOLBAR_LAYOUT}
              isListStyleDropdownEnabled={false}
              toolbarVisibility={PAPYRA_TOOLBAR_VISIBILITY}
              headingOptions={PAPYRA_HEADING_OPTIONS}
              slashCommandVisibility={PAPYRA_SLASH_COMMAND_VISIBILITY}
              extraSlashCommands={slashCommands}
              toolbarCustomItems={toolbarItems}
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
