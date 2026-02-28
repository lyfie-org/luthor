import {
  TableExtension,
  IframeEmbedExtension,
  YouTubeEmbedExtension,
  ImageExtension,
  ContextMenuExtension,
  CommandPaletteExtension,
  SlashCommandExtension,
  EmojiExtension,
  DraggableBlockExtension,
  LinkExtension,
  createCustomNodeExtension,
  boldExtension,
  italicExtension,
  underlineExtension,
  strikethroughExtension,
  FontFamilyExtension,
  type FontFamilyOption,
  FontSizeExtension,
  type FontSizeOption,
  LineHeightExtension,
  type LineHeightOption,
  textColorExtension,
  textHighlightExtension,
  subscriptExtension,
  superscriptExtension,
  horizontalRuleExtension,
  listExtension,
  historyExtension,
  blockFormatExtension,
  codeExtension,
  codeIntelligenceExtension,
  codeFormatExtension,
  tabIndentExtension,
  enterKeyBehaviorExtension,
  type CodeHighlightProvider,
  type CodeLanguageOptionsConfig,
  type Extension,
} from "@lyfie/luthor-headless";
import type { ReactNode } from "react";
import { createFloatingToolbarExtension, setFloatingToolbarContext } from "../../core";

export { setFloatingToolbarContext };

export const EXTENSIVE_FEATURE_KEYS = [
  "bold",
  "italic",
  "underline",
  "strikethrough",
  "fontFamily",
  "fontSize",
  "lineHeight",
  "textColor",
  "textHighlight",
  "subscript",
  "superscript",
  "link",
  "horizontalRule",
  "table",
  "list",
  "history",
  "image",
  "blockFormat",
  "code",
  "codeIntelligence",
  "codeFormat",
  "tabIndent",
  "enterKeyBehavior",
  "iframeEmbed",
  "youTubeEmbed",
  "floatingToolbar",
  "contextMenu",
  "commandPalette",
  "slashCommand",
  "emoji",
  "draggableBlock",
  "customNode",
  "themeToggle",
] as const;

export type FeatureFlag = (typeof EXTENSIVE_FEATURE_KEYS)[number];
export type FeatureFlags = Record<FeatureFlag, boolean>;
export type FeatureFlagOverrides = Partial<FeatureFlags>;

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  bold: true,
  italic: true,
  underline: true,
  strikethrough: true,
  fontFamily: true,
  fontSize: true,
  lineHeight: true,
  textColor: true,
  textHighlight: true,
  subscript: true,
  superscript: true,
  link: true,
  horizontalRule: true,
  table: true,
  list: true,
  history: true,
  image: true,
  blockFormat: true,
  code: true,
  codeIntelligence: true,
  codeFormat: true,
  tabIndent: true,
  enterKeyBehavior: true,
  iframeEmbed: true,
  youTubeEmbed: true,
  floatingToolbar: true,
  contextMenu: true,
  commandPalette: true,
  slashCommand: true,
  emoji: true,
  draggableBlock: true,
  customNode: true,
  themeToggle: true,
};

export function resolveFeatureFlags(overrides?: FeatureFlagOverrides): FeatureFlags {
  const resolved: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS };
  if (!overrides) {
    return resolved;
  }

  for (const key of EXTENSIVE_FEATURE_KEYS) {
    if (typeof overrides[key] === "boolean") {
      resolved[key] = overrides[key] as boolean;
    }
  }

  return resolved;
}

export function isFeatureEnabled(featureFlags: FeatureFlags, feature: FeatureFlag): boolean {
  return featureFlags[feature] !== false;
}

export type ExtensiveExtensionsConfig = {
  fontFamilyOptions?: readonly FontFamilyOption[];
  fontSizeOptions?: readonly FontSizeOption[];
  lineHeightOptions?: readonly LineHeightOption[];
  minimumDefaultLineHeight?: string | number;
  featureFlags?: FeatureFlagOverrides;
  isDraggableBoxEnabled?: boolean;
  scaleByRatio?: boolean;
  syntaxHighlighting?: "auto" | "disabled";
  codeHighlightProvider?: CodeHighlightProvider | null;
  loadCodeHighlightProvider?: () => Promise<CodeHighlightProvider | null>;
  maxAutoDetectCodeLength?: number;
  isCopyAllowed?: boolean;
  languageOptions?: readonly string[] | CodeLanguageOptionsConfig;
};

