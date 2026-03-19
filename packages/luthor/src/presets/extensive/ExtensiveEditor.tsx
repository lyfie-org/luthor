import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  clearLexicalSelection,
  createEditorSystem,
  createEditorThemeStyleVars,
  defaultLuthorTheme,
  htmlToJSON,
  jsonToHTML,
  jsonToMarkdown,
  markdownToJSON,
  mergeThemes,
  RichText,
  type MarkdownBridgeFlavor,
  type LuthorTheme,
  type SourceMetadataMode,
} from "@lyfie/luthor-headless";
import {
  createExtensiveExtensions,
  extensiveExtensions,
  setFloatingToolbarContext,
  resolveFeatureFlags,
  type FeatureFlags,
  type FeatureFlagOverrides,
  type FeatureFlag,
  EXTENSIVE_FEATURE_KEYS,
} from "./extensions";
import {
  CommandPalette,
  SlashCommandMenu,
  EmojiSuggestionMenu,
  commandsToCommandPaletteItems,
  commandsToSlashCommandItems,
  formatHTMLSource,
  formatJSONSource,
  formatMarkdownSource,
  generateCommands,
  ModeTabs,
  LinkHoverBubble,
  registerKeyboardShortcuts,
  SourceView,
  Toolbar,
  TRADITIONAL_TOOLBAR_LAYOUT,
  BLOCK_HEADING_LEVELS,
  type CoreEditorCommands,
  type BlockHeadingLevel,
  type ToolbarAlignment,
  type ToolbarStyleVars,
  type QuoteStyleVars,
  type DefaultSettings,
  type EditorThemeOverrides,
  type ToolbarLayout,
  type ToolbarVisibility,
  type ToolbarPosition,
  type SlashCommandVisibility,
  type KeyboardShortcut,
  type ShortcutConfig as CommandShortcutConfig,
} from "../../core";
import {
  createDefaultSettingsStyleVarRecord as sharedCreateDefaultSettingsStyleVarRecord,
  createFeatureGuardedCommands as sharedCreateFeatureGuardedCommands,
  createModeCache,
  invalidateModeCache,
  isEditableCommandTarget as sharedIsEditableCommandTarget,
  isModeCached,
  isShortcutMatch as sharedIsShortcutMatch,
  markModeCached,
  mergeToolbarVisibilityWithFeatures as sharedMergeToolbarVisibilityWithFeatures,
  normalizeStyleVarsKey as sharedNormalizeStyleVarsKey,
  type FeatureShortcutSpec,
  type ToolbarFeatureMap,
} from "../_shared";
import type {
  CommandPaletteExtension,
  SlashCommandExtension,
  EmojiExtension,
  EmojiCatalogItem,
  CodeHighlightProvider,
  CodeLanguageOptionsConfig,
  FontFamilyOption,
  FontSizeOption,
  LineHeightOption,
} from "@lyfie/luthor-headless";

const { Provider, useEditor } = createEditorSystem<typeof extensiveExtensions>();

export type ExtensiveEditorMode =
  | "visual-only"
  | "visual-editor"
  | "visual"
  | "json"
  | "markdown"
  | "html";
export type ExtensiveEditorPlaceholder =
  | string
  | {
      visual?: string;
      json?: string;
      markdown?: string;
      html?: string;
    };

const DEFAULT_VISUAL_PLACEHOLDER = "Write anything...";
const DEFAULT_JSON_PLACEHOLDER = "Enter JSON document content...";
const DEFAULT_MARKDOWN_PLACEHOLDER = "Enter Markdown content...";
const DEFAULT_HTML_PLACEHOLDER = "Enter HTML content...";
const NON_VISIBLE_OVERFLOW_VALUES = new Set(["auto", "scroll", "overlay"]);

type ExtensiveEditorCanonicalMode = Exclude<ExtensiveEditorMode, "visual">;
type ExtensiveEditorSourceMode = Exclude<
  ExtensiveEditorCanonicalMode,
  "visual-only" | "visual-editor"
>;

const SOURCE_MODE_ERROR_TITLE: Record<ExtensiveEditorSourceMode, string> = {
  json: "Invalid JSON",
  markdown: "Invalid Markdown",
  html: "Invalid HTML",
};

function toCanonicalExtensiveMode(mode: ExtensiveEditorMode): ExtensiveEditorCanonicalMode {
  return mode === "visual" ? "visual-editor" : mode;
}

function isVisualEditorMode(mode: ExtensiveEditorMode | ExtensiveEditorCanonicalMode): boolean {
  return toCanonicalExtensiveMode(mode as ExtensiveEditorMode) === "visual-editor";
}

function hasExtensiveMode(
  modes: readonly ExtensiveEditorMode[],
  mode: ExtensiveEditorCanonicalMode,
): boolean {
  return modes.some((candidate) => toCanonicalExtensiveMode(candidate) === mode);
}

function isSourceMode(mode: ExtensiveEditorMode | ExtensiveEditorCanonicalMode): mode is ExtensiveEditorSourceMode {
  return mode === "json" || mode === "markdown" || mode === "html";
}

function resolveOverflowY(style: CSSStyleDeclaration): string {
  const overflowY = style.overflowY;
  if (overflowY && overflowY !== "visible") {
    return overflowY;
  }
  return style.overflow || overflowY || "visible";
}

function scrollElementToTop(element: HTMLElement): void {
  if (typeof element.scrollTo === "function") {
    try {
      element.scrollTo({ top: 0, behavior: "auto" });
    } catch {
      element.scrollTop = 0;
      return;
    }
  }

  if (element.scrollTop !== 0) {
    element.scrollTop = 0;
  }
}

function resetVisualEditorScrollPosition(rootElement: HTMLElement): void {
  const candidates = new Set<HTMLElement>();
  const addCandidate = (candidate: HTMLElement | null) => {
    if (candidate) {
      candidates.add(candidate);
    }
  };

  addCandidate(rootElement);
  addCandidate(rootElement.closest(".luthor-richtext-container") as HTMLElement | null);
  addCandidate(rootElement.closest(".luthor-editor-visual-shell") as HTMLElement | null);
  addCandidate(rootElement.closest(".luthor-editor") as HTMLElement | null);
  addCandidate(rootElement.closest(".luthor-editor-wrapper") as HTMLElement | null);

  if (typeof window !== "undefined") {
    let ancestor = rootElement.parentElement;
    while (ancestor && ancestor !== document.body && ancestor !== document.documentElement) {
      const overflowY = resolveOverflowY(window.getComputedStyle(ancestor));
      if (NON_VISIBLE_OVERFLOW_VALUES.has(overflowY)) {
        addCandidate(ancestor);
      }
      ancestor = ancestor.parentElement;
    }
  }

  candidates.forEach((candidate) => {
    scrollElementToTop(candidate);
  });
}

function scheduleAfterVisualShellMount(callback: () => void): void {
  if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => callback());
    });
    return;
  }

  globalThis.setTimeout(callback, 0);
}

function patchNonScrollingOverflowAncestors(wrapper: HTMLElement): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const patched: Array<{ element: HTMLElement; overflowY: string }> = [];
  let ancestor = wrapper.parentElement;

  while (ancestor && ancestor !== document.body && ancestor !== document.documentElement) {
    const computedStyle = window.getComputedStyle(ancestor);
    const overflowY = resolveOverflowY(computedStyle);

    if (!NON_VISIBLE_OVERFLOW_VALUES.has(overflowY)) {
      ancestor = ancestor.parentElement;
      continue;
    }

    const isScrollableInY = ancestor.scrollHeight > ancestor.clientHeight + 1;

    if (isScrollableInY) {
      // This is an active scroll host (e.g. fixed-height editor pane); keep native sticky behavior.
      break;
    }

    if (overflowY === "auto" || overflowY === "overlay") {
      patched.push({ element: ancestor, overflowY: ancestor.style.overflowY });
      ancestor.style.overflowY = "visible";
      ancestor = ancestor.parentElement;
      continue;
    }

    // Explicit overflow: scroll/hidden/clip likely indicates intentional clipping; avoid overriding.
    break;
  }

  return () => {
    for (let index = patched.length - 1; index >= 0; index -= 1) {
      const patch = patched[index];
      if (!patch) {
        continue;
      }
      patch.element.style.overflowY = patch.overflowY;
    }
  };
}

function setupToolbarPinOverflowFallback(wrapper: HTMLElement): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  let cleanupPatch = patchNonScrollingOverflowAncestors(wrapper);

  const reapply = () => {
    cleanupPatch();
    cleanupPatch = patchNonScrollingOverflowAncestors(wrapper);
  };

  window.addEventListener("resize", reapply);

  return () => {
    window.removeEventListener("resize", reapply);
    cleanupPatch();
  };
}

export interface ExtensiveEditorRef {
  injectJSON: (content: string) => void;
  getJSON: () => string;
  getMarkdown: () => string;
  getHTML: () => string;
}

type JsonTextNode = {
  type: "text";
  version: 1;
  text: string;
  detail: 0;
  format: 0;
  mode: "normal";
  style: "";
};

type JsonParagraphNode = {
  type: "paragraph";
  version: 1;
  format: "";
  indent: 0;
  direction: null;
  children: JsonTextNode[];
};

type JsonDocument = {
  root: {
    type: "root";
    version: 1;
    format: "";
    indent: 0;
    direction: null;
    children: JsonParagraphNode[];
  };
};

function createJSONDocumentFromText(content: string): JsonDocument {
  const normalized = content.replace(/\r\n?/g, "\n").trim();
  const blocks = normalized
    .split(/\n{2,}/)
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter((block) => block.length > 0);

  const children = (blocks.length > 0 ? blocks : [""]).map<JsonParagraphNode>((block) => ({
    type: "paragraph",
    version: 1,
    format: "",
    indent: 0,
    direction: null,
    children: [
      {
        type: "text",
        version: 1,
        text: block,
        detail: 0,
        format: 0,
        mode: "normal",
        style: "",
      },
    ],
  }));

  return {
    root: {
      type: "root",
      version: 1,
      format: "",
      indent: 0,
      direction: null,
      children,
    },
  };
}