const DEFAULT_EXTENSIVE_FONT_FAMILY_OPTIONS: readonly FontFamilyOption[] = [
  { value: "default", label: "Default", fontFamily: "inherit" },
  {
    value: "inter",
    label: "Inter",
    fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
    cssImportUrl:
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  },
  {
    value: "merriweather",
    label: "Merriweather",
    fontFamily: "'Merriweather', Georgia, 'Times New Roman', serif",
    cssImportUrl:
      "https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap",
  },
  {
    value: "jetbrains-mono",
    label: "JetBrains Mono",
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    cssImportUrl:
      "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap",
  },
];

const DEFAULT_FONT_FAMILY_OPTION: FontFamilyOption = {
  value: "default",
  label: "Default",
  fontFamily: "inherit",
};

const DEFAULT_EXTENSIVE_FONT_SIZE_OPTIONS: readonly FontSizeOption[] = [
  { value: "default", label: "Default", fontSize: "inherit" },
  { value: "12", label: "12px", fontSize: "12px" },
  { value: "14", label: "14px", fontSize: "14px" },
  { value: "16", label: "16px", fontSize: "16px" },
  { value: "18", label: "18px", fontSize: "18px" },
  { value: "20", label: "20px", fontSize: "20px" },
  { value: "24", label: "24px", fontSize: "24px" },
  { value: "32", label: "32px", fontSize: "32px" },
];

const DEFAULT_FONT_SIZE_OPTION: FontSizeOption = {
  value: "default",
  label: "Default",
  fontSize: "inherit",
};

const DEFAULT_EXTENSIVE_LINE_HEIGHT_OPTIONS: readonly LineHeightOption[] = [
  { value: "default", label: "Default", lineHeight: "1.5" },
  { value: "1", label: "1.0", lineHeight: "1" },
  { value: "1.15", label: "1.15", lineHeight: "1.15" },
  { value: "1.5", label: "1.5", lineHeight: "1.5" },
  { value: "1.75", label: "1.75", lineHeight: "1.75" },
  { value: "2", label: "2.0", lineHeight: "2" },
];

const DEFAULT_LINE_HEIGHT_OPTION: LineHeightOption = {
  value: "default",
  label: "Default",
  lineHeight: "1.5",
};
const DEFAULT_LINE_HEIGHT_RATIO = "1.5";
const MIN_LINE_HEIGHT_RATIO = 1;

function normalizeOptionToken(value: string): string {
  return value.trim().toLowerCase();
}

function isValidOptionToken(value: string): boolean {
  return /^[a-z0-9][a-z0-9-]*$/i.test(value);
}

function isValidLineHeightOptionValue(value: string): boolean {
  const normalized = normalizeOptionToken(value);
  if (normalized === "default") {
    return true;
  }

  return parseLineHeightRatio(value) !== null;
}

function resolveFontFamilyOptions(
  inputOptions?: readonly FontFamilyOption[],
): readonly FontFamilyOption[] {
  const candidateOptions = inputOptions ?? DEFAULT_EXTENSIVE_FONT_FAMILY_OPTIONS;
  const seen = new Set<string>();
  const sanitized: FontFamilyOption[] = [];

  for (const option of candidateOptions) {
    const value = option.value.trim();
    const label = option.label.trim();
    const fontFamily = option.fontFamily.trim();

    if (!value || !label || !fontFamily) {
      continue;
    }

    if (!isValidOptionToken(value)) {
      continue;
    }

    const normalizedValue = normalizeOptionToken(value);
    if (seen.has(normalizedValue)) {
      continue;
    }

    seen.add(normalizedValue);
    sanitized.push({
      value,
      label,
      fontFamily,
      cssImportUrl: option.cssImportUrl?.trim() || undefined,
    });
  }

  if (sanitized.length === 0) {
    return DEFAULT_EXTENSIVE_FONT_FAMILY_OPTIONS;
  }

  const hasDefaultOption = sanitized.some((option) => {
    return normalizeOptionToken(option.value) === "default";
  });

  if (!hasDefaultOption) {
    return [DEFAULT_FONT_FAMILY_OPTION, ...sanitized];
  }

  return sanitized;
}