const EMPTY_JSON_DOCUMENT = createJSONDocumentFromText("");

function clampCoordinate(value: number, min: number, max: number): number {
  if (max <= min) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

function positionCaretFromViewportPoint(
  x: number,
  y: number,
): boolean {
  const documentAny = document as Document & {
    caretPositionFromPoint?: (
      xPos: number,
      yPos: number,
    ) => {
      offsetNode: Node;
      offset: number;
    } | null;
    caretRangeFromPoint?: (xPos: number, yPos: number) => Range | null;
  };

  const selection = window.getSelection();
  if (!selection) {
    return false;
  }

  const position = documentAny.caretPositionFromPoint?.(x, y);
  if (position) {
    const range = document.createRange();
    range.setStart(position.offsetNode, position.offset);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  }

  const range = documentAny.caretRangeFromPoint?.(x, y);
  if (!range) {
    return false;
  }

  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  return true;
}

function positionCaretInNearestLine(editable: HTMLElement, clientX: number, clientY: number): void {
  const blocks = Array.from(editable.children).filter(
    (node): node is HTMLElement => node instanceof HTMLElement,
  );
  const nearestBlock = blocks.reduce<HTMLElement | null>((closest, block) => {
    const rect = block.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    if (!closest) {
      return block;
    }

    const closestRect = closest.getBoundingClientRect();
    const closestCenterY = closestRect.top + closestRect.height / 2;
    return Math.abs(centerY - clientY) < Math.abs(closestCenterY - clientY) ? block : closest;
  }, null);

  const targetBlock = nearestBlock ?? (editable.firstElementChild as HTMLElement | null) ?? editable;
  const editableRect = editable.getBoundingClientRect();
  const targetRect = targetBlock.getBoundingClientRect();
  const x = clampCoordinate(clientX, editableRect.left + 1, editableRect.right - 1);
  const y = clampCoordinate(clientY, targetRect.top + 1, targetRect.bottom - 1);
  positionCaretFromViewportPoint(x, y);
}

function toJSONInput(value: string): string {
  try {
    const parsed = JSON.parse(value);
    return JSON.stringify(parsed);
  } catch {
    return JSON.stringify(createJSONDocumentFromText(value));
  }
}

function serializeJSONToSource(
  mode: ExtensiveEditorSourceMode,
  document: unknown,
  sourceMetadataMode: SourceMetadataMode = "preserve",
  markdownBridgeFlavor: MarkdownBridgeFlavor = "luthor",
): string {
  const resolvedDocument = document ?? EMPTY_JSON_DOCUMENT;

  if (mode === "json") {
    return formatJSONSource(JSON.stringify(resolvedDocument));
  }

  if (mode === "markdown") {
    const markdown = markdownBridgeFlavor === "lexical-native"
      ? jsonToMarkdown(resolvedDocument, { bridgeFlavor: "lexical-native" })
      : sourceMetadataMode === "none"
        ? jsonToMarkdown(resolvedDocument, { metadataMode: "none" })
        : jsonToMarkdown(resolvedDocument);
    return formatMarkdownSource(markdown);
  }

  const html = sourceMetadataMode === "none"
    ? jsonToHTML(resolvedDocument, { metadataMode: "none" })
    : jsonToHTML(resolvedDocument);
  return formatHTMLSource(html);
}

function extractLeadingFrontmatterBlock(markdown: string): {
  frontmatter: string | null;
  body: string;
} {
  const normalized = markdown.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");
  if (lines.length < 3) {
    return { frontmatter: null, body: normalized };
  }

  const firstLine = (lines[0] ?? "").replace(/^\uFEFF/, "");
  if (firstLine.trim() !== "---") {
    return { frontmatter: null, body: normalized };
  }

  let closingIndex = -1;
  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const trimmed = (lines[lineIndex] ?? "").trim();
    if (trimmed === "---" || trimmed === "...") {
      closingIndex = lineIndex;
      break;
    }
  }

  if (closingIndex < 2) {
    return { frontmatter: null, body: normalized };
  }

  const frontmatterBody = lines.slice(1, closingIndex).join("\n");
  if (!/^[^#\n]*:/m.test(frontmatterBody)) {
    return { frontmatter: null, body: normalized };
  }

  return {
    frontmatter: lines.slice(0, closingIndex + 1).join("\n").trim(),
    body: lines.slice(closingIndex + 1).join("\n"),
  };
}

function mergePreservedFrontmatter(
  previousCanonicalMarkdown: string,
  nextVisualMarkdown: string,
): string {
  const previous = extractLeadingFrontmatterBlock(previousCanonicalMarkdown);
  if (!previous.frontmatter) {
    return nextVisualMarkdown;
  }

  const next = extractLeadingFrontmatterBlock(nextVisualMarkdown);
  if (next.frontmatter) {
    return nextVisualMarkdown;
  }

  const normalizedBody = nextVisualMarkdown.replace(/\r\n?/g, "\n").trim();
  return normalizedBody.length > 0
    ? `${previous.frontmatter}\n\n${normalizedBody}`
    : `${previous.frontmatter}\n`;
}

function normalizeFontFamilyOptionsKey(options?: readonly FontFamilyOption[]): string {
  if (!options || options.length === 0) {
    return "__default__";
  }

  return JSON.stringify(
    options.map((option) => ({
      value: option.value.trim(),
      label: option.label.trim(),
      fontFamily: option.fontFamily.trim(),
      cssImportUrl: option.cssImportUrl?.trim() || "",
    })),
  );
}

function normalizeFontSizeOptionsKey(options?: readonly FontSizeOption[]): string {
  if (!options || options.length === 0) {
    return "__default__";
  }

  return JSON.stringify(
    options.map((option) => ({
      value: String(option.value).trim(),
      label: String(option.label).trim(),
      fontSize: String(option.fontSize).trim(),
    })),
  );
}

function normalizeLineHeightOptionsKey(options?: readonly LineHeightOption[]): string {
  if (!options || options.length === 0) {
    return "__default__";
  }

  return JSON.stringify(
    options.map((option) => ({
      value: String(option.value).trim(),
      label: String(option.label).trim(),
      lineHeight: String(option.lineHeight).trim(),
    })),
  );
}

function normalizeMinimumDefaultLineHeightKey(value: string | number | undefined): string {
  const fallback = "1.5";

  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 1) {
      return fallback;
    }
    return value.toString();
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return fallback;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return fallback;
    }
    return parsed.toString();
  }

  return fallback;
}

function normalizeMaxListIndentationKey(value: number | undefined): string {
  if (!Number.isFinite(value)) {
    return "8";
  }

  const normalized = Math.floor(value as number);
  if (normalized < 0) {
    return "8";
  }

  return normalized.toString();
}

function normalizeStyleVarsKey(styleVars?: Record<string, string | undefined>): string {
  return sharedNormalizeStyleVarsKey(styleVars);
}

function normalizeLanguageOptionsKey(
  options?: readonly string[] | CodeLanguageOptionsConfig,
): string {
  if (!options) {
    return "__default__";
  }

  if (Array.isArray(options)) {
    return JSON.stringify({
      mode: "append",
      values: options.map((option) => option.trim()),
    });
  }

  const config = options as CodeLanguageOptionsConfig;
  const values = Array.isArray(config.values) ? config.values : [];

  return JSON.stringify({
    mode: config.mode ?? "append",
    values: values.map((option) => option.trim()),
  });
}

function createDefaultSettingsStyleVarRecord(defaultSettings?: DefaultSettings): Record<string, string> | undefined {
  return sharedCreateDefaultSettingsStyleVarRecord(defaultSettings);
}

function normalizeFeatureFlagsKey(overrides?: FeatureFlagOverrides): string {
  const resolved = resolveFeatureFlags(overrides);
  return JSON.stringify(
    EXTENSIVE_FEATURE_KEYS.map((key) => [key, resolved[key]]),
  );
}

function isEditableCommandTarget(target: EventTarget | null): boolean {
  return sharedIsEditableCommandTarget(target);
}

const FEATURE_SHORTCUT_SPECS: readonly FeatureShortcutSpec<FeatureFlag>[] = [
  { feature: "bold", key: "b", requiresPrimary: true },
  { feature: "italic", key: "i", requiresPrimary: true },
  { feature: "underline", key: "u", requiresPrimary: true },
  { feature: "link", key: "k", requiresPrimary: true },
  { feature: "history", key: "z", requiresPrimary: true },
  { feature: "history", key: "y", requiresPrimary: true },
  { feature: "history", key: "z", requiresPrimary: true, shift: true },
  { feature: "commandPalette", key: "p", requiresPrimary: true, shift: true },
  { feature: "codeFormat", key: "`", requiresPrimary: true },
  { feature: "code", key: "`", requiresPrimary: true, shift: true },
  { feature: "list", key: "l", requiresPrimary: true, shift: true },
  { feature: "list", key: "l", requiresPrimary: true, alt: true },
  { feature: "list", key: "x", requiresPrimary: true, shift: true },
  { feature: "blockFormat", key: "0", requiresPrimary: true, alt: true },
  { feature: "blockFormat", key: "1", requiresPrimary: true, alt: true },
  { feature: "blockFormat", key: "2", requiresPrimary: true, alt: true },
  { feature: "blockFormat", key: "3", requiresPrimary: true, alt: true },
  { feature: "blockFormat", key: "4", requiresPrimary: true, alt: true },
  { feature: "blockFormat", key: "5", requiresPrimary: true, alt: true },
  { feature: "blockFormat", key: "6", requiresPrimary: true, alt: true },
];

function isShortcutMatch(event: KeyboardEvent, shortcut: FeatureShortcutSpec): boolean {
  return sharedIsShortcutMatch(event, shortcut);
}

function createFeatureGuardedCommands(
  commands: CoreEditorCommands,
  featureFlags: FeatureFlags,
  isInCodeBlock: boolean,
): CoreEditorCommands {
  return sharedCreateFeatureGuardedCommands(commands, featureFlags, isInCodeBlock);
}