function resolveFontSizeOptions(
  inputOptions?: readonly FontSizeOption[],
): readonly FontSizeOption[] {
  const candidateOptions = inputOptions ?? DEFAULT_EXTENSIVE_FONT_SIZE_OPTIONS;
  const seen = new Set<string>();
  const sanitized: FontSizeOption[] = [];

  for (const option of candidateOptions) {
    const value = String(option.value).trim();
    const label = String(option.label).trim();
    const fontSize = String(option.fontSize).trim();

    if (!value || !label || !fontSize) {
      continue;
    }

    if (!isValidOptionToken(value)) {
      continue;
    }

    const normalizedValue = normalizeOptionToken(value);
    if (seen.has(normalizedValue)) {
      continue;
    }

    seen.add(normalizedValue);
    sanitized.push({
      value,
      label,
      fontSize,
    });
  }

  if (sanitized.length === 0) {
    return DEFAULT_EXTENSIVE_FONT_SIZE_OPTIONS;
  }

  const hasDefaultOption = sanitized.some((option) => {
    return normalizeOptionToken(option.value) === "default";
  });

  if (!hasDefaultOption) {
    return [DEFAULT_FONT_SIZE_OPTION, ...sanitized];
  }

  return sanitized;
}

function parseLineHeightRatio(value: string): string | null {
  const trimmed = value.trim();
  if (!/^\d*\.?\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < MIN_LINE_HEIGHT_RATIO) {
    return null;
  }

  return parsed.toString();
}

function normalizeMinimumDefaultLineHeight(input: string | number | undefined): string {
  if (typeof input === "number") {
    if (!Number.isFinite(input)) {
      return DEFAULT_LINE_HEIGHT_RATIO;
    }

    const normalized = parseLineHeightRatio(input.toString());
    return normalized ?? DEFAULT_LINE_HEIGHT_RATIO;
  }

  if (typeof input === "string") {
    const normalized = parseLineHeightRatio(input);
    return normalized ?? DEFAULT_LINE_HEIGHT_RATIO;
  }

  return DEFAULT_LINE_HEIGHT_RATIO;
}

function resolveLineHeightOptions(
  inputOptions?: readonly LineHeightOption[],
  minimumDefaultLineHeight: string = DEFAULT_LINE_HEIGHT_RATIO,
): readonly LineHeightOption[] {
  const candidateOptions = inputOptions ?? DEFAULT_EXTENSIVE_LINE_HEIGHT_OPTIONS;
  const seen = new Set<string>();
  const sanitized: LineHeightOption[] = [];

  for (const option of candidateOptions) {
    const value = String(option.value).trim();
    const label = String(option.label).trim();

    if (!value || !label) {
      continue;
    }

    if (!isValidLineHeightOptionValue(value)) {
      continue;
    }

    const normalizedValue = normalizeOptionToken(value);
    if (seen.has(normalizedValue)) {
      continue;
    }

    if (normalizedValue === "default") {
      seen.add(normalizedValue);
      sanitized.push({
        value,
        label,
        lineHeight: minimumDefaultLineHeight,
      });
      continue;
    }

    const ratio = parseLineHeightRatio(String(option.lineHeight));
    if (!ratio) {
      continue;
    }

    seen.add(normalizedValue);
    sanitized.push({
      value,
      label,
      lineHeight: ratio,
    });
  }

  if (sanitized.length === 0) {
    return DEFAULT_EXTENSIVE_LINE_HEIGHT_OPTIONS;
  }

  const hasDefaultOption = sanitized.some((option) => {
    return normalizeOptionToken(option.value) === "default";
  });

  if (!hasDefaultOption) {
    return [{ ...DEFAULT_LINE_HEIGHT_OPTION, lineHeight: minimumDefaultLineHeight }, ...sanitized];
  }

  return sanitized;
}

function TableBubbleIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const InsertRowAboveSvg = () => (
  <TableBubbleIcon>
    <rect x="3.5" y="5" width="17" height="14" rx="1.5" />
    <path d="M3.5 11h17" />
    <path d="M10.5 14.5h3" />
    <path d="M12 2.8v4.4" />
    <path d="M9.8 5h4.4" />
  </TableBubbleIcon>
);

const InsertRowBelowSvg = () => (
  <TableBubbleIcon>
    <rect x="3.5" y="5" width="17" height="14" rx="1.5" />
    <path d="M3.5 11h17" />
    <path d="M10.5 8.5h3" />
    <path d="M12 16.8v4.4" />
    <path d="M9.8 19h4.4" />
  </TableBubbleIcon>
);