const TOOLBAR_FEATURE_MAP: ToolbarFeatureMap<FeatureFlag> = {
  fontFamily: "fontFamily",
  fontSize: "fontSize",
  lineHeight: "lineHeight",
  textColor: "textColor",
  textHighlight: "textHighlight",
  bold: "bold",
  italic: "italic",
  underline: "underline",
  strikethrough: "strikethrough",
  subscript: "subscript",
  superscript: "superscript",
  code: "codeFormat",
  link: "link",
  blockFormat: "blockFormat",
  quote: "blockFormat",
  alignLeft: "blockFormat",
  alignCenter: "blockFormat",
  alignRight: "blockFormat",
  alignJustify: "blockFormat",
  codeBlock: "code",
  unorderedList: "list",
  orderedList: "list",
  checkList: "list",
  indentList: "list",
  outdentList: "list",
  horizontalRule: "horizontalRule",
  table: "table",
  image: "image",
  emoji: "emoji",
  embed: ["iframeEmbed", "youTubeEmbed"],
  undo: "history",
  redo: "history",
  commandPalette: "commandPalette",
  themeToggle: "themeToggle",
};

function mergeToolbarVisibilityWithFeatures(
  toolbarVisibility: ToolbarVisibility | undefined,
  featureFlags: FeatureFlags,
): ToolbarVisibility {
  return sharedMergeToolbarVisibilityWithFeatures(
    toolbarVisibility,
    featureFlags,
    TOOLBAR_FEATURE_MAP,
  );
}

function normalizeHeadingOptions(input?: readonly BlockHeadingLevel[]): BlockHeadingLevel[] {
  if (!input || input.length === 0) {
    return [...BLOCK_HEADING_LEVELS];
  }

  const seen = new Set<BlockHeadingLevel>();
  const normalized: BlockHeadingLevel[] = [];
  for (const heading of input) {
    if (!BLOCK_HEADING_LEVELS.includes(heading) || seen.has(heading)) {
      continue;
    }

    seen.add(heading);
    normalized.push(heading);
  }

  return normalized.length > 0 ? normalized : [...BLOCK_HEADING_LEVELS];
}

function normalizeSlashCommandVisibilityKey(visibility?: SlashCommandVisibility): string {
  if (!visibility) {
    return "__default__";
  }

  if (Array.isArray(visibility)) {
    const seen = new Set<string>();
    const allowlist: string[] = [];
    for (const selection of visibility) {
      for (const [id, enabled] of Object.entries(selection)) {
        const normalizedId = id.trim();
        if (!enabled || !normalizedId || seen.has(normalizedId)) {
          continue;
        }
        seen.add(normalizedId);
        allowlist.push(normalizedId);
      }
    }

    if (allowlist.length === 0) {
      return "__default__";
    }

    return JSON.stringify({ allowlist, denylist: [] });
  }

  const normalize = (ids?: readonly string[]): string[] => {
    if (!ids || ids.length === 0) {
      return [];
    }

    const seen = new Set<string>();
    const normalized: string[] = [];
    for (const id of ids) {
      const value = id.trim();
      if (!value || seen.has(value)) {
        continue;
      }
      seen.add(value);
      normalized.push(value);
    }
    return normalized;
  };

  const visibilityFilters = visibility as {
    allowlist?: readonly string[];
    denylist?: readonly string[];
  };
  const allowlist = normalize(visibilityFilters.allowlist);
  const denylist = normalize(visibilityFilters.denylist);
  if (allowlist.length === 0 && denylist.length === 0) {
    return "__default__";
  }

  return JSON.stringify({ allowlist, denylist });
}

function normalizeCommandIdList(ids?: readonly string[]): string[] {
  if (!ids || ids.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const id of ids) {
    const value = id.trim();
    if (!value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    normalized.push(value);
  }

  return normalized;
}

function isKeyboardShortcutMatch(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  return (
    event.key.toLowerCase() === shortcut.key.toLowerCase() &&
    !!event.ctrlKey === !!shortcut.ctrlKey &&
    !!event.metaKey === !!shortcut.metaKey &&
    !!event.shiftKey === !!shortcut.shiftKey &&
    !!event.altKey === !!shortcut.altKey
  );
}

function normalizeShortcutConfigKey(shortcutConfig?: CommandShortcutConfig): string {
  if (!shortcutConfig) {
    return "__default__";
  }

  const disabledCommandIds = Array.isArray(shortcutConfig.disabledCommandIds)
    ? [...shortcutConfig.disabledCommandIds]
      .map((id) => id.trim())
      .filter((id) => id.length > 0)
      .sort((left, right) => left.localeCompare(right))
    : [];

  const bindings = shortcutConfig.bindings
    ? Object.entries(shortcutConfig.bindings)
      .map(([commandId, override]) => {
        if (override === false || override === null) {
          return [commandId, false] as const;
        }

        const shortcuts = Array.isArray(override) ? override : [override];
        const normalizedShortcuts = shortcuts
          .map((shortcut) => ({
            key: shortcut.key.trim(),
            ctrlKey: !!shortcut.ctrlKey,
            metaKey: !!shortcut.metaKey,
            shiftKey: !!shortcut.shiftKey,
            altKey: !!shortcut.altKey,
            preventDefault: shortcut.preventDefault,
          }))
          .filter((shortcut) => shortcut.key.length > 0)
          .sort((left, right) => {
            const leftKey = `${left.key}:${left.ctrlKey ? 1 : 0}:${left.metaKey ? 1 : 0}:${left.shiftKey ? 1 : 0}:${left.altKey ? 1 : 0}`;
            const rightKey = `${right.key}:${right.ctrlKey ? 1 : 0}:${right.metaKey ? 1 : 0}:${right.shiftKey ? 1 : 0}:${right.altKey ? 1 : 0}`;
            return leftKey.localeCompare(rightKey);
          });

        if (normalizedShortcuts.length === 0) {
          return [commandId, false] as const;
        }

        return [commandId, normalizedShortcuts] as const;
      })
      .sort(([left], [right]) => left.localeCompare(right))
    : [];

  return JSON.stringify({
    disabledCommandIds,
    bindings,
    preventCollisions: shortcutConfig.preventCollisions !== false,
    preventNativeConflicts: shortcutConfig.preventNativeConflicts !== false,
  });
}

function ExtensiveEditorContent({
  isDark,
  toggleTheme,
  visualPlaceholder,
  jsonPlaceholder,
  markdownPlaceholder,
  htmlPlaceholder,
  initialMode,
  availableModes,
  onReady,
  toolbarLayout,
  toolbarVisibility,
  toolbarPosition,
  toolbarAlignment,
  toolbarClassName,
  toolbarStyleVars,
  isToolbarEnabled,
  isToolbarPinned,
  isEditorViewTabsVisible,
  headingOptions,
  paragraphLabel,
  syncHeadingOptionsWithCommands,
  slashCommandVisibility,
  shortcutConfig,
  commandPaletteShortcutOnly,
  isListStyleDropdownEnabled,
  featureFlags,
  editOnClick,
  sourceMetadataMode,
  markdownBridgeFlavor,
  markdownSourceOfTruth,
  showLineNumbers,
}: {
  isDark: boolean;
  toggleTheme: () => void;
  visualPlaceholder: string;
  jsonPlaceholder: string;
  markdownPlaceholder: string;
  htmlPlaceholder: string;
  initialMode: ExtensiveEditorCanonicalMode;
  availableModes: readonly ExtensiveEditorMode[];
  onReady?: (methods: ExtensiveEditorRef) => void;
  toolbarLayout?: ToolbarLayout;
  toolbarVisibility?: ToolbarVisibility;
  toolbarPosition: ToolbarPosition;
  toolbarAlignment: ToolbarAlignment;
  toolbarClassName?: string;
  toolbarStyleVars?: ToolbarStyleVars;
  isToolbarEnabled: boolean;
  isToolbarPinned: boolean;
  isEditorViewTabsVisible: boolean;
  headingOptions?: readonly BlockHeadingLevel[];
  paragraphLabel?: string;
  syncHeadingOptionsWithCommands: boolean;
  slashCommandVisibility?: SlashCommandVisibility;
  shortcutConfig?: CommandShortcutConfig;
  commandPaletteShortcutOnly: boolean;
  isListStyleDropdownEnabled: boolean;
  featureFlags: FeatureFlags;
  editOnClick: boolean;
  sourceMetadataMode: SourceMetadataMode;
  markdownBridgeFlavor: MarkdownBridgeFlavor;
  markdownSourceOfTruth: boolean;
  showLineNumbers: boolean;
}) {
  const {
    commands,
    hasExtension,
    activeStates,
    lexical: editor,
    extensions,
    export: exportApi,
    import: importApi,
  } = useEditor();
  const [mode, setMode] = useState<ExtensiveEditorCanonicalMode>(initialMode);
  const [content, setContent] = useState<Record<ExtensiveEditorSourceMode, string>>({
    json: "",
    markdown: "",
    html: "",
  });
  const [convertingMode, setConvertingMode] = useState<ExtensiveEditorCanonicalMode | null>(null);
  const [sourceError, setSourceError] = useState<{ mode: ExtensiveEditorSourceMode; error: string } | null>(null);
  const [commandPaletteState, setCommandPaletteState] = useState({
    isOpen: false,
    commands: [] as ReturnType<typeof commandsToCommandPaletteItems>,
  });
  const [slashCommandState, setSlashCommandState] = useState({
    isOpen: false,
    query: "",
    position: null as { x: number; y: number } | null,
    commands: [] as ReturnType<typeof commandsToSlashCommandItems>,
  });
  const [emojiSuggestionState, setEmojiSuggestionState] = useState({
    isOpen: false,
    query: "",
    position: null as { x: number; y: number } | null,
    suggestions: [] as EmojiCatalogItem[],
  });
  const readyRef = useRef(false);
  const resolvedHeadingOptions = useMemo(
    () => normalizeHeadingOptions(headingOptions),
    [headingOptions],
  );
  const commandHeadingOptions = syncHeadingOptionsWithCommands ? resolvedHeadingOptions : undefined;
  const commandParagraphLabel = syncHeadingOptionsWithCommands ? paragraphLabel : undefined;
  const isInCodeBlock = activeStates.isInCodeBlock === true;
  const safeCommands = useMemo(
    () => createFeatureGuardedCommands(commands as CoreEditorCommands, featureFlags, isInCodeBlock),
    [commands, featureFlags, isInCodeBlock],
  );
  const isFeatureEnabled = useMemo(
    () => (feature: string) => {
      if (!Object.prototype.hasOwnProperty.call(featureFlags, feature)) {
        return true;
      }

      return featureFlags[feature as FeatureFlag] !== false;
    },
    [featureFlags],
  );
  const isMenuFeatureEnabled = useMemo(
    () => (feature: string) => isVisualEditorMode(mode) && isFeatureEnabled(feature),
    [mode, isFeatureEnabled],
  );
  const resolvedToolbarVisibility = useMemo(
    () => mergeToolbarVisibilityWithFeatures(toolbarVisibility, featureFlags),
    [toolbarVisibility, featureFlags],
  );
  const isDraggableBoxEnabled = featureFlags.draggableBlock !== false;
  const slashCommandVisibilityKey = normalizeSlashCommandVisibilityKey(slashCommandVisibility);
  const stableSlashCommandVisibilityRef = useRef<SlashCommandVisibility | undefined>(slashCommandVisibility);
  const stableSlashCommandVisibilityKeyRef = useRef(slashCommandVisibilityKey);
  const shortcutConfigKey = normalizeShortcutConfigKey(shortcutConfig);
  const stableShortcutConfigRef = useRef<CommandShortcutConfig | undefined>(shortcutConfig);
  const stableShortcutConfigKeyRef = useRef(shortcutConfigKey);
  const disabledCommandIds = useMemo(
    () => normalizeCommandIdList(shortcutConfig?.disabledCommandIds),
    [shortcutConfig?.disabledCommandIds],
  );
  const disabledCommandIdsSet = useMemo(
    () => new Set(disabledCommandIds),
    [disabledCommandIds],
  );
  const blockedDefaultShortcuts = useMemo<KeyboardShortcut[]>(() => {
    if (disabledCommandIdsSet.size === 0) {
      return [];
    }

    return generateCommands({
      headingOptions: commandHeadingOptions,
      paragraphLabel: commandParagraphLabel,
      isFeatureEnabled,
    })
      .filter((command) => disabledCommandIdsSet.has(command.id))
      .flatMap((command) => command.shortcuts ?? []);
  }, [
    disabledCommandIdsSet,
    commandHeadingOptions,
    commandParagraphLabel,
    isFeatureEnabled,
  ]);

  if (stableSlashCommandVisibilityKeyRef.current !== slashCommandVisibilityKey) {
    stableSlashCommandVisibilityKeyRef.current = slashCommandVisibilityKey;
    stableSlashCommandVisibilityRef.current = slashCommandVisibility;
  }

  if (stableShortcutConfigKeyRef.current !== shortcutConfigKey) {
    stableShortcutConfigKeyRef.current = shortcutConfigKey;
    stableShortcutConfigRef.current = shortcutConfig;
  }
  
  // Lazy conversion state: track which formats are valid cache
  const cacheValidRef = useRef(createModeCache<ExtensiveEditorCanonicalMode>(["visual-editor"]));
  const sourceDirtyRef = useRef<Record<ExtensiveEditorSourceMode, boolean>>({
    json: false,
    markdown: false,
    html: false,
  });
  const canonicalMarkdownRef = useRef("");
  const canonicalMarkdownStaleRef = useRef(true);
  const suppressCanonicalMarkdownStaleRef = useRef(false);
  const suppressCanonicalMarkdownWhileImportingRef = useRef(false);
  const editorChangeCountRef = useRef(0);
  const pendingEditIntentRef = useRef<{ clientX: number; clientY: number } | null>(null);

  useEffect(() => {
    setFloatingToolbarContext(
      safeCommands,
      activeStates,
      isDark ? "dark" : "light",
      isMenuFeatureEnabled,
    );
  }, [safeCommands, activeStates, isDark, isMenuFeatureEnabled]);

  const methods = useMemo<ExtensiveEditorRef>(
    () => {
      const hydrateSourceSnapshots = (document: unknown) => {
        const nextJson = serializeJSONToSource(
          "json",
          document,
          sourceMetadataMode,
          markdownBridgeFlavor,
        );
        const nextMarkdown = serializeJSONToSource(
          "markdown",
          document,
          sourceMetadataMode,
          markdownBridgeFlavor,
        );
        const nextHTML = serializeJSONToSource(
          "html",
          document,
          sourceMetadataMode,
          markdownBridgeFlavor,
        );

        setContent((previous) => (
          previous.json === nextJson &&
          previous.markdown === nextMarkdown &&
          previous.html === nextHTML
            ? previous
            : {
                json: nextJson,
                markdown: nextMarkdown,
                html: nextHTML,
              }
        ));

        sourceDirtyRef.current.json = false;
        sourceDirtyRef.current.markdown = false;
        sourceDirtyRef.current.html = false;
        markModeCached(cacheValidRef.current, "json");
        markModeCached(cacheValidRef.current, "markdown");
        markModeCached(cacheValidRef.current, "html");

        if (markdownSourceOfTruth) {
          canonicalMarkdownRef.current = nextMarkdown;
          canonicalMarkdownStaleRef.current = false;
        }
      };

      const injectJSON = (value: string) => {
        setTimeout(() => {
          try {
            const parsed = JSON.parse(value);
            importApi.fromJSON(parsed);
            hydrateSourceSnapshots(parsed);
          } catch (error) {
            console.error("Failed to inject JSON:", error);
            return;
          }
        }, 100);
      };
      const resolveMarkdownSnapshot = (): string => {
        if (!markdownSourceOfTruth) {
          return serializeJSONToSource(
            "markdown",
            exportApi.toJSON(),
            sourceMetadataMode,
            markdownBridgeFlavor,
          );
        }

        if (canonicalMarkdownStaleRef.current) {
          const nextMarkdown = serializeJSONToSource(
            "markdown",
            exportApi.toJSON(),
            sourceMetadataMode,
            markdownBridgeFlavor,
          );
          canonicalMarkdownRef.current = nextMarkdown;
          canonicalMarkdownStaleRef.current = false;
        }

        return canonicalMarkdownRef.current;
      };
      const parseCanonicalMarkdownDocument = () => {
        const markdown = resolveMarkdownSnapshot();
        if (markdownBridgeFlavor === "lexical-native") {
          return markdownToJSON(markdown, { bridgeFlavor: "lexical-native" });
        }

        return sourceMetadataMode === "none"
          ? markdownToJSON(markdown, { metadataMode: "none" })
          : markdownToJSON(markdown);
      };
      const getJSON = () => {
        if (!markdownSourceOfTruth) {
          return serializeJSONToSource("json", exportApi.toJSON());
        }

        return serializeJSONToSource(
          "json",
          parseCanonicalMarkdownDocument(),
          sourceMetadataMode,
          markdownBridgeFlavor,
        );
      };
      const getMarkdown = () => resolveMarkdownSnapshot();
      const getHTML = () => {
        if (!markdownSourceOfTruth) {
          return serializeJSONToSource(
            "html",
            exportApi.toJSON(),
            sourceMetadataMode,
            markdownBridgeFlavor,
          );
        }

        return serializeJSONToSource(
          "html",
          parseCanonicalMarkdownDocument(),
          sourceMetadataMode,
          markdownBridgeFlavor,
        );
      };
      return {
        injectJSON,
        getJSON,
        getMarkdown,
        getHTML,
      };
    },
    [
      exportApi,
      importApi,
      markdownBridgeFlavor,
      markdownSourceOfTruth,
      sourceMetadataMode,
    ],
  );

  useEffect(() => {
    if (!editor || !safeCommands) return;

    const commandApi = safeCommands as CoreEditorCommands;
    const paletteItems = commandsToCommandPaletteItems(commandApi, {
      headingOptions: commandHeadingOptions,
      paragraphLabel: commandParagraphLabel,
      isFeatureEnabled: isMenuFeatureEnabled,
      shortcutConfig: stableShortcutConfigRef.current,
      commandPaletteShortcutOnly,
    });
    if (typeof commandApi.registerCommand === "function") {
      paletteItems.forEach((cmd) => commandApi.registerCommand(cmd));
    }
    const slashItems = commandsToSlashCommandItems(commandApi, {
      headingOptions: commandHeadingOptions,
      paragraphLabel: commandParagraphLabel,
      slashCommandVisibility: stableSlashCommandVisibilityRef.current,
      isFeatureEnabled: isMenuFeatureEnabled,
      shortcutConfig: stableShortcutConfigRef.current,
    });
    if (typeof commandApi.setSlashCommands === "function") {
      commandApi.setSlashCommands(slashItems);
    } else {
      slashItems.forEach((cmd) => commandApi.registerSlashCommand?.(cmd));
    }

    const unregisterShortcuts = registerKeyboardShortcuts(commandApi, document.body, {
      headingOptions: commandHeadingOptions,
      paragraphLabel: commandParagraphLabel,
      isFeatureEnabled: isMenuFeatureEnabled,
      shortcutConfig: stableShortcutConfigRef.current,
      scope: () => editor.getRootElement(),
    });

    if (!readyRef.current) {
      readyRef.current = true;
      onReady?.(methods);
    }

    return () => {
      unregisterShortcuts();
      if (typeof commandApi.unregisterCommand === "function") {
        paletteItems.forEach((cmd) => commandApi.unregisterCommand(cmd.id));
      }
      if (typeof commandApi.setSlashCommands === "function") {
        commandApi.setSlashCommands([]);
      } else {
        slashItems.forEach((cmd) => commandApi.unregisterSlashCommand?.(cmd.id));
      }
    };
  }, [
    editor,
    safeCommands,
    methods,
    onReady,
    commandHeadingOptions,
    commandParagraphLabel,
    slashCommandVisibilityKey,
    shortcutConfigKey,
    isMenuFeatureEnabled,
    commandPaletteShortcutOnly,
  ]);

  useEffect(() => {
    const resolveScopeElement = () => editor?.getRootElement();
    const disabledShortcutSpecs = FEATURE_SHORTCUT_SPECS.filter(
      (shortcut) => featureFlags[shortcut.feature] === false,
    );

    if (disabledShortcutSpecs.length === 0) {
      return;
    }

    const handleKeydown = (event: KeyboardEvent) => {
      const scopeElement = resolveScopeElement();
      if (scopeElement && event.target instanceof Node && !scopeElement.contains(event.target)) {
        return;
      }

      if (!isEditableCommandTarget(event.target)) {
        return;
      }

      const isDisabledFeatureShortcut = disabledShortcutSpecs.some((shortcut) => {
        return isShortcutMatch(event, shortcut);
      });

      if (!isDisabledFeatureShortcut) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    };

    document.addEventListener("keydown", handleKeydown, true);
    return () => {
      document.removeEventListener("keydown", handleKeydown, true);
    };
  }, [editor, featureFlags]);

  useEffect(() => {
    const commandPaletteExtension = extensions.find(
      (ext: any) => ext.name === "commandPalette",
    ) as CommandPaletteExtension | undefined;

    if (!commandPaletteExtension || !commandPaletteExtension.subscribe) return;

    return commandPaletteExtension.subscribe((isOpen, items) => {
      const filteredItems = items.filter((item) => {
        if (disabledCommandIdsSet.has(item.id)) {
          return false;
        }

        if (commandPaletteShortcutOnly) {
          const hasShortcut = typeof item.shortcut === "string" && item.shortcut.trim().length > 0;
          return hasShortcut;
        }

        return true;
      });

      setCommandPaletteState({
        isOpen: isVisualEditorMode(mode) ? isOpen : false,
        commands: filteredItems,
      });
    });
  }, [extensions, disabledCommandIdsSet, commandPaletteShortcutOnly, mode]);

  useEffect(() => {
    if (blockedDefaultShortcuts.length === 0) {
      return;
    }

    const resolveScopeElement = () => editor?.getRootElement();

    const handleKeydown = (event: KeyboardEvent) => {
      const scopeElement = resolveScopeElement();
      if (scopeElement && event.target instanceof Node && !scopeElement.contains(event.target)) {
        return;
      }

      if (!isEditableCommandTarget(event.target)) {
        return;
      }

      const isBlockedShortcut = blockedDefaultShortcuts.some((shortcut) => {
        return isKeyboardShortcutMatch(event, shortcut);
      });

      if (!isBlockedShortcut) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    };

    document.addEventListener("keydown", handleKeydown, true);
    return () => {
      document.removeEventListener("keydown", handleKeydown, true);
    };
  }, [editor, blockedDefaultShortcuts]);

  useEffect(() => {
    const slashCommandExtension = extensions.find(
      (ext: any) => ext.name === "slashCommand",
    ) as SlashCommandExtension | undefined;

    if (!slashCommandExtension || !slashCommandExtension.subscribe) return;

    return slashCommandExtension.subscribe((state) => {
      setSlashCommandState({
        isOpen: isVisualEditorMode(mode) ? state.isOpen : false,
        query: isVisualEditorMode(mode) ? state.query : "",
        position: isVisualEditorMode(mode) ? state.position : null,
        commands: isVisualEditorMode(mode) ? state.commands : [],
      });
    });
  }, [extensions, mode]);

  useEffect(() => {
    const emojiExtension = extensions.find(
      (ext: any) => ext.name === "emoji",
    ) as EmojiExtension | undefined;

    if (!emojiExtension || !emojiExtension.subscribe) return;

    return emojiExtension.subscribe((state) => {
      setEmojiSuggestionState({
        isOpen: isVisualEditorMode(mode) ? state.isOpen : false,
        query: isVisualEditorMode(mode) ? state.query : "",
        position: isVisualEditorMode(mode) ? state.position : null,
        suggestions: isVisualEditorMode(mode) ? state.suggestions : [],
      });
    });
  }, [extensions, mode]);

  useEffect(() => {
    if (isVisualEditorMode(mode)) {
      return;
    }

    setCommandPaletteState((previous) => (
      previous.isOpen
        ? {
            ...previous,
            isOpen: false,
          }
        : previous
    ));
    setSlashCommandState((previous) => (
      previous.isOpen || previous.query.length > 0 || previous.position !== null || previous.commands.length > 0
        ? {
            isOpen: false,
            query: "",
            position: null,
            commands: [],
          }
        : previous
    ));
    setEmojiSuggestionState((previous) => (
      previous.isOpen || previous.query.length > 0 || previous.position !== null || previous.suggestions.length > 0
        ? {
            isOpen: false,
            query: "",
            position: null,
            suggestions: [],
          }
        : previous
    ));

    safeCommands.hideCommandPalette?.();
    safeCommands.closeSlashMenu?.();
    safeCommands.closeEmojiSuggestions?.();
  }, [mode, safeCommands]);

  useEffect(() => {
    if (!editor || !exportApi) return;

    const unsubscribe = editor.registerUpdateListener(({
      dirtyElements,
      dirtyLeaves,
    }: {
      dirtyElements: Map<unknown, unknown>;
      dirtyLeaves: Set<unknown>;
    }) => {
      const hasContentChanges =
        dirtyElements.size > 0 || dirtyLeaves.size > 0;
      if (!hasContentChanges) {
        return;
      }

      // When visual editor changes, mark all cached formats as stale
      // This prevents stale cache but doesn't do any actual export work
      editorChangeCountRef.current += 1;
      invalidateModeCache(cacheValidRef.current, ["visual-editor"]);
      if (markdownSourceOfTruth) {
        if (!isVisualEditorMode(mode)) {
          return;
        }

        if (suppressCanonicalMarkdownWhileImportingRef.current) {
          return;
        }

        if (suppressCanonicalMarkdownStaleRef.current) {
          suppressCanonicalMarkdownStaleRef.current = false;
          return;
        }
        canonicalMarkdownStaleRef.current = true;
      }
    });

    return unsubscribe;
  }, [editor, exportApi, markdownSourceOfTruth, mode]);

  const parseMarkdownSourceDocument = (sourceValue: string): unknown => {
    if (markdownBridgeFlavor === "lexical-native") {
      return markdownToJSON(sourceValue, {
        bridgeFlavor: "lexical-native",
      });
    }

    return sourceMetadataMode === "none"
      ? markdownToJSON(sourceValue, { metadataMode: "none" })
      : markdownToJSON(sourceValue);
  };

  const parseSourceModeDocument = (
    sourceMode: ExtensiveEditorSourceMode,
    sourceValue: string,
  ): unknown => {
    if (sourceMode === "json") {
      return sourceValue.trim()
        ? JSON.parse(sourceValue)
        : createJSONDocumentFromText("");
    }

    if (sourceMode === "markdown") {
      return parseMarkdownSourceDocument(sourceValue);
    }

    return sourceMetadataMode === "none"
      ? htmlToJSON(sourceValue, { metadataMode: "none" })
      : htmlToJSON(sourceValue);
  };

  const exportToSourceMode = (sourceMode: ExtensiveEditorSourceMode): string => {
    const visualDocument = exportApi.toJSON() ?? EMPTY_JSON_DOCUMENT;
    return serializeJSONToSource(
      sourceMode,
      visualDocument,
      sourceMetadataMode,
      markdownBridgeFlavor,
    );
  };

  const ensureCanonicalMarkdownFromVisual = (): string => {
    const nextMarkdown = exportToSourceMode("markdown");
    const mergedMarkdown = mergePreservedFrontmatter(
      canonicalMarkdownRef.current,
      nextMarkdown,
    );
    canonicalMarkdownRef.current = mergedMarkdown;
    canonicalMarkdownStaleRef.current = false;
    sourceDirtyRef.current.markdown = false;
    markModeCached(cacheValidRef.current, "markdown");
    setContent((previous) => (
      previous.markdown === mergedMarkdown
        ? previous
        : {
            ...previous,
            markdown: mergedMarkdown,
          }
    ));
    return mergedMarkdown;
  };

  const ensureCanonicalMarkdown = (): string => {
    if (!markdownSourceOfTruth) {
      return exportToSourceMode("markdown");
    }

    if (!canonicalMarkdownStaleRef.current) {
      return canonicalMarkdownRef.current;
    }

    return ensureCanonicalMarkdownFromVisual();
  };

  const exportFromCanonicalMarkdown = (
    targetMode: Exclude<ExtensiveEditorSourceMode, "markdown">,
  ): string => {
    const markdown = ensureCanonicalMarkdown();
    const canonicalDocument = parseMarkdownSourceDocument(markdown);
    return serializeJSONToSource(
      targetMode,
      canonicalDocument,
      sourceMetadataMode,
      markdownBridgeFlavor,
    );
  };

  const importFromSourceMode = (sourceMode: ExtensiveEditorSourceMode): void => {
    const sourceValue = content[sourceMode];
    const parsed = parseSourceModeDocument(sourceMode, sourceValue);
    const importingCanonicalMarkdown = markdownSourceOfTruth && sourceMode === "markdown";
    if (markdownSourceOfTruth && sourceMode === "markdown") {
      suppressCanonicalMarkdownStaleRef.current = true;
    }
    if (importingCanonicalMarkdown) {
      suppressCanonicalMarkdownWhileImportingRef.current = true;
    }
    try {
      importApi.fromJSON(parsed);
    } finally {
      if (importingCanonicalMarkdown) {
        suppressCanonicalMarkdownWhileImportingRef.current = false;
      }
    }

    if (markdownSourceOfTruth) {
      if (sourceMode === "markdown") {
        canonicalMarkdownRef.current = sourceValue;
        canonicalMarkdownStaleRef.current = false;
      } else {
        canonicalMarkdownStaleRef.current = true;
      }
    }

    sourceDirtyRef.current[sourceMode] = false;
    invalidateModeCache(cacheValidRef.current, ["visual-editor"]);
  };

  const updateSourceModeContent = (
    sourceMode: ExtensiveEditorSourceMode,
    value: string,
    options?: { dirty?: boolean },
  ) => {
    setContent((prev) => ({ ...prev, [sourceMode]: value }));
    sourceDirtyRef.current[sourceMode] = options?.dirty === true;
    if (markdownSourceOfTruth && sourceMode === "markdown") {
      canonicalMarkdownRef.current = value;
      canonicalMarkdownStaleRef.current = false;
    }
  };

  const handleModeChange = async (newMode: ExtensiveEditorMode) => {
    const normalizedNextMode = toCanonicalExtensiveMode(newMode);
    if (normalizedNextMode === mode) {
      return;
    }

    if (!hasExtensiveMode(availableModes, normalizedNextMode)) {
      return;
    }

    const currentMode = mode;
    let errorMode: ExtensiveEditorSourceMode | null = null;

    try {
      setSourceError(null);

      if (isSourceMode(currentMode)) {
        const currentSourceMode = currentMode;
        if (sourceDirtyRef.current[currentSourceMode]) {
          errorMode = currentSourceMode;
          importFromSourceMode(currentSourceMode);
          await new Promise((resolve) => setTimeout(resolve, 50));
          errorMode = null;
        }
      }

      if (
        markdownSourceOfTruth &&
        canonicalMarkdownStaleRef.current &&
        (isVisualEditorMode(currentMode) || (isSourceMode(currentMode) && currentMode !== "markdown"))
      ) {
        ensureCanonicalMarkdownFromVisual();
      }

      if (isVisualEditorMode(currentMode) && !isVisualEditorMode(normalizedNextMode)) {
        if (editor) {
          clearLexicalSelection(editor);
        }
        editor?.getRootElement()?.blur();
      }

      setMode(normalizedNextMode);

      if (isSourceMode(normalizedNextMode)) {
        const targetMode = normalizedNextMode;
        if (!isModeCached(cacheValidRef.current, targetMode)) {
          setConvertingMode(targetMode);
          await new Promise((resolve) => setTimeout(resolve, 50));
          try {
            errorMode = targetMode;
            const nextSource = markdownSourceOfTruth
              ? targetMode === "markdown"
                ? ensureCanonicalMarkdown()
                : exportFromCanonicalMarkdown(targetMode)
              : exportToSourceMode(targetMode);
            updateSourceModeContent(targetMode, nextSource);
            markModeCached(cacheValidRef.current, targetMode);
            errorMode = null;
          } finally {
            setConvertingMode(null);
          }
        }
      }

      if (isVisualEditorMode(normalizedNextMode)) {
        const isEditIntentTransition =
          currentMode === "visual-only" && pendingEditIntentRef.current !== null;

        if (isEditIntentTransition) {
          setTimeout(() => editor?.focus(), 100);
        } else {
          scheduleAfterVisualShellMount(() => {
            const rootElement = editor?.getRootElement();
            if (!rootElement) {
              return;
            }

            resetVisualEditorScrollPosition(rootElement);
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Invalid format - could not parse content";
      if (errorMode && typeof window !== "undefined") {
        setSourceError({ mode: errorMode, error: errorMessage });
      }
    }
  };

  const handleVisualOnlyEditIntent = (position: { clientX: number; clientY: number }) => {
    if (!editOnClick || mode !== "visual-only" || !hasExtensiveMode(availableModes, "visual-editor")) {
      return;
    }

    pendingEditIntentRef.current = position;
    void handleModeChange("visual-editor");
  };

  useEffect(() => {
    if (!isVisualEditorMode(mode)) {
      return;
    }

    const pending = pendingEditIntentRef.current;
    if (!pending) {
      return;
    }

    pendingEditIntentRef.current = null;
    const run = () => {
      const editableElement = editor?.getRootElement();
      if (!editableElement) {
        return;
      }

      positionCaretInNearestLine(editableElement, pending.clientX, pending.clientY);
    };

    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => run());
      return;
    }

    const timeoutId = globalThis.setTimeout(run, 0);
    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [editor, mode]);

  const toolbarNode = isToolbarEnabled ? (
    <Toolbar
      commands={safeCommands}
      hasExtension={(name: string) => hasExtension(name as any)}
      activeStates={activeStates}
      isDark={isDark}
      toggleTheme={toggleTheme}
      onCommandPaletteOpen={() => {
        if (isVisualEditorMode(mode) && featureFlags.commandPalette !== false) {
          safeCommands.showCommandPalette();
        }
      }}
      imageUploadHandler={(file) => ((extensions.find((ext: any) => ext.name === "image") as any)?.config?.uploadHandler?.(file) ?? Promise.resolve(URL.createObjectURL(file)))}
      layout={toolbarLayout ?? TRADITIONAL_TOOLBAR_LAYOUT}
      toolbarVisibility={resolvedToolbarVisibility}
      toolbarStyleVars={toolbarStyleVars}
      headingOptions={resolvedHeadingOptions}
      paragraphLabel={paragraphLabel}
      isListStyleDropdownEnabled={isListStyleDropdownEnabled}
      classNames={{
        toolbar: `luthor-toolbar luthor-toolbar--align-${toolbarAlignment}${toolbarClassName ? ` ${toolbarClassName}` : ""}`,
      }}
    />
  ) : null;
  const shouldRenderModeTabs = isEditorViewTabsVisible;
  const shouldRenderTopToolbar = isVisualEditorMode(mode) && isToolbarEnabled && toolbarPosition === "top";
  const shouldPinTopRegion = isToolbarPinned && toolbarPosition === "top" && shouldRenderModeTabs;
  const topRegionClassName = ["luthor-editor-top-region", shouldPinTopRegion ? "luthor-editor-top-region--pinned" : ""]
    .filter(Boolean)
    .join(" ");
  const shouldPinTopToolbarSlot = isToolbarPinned && toolbarPosition === "top" && !shouldRenderModeTabs;
  const topToolbarSlotClassName = ["luthor-editor-toolbar-slot", "luthor-editor-toolbar-slot--top", shouldRenderTopToolbar && shouldPinTopToolbarSlot ? "luthor-editor-toolbar-slot--pinned" : ""]
    .filter(Boolean)
    .join(" ");
  const shouldRenderBottomToolbar = isVisualEditorMode(mode) && isToolbarEnabled && toolbarPosition === "bottom";
  const overlayPortalContainer =
    (editor?.getRootElement()?.closest(".luthor-editor-wrapper") as HTMLElement | null) ?? null;
  const activeSourceMode = isSourceMode(mode) ? mode : null;
  const isVisualOnlyMode = mode === "visual-only";
  const showVisualShell = isVisualEditorMode(mode) || isVisualOnlyMode;
  const shouldHideDraggableAffordances = !isDraggableBoxEnabled || !isVisualEditorMode(mode);

  return (
    <>
      <div
        className={`luthor-editor${shouldHideDraggableAffordances ? " luthor-editor--draggable-disabled" : ""}`}
        data-mode={mode}
      >
        {(shouldRenderModeTabs || shouldRenderTopToolbar) && (
          <div className={topRegionClassName}>
            {shouldRenderModeTabs && (
              <div className="luthor-editor-header">
                <ModeTabs 
                  mode={mode} 
                  onModeChange={handleModeChange} 
                  availableModes={availableModes}
                  isConverting={convertingMode}
                />
              </div>
            )}
            {shouldRenderTopToolbar && (
              <div className={topToolbarSlotClassName}>{toolbarNode}</div>
            )}
          </div>
        )}
        <div
          className={`luthor-editor-visual-shell${showVisualShell ? "" : " is-hidden"}${shouldHideDraggableAffordances ? " luthor-editor-visual-shell--no-gutter" : ""}`}
          aria-hidden={!showVisualShell}
        >
          {!shouldHideDraggableAffordances && (
            <div className="luthor-editor-visual-gutter" aria-hidden="true" />
          )}
          <RichText
            placeholder={visualPlaceholder}
            nonEditableVisualMode={isVisualOnlyMode}
            onEditIntent={isVisualOnlyMode ? handleVisualOnlyEditIntent : undefined}
            classNames={{
              container: "luthor-richtext-container luthor-preset-extensive__container",
              contentEditable: "luthor-content-editable luthor-preset-extensive__content",
              placeholder: "luthor-placeholder luthor-preset-extensive__placeholder",
            }}
          />
        </div>
        {activeSourceMode && (
          <div className="luthor-source-panel">
            {sourceError && sourceError.mode === activeSourceMode && (
              <div className="luthor-source-error">
                <div className="luthor-source-error-icon">!</div>
                <div className="luthor-source-error-message">
                  <strong>{SOURCE_MODE_ERROR_TITLE[activeSourceMode]}</strong>
                  <p>{sourceError.error}</p>
                  <small>Fix the errors above and try switching modes again</small>
                </div>
              </div>
            )}
            {activeSourceMode === "json" && (
              <SourceView
                value={content.json}
                onChange={(value) => updateSourceModeContent("json", value, { dirty: true })}
                placeholder={jsonPlaceholder}
                showLineNumbers={showLineNumbers}
              />
            )}
            {activeSourceMode === "markdown" && (
              <SourceView
                value={content.markdown}
                onChange={(value) => updateSourceModeContent("markdown", value, { dirty: true })}
                placeholder={markdownPlaceholder}
                className="luthor-source-view--wrapped"
                wrap="soft"
                showLineNumbers={showLineNumbers}
              />
            )}
            {activeSourceMode === "html" && (
              <SourceView
                value={content.html}
                onChange={(value) => updateSourceModeContent("html", value, { dirty: true })}
                placeholder={htmlPlaceholder}
                className="luthor-source-view--wrapped"
                wrap="soft"
                showLineNumbers={showLineNumbers}
              />
            )}
          </div>
        )}
      </div>
      <LinkHoverBubble
        editor={editor}
        commands={safeCommands}
        editorTheme={isDark ? "dark" : "light"}
        disabled={!isVisualEditorMode(mode)}
      />
      {shouldRenderBottomToolbar && (
        <div className="luthor-editor-toolbar-slot luthor-editor-toolbar-slot--bottom">{toolbarNode}</div>
      )}
      {isVisualEditorMode(mode) && (
        <CommandPalette
          isOpen={commandPaletteState.isOpen}
          onClose={() => safeCommands.hideCommandPalette()}
          commands={commandPaletteState.commands}
        />
      )}
      {isVisualEditorMode(mode) && (
        <SlashCommandMenu
          isOpen={slashCommandState.isOpen}
          query={slashCommandState.query}
          position={slashCommandState.position}
          portalContainer={overlayPortalContainer}
          commands={slashCommandState.commands}
          onClose={() => safeCommands.closeSlashMenu?.()}
          onExecute={(commandId) => {
            safeCommands.executeSlashCommand?.(commandId);
          }}
        />
      )}
      {isVisualEditorMode(mode) && (
        <EmojiSuggestionMenu
          isOpen={emojiSuggestionState.isOpen}
          query={emojiSuggestionState.query}
          position={emojiSuggestionState.position}
          portalContainer={overlayPortalContainer}
          suggestions={emojiSuggestionState.suggestions}
          onClose={() => safeCommands.closeEmojiSuggestions?.()}
          onExecute={(emoji) => {
            safeCommands.executeEmojiSuggestion?.(emoji);
          }}
        />
      )}
    </>
  );
}

export interface ExtensiveEditorProps {
  className?: string;
  onReady?: (methods: ExtensiveEditorRef) => void;
  initialTheme?: "light" | "dark";
  onThemeChange?: (theme: "light" | "dark") => void;
  theme?: Partial<LuthorTheme>;
  defaultContent?: string;
  showDefaultContent?: boolean;
  placeholder?: ExtensiveEditorPlaceholder;
  defaultEditorView?: ExtensiveEditorMode;
  initialMode?: ExtensiveEditorMode;
  /** Preferred prop name for toggling editor view tabs visibility */
  isEditorViewTabsVisible?: boolean;
  /** Backward-compatible alias for toggling editor view tabs visibility */
  isEditorViewsTabVisible?: boolean;
  availableModes?: readonly ExtensiveEditorMode[];
  variantClassName?: string;
  toolbarLayout?: ToolbarLayout;
  toolbarVisibility?: ToolbarVisibility;
  toolbarPosition?: ToolbarPosition;
  toolbarAlignment?: ToolbarAlignment;
  toolbarClassName?: string;
  toolbarStyleVars?: ToolbarStyleVars;
  quoteClassName?: string;
  quoteStyleVars?: QuoteStyleVars;
  defaultSettings?: DefaultSettings;
  editorThemeOverrides?: EditorThemeOverrides;
  isToolbarEnabled?: boolean;
  isToolbarPinned?: boolean;
  fontFamilyOptions?: readonly FontFamilyOption[];
  fontSizeOptions?: readonly FontSizeOption[];
  lineHeightOptions?: readonly LineHeightOption[];
  minimumDefaultLineHeight?: string | number;
  scaleByRatio?: boolean;
  headingOptions?: readonly BlockHeadingLevel[];
  paragraphLabel?: string;
  syncHeadingOptionsWithCommands?: boolean;
  slashCommandVisibility?: SlashCommandVisibility;
  shortcutConfig?: CommandShortcutConfig;
  commandPaletteShortcutOnly?: boolean;
  isListStyleDropdownEnabled?: boolean;
  /**
   * When enabled, clicking inside Visual Only view switches to editable Visual mode
   * and places the caret at the clicked coordinate (or nearest line).
   */
  editOnClick?: boolean;
  isDraggableBoxEnabled?: boolean;
  featureFlags?: FeatureFlagOverrides;
  sourceMetadataMode?: SourceMetadataMode;
  markdownBridgeFlavor?: MarkdownBridgeFlavor;
  markdownSourceOfTruth?: boolean;
  syntaxHighlighting?: "auto" | "disabled";
  codeHighlightProvider?: CodeHighlightProvider | null;
  loadCodeHighlightProvider?: () => Promise<CodeHighlightProvider | null>;
  maxAutoDetectCodeLength?: number;
  isCopyAllowed?: boolean;
  languageOptions?: readonly string[] | CodeLanguageOptionsConfig;
  showLineNumbers?: boolean;
  /** Controls accent styling for inline code spans without affecting fenced code blocks. */
  inlineCodeHighlighting?: boolean;
  /** Maximum list sub-indent levels (excluding top-level list). Default: 8 */
  maxListIndentation?: number;
}

export const ExtensiveEditor = forwardRef<ExtensiveEditorRef, ExtensiveEditorProps>(
  ({
    className,
    onReady,
    initialTheme = "light",
    onThemeChange,
    theme,
    defaultContent,
    showDefaultContent = true,
    placeholder = DEFAULT_VISUAL_PLACEHOLDER,
    defaultEditorView,
    initialMode = "visual-editor",
    isEditorViewTabsVisible,
    isEditorViewsTabVisible,
    availableModes = ["visual-editor", "visual-only", "json", "markdown", "html"],
    variantClassName,
    toolbarLayout,
    toolbarVisibility,
    toolbarPosition = "top",
    toolbarAlignment = "left",
    toolbarClassName,
    toolbarStyleVars,
    quoteClassName,
    quoteStyleVars,
    defaultSettings,
    editorThemeOverrides,
    isToolbarEnabled = true,
    isToolbarPinned = false,
    fontFamilyOptions,
    fontSizeOptions,
    lineHeightOptions,
    minimumDefaultLineHeight = 1.5,
    scaleByRatio = false,
    headingOptions,
    paragraphLabel,
    syncHeadingOptionsWithCommands = true,
    slashCommandVisibility,
    shortcutConfig,
    commandPaletteShortcutOnly = false,
    isListStyleDropdownEnabled = true,
    editOnClick = true,
    isDraggableBoxEnabled,
    featureFlags,
    sourceMetadataMode = "preserve",
    markdownBridgeFlavor = "luthor",
    markdownSourceOfTruth = false,
    syntaxHighlighting,
    codeHighlightProvider,
    loadCodeHighlightProvider,
    maxAutoDetectCodeLength,
    isCopyAllowed = true,
    languageOptions,
    showLineNumbers = true,
    inlineCodeHighlighting = true,
    maxListIndentation = 8,
  }, ref) => {
    const [editorTheme, setEditorTheme] = useState<"light" | "dark">(initialTheme);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const isDark = editorTheme === "dark";
    const requestedInitialMode = toCanonicalExtensiveMode(defaultEditorView ?? initialMode);
    const resolvedInitialMode = hasExtensiveMode(availableModes, requestedInitialMode)
      ? requestedInitialMode
      : toCanonicalExtensiveMode(availableModes[0] ?? "visual-editor");
    const resolvedIsEditorViewTabsVisible = isEditorViewTabsVisible ?? isEditorViewsTabVisible ?? true;

    const toggleTheme = () => setEditorTheme(isDark ? "light" : "dark");
    const resolvedPlaceholders = useMemo(() => {
      if (typeof placeholder === "string") {
        return {
          visual: placeholder,
          json: DEFAULT_JSON_PLACEHOLDER,
          markdown: DEFAULT_MARKDOWN_PLACEHOLDER,
          html: DEFAULT_HTML_PLACEHOLDER,
        };
      }

      return {
        visual: placeholder.visual ?? DEFAULT_VISUAL_PLACEHOLDER,
        json: placeholder.json ?? DEFAULT_JSON_PLACEHOLDER,
        markdown: placeholder.markdown ?? DEFAULT_MARKDOWN_PLACEHOLDER,
        html: placeholder.html ?? DEFAULT_HTML_PLACEHOLDER,
      };
    }, [placeholder]);

    useEffect(() => {
      setEditorTheme(initialTheme);
    }, [initialTheme]);

    useEffect(() => {
      onThemeChange?.(editorTheme);
    }, [editorTheme, onThemeChange]);

    useEffect(() => {
      if (!isToolbarPinned || toolbarPosition !== "top") {
        return;
      }

      const wrapper = wrapperRef.current;
      if (!wrapper) {
        return;
      }

      return setupToolbarPinOverflowFallback(wrapper);
    }, [isToolbarPinned, toolbarPosition]);

    const fontFamilyOptionsKey = useMemo(
      () => normalizeFontFamilyOptionsKey(fontFamilyOptions),
      [fontFamilyOptions],
    );
    const fontSizeOptionsKey = useMemo(
      () => normalizeFontSizeOptionsKey(fontSizeOptions),
      [fontSizeOptions],
    );
    const lineHeightOptionsKey = useMemo(
      () => normalizeLineHeightOptionsKey(lineHeightOptions),
      [lineHeightOptions],
    );
    const minimumDefaultLineHeightKey = useMemo(
      () => normalizeMinimumDefaultLineHeightKey(minimumDefaultLineHeight),
      [minimumDefaultLineHeight],
    );
    const maxListIndentationKey = useMemo(
      () => normalizeMaxListIndentationKey(maxListIndentation),
      [maxListIndentation],
    );
    const syntaxHighlightKey = syntaxHighlighting ?? "unset";
    const maxAutoDetectKey =
      typeof maxAutoDetectCodeLength === "number"
        ? maxAutoDetectCodeLength.toString()
        : "unset";
    const languageOptionsKey = useMemo(
      () => normalizeLanguageOptionsKey(languageOptions),
      [languageOptions],
    );
    const copyAllowedKey = isCopyAllowed ? "copy-on" : "copy-off";
    const lineNumbersKey = showLineNumbers ? "line-numbers-on" : "line-numbers-off";
    const effectiveFeatureFlags = useMemo<FeatureFlagOverrides | undefined>(() => {
      if (typeof isDraggableBoxEnabled !== "boolean") {
        return featureFlags;
      }

      return {
        ...(featureFlags ?? {}),
        draggableBlock: isDraggableBoxEnabled,
      };
    }, [featureFlags, isDraggableBoxEnabled]);
    const featureFlagsKey = useMemo(
      () => normalizeFeatureFlagsKey(effectiveFeatureFlags),
      [effectiveFeatureFlags],
    );
    const resolvedFeatureFlags = useMemo(
      () => resolveFeatureFlags(effectiveFeatureFlags),
      [effectiveFeatureFlags],
    );
    const extensionsKey = `${fontFamilyOptionsKey}::${fontSizeOptionsKey}::${lineHeightOptionsKey}::${minimumDefaultLineHeightKey}::${maxListIndentationKey}::${scaleByRatio ? "ratio-on" : "ratio-off"}::${syntaxHighlightKey}::${maxAutoDetectKey}::${copyAllowedKey}::${lineNumbersKey}::${languageOptionsKey}::${featureFlagsKey}`;
    const stableFontFamilyOptionsRef = useRef<readonly FontFamilyOption[] | undefined>(fontFamilyOptions);
    const stableFontSizeOptionsRef = useRef<readonly FontSizeOption[] | undefined>(fontSizeOptions);
    const stableLineHeightOptionsRef = useRef<readonly LineHeightOption[] | undefined>(lineHeightOptions);
    const stableMinimumDefaultLineHeightRef = useRef<string | number | undefined>(minimumDefaultLineHeight);
    const stableFeatureFlagsRef = useRef<FeatureFlagOverrides | undefined>(effectiveFeatureFlags);
    const stableLanguageOptionsRef = useRef<
      readonly string[] | CodeLanguageOptionsConfig | undefined
    >(languageOptions);
    const stableCodeHighlightProviderRef = useRef<CodeHighlightProvider | null | undefined>(codeHighlightProvider);
    const stableLoadCodeHighlightProviderRef = useRef<
      (() => Promise<CodeHighlightProvider | null>) | undefined
    >(loadCodeHighlightProvider);
    const stableExtensionsKeyRef = useRef(extensionsKey);

    if (
      stableExtensionsKeyRef.current !== extensionsKey ||
      stableCodeHighlightProviderRef.current !== codeHighlightProvider ||
      stableLoadCodeHighlightProviderRef.current !== loadCodeHighlightProvider
    ) {
      stableExtensionsKeyRef.current = extensionsKey;
      stableFontFamilyOptionsRef.current = fontFamilyOptions;
      stableFontSizeOptionsRef.current = fontSizeOptions;
      stableLineHeightOptionsRef.current = lineHeightOptions;
      stableMinimumDefaultLineHeightRef.current = minimumDefaultLineHeight;
      stableFeatureFlagsRef.current = effectiveFeatureFlags;
      stableLanguageOptionsRef.current = languageOptions;
      stableCodeHighlightProviderRef.current = codeHighlightProvider;
      stableLoadCodeHighlightProviderRef.current = loadCodeHighlightProvider;
    }

    const memoizedExtensionsRef = useRef<{
      key: string;
      value: ReturnType<typeof createExtensiveExtensions>;
    } | null>(null);

    if (!memoizedExtensionsRef.current || memoizedExtensionsRef.current.key !== extensionsKey) {
      const nextConfig = {
        fontFamilyOptions: stableFontFamilyOptionsRef.current,
        fontSizeOptions: stableFontSizeOptionsRef.current,
        lineHeightOptions: stableLineHeightOptionsRef.current,
        minimumDefaultLineHeight: stableMinimumDefaultLineHeightRef.current,
        maxListIndentation: Number(maxListIndentationKey),
        scaleByRatio,
        ...(syntaxHighlighting !== undefined
          ? { syntaxHighlighting }
          : {}),
        ...(stableCodeHighlightProviderRef.current !== undefined
          ? { codeHighlightProvider: stableCodeHighlightProviderRef.current }
          : {}),
        ...(stableLoadCodeHighlightProviderRef.current !== undefined
          ? { loadCodeHighlightProvider: stableLoadCodeHighlightProviderRef.current }
          : {}),
        ...(maxAutoDetectCodeLength !== undefined
          ? { maxAutoDetectCodeLength }
          : {}),
        isCopyAllowed,
        showLineNumbers,
        ...(stableLanguageOptionsRef.current !== undefined
          ? { languageOptions: stableLanguageOptionsRef.current }
          : {}),
        ...(typeof isDraggableBoxEnabled === "boolean"
          ? { isDraggableBoxEnabled }
          : {}),
        ...(stableFeatureFlagsRef.current ? { featureFlags: stableFeatureFlagsRef.current } : {}),
      };

      memoizedExtensionsRef.current = {
        key: extensionsKey,
        value: createExtensiveExtensions(nextConfig),
      };
    }
    const memoizedExtensions = memoizedExtensionsRef.current.value;
    const editorThemeConfig = useMemo(() => {
      const mergedTheme = mergeThemes(defaultLuthorTheme, theme ?? {});
      if (!quoteClassName) {
        return mergedTheme;
      }

      return {
        ...mergedTheme,
        quote: `${mergedTheme.quote ?? ""} ${quoteClassName}`.trim(),
      };
    }, [theme, quoteClassName]);
    const editorThemeOverridesKey = useMemo(
      () => normalizeStyleVarsKey(editorThemeOverrides),
      [editorThemeOverrides],
    );
    const quoteStyleVarsKey = useMemo(
      () => normalizeStyleVarsKey(quoteStyleVars),
      [quoteStyleVars],
    );
    const defaultSettingsVars = useMemo(
      () => createDefaultSettingsStyleVarRecord(defaultSettings),
      [defaultSettings],
    );
    const defaultSettingsKey = useMemo(
      () => normalizeStyleVarsKey(defaultSettingsVars),
      [defaultSettingsVars],
    );

    const wrapperStyleVars = useMemo(() => {
      void defaultSettingsKey;
      void editorThemeOverridesKey;
      void quoteStyleVarsKey;
      const defaultVars = defaultSettingsVars as CSSProperties | undefined;
      const editorThemeVars = createEditorThemeStyleVars(editorThemeOverrides);
      const quoteVars = quoteStyleVars as CSSProperties | undefined;
      const lineHeightVars = {
        "--luthor-default-line-height": minimumDefaultLineHeightKey,
      } as CSSProperties;
      if (!defaultVars && !editorThemeVars && !quoteVars) {
        return lineHeightVars;
      }

      return {
        ...(defaultVars ?? {}),
        ...(editorThemeVars as CSSProperties | undefined),
        ...(quoteVars ?? {}),
        ...lineHeightVars,
      };
    }, [
      minimumDefaultLineHeightKey,
      defaultSettingsVars,
      editorThemeOverrides,
      quoteStyleVars,
      defaultSettingsKey,
      editorThemeOverridesKey,
      quoteStyleVarsKey,
    ]);

    const [methods, setMethods] = useState<ExtensiveEditorRef | null>(null);
    useImperativeHandle(
      ref,
      () =>
        methods ?? {
          injectJSON: () => {},
          getJSON: () => serializeJSONToSource("json", EMPTY_JSON_DOCUMENT),
          getMarkdown: () =>
            serializeJSONToSource(
              "markdown",
              EMPTY_JSON_DOCUMENT,
              sourceMetadataMode,
              markdownBridgeFlavor,
            ),
          getHTML: () =>
            serializeJSONToSource(
              "html",
              EMPTY_JSON_DOCUMENT,
              sourceMetadataMode,
              markdownBridgeFlavor,
            ),
        },
      [markdownBridgeFlavor, methods, sourceMetadataMode],
    );

    const handleReady = (m: ExtensiveEditorRef) => {
      setMethods(m);
      if (defaultContent) {
        m.injectJSON(toJSONInput(defaultContent));
      } else if (showDefaultContent) {
        // Demo starter content is app-owned; package presets remain content-neutral by default.
      }
      onReady?.(m);
    };

    return (
      <div
        ref={wrapperRef}
        className={`luthor-preset luthor-preset-extensive luthor-editor-wrapper${isToolbarPinned ? " luthor-editor-wrapper--toolbar-pinned" : ""} ${variantClassName || ""} ${className || ""}`.trim()}
        data-editor-theme={editorTheme}
        data-inline-code-highlighting={inlineCodeHighlighting ? "on" : "off"}
        style={wrapperStyleVars}
      >
        <Provider extensions={memoizedExtensions} config={{ theme: editorThemeConfig }}>
          <ExtensiveEditorContent
            isDark={isDark}
            toggleTheme={toggleTheme}
            visualPlaceholder={resolvedPlaceholders.visual}
            jsonPlaceholder={resolvedPlaceholders.json}
            markdownPlaceholder={resolvedPlaceholders.markdown}
            htmlPlaceholder={resolvedPlaceholders.html}
            initialMode={resolvedInitialMode}
            availableModes={availableModes}
            onReady={handleReady}
            toolbarLayout={toolbarLayout}
            toolbarVisibility={toolbarVisibility}
            toolbarPosition={toolbarPosition}
            toolbarAlignment={toolbarAlignment}
            toolbarClassName={toolbarClassName}
            toolbarStyleVars={toolbarStyleVars}
            isToolbarEnabled={isToolbarEnabled}
            isToolbarPinned={isToolbarPinned}
            isEditorViewTabsVisible={resolvedIsEditorViewTabsVisible}
            headingOptions={headingOptions}
            paragraphLabel={paragraphLabel}
            syncHeadingOptionsWithCommands={syncHeadingOptionsWithCommands}
            slashCommandVisibility={slashCommandVisibility}
            shortcutConfig={shortcutConfig}
            commandPaletteShortcutOnly={commandPaletteShortcutOnly}
            isListStyleDropdownEnabled={isListStyleDropdownEnabled}
            featureFlags={resolvedFeatureFlags}
            editOnClick={editOnClick}
            sourceMetadataMode={sourceMetadataMode}
            markdownBridgeFlavor={markdownBridgeFlavor}
            markdownSourceOfTruth={markdownSourceOfTruth}
            showLineNumbers={showLineNumbers}
          />
        </Provider>
      </div>
    );
  },
);

ExtensiveEditor.displayName = "ExtensiveEditor";