const InsertColumnLeftSvg = () => (
  <TableBubbleIcon>
    <rect x="3.5" y="5" width="17" height="14" rx="1.5" />
    <path d="M11.5 5v14" />
    <path d="M7.5 10.5v3" />
    <path d="M2.8 12h4.4" />
    <path d="M5 9.8v4.4" />
  </TableBubbleIcon>
);

const InsertColumnRightSvg = () => (
  <TableBubbleIcon>
    <rect x="3.5" y="5" width="17" height="14" rx="1.5" />
    <path d="M12.5 5v14" />
    <path d="M16.5 10.5v3" />
    <path d="M16.8 12h4.4" />
    <path d="M19 9.8v4.4" />
  </TableBubbleIcon>
);

const DeleteRowSvg = () => (
  <TableBubbleIcon>
    <rect x="3.5" y="5" width="17" height="14" rx="1.5" />
    <path d="M3.5 11h17" />
    <path d="M9.8 14.8l4.4 4.4" />
    <path d="M14.2 14.8l-4.4 4.4" />
  </TableBubbleIcon>
);

const DeleteColumnSvg = () => (
  <TableBubbleIcon>
    <rect x="3.5" y="5" width="17" height="14" rx="1.5" />
    <path d="M12 5v14" />
    <path d="M14.8 9.8l4.4 4.4" />
    <path d="M19.2 9.8l-4.4 4.4" />
  </TableBubbleIcon>
);

const DeleteTableSvg = () => (
  <TableBubbleIcon>
    <rect x="3.5" y="5" width="17" height="14" rx="1.5" />
    <path d="M3.5 10.5h17" />
    <path d="M10.5 5v14" />
    <path d="M14.8 9.8l4.4 4.4" />
    <path d="M19.2 9.8l-4.4 4.4" />
  </TableBubbleIcon>
);

const HeaderRowSvg = () => (
  <TableBubbleIcon>
    <rect x="3.5" y="5" width="17" height="14" rx="1.5" />
    <path d="M3.5 10.5h17" />
    <path d="M10.5 5v14" />
    <path d="M3.5 8h17" />
  </TableBubbleIcon>
);

export const extensiveImageExtension = new ImageExtension();
(extensiveImageExtension as any).config = {
  ...(extensiveImageExtension as any).config,
  uploadHandler: async (file: File) => URL.createObjectURL(file),
  defaultAlignment: "center",
  resizable: true,
  pasteListener: { insert: true, replace: true },
  debug: false,
};

const tableExt = new TableExtension();
(tableExt as any).config = {
  ...(tableExt as any).config,
  enableContextMenu: true,
  tableBubbleRenderer: ({ headersEnabled, setHeadersEnabled, actions }: any) => (
    <>
      <button
        type="button"
        className="luthor-table-bubble-button luthor-table-bubble-button-icon"
        title="Insert row above"
        aria-label="Insert row above"
        onClick={actions.insertRowAbove}
      >
        <InsertRowAboveSvg />
      </button>
      <button
        type="button"
        className="luthor-table-bubble-button luthor-table-bubble-button-icon"
        title="Insert row below"
        aria-label="Insert row below"
        onClick={actions.insertRowBelow}
      >
        <InsertRowBelowSvg />
      </button>
      <button
        type="button"
        className="luthor-table-bubble-button luthor-table-bubble-button-icon"
        title="Insert column left"
        aria-label="Insert column left"
        onClick={actions.insertColumnLeft}
      >
        <InsertColumnLeftSvg />
      </button>
      <button
        type="button"
        className="luthor-table-bubble-button luthor-table-bubble-button-icon"
        title="Insert column right"
        aria-label="Insert column right"
        onClick={actions.insertColumnRight}
      >
        <InsertColumnRightSvg />
      </button>
      <button
        type="button"
        className="luthor-table-bubble-button luthor-table-bubble-button-icon"
        title="Delete selected row"
        aria-label="Delete selected row"
        onClick={actions.deleteSelectedRow}
      >
        <DeleteRowSvg />
      </button>
      <button
        type="button"
        className="luthor-table-bubble-button luthor-table-bubble-button-icon"
        title="Delete selected column"
        aria-label="Delete selected column"
        onClick={actions.deleteSelectedColumn}
      >
        <DeleteColumnSvg />
      </button>
      <label className="luthor-table-bubble-checkbox" title="Use first row as table headers">
        <button
          type="button"
          className={`luthor-table-bubble-button luthor-table-bubble-button-icon${headersEnabled ? " luthor-table-bubble-button-active" : ""}`}
          title="Use first row as table headers"
          aria-label="Use first row as table headers"
          aria-pressed={headersEnabled}
          onClick={() => setHeadersEnabled(!headersEnabled)}
        >
          <HeaderRowSvg />
        </button>
      </label>
      <button
        type="button"
        className="luthor-table-bubble-button luthor-table-bubble-button-icon luthor-table-bubble-button-danger"
        title="Delete table"
        aria-label="Delete table"
        onClick={actions.deleteTable}
      >
        <DeleteTableSvg />
      </button>
    </>
  ),
};

const iframeEmbedExt = new IframeEmbedExtension();
(iframeEmbedExt as any).config = {
  ...(iframeEmbedExt as any).config,
  defaultWidth: 720,
  defaultHeight: 405,
  defaultAlignment: "center",
};

const youTubeEmbedExt = new YouTubeEmbedExtension();
(youTubeEmbedExt as any).config = {
  ...(youTubeEmbedExt as any).config,
  defaultWidth: 720,
  defaultHeight: 405,
  defaultAlignment: "center",
  nocookie: true,
  controls: true,
  rel: 1,
};

const floatingToolbarExt = createFloatingToolbarExtension();

const contextMenuExt = new ContextMenuExtension();
(contextMenuExt as any).config = {
  ...(contextMenuExt as any).config,
  preventDefault: true,
};

const commandPaletteExt = new CommandPaletteExtension();
const slashCommandExt = new SlashCommandExtension();
const emojiExt = new EmojiExtension();

const draggableBlockExt = new DraggableBlockExtension();
(draggableBlockExt as any).config = {
  ...(draggableBlockExt as any).config,
  buttonStackPosition: "left",
};

const linkExt = new LinkExtension();
(linkExt as any).config = {
  ...(linkExt as any).config,
  linkSelectedTextOnPaste: true,
  autoLinkText: true,
  autoLinkUrls: true,
};

const textColorExt = textColorExtension.configure({
  options: [
    { value: "default", label: "Default", color: "inherit" },
    { value: "slate", label: "Slate", color: "#334155" },
    { value: "red", label: "Red", color: "#dc2626" },
    { value: "orange", label: "Orange", color: "#ea580c" },
    { value: "green", label: "Green", color: "#16a34a" },
    { value: "blue", label: "Blue", color: "#2563eb" },
    { value: "purple", label: "Purple", color: "#7c3aed" },
  ],
});

const textHighlightExt = textHighlightExtension.configure({
  options: [
    { value: "default", label: "Default", backgroundColor: "transparent" },
    { value: "yellow", label: "Yellow", backgroundColor: "#fef08a" },
    { value: "green", label: "Green", backgroundColor: "#bbf7d0" },
    { value: "blue", label: "Blue", backgroundColor: "#bfdbfe" },
    { value: "pink", label: "Pink", backgroundColor: "#fbcfe8" },
    { value: "orange", label: "Orange", backgroundColor: "#fed7aa" },
  ],
});

const { extension: featureCardExtension } = createCustomNodeExtension({
  nodeType: "featureCard",
  defaultPayload: {
    title: "AI Draft Block",
    description:
      "AI-generated first draft. Review and edit before publishing to customers.",
    tag: "AI Draft",
  },
  render: ({ payload, isSelected }) => (
    <aside className={`luthor-extensive-feature-card${isSelected ? " is-selected" : ""}`}>
      <div className="luthor-extensive-feature-card__tag">{payload.tag ?? "AI Draft"}</div>
      <h4 className="luthor-extensive-feature-card__title">{payload.title ?? "Generated Draft"}</h4>
      <p className="luthor-extensive-feature-card__description">
        {payload.description ?? "AI-generated first pass. Review and finalize before sharing."}
      </p>
    </aside>
  ),
});

function buildExtensiveExtensions({
  fontFamilyOptions,
  fontSizeOptions,
  lineHeightOptions,
  minimumDefaultLineHeight,
  featureFlags,
  isDraggableBoxEnabled,
  scaleByRatio,
  syntaxHighlighting,
  codeHighlightProvider,
  loadCodeHighlightProvider,
  maxAutoDetectCodeLength,
  isCopyAllowed,
  languageOptions,
}: ExtensiveExtensionsConfig = {}) {
  const resolvedFeatureFlags = resolveFeatureFlags(featureFlags);
  const enabled = (feature: FeatureFlag) => isFeatureEnabled(resolvedFeatureFlags, feature);
  const isDraggableFeatureEnabled =
    (isDraggableBoxEnabled ?? true) && enabled("draggableBlock");
  const resolvedMinimumDefaultLineHeight = normalizeMinimumDefaultLineHeight(minimumDefaultLineHeight);

  const fontFamilyExt = new FontFamilyExtension().configure({
    options: resolveFontFamilyOptions(fontFamilyOptions),
    cssLoadStrategy: "on-demand",
  });
  const fontSizeExt = new FontSizeExtension().configure({
    options: resolveFontSizeOptions(fontSizeOptions),
  });
  const lineHeightExt = new LineHeightExtension().configure({
    options: resolveLineHeightOptions(lineHeightOptions, resolvedMinimumDefaultLineHeight),
    defaultLineHeight: resolvedMinimumDefaultLineHeight,
  });
  extensiveImageExtension.configure({
    scaleByRatio: scaleByRatio ?? false,
  });
  (codeExtension as any).configure({
    syntaxHighlighting: syntaxHighlighting ?? "auto",
    provider: codeHighlightProvider ?? undefined,
    loadProvider: loadCodeHighlightProvider,
  });
  (codeIntelligenceExtension as any).configure({
    provider: codeHighlightProvider ?? undefined,
    loadProvider: loadCodeHighlightProvider,
    maxAutoDetectLength: maxAutoDetectCodeLength,
    isCopyAllowed: isCopyAllowed ?? true,
    languageOptions,
  });

  const extensions: Extension[] = [];

  if (enabled("bold")) extensions.push(boldExtension);
  if (enabled("italic")) extensions.push(italicExtension);
  if (enabled("underline")) extensions.push(underlineExtension);
  if (enabled("strikethrough")) extensions.push(strikethroughExtension);
  if (enabled("fontFamily")) extensions.push(fontFamilyExt);
  if (enabled("fontSize")) extensions.push(fontSizeExt);
  if (enabled("lineHeight")) extensions.push(lineHeightExt);
  if (enabled("textColor")) extensions.push(textColorExt);
  if (enabled("textHighlight")) extensions.push(textHighlightExt);
  if (enabled("subscript")) extensions.push(subscriptExtension);
  if (enabled("superscript")) extensions.push(superscriptExtension);
  if (enabled("link")) extensions.push(linkExt);
  if (enabled("horizontalRule")) extensions.push(horizontalRuleExtension);
  if (enabled("table")) extensions.push(tableExt);
  if (enabled("list")) extensions.push(listExtension);
  if (enabled("history")) extensions.push(historyExtension);
  if (enabled("image")) extensions.push(extensiveImageExtension);
  if (enabled("blockFormat")) extensions.push(blockFormatExtension);
  if (enabled("code")) extensions.push(codeExtension);
  if (enabled("codeIntelligence")) extensions.push(codeIntelligenceExtension);
  if (enabled("codeFormat")) extensions.push(codeFormatExtension);
  if (enabled("tabIndent")) extensions.push(tabIndentExtension);
  if (enabled("enterKeyBehavior")) extensions.push(enterKeyBehaviorExtension);
  if (enabled("iframeEmbed")) extensions.push(iframeEmbedExt);
  if (enabled("youTubeEmbed")) extensions.push(youTubeEmbedExt);
  if (enabled("floatingToolbar")) extensions.push(floatingToolbarExt);
  if (enabled("contextMenu")) extensions.push(contextMenuExt);
  if (enabled("commandPalette")) extensions.push(commandPaletteExt);
  if (enabled("slashCommand")) extensions.push(slashCommandExt);
  if (enabled("emoji")) extensions.push(emojiExt);
  if (isDraggableFeatureEnabled) extensions.push(draggableBlockExt);
  if (enabled("customNode")) extensions.push(featureCardExtension);

  return extensions;
}

export type ExtensiveExtensions = ReturnType<typeof buildExtensiveExtensions>;

export function createExtensiveExtensions(
  config?: ExtensiveExtensionsConfig,
): ExtensiveExtensions {
  return buildExtensiveExtensions(config);
}

export const extensiveExtensions = buildExtensiveExtensions();
