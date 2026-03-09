import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type Dispatch,
  type ReactElement,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  CodeBlockIcon,
  CodeIcon,
  CommandIcon,
  EmojiIcon,
  FileCodeIcon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListCheckIcon,
  ListOrderedIcon,
  MinusIcon,
  MoonIcon,
  RedoIcon,
  UndoIcon,
  SunIcon,
  SubscriptIcon,
  SuperscriptIcon,
  TableIcon,
  TypeIcon,
  UnderlineIcon,
  UnlinkIcon,
  UploadIcon,
  HighlighterIcon,
  IndentIcon,
  OutdentIcon,
  PaletteIcon,
  QuoteIcon,
  StrikethroughIcon,
  ChevronDownIcon,
} from "./icons";
import { Button, Dialog, Dropdown, IconButton, Select } from "./ui";
import { getOverlayThemeStyleFromElement } from "./overlay-theme";
import { computeAnchoredOverlayStyle, resolveEditorPortalContainer } from "./overlay-position";
import { BLOCK_HEADING_LEVELS, type BlockHeadingLevel, type CoreEditorActiveStates, type CoreEditorCommands, type CoreToolbarClassNames, type InsertTableConfig, type ImageAlignment, type ToolbarLayout, type ToolbarItemType, type ToolbarStyleVars, type ToolbarVisibility } from "./types";
import { TRADITIONAL_TOOLBAR_LAYOUT } from "./types";

type SelectOption = {
  value: string;
  label: string;
};

type ColorOption = {
  value: string;
  label: string;
  color: string;
};

type EmojiOption = {
  emoji: string;
  label: string;
  shortcodes: string[];
  keywords?: string[];
};

const RECENT_COLORS_LIMIT = 6;
const EXTENSIVE_SWATCH_COLORS: readonly string[] = [
  "#ffffff", "#f2f2f2", "#d9d9d9", "#bfbfbf", "#808080", "#404040",
  "#000000", "#fbe5d6", "#f8cbad", "#f4b183", "#ed7d31", "#c55a11",
  "#fff2cc", "#ffe699", "#ffd966", "#ffc000", "#bf9000", "#7f6000",
  "#e2f0d9", "#c6e0b4", "#a9d18e", "#70ad47", "#548235", "#375623",
  "#ddebf7", "#bdd7ee", "#9dc3e6", "#5b9bd5", "#2f75b5", "#1f4e78",
  "#e4dfec", "#d9c2e9", "#b4a7d6", "#8e7cc3", "#674ea7", "#351c75",
];

const ORDERED_LIST_OPTIONS: ReadonlyArray<{
  title: string;
  pattern:
    | "decimal-alpha-roman"
    | "decimal-hierarchical"
    | "upper-roman-upper-alpha"
    | "upper-alpha-lower-alpha";
}> = [
  { title: "1. a. i. style", pattern: "decimal-alpha-roman" },
  { title: "A. a. i. style", pattern: "upper-alpha-lower-alpha" },
  { title: "1. 1.1 1.2 style", pattern: "decimal-hierarchical" },
  { title: "I. A. 1. style", pattern: "upper-roman-upper-alpha" },
];

type OrderedListPattern =
  | "decimal-alpha-roman"
  | "decimal-hierarchical"
  | "upper-roman-upper-alpha"
  | "upper-alpha-lower-alpha";

const UNORDERED_LIST_OPTIONS: ReadonlyArray<{
  title: string;
  pattern:
    | "disc-circle-square"
    | "arrow-diamond-disc"
    | "square-square-square"
    | "arrow-circle-square";
}> = [
  { title: "Dot / Circle / Square", pattern: "disc-circle-square" },
  { title: "Arrow / Diamond / Dot", pattern: "arrow-diamond-disc" },
  { title: "Square / Square / Square", pattern: "square-square-square" },
  { title: "Arrow / Circle / Square", pattern: "arrow-circle-square" },
];

type UnorderedMarkerType = "disc" | "circle" | "square" | "arrow" | "diamond";

function getUnorderedMarkerPattern(
  pattern: "disc-circle-square" | "arrow-diamond-disc" | "square-square-square" | "arrow-circle-square",
): readonly [UnorderedMarkerType, UnorderedMarkerType, UnorderedMarkerType] {
  switch (pattern) {
    case "disc-circle-square":
      return ["disc", "circle", "square"];
    case "arrow-diamond-disc":
      return ["arrow", "diamond", "disc"];
    case "square-square-square":
      return ["square", "square", "square"];
    case "arrow-circle-square":
      return ["arrow", "circle", "square"];
  }
}

function UnorderedMarkerShape({ type, cy }: { type: UnorderedMarkerType; cy: number }) {
  switch (type) {
    case "disc":
      return <circle cx="16" cy={cy} r="3.2" className="luthor-unordered-variant-marker" />;
    case "circle":
      return <circle cx="16" cy={cy} r="3.2" className="luthor-unordered-variant-marker-open" />;
    case "square":
      return <rect x="12.8" y={cy - 3.2} width="6.4" height="6.4" className="luthor-unordered-variant-marker" />;
    case "diamond":
      return <path d={`M16 ${cy - 3.8} L19.8 ${cy} L16 ${cy + 3.8} L12.2 ${cy} Z`} className="luthor-unordered-variant-marker" />;
    case "arrow":
      return <path d={`M11.6 ${cy - 2.8} L16.8 ${cy} L11.6 ${cy + 2.8} M11.6 ${cy} H19.6`} className="luthor-unordered-variant-arrow" />;
  }
}

function UnorderedListVariantPreview({
  pattern,
}: {
  pattern: "disc-circle-square" | "arrow-diamond-disc" | "square-square-square" | "arrow-circle-square";
}) {
  const markers = getUnorderedMarkerPattern(pattern);
  const rowY = [12.5, 24.5, 36.5, 48.5, 60.5] as const;
  const rowIndent =
    pattern === "disc-circle-square"
      ? [0, 1, 1, 2, 0]
      : pattern === "arrow-diamond-disc"
        ? [0, 1, 1, 2, 0]
        : pattern === "square-square-square"
          ? [0, 1, 2, 1, 0]
          : [0, 1, 1, 2, 0];
  const rowMarkers: readonly UnorderedMarkerType[] = [
    markers[0],
    markers[1],
    markers[1],
    markers[2],
    markers[0],
  ];

  return (
    <svg
      width="94"
      height="74"
      viewBox="0 0 94 74"
      role="img"
      aria-hidden="true"
      className="luthor-unordered-variant-svg"
    >
      <rect x="0.5" y="0.5" width="93" height="73" rx="3" className="luthor-unordered-variant-frame" />

      {rowY.map((y, index) => {
        const indentLevel = rowIndent[index] ?? 0;
        const markerX = 12 + indentLevel * 12;
        const textX = 24 + indentLevel * 12;
        const textWidth = 57 - indentLevel * 10;
        return (
          <g key={`${pattern}-row-${index}`}>
            <g transform={`translate(${markerX - 16}, 0)`}>
              <UnorderedMarkerShape type={rowMarkers[index] ?? markers[0]} cy={y} />
            </g>
            <rect x={textX} y={y - 2.5} width={textWidth} height="5" rx="2.5" className="luthor-unordered-variant-line" />
          </g>
        );
      })}
    </svg>
  );
}

function ChecklistVariantPreview({ variant }: { variant: "strikethrough" | "plain" }) {
  const strike = variant === "strikethrough";

  return (
    <svg
      width="78"
      height="42"
      viewBox="0 0 78 42"
      role="img"
      aria-hidden="true"
      className="luthor-checklist-variant-svg"
    >
      <rect x="0.5" y="0.5" width="77" height="41" rx="3" className="luthor-checklist-variant-frame" />

      <rect x="10.5" y="10.5" width="10" height="10" rx="1.5" className="luthor-checklist-variant-box" />
      <rect x="10.5" y="24.5" width="10" height="10" rx="1.5" className="luthor-checklist-variant-box" />
      <path d="M12.6 29.2l2 2.2 3.8-4.3" className="luthor-checklist-variant-check" />

      <rect x="26.5" y="11.8" width="40" height="6" rx="2" className="luthor-checklist-variant-line" />
      <rect x="26.5" y="25.8" width="40" height="6" rx="2" className="luthor-checklist-variant-line" />
      {strike ? (
        <>
          <line x1="26.5" y1="28.8" x2="66.5" y2="28.8" className="luthor-checklist-variant-strike" />
        </>
      ) : null}
    </svg>
  );
}

function OrderedListVariantPreview({ pattern }: { pattern: OrderedListPattern }) {
  const rowY = [12.5, 24.5, 36.5, 48.5, 60.5] as const;
  const rowIndent = [0, 1, 1, 2, 0] as const;

  const rowLabels: readonly string[] =
    pattern === "decimal-alpha-roman"
      ? ["1.", "a.", "b.", "i.", "2."]
      : pattern === "upper-alpha-lower-alpha"
        ? ["A.", "a.", "b.", "i.", "B."]
        : pattern === "decimal-hierarchical"
          ? ["1.", "1.1.", "1.2.", "1.2.1.", "2."]
          : ["I.", "A.", "B.", "1.", "II."];

  return (
    <svg
      width="94"
      height="74"
      viewBox="0 0 94 74"
      role="img"
      aria-hidden="true"
      className="luthor-ordered-variant-svg"
    >
      <rect x="0.5" y="0.5" width="93" height="73" rx="3" className="luthor-ordered-variant-frame" />
      {rowY.map((y, index) => {
        const indentLevel = rowIndent[index] ?? 0;
        const labelX = 9 + indentLevel * 12;
        const textX = 26 + indentLevel * 12;
        const textWidth = 56 - indentLevel * 10;

        return (
          <g key={`${pattern}-ordered-row-${index}`}>
            <text x={labelX} y={y + 2.8} className="luthor-ordered-variant-label">
              {rowLabels[index]}
            </text>
            <rect x={textX} y={y - 2.5} width={textWidth} height="5" rx="2.5" className="luthor-ordered-variant-line" />
          </g>
        );
      })}
    </svg>
  );
}

function normalizeColorValue(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function findColorByValue(options: readonly ColorOption[], value: string): string | null {
  const normalizedValue = normalizeColorValue(value);

  for (const option of options) {
    if (normalizeColorValue(option.value) === normalizedValue) {
      return option.color;
    }
  }

  return null;
}

function resolveCurrentColor(value: string, options: readonly ColorOption[], fallback: string): string {
  if (!value || value === "default") {
    return fallback;
  }

  const optionColor = findColorByValue(options, value);
  if (optionColor) {
    return optionColor;
  }

  return value;
}

function toHexColorForInput(color: string, fallback: string): string {
  const normalized = color.trim();
  if (/^#([\da-f]{6})$/i.test(normalized)) {
    return normalized;
  }

  if (/^#([\da-f]{3})$/i.test(normalized)) {
    const chars = normalized.slice(1).split("");
    return `#${chars.map((char) => `${char}${char}`).join("")}`;
  }

  return fallback;
}

type SelectionTypographyValues = {
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
};

const DEFAULT_FONT_FAMILY_FALLBACK_LABEL = "Inherited";
const DEFAULT_FONT_SIZE_FALLBACK_LABEL = "16px";
const DEFAULT_LINE_HEIGHT_FALLBACK_LABEL = "1.5";

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function normalizeFontToken(value: string): string {
  const firstFamily = value.split(",")[0] ?? "";
  return normalizeToken(firstFamily.replace(/["']/g, ""));
}

function parsePixelValue(value: string): number | null {
  const match = value.trim().toLowerCase().match(/^(-?\d*\.?\d+)px$/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function getSelectionTypographyValues(): SelectionTypographyValues | null {
  if (typeof window === "undefined") return null;

  const selection = window.getSelection();
  const anchorNode = selection?.anchorNode;
  if (!anchorNode) return null;

  const element =
    anchorNode.nodeType === Node.ELEMENT_NODE
      ? (anchorNode as Element)
      : anchorNode.parentElement;
  if (!element) return null;

  const host = element.closest(".luthor-content-editable");
  if (!host) return null;

  const computed = window.getComputedStyle(element as HTMLElement);
  return {
    fontFamily: computed.fontFamily,
    fontSize: computed.fontSize,
    lineHeight: computed.lineHeight,
  };
}

function getEditorTypographyValues(): SelectionTypographyValues | null {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  const host = document.querySelector(".luthor-content-editable");
  if (!(host instanceof HTMLElement)) {
    return null;
  }

  const computed = window.getComputedStyle(host);
  return {
    fontFamily: computed.fontFamily,
    fontSize: computed.fontSize,
    lineHeight: computed.lineHeight,
  };
}

function toPrimaryFontLabel(fontFamily: string): string {
  const firstFamily = fontFamily.split(",")[0]?.trim() ?? "";
  return firstFamily.replace(/^['"]|['"]$/g, "").trim();
}

function resolveDefaultFontFamilyLabel(
  optionFontFamily: string,
  typography: SelectionTypographyValues | null,
): string {
  const normalized = normalizeToken(optionFontFamily);
  if (normalized && normalized !== "inherit") {
    const direct = toPrimaryFontLabel(optionFontFamily);
    if (direct) return direct;
  }

  const fromTypography = toPrimaryFontLabel(typography?.fontFamily ?? "");
  return fromTypography || DEFAULT_FONT_FAMILY_FALLBACK_LABEL;
}

function resolveDefaultFontSizeLabel(
  optionFontSize: string,
  typography: SelectionTypographyValues | null,
): string {
  const normalized = normalizeToken(optionFontSize);
  if (normalized && normalized !== "inherit") {
    return optionFontSize.trim();
  }

  const fromTypography = (typography?.fontSize ?? "").trim();
  return fromTypography || DEFAULT_FONT_SIZE_FALLBACK_LABEL;
}

function resolveDefaultLineHeightLabel(
  optionLineHeight: string,
  typography: SelectionTypographyValues | null,
): string {
  const normalized = normalizeToken(optionLineHeight);
  if (normalized && normalized !== "normal") {
    return optionLineHeight.trim();
  }

  const fromTypography = (typography?.lineHeight ?? "").trim();
  return fromTypography || DEFAULT_LINE_HEIGHT_FALLBACK_LABEL;
}

function resolveFontFamilyOptionValue(
  computedFontFamily: string | undefined,
  options: readonly { value: string; fontFamily: string }[],
): string | null {
  if (!computedFontFamily) return null;
  const normalized = normalizeFontToken(computedFontFamily);
  if (!normalized) return null;

  const match = options.find((option) => {
    if (normalizeToken(option.value) === normalized) return true;
    return normalizeFontToken(option.fontFamily) === normalized;
  });

  return match?.value ?? null;
}

function resolveFontSizeOptionValue(
  computedFontSize: string | undefined,
  options: readonly { value: string | number; fontSize: string | number }[],
): string | null {
  if (!computedFontSize) return null;

  const normalized = normalizeToken(computedFontSize);
  const directMatch = options.find((option) => {
    if (normalizeToken(String(option.value)) === normalized) return true;
    return normalizeToken(String(option.fontSize)) === normalized;
  });
  if (directMatch) return String(directMatch.value);

  const targetPx = parsePixelValue(computedFontSize);
  if (targetPx == null) return null;

  let closest: { value: string; distance: number } | null = null;
  for (const option of options) {
    const optionPx = parsePixelValue(String(option.fontSize));
    if (optionPx == null) continue;
    const distance = Math.abs(optionPx - targetPx);
    if (!closest || distance < closest.distance) {
      closest = { value: String(option.value), distance };
    }
  }

  return closest?.value ?? null;
}

function resolveLineHeightOptionValue(
  computedLineHeight: string | undefined,
  computedFontSize: string | undefined,
  options: readonly { value: string; lineHeight: string }[],
): string | null {
  if (!computedLineHeight) return null;

  const normalized = normalizeToken(computedLineHeight);
  const directMatch = options.find((option) => {
    if (normalizeToken(option.value) === normalized) return true;
    return normalizeToken(option.lineHeight) === normalized;
  });
  if (directMatch) return directMatch.value;

  const fontSizePx = computedFontSize ? parsePixelValue(computedFontSize) : null;
  const lineHeightPx = parsePixelValue(computedLineHeight);

  let targetRatio: number | null = null;
  if (lineHeightPx != null && fontSizePx != null && fontSizePx > 0) {
    targetRatio = lineHeightPx / fontSizePx;
  } else {
    const parsed = Number(computedLineHeight);
    if (Number.isFinite(parsed)) {
      targetRatio = parsed;
    }
  }

  if (targetRatio == null) return null;

  let closest: { value: string; distance: number } | null = null;
  for (const option of options) {
    const optionRatio = Number(option.lineHeight);
    if (!Number.isFinite(optionRatio)) continue;
    const distance = Math.abs(optionRatio - targetRatio);
    if (!closest || distance < closest.distance) {
      closest = { value: option.value, distance };
    }
  }

  return closest?.value ?? null;
}

interface ColorPickerButtonProps {
  title: string;
  value: string;
  options: readonly ColorOption[];
  recentColors: readonly string[];
  active?: boolean;
  fallbackColor: string;
  highlight?: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
  onAddRecent: (color: string) => void;
}

function ColorPickerButton({
  title,
  value,
  options,
  recentColors,
  active,
  fallbackColor,
  highlight,
  onChange,
  onClear,
  onAddRecent,
}: ColorPickerButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const customColorInputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<number | null>(null);
  const pendingPreviewColorRef = useRef<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties | undefined>(undefined);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const currentColor = resolveCurrentColor(value, options, fallbackColor);

  const presetColors = useMemo(() => {
    return EXTENSIVE_SWATCH_COLORS;
  }, []);

  const recentSwatches = useMemo(() => {
    const recent = [...recentColors].slice(0, RECENT_COLORS_LIMIT);
    while (recent.length < RECENT_COLORS_LIMIT) {
      recent.push("");
    }
    return recent;
  }, [recentColors]);

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const schedulePreview = useCallback((color: string) => {
    pendingPreviewColorRef.current = color;

    if (frameRef.current) return;

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      if (!pendingPreviewColorRef.current) return;
      onChange(pendingPreviewColorRef.current);
      pendingPreviewColorRef.current = null;
    });
  }, [onChange]);

  const updatePanelPosition = useCallback((isVisible: boolean) => {
    const trigger = buttonRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const measuredPanel = panelRef.current?.getBoundingClientRect();
    const container = resolveEditorPortalContainer(trigger);
    setPortalContainer(container);
    const placement = computeAnchoredOverlayStyle({
      anchorRect: rect,
      overlay: {
        width: measuredPanel?.width ?? 248,
        height: measuredPanel?.height ?? 340,
      },
      portalContainer: container,
      gap: 6,
      margin: 8,
      preferredX: "start",
      preferredY: "bottom",
      flipX: true,
      flipY: true,
    });
    setPanelStyle({
      ...placement,
      visibility: isVisible ? "visible" : "hidden",
      ...getOverlayThemeStyleFromElement(trigger),
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;

    updatePanelPosition(false);

    const frame = window.requestAnimationFrame(() => {
      updatePanelPosition(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [isOpen, updatePanelPosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleReposition = () => updatePanelPosition(true);

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
      setPortalContainer(null);
    };
  }, [isOpen, updatePanelPosition]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`luthor-toolbar-button luthor-color-button${active ? " active" : ""}${highlight ? " is-highlight" : ""}`}
        title={title}
        aria-label={title}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {highlight ? (
          <HighlighterIcon size={15} className="luthor-color-button-highlighter" />
        ) : (
          <span className="luthor-color-button-letter">A</span>
        )}
        <span
          className="luthor-color-button-indicator"
          style={{ backgroundColor: currentColor }}
        />
      </button>

      {isOpen && typeof document !== "undefined" && createPortal(
        <div ref={panelRef} className="luthor-color-picker" style={panelStyle}>
          <div className="luthor-color-picker-header">
            <span className="luthor-color-picker-title">{title}</span>
          </div>

          <div className="luthor-color-picker-section">
            <p className="luthor-color-picker-label">Colors</p>
            <div className="luthor-color-swatch-grid">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="luthor-color-swatch"
                  style={{ backgroundColor: color }}
                  aria-label={`Use color ${color}`}
                  onClick={() => {
                    onChange(color);
                    onAddRecent(color);
                    setIsOpen(false);
                  }}
                />
              ))}
            </div>
          </div>

          <div className="luthor-color-picker-section">
            <p className="luthor-color-picker-label">Recent colors</p>
            <div className="luthor-color-swatch-row">
              {recentSwatches.map((color, index) => (
                <button
                  key={`${color || "empty"}-${index}`}
                  type="button"
                  className="luthor-color-swatch"
                  style={{ backgroundColor: color || "transparent" }}
                  aria-label={color ? `Use recent color ${color}` : "Empty recent color slot"}
                  disabled={!color}
                  onClick={() => {
                    if (!color) return;
                    onChange(color);
                    onAddRecent(color);
                    setIsOpen(false);
                  }}
                />
              ))}
            </div>
          </div>

          <div className="luthor-color-picker-footer">
            <button
              type="button"
              className="luthor-color-picker-clear"
              onClick={() => {
                onClear();
                setIsOpen(false);
              }}
            >
              Reset to Default
            </button>

            <button
              type="button"
              className="luthor-color-picker-custom"
              onClick={() => customColorInputRef.current?.click()}
            >
              <PaletteIcon size={14} />
              <span>Custom Color</span>
            </button>

            <input
              ref={customColorInputRef}
              type="color"
              className="luthor-color-picker-native luthor-color-picker-native-hidden"
              value={toHexColorForInput(currentColor, fallbackColor)}
              onInput={(event) => {
                schedulePreview((event.target as HTMLInputElement).value);
              }}
              onChange={(event) => {
                const next = (event.target as HTMLInputElement).value;
                onChange(next);
                onAddRecent(next);
              }}
            />
          </div>
        </div>,
        portalContainer ?? document.body,
      )}
    </>
  );
}

function useImageHandlers(commands: CoreEditorCommands, imageUploadHandler?: (file: File) => Promise<string>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gifInputRef = useRef<HTMLInputElement>(null);

  const handlers = useMemo(
    () => ({
      insertFromUrl: () => {
        const src = prompt("Enter image URL:");
        if (!src) return;
        const alt = prompt("Enter alt text:") || "";
        const caption = prompt("Enter caption (optional):") || undefined;
        commands.insertImage({ src, alt, caption });
      },
      insertFromFile: () => fileInputRef.current?.click(),
      insertGifFromUrl: () => {
        const src = prompt("Enter GIF URL:");
        if (!src) return;
        const alt = prompt("Enter alt text (optional):") || "GIF";
        commands.insertImage({ src, alt });
      },
      insertGifFromFile: () => gifInputRef.current?.click(),
      handleUpload: async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        let src: string;
        if (imageUploadHandler) {
          try {
            src = await imageUploadHandler(file);
          } catch {
            alert("Failed to upload image");
            return;
          }
        } else {
          src = URL.createObjectURL(file);
        }
        commands.insertImage({ src, alt: file.name, file });
        event.target.value = "";
      },
      handleGifUpload: async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const isGif = file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif");
        if (!isGif) {
          alert("Please select a GIF file.");
          event.target.value = "";
          return;
        }

        let src: string;
        if (imageUploadHandler) {
          try {
            src = await imageUploadHandler(file);
          } catch {
            alert("Failed to upload GIF");
            return;
          }
        } else {
          src = URL.createObjectURL(file);
        }

        commands.insertImage({ src, alt: file.name || "GIF", file });
        event.target.value = "";
      },
      setAlignment: (alignment: ImageAlignment) => {
        commands.setImageAlignment(alignment);
      },
      setCaption: () => {
        const newCaption = prompt("Enter caption:") || "";
        commands.setImageCaption(newCaption);
      },
    }),
    [commands, imageUploadHandler],
  );

  return { handlers, fileInputRef, gifInputRef };
}

function useEmbedHandlers(commands: CoreEditorCommands) {
  return useMemo(
    () => ({
      insertIframe: () => {
        const inputUrl = prompt("Enter iframe URL:");
        if (!inputUrl) return;

        if (typeof commands.insertIframeEmbed !== "function") {
          return;
        }

        commands.insertIframeEmbed(inputUrl);
      },
      insertYouTube: () => {
        const inputUrl = prompt("Enter YouTube URL:");
        if (!inputUrl) return;

        if (typeof commands.insertYouTubeEmbed !== "function") {
          return;
        }

        commands.insertYouTubeEmbed(inputUrl);
      },
    }),
    [commands],
  );
}

export function isToolbarItemSupported(itemType: ToolbarItemType, hasExtension: (name: string) => boolean): boolean {
  switch (itemType) {
    case "fontFamily":
      return hasExtension("fontFamily");
    case "fontSize":
      return hasExtension("fontSize");
    case "lineHeight":
      return hasExtension("lineHeight");
    case "textColor":
      return hasExtension("textColor");
    case "textHighlight":
      return hasExtension("textHighlight");
    case "subscript":
      return hasExtension("subscript");
    case "superscript":
      return hasExtension("superscript");
    case "blockFormat":
    case "quote":
    case "alignLeft":
    case "alignCenter":
    case "alignRight":
    case "alignJustify":
      return hasExtension("blockFormat");
    case "codeBlock":
      return hasExtension("code");
    case "unorderedList":
    case "orderedList":
    case "checkList":
    case "indentList":
    case "outdentList":
      return hasExtension("list");
    case "horizontalRule":
      return hasExtension("horizontalRule");
    case "table":
      return hasExtension("table");
    case "image":
      return hasExtension("image");
    case "emoji":
      return hasExtension("emoji");
    case "embed":
      return hasExtension("iframeEmbed") || hasExtension("youtubeEmbed");
    case "undo":
    case "redo":
      return hasExtension("history");
    default:
      return true;
  }
}

export function isToolbarItemVisible(
  itemType: ToolbarItemType,
  hasExtension: (name: string) => boolean,
  toolbarVisibility?: ToolbarVisibility,
): boolean {
  if (!isToolbarItemSupported(itemType, hasExtension)) {
    return false;
  }

  return toolbarVisibility?.[itemType] !== false;
}

export function filterToolbarLayout(
  layout: ToolbarLayout,
  hasExtension: (name: string) => boolean,
  toolbarVisibility?: ToolbarVisibility,
): ToolbarLayout {
  return {
    sections: layout.sections
      .map((section) => ({
        ...section,
        items: section.items.filter((itemType) => isToolbarItemVisible(itemType, hasExtension, toolbarVisibility)),
      }))
      .filter((section) => section.items.length > 0),
  };
}

export interface ToolbarProps {
  commands: CoreEditorCommands;
  hasExtension: (name: string) => boolean;
  activeStates: CoreEditorActiveStates;
  isDark: boolean;
  toggleTheme: () => void;
  onCommandPaletteOpen?: () => void;
  imageUploadHandler?: (file: File) => Promise<string>;
  classNames?: CoreToolbarClassNames;
  toolbarStyleVars?: ToolbarStyleVars;
  layout?: ToolbarLayout;
  toolbarVisibility?: ToolbarVisibility;
  headingOptions?: readonly BlockHeadingLevel[];
  paragraphLabel?: string;
}

export function Toolbar({
  commands,
  hasExtension,
  activeStates,
  isDark,
  toggleTheme,
  onCommandPaletteOpen,
  imageUploadHandler,
  classNames,
  toolbarStyleVars,
  layout,
  toolbarVisibility,
  headingOptions,
  paragraphLabel,
}: ToolbarProps) {
  const { handlers, fileInputRef, gifInputRef } = useImageHandlers(commands, imageUploadHandler);
  const embedHandlers = useEmbedHandlers(commands);
  const hasAnyEmbedExtension = hasExtension("iframeEmbed") || hasExtension("youtubeEmbed");
  const isAnyEmbedSelected =
    activeStates.isIframeEmbedSelected ||
    activeStates.isYouTubeEmbedSelected;
  const [showImageDropdown, setShowImageDropdown] = useState(false);
  const [showEmojiDropdown, setShowEmojiDropdown] = useState(false);
  const [showAlignDropdown, setShowAlignDropdown] = useState(false);
  const [showEmbedDropdown, setShowEmbedDropdown] = useState(false);
  const [showUnorderedListDropdown, setShowUnorderedListDropdown] = useState(false);
  const [showOrderedListDropdown, setShowOrderedListDropdown] = useState(false);
  const [showCheckListDropdown, setShowCheckListDropdown] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [fontFamilyValue, setFontFamilyValue] = useState("default");
  const [fontFamilyOptions, setFontFamilyOptions] = useState<SelectOption[]>([
    { value: "default", label: DEFAULT_FONT_FAMILY_FALLBACK_LABEL },
  ]);
  const [fontSizeValue, setFontSizeValue] = useState("default");
  const [fontSizeOptions, setFontSizeOptions] = useState<SelectOption[]>([
    { value: "default", label: DEFAULT_FONT_SIZE_FALLBACK_LABEL },
  ]);
  const [lineHeightValue, setLineHeightValue] = useState("default");
  const [lineHeightOptions, setLineHeightOptions] = useState<SelectOption[]>([
    { value: "default", label: DEFAULT_LINE_HEIGHT_FALLBACK_LABEL },
  ]);
  const [textColorValue, setTextColorValue] = useState("default");
  const [textColorOptions, setTextColorOptions] = useState<ColorOption[]>([
    { value: "default", label: "Default", color: "inherit" },
  ]);
  const [recentTextColors, setRecentTextColors] = useState<string[]>([]);
  const [textHighlightValue, setTextHighlightValue] = useState("default");
  const [textHighlightOptions, setTextHighlightOptions] = useState<ColorOption[]>([
    { value: "default", label: "Default", color: "transparent" },
  ]);
  const [recentHighlightColors, setRecentHighlightColors] = useState<string[]>([]);
  const [selectionVersion, setSelectionVersion] = useState(0);
  const [tableConfig, setTableConfig] = useState<InsertTableConfig>({
    rows: 3,
    columns: 3,
    includeHeaders: false,
  });
  const selectionSyncRafRef = useRef<number | null>(null);
  const lastSelectionTypographyRef = useRef<string>("");

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const handleSelectionChange = () => {
      if (selectionSyncRafRef.current !== null) {
        return;
      }

      selectionSyncRafRef.current = window.requestAnimationFrame(() => {
        selectionSyncRafRef.current = null;

        const domSelection = window.getSelection();
        if (!domSelection || domSelection.rangeCount === 0) {
          return;
        }
        // Drag-select emits many selectionchange events; avoid rerender churn mid-drag.
        if (!domSelection.getRangeAt(0).collapsed) {
          return;
        }

        const typography = getSelectionTypographyValues();
        if (!typography) {
          return;
        }

        const signature = `${typography.fontFamily}|${typography.fontSize}|${typography.lineHeight}`;
        if (signature === lastSelectionTypographyRef.current) {
          return;
        }

        lastSelectionTypographyRef.current = signature;
        setSelectionVersion((previous) => previous + 1);
      });
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      if (selectionSyncRafRef.current !== null) {
        cancelAnimationFrame(selectionSyncRafRef.current);
        selectionSyncRafRef.current = null;
      }
    };
  }, []);

  const emojiOptions = useMemo<EmojiOption[]>(() => {
    if (!hasExtension("emoji")) {
      return [];
    }

    if (typeof commands.getEmojiSuggestions === "function") {
      return commands.getEmojiSuggestions("");
    }

    if (typeof commands.getEmojiCatalog === "function") {
      return commands.getEmojiCatalog();
    }

    return [];
  }, [commands, hasExtension]);

  useEffect(() => {
    if (!hasExtension("fontFamily") || typeof commands.getFontFamilyOptions !== "function") {
      return;
    }

    const typography = getSelectionTypographyValues() ?? getEditorTypographyValues();
    const options = commands.getFontFamilyOptions().map((option) => ({
      value: option.value,
      label: normalizeToken(option.value) === "default"
        ? resolveDefaultFontFamilyLabel(option.fontFamily, typography)
        : option.label,
    }));

    const normalizedOptions = options.length > 0
      ? options
      : [{ value: "default", label: DEFAULT_FONT_FAMILY_FALLBACK_LABEL }];
    setFontFamilyOptions(normalizedOptions);
    setFontFamilyValue((previousValue) => {
      if (normalizedOptions.some((option) => option.value === previousValue)) {
        return previousValue;
      }
      return "default";
    });
  }, [commands, hasExtension]);

  useEffect(() => {
    if (!hasExtension("fontFamily") || typeof commands.getCurrentFontFamily !== "function") {
      return;
    }

    const getFontFamilyOptions = commands.getFontFamilyOptions;
    if (typeof getFontFamilyOptions !== "function") {
      return;
    }

    let isCancelled = false;

    void commands.getCurrentFontFamily().then((value) => {
      if (isCancelled) return;

      if (value && value !== "default") {
        setFontFamilyValue(value);
        return;
      }

      const selectionTypography = getSelectionTypographyValues();
      const resolvedValue = resolveFontFamilyOptionValue(
        selectionTypography?.fontFamily,
        getFontFamilyOptions(),
      );

      setFontFamilyValue(resolvedValue ?? "default");
    });

    return () => {
      isCancelled = true;
    };
  }, [activeStates, commands, hasExtension, selectionVersion]);

  useEffect(() => {
    if (!hasExtension("fontSize") || typeof commands.getFontSizeOptions !== "function") {
      return;
    }

    const typography = getSelectionTypographyValues() ?? getEditorTypographyValues();
    const options = commands.getFontSizeOptions().map((option) => ({
      value: String(option.value).trim(),
      label: normalizeToken(String(option.value)) === "default"
        ? resolveDefaultFontSizeLabel(String(option.fontSize), typography)
        : String(option.label).trim(),
    })).filter((option) => option.value.length > 0 && option.label.length > 0);

    const hasDefaultOption = options.some((option) => normalizeToken(option.value) === "default");
    const normalizedOptions = options.length === 0
      ? [{ value: "default", label: DEFAULT_FONT_SIZE_FALLBACK_LABEL }]
      : hasDefaultOption
        ? options
        : [{ value: "default", label: DEFAULT_FONT_SIZE_FALLBACK_LABEL }, ...options];
    setFontSizeOptions(normalizedOptions);
    setFontSizeValue((previousValue) => {
      if (normalizedOptions.some((option) => option.value === previousValue)) {
        return previousValue;
      }
      return "default";
    });
  }, [commands, hasExtension]);

  useEffect(() => {
    if (!hasExtension("fontSize") || typeof commands.getCurrentFontSize !== "function") {
      return;
    }

    const getFontSizeOptions = commands.getFontSizeOptions;
    if (typeof getFontSizeOptions !== "function") {
      return;
    }

    let isCancelled = false;

    void commands.getCurrentFontSize().then((value) => {
      if (isCancelled) return;

      if (value && value !== "default") {
        setFontSizeValue(value);
        return;
      }

      const selectionTypography = getSelectionTypographyValues();
      const resolvedValue = resolveFontSizeOptionValue(
        selectionTypography?.fontSize,
        getFontSizeOptions(),
      );

      setFontSizeValue(resolvedValue ?? "default");
    });

    return () => {
      isCancelled = true;
    };
  }, [activeStates, commands, hasExtension, selectionVersion]);

  useEffect(() => {
    if (!hasExtension("lineHeight") || typeof commands.getLineHeightOptions !== "function") {
      return;
    }

    const typography = getSelectionTypographyValues() ?? getEditorTypographyValues();
    const options = commands.getLineHeightOptions().map((option) => ({
      value: option.value,
      label: normalizeToken(option.value) === "default"
        ? resolveDefaultLineHeightLabel(option.lineHeight, typography)
        : option.label,
    }));

    const normalizedOptions = options.length > 0
      ? options
      : [{ value: "default", label: DEFAULT_LINE_HEIGHT_FALLBACK_LABEL }];
    setLineHeightOptions(normalizedOptions);
  }, [commands, hasExtension]);

  useEffect(() => {
    if (!hasExtension("lineHeight") || typeof commands.getCurrentLineHeight !== "function") {
      return;
    }

    const getLineHeightOptions = commands.getLineHeightOptions;
    if (typeof getLineHeightOptions !== "function") {
      return;
    }

    let isCancelled = false;

    void commands.getCurrentLineHeight().then((value) => {
      if (isCancelled) return;

      if (value) {
        setLineHeightValue(value);
        return;
      }

      const selectionTypography = getSelectionTypographyValues();
      const resolvedValue = resolveLineHeightOptionValue(
        selectionTypography?.lineHeight,
        selectionTypography?.fontSize,
        getLineHeightOptions(),
      );

      setLineHeightValue(resolvedValue ?? "default");
    });

    return () => {
      isCancelled = true;
    };
  }, [activeStates, commands, hasExtension, selectionVersion]);

  useEffect(() => {
    if (!hasExtension("textColor") || typeof commands.getTextColorOptions !== "function") {
      return;
    }

    const options = commands.getTextColorOptions().map((option) => ({
      value: option.value,
      label: option.label,
      color: option.color,
    }));

    if (options.length > 0) {
      setTextColorOptions(options);
    }
  }, [commands, hasExtension]);

  useEffect(() => {
    if (!hasExtension("textColor") || typeof commands.getCurrentTextColor !== "function") {
      return;
    }

    let isCancelled = false;

    void commands.getCurrentTextColor().then((value) => {
      if (isCancelled) return;
      setTextColorValue(value ?? "default");
    });

    return () => {
      isCancelled = true;
    };
  }, [activeStates, commands, hasExtension, selectionVersion]);

  useEffect(() => {
    if (!hasExtension("textHighlight") || typeof commands.getTextHighlightOptions !== "function") {
      return;
    }

    const options = commands.getTextHighlightOptions().map((option) => ({
      value: option.value,
      label: option.label,
      color: option.backgroundColor,
    }));

    if (options.length > 0) {
      setTextHighlightOptions(options);
    }
  }, [commands, hasExtension]);

  useEffect(() => {
    if (!hasExtension("textHighlight") || typeof commands.getCurrentTextHighlight !== "function") {
      return;
    }

    let isCancelled = false;

    void commands.getCurrentTextHighlight().then((value) => {
      if (isCancelled) return;
      setTextHighlightValue(value ?? "default");
    });

    return () => {
      isCancelled = true;
    };
  }, [activeStates, commands, hasExtension, selectionVersion]);

  const availableHeadingOptions = useMemo(() => {
    if (!headingOptions || headingOptions.length === 0) {
      return [...BLOCK_HEADING_LEVELS];
    }

    const seen = new Set<BlockHeadingLevel>();
    const normalized: BlockHeadingLevel[] = [];
    for (const heading of headingOptions) {
      if (!BLOCK_HEADING_LEVELS.includes(heading) || seen.has(heading)) {
        continue;
      }
      seen.add(heading);
      normalized.push(heading);
    }
    return normalized.length > 0 ? normalized : [...BLOCK_HEADING_LEVELS];
  }, [headingOptions]);

  const resolvedParagraphLabel = (paragraphLabel?.trim() || "Paragraph");
  const blockFormatOptions = useMemo(() => {
    const headingSelectOptions = availableHeadingOptions.map((heading) => ({
      value: heading,
      label: `Heading ${heading.slice(1)}`,
    }));

    return [
      { value: "p", label: resolvedParagraphLabel },
      ...headingSelectOptions,
    ];
  }, [availableHeadingOptions, resolvedParagraphLabel]);

  const computedCurrentBlockFormat =
    activeStates.isH1 ? "h1" :
    activeStates.isH2 ? "h2" :
    activeStates.isH3 ? "h3" :
    activeStates.isH4 ? "h4" :
    activeStates.isH5 ? "h5" :
    activeStates.isH6 ? "h6" :
    "p";
  const currentBlockFormat = blockFormatOptions.some((option) => option.value === computedCurrentBlockFormat)
    ? computedCurrentBlockFormat
    : "p";

  const handleBlockFormatChange = (value: string) => {
    if (value === "p") commands.toggleParagraph();
    else if (value.startsWith("h") && availableHeadingOptions.includes(value as BlockHeadingLevel)) {
      commands.toggleHeading(value as BlockHeadingLevel);
    }
  };

  const handleFontFamilyChange = (value: string) => {
    if (value === "default") {
      commands.clearFontFamily?.();
    } else {
      commands.setFontFamily?.(value);
    }
    setFontFamilyValue(value);
  };

  const handleFontSizeChange = (value: string) => {
    if (value === "default") {
      commands.clearFontSize?.();
    } else {
      commands.setFontSize?.(value);
    }
    setFontSizeValue(value);
  };

  const handleLineHeightChange = (value: string) => {
    if (value === "default") {
      commands.setLineHeight?.(value);
    } else {
      commands.setLineHeight?.(value);
    }
    setLineHeightValue(value);
  };

  const pushRecentColor = (setter: Dispatch<SetStateAction<string[]>>, color: string) => {
    setter((prev) => {
      const normalized = normalizeColorValue(color);
      const deduped = prev.filter((entry) => normalizeColorValue(entry) !== normalized);
      return [color, ...deduped].slice(0, RECENT_COLORS_LIMIT);
    });
  };

  const handleTextColorChange = (value: string) => {
    if (value === "default") {
      commands.clearTextColor?.();
      setTextColorValue("default");
      return;
    }

    commands.setTextColor?.(value);
    setTextColorValue(value);
  };

  const handleTextHighlightChange = (value: string) => {
    if (value === "default") {
      commands.clearTextHighlight?.();
      setTextHighlightValue("default");
      return;
    }

    commands.setTextHighlight?.(value);
    setTextHighlightValue(value);
  };

  const applyOrderedListPattern = (pattern: OrderedListPattern) => {
    if (typeof commands.setOrderedListPattern === "function") {
      commands.setOrderedListPattern(pattern);
      return;
    }

    commands.toggleOrderedList();
  };

  const applyUnorderedListPattern = (
    pattern:
      | "disc-circle-square"
      | "arrow-diamond-disc"
      | "square-square-square"
      | "arrow-circle-square",
  ) => {
    if (typeof commands.setUnorderedListPattern === "function") {
      commands.setUnorderedListPattern(pattern);
      return;
    }

    commands.toggleUnorderedList();
  };

  const applyCheckListVariant = (variant: "strikethrough" | "plain") => {
    if (typeof commands.setCheckListVariant === "function") {
      commands.setCheckListVariant(variant);
      return;
    }

    commands.toggleCheckList();
  };

  const renderToolbarItem = (itemType: ToolbarItemType): ReactElement | null => {
    switch (itemType) {
      case "fontFamily":
        if (!hasExtension("fontFamily")) return null;
        return (
          <Select
            key="fontFamily"
            value={fontFamilyValue}
            onValueChange={handleFontFamilyChange}
            options={fontFamilyOptions}
            placeholder="Font"
          />
        );

      case "fontSize":
        if (!hasExtension("fontSize")) return null;
        return (
          <Select
            key="fontSize"
            value={fontSizeValue}
            onValueChange={handleFontSizeChange}
            options={fontSizeOptions}
            placeholder="Size"
          />
        );

      case "lineHeight":
        if (!hasExtension("lineHeight")) return null;
        return (
          <Select
            key="lineHeight"
            value={lineHeightValue}
            onValueChange={handleLineHeightChange}
            options={lineHeightOptions}
            placeholder="Line"
          />
        );

      case "textColor":
        if (!hasExtension("textColor")) return null;
        return (
          <ColorPickerButton
            key="textColor"
            title="Text Color"
            value={textColorValue}
            options={textColorOptions}
            recentColors={recentTextColors}
            active={activeStates.hasCustomTextColor}
            fallbackColor="#0f172a"
            onChange={handleTextColorChange}
            onClear={() => handleTextColorChange("default")}
            onAddRecent={(color) => pushRecentColor(setRecentTextColors, color)}
          />
        );

      case "textHighlight":
        if (!hasExtension("textHighlight")) return null;
        return (
          <ColorPickerButton
            key="textHighlight"
            title="Text Highlight"
            value={textHighlightValue}
            options={textHighlightOptions}
            recentColors={recentHighlightColors}
            active={activeStates.hasTextHighlight}
            fallbackColor="#fef08a"
            highlight
            onChange={handleTextHighlightChange}
            onClear={() => handleTextHighlightChange("default")}
            onAddRecent={(color) => pushRecentColor(setRecentHighlightColors, color)}
          />
        );

      case "bold":
        return (
          <IconButton key="bold" onClick={() => commands.toggleBold()} active={activeStates.bold} title="Bold (Ctrl+B)">
            <BoldIcon size={16} />
          </IconButton>
        );

      case "italic":
        return (
          <IconButton key="italic" onClick={() => commands.toggleItalic()} active={activeStates.italic} title="Italic (Ctrl+I)">
            <ItalicIcon size={16} />
          </IconButton>
        );

      case "underline":
        return (
          <IconButton key="underline" onClick={() => commands.toggleUnderline()} active={activeStates.underline} title="Underline (Ctrl+U)">
            <UnderlineIcon size={16} />
          </IconButton>
        );

      case "strikethrough":
        return (
          <IconButton key="strikethrough" onClick={() => commands.toggleStrikethrough()} active={activeStates.strikethrough} title="Strikethrough">
            <StrikethroughIcon size={16} />
          </IconButton>
        );

      case "subscript":
        if (!hasExtension("subscript")) return null;
        return (
          <IconButton key="subscript" onClick={() => commands.toggleSubscript?.()} active={activeStates.subscript} title="Subscript">
            <SubscriptIcon size={16} />
          </IconButton>
        );

      case "superscript":
        if (!hasExtension("superscript")) return null;
        return (
          <IconButton key="superscript" onClick={() => commands.toggleSuperscript?.()} active={activeStates.superscript} title="Superscript">
            <SuperscriptIcon size={16} />
          </IconButton>
        );

      case "code":
        return (
          <IconButton key="code" onClick={() => commands.formatText("code")} active={activeStates.code} title="Inline Code">
            <CodeIcon size={16} />
          </IconButton>
        );

      case "link":
        return (
          <IconButton
            key="link"
            onClick={() => (activeStates.isLink ? commands.removeLink() : commands.insertLink())}
            active={activeStates.isLink}
            title={activeStates.isLink ? "Remove Link" : "Insert Link"}
          >
            {activeStates.isLink ? <UnlinkIcon size={16} /> : <LinkIcon size={16} />}
          </IconButton>
        );

      case "blockFormat":
        if (!hasExtension("blockFormat")) return null;
        return (
          <Select
            key="blockFormat"
            value={currentBlockFormat}
            onValueChange={handleBlockFormatChange}
            options={blockFormatOptions}
            placeholder="Format"
          />
        );

      case "quote":
        if (!hasExtension("blockFormat")) return null;
        return (
          <IconButton key="quote" onClick={() => commands.toggleQuote()} active={activeStates.isQuote} title="Quote">
            <QuoteIcon size={16} />
          </IconButton>
        );

      case "alignLeft":
        if (!hasExtension("blockFormat")) return null;
        return (
          <IconButton key="alignLeft" onClick={() => commands.setTextAlignment("left")} active={activeStates.isTextAlignedLeft} title="Align Left">
            <AlignLeftIcon size={16} />
          </IconButton>
        );

      case "alignCenter":
        if (!hasExtension("blockFormat")) return null;
        return (
          <IconButton key="alignCenter" onClick={() => commands.setTextAlignment("center")} active={activeStates.isTextAlignedCenter} title="Align Center">
            <AlignCenterIcon size={16} />
          </IconButton>
        );

      case "alignRight":
        if (!hasExtension("blockFormat")) return null;
        return (
          <IconButton key="alignRight" onClick={() => commands.setTextAlignment("right")} active={activeStates.isTextAlignedRight} title="Align Right">
            <AlignRightIcon size={16} />
          </IconButton>
        );

      case "alignJustify":
        if (!hasExtension("blockFormat")) return null;
        return (
          <IconButton key="alignJustify" onClick={() => commands.setTextAlignment("justify")} active={activeStates.isTextAlignedJustify} title="Justify">
            <AlignJustifyIcon size={16} />
          </IconButton>
        );

      case "codeBlock":
        if (!hasExtension("code")) return null;
        return (
          <IconButton key="codeBlock" onClick={() => commands.toggleCodeBlock()} active={activeStates.isInCodeBlock} title="Code Block">
            <CodeBlockIcon size={16} />
          </IconButton>
        );

      case "unorderedList":
        if (!hasExtension("list")) return null;
        return (
          <div key="unorderedList" className="luthor-toolbar-split-button">
            <IconButton onClick={() => commands.toggleUnorderedList()} active={activeStates.unorderedList} title="Bullet List">
              <ListIcon size={16} />
            </IconButton>
            <Dropdown
              trigger={
                <button
                  type="button"
                  className={`luthor-toolbar-button luthor-toolbar-button-arrow${activeStates.unorderedList ? " active" : ""}`}
                  title="Bullet List Styles"
                  aria-label="Bullet List Styles"
                >
                  <ChevronDownIcon size={12} />
                </button>
              }
              isOpen={showUnorderedListDropdown}
              onOpenChange={setShowUnorderedListDropdown}
            >
              <div className="luthor-unordered-variant-grid">
                {UNORDERED_LIST_OPTIONS.map((option) => (
                  <button
                    key={option.pattern}
                    className="luthor-unordered-variant-option"
                    type="button"
                    title={option.title}
                    aria-label={option.title}
                    onClick={() => {
                      applyUnorderedListPattern(option.pattern);
                      setShowUnorderedListDropdown(false);
                    }}
                  >
                    <UnorderedListVariantPreview pattern={option.pattern} />
                  </button>
                ))}
              </div>
            </Dropdown>
          </div>
        );

      case "orderedList":
        if (!hasExtension("list")) return null;
        return (
          <div key="orderedList" className="luthor-toolbar-split-button">
            <IconButton onClick={() => commands.toggleOrderedList()} active={activeStates.orderedList} title="Numbered List">
              <ListOrderedIcon size={16} />
            </IconButton>
            <Dropdown
              trigger={
                <button
                  type="button"
                  className={`luthor-toolbar-button luthor-toolbar-button-arrow${activeStates.orderedList ? " active" : ""}`}
                  title="Numbered List Styles"
                  aria-label="Numbered List Styles"
                >
                  <ChevronDownIcon size={12} />
                </button>
              }
              isOpen={showOrderedListDropdown}
              onOpenChange={setShowOrderedListDropdown}
            >
              <div className="luthor-ordered-variant-grid">
                {ORDERED_LIST_OPTIONS.map((option) => (
                  <button
                    key={option.pattern}
                    className="luthor-ordered-variant-option"
                    type="button"
                    title={option.title}
                    aria-label={option.title}
                    onClick={() => {
                      applyOrderedListPattern(option.pattern);
                      setShowOrderedListDropdown(false);
                    }}
                  >
                    <OrderedListVariantPreview pattern={option.pattern} />
                  </button>
                ))}
              </div>
            </Dropdown>
          </div>
        );

      case "checkList":
        if (!hasExtension("list")) return null;
        return (
          <div key="checkList" className="luthor-toolbar-split-button">
            <IconButton onClick={() => commands.toggleCheckList()} active={activeStates.checkList} title="Checklist">
              <ListCheckIcon size={16} />
            </IconButton>
            <Dropdown
              trigger={
                <button
                  type="button"
                  className={`luthor-toolbar-button luthor-toolbar-button-arrow${activeStates.checkList ? " active" : ""}`}
                  title="Checklist Styles"
                  aria-label="Checklist Styles"
                >
                  <ChevronDownIcon size={12} />
                </button>
              }
              isOpen={showCheckListDropdown}
              onOpenChange={setShowCheckListDropdown}
            >
              <div className="luthor-checklist-variant-grid">
                <button
                  className="luthor-checklist-variant-option"
                  type="button"
                  title="Checked = Strike through"
                  aria-label="Checked = Strike through"
                  onClick={() => {
                    applyCheckListVariant("strikethrough");
                    setShowCheckListDropdown(false);
                  }}
                >
                  <ChecklistVariantPreview variant="strikethrough" />
                </button>
                <button
                  className="luthor-checklist-variant-option"
                  type="button"
                  title="Checked = Keep text"
                  aria-label="Checked = Keep text"
                  onClick={() => {
                    applyCheckListVariant("plain");
                    setShowCheckListDropdown(false);
                  }}
                >
                  <ChecklistVariantPreview variant="plain" />
                </button>
              </div>
            </Dropdown>
          </div>
        );

      case "indentList":
        if (!hasExtension("list")) return null;
        return (
          <IconButton
            key="indentList"
            onClick={() => commands.indentList()}
            title="Indent List"
          >
            <IndentIcon size={14} />
          </IconButton>
        );

      case "outdentList":
        if (!hasExtension("list")) return null;
        return (
          <IconButton
            key="outdentList"
            onClick={() => commands.outdentList()}
            title="Outdent List"
          >
            <OutdentIcon size={14} />
          </IconButton>
        );

      case "horizontalRule":
        if (!hasExtension("horizontalRule")) return null;
        return (
          <IconButton key="horizontalRule" onClick={() => commands.insertHorizontalRule()} title="Insert Horizontal Rule">
            <MinusIcon size={16} />
          </IconButton>
        );

      case "table":
        if (!hasExtension("table")) return null;
        return (
          <IconButton key="table" onClick={() => setShowTableDialog(true)} title="Insert Table">
            <TableIcon size={16} />
          </IconButton>
        );

      case "image":
        if (!hasExtension("image")) return null;
        return (
          <>
            <Dropdown
              key="image"
              trigger={
                <button className={`luthor-toolbar-button ${activeStates.imageSelected ? "active" : ""}`} title="Insert Image">
                  <ImageIcon size={16} />
                </button>
              }
              isOpen={showImageDropdown}
              onOpenChange={setShowImageDropdown}
            >
              <button className="luthor-dropdown-item" onClick={() => { handlers.insertFromUrl(); setShowImageDropdown(false); }}>
                <LinkIcon size={16} />
                <span>From URL</span>
              </button>
              <button className="luthor-dropdown-item" onClick={() => { handlers.insertFromFile(); setShowImageDropdown(false); }}>
                <UploadIcon size={16} />
                <span>Upload File</span>
              </button>
              <button className="luthor-dropdown-item" onClick={() => { handlers.insertGifFromUrl(); setShowImageDropdown(false); }}>
                <EmojiIcon size={16} />
                <span>Insert GIF URL</span>
              </button>
              <button className="luthor-dropdown-item" onClick={() => { handlers.insertGifFromFile(); setShowImageDropdown(false); }}>
                <UploadIcon size={16} />
                <span>Upload GIF</span>
              </button>
            </Dropdown>
            {activeStates.imageSelected && (
              <Dropdown
                key="imageAlign"
                trigger={
                  <button className="luthor-toolbar-button" title="Align Image">
                    <AlignCenterIcon size={16} />
                  </button>
                }
                isOpen={showAlignDropdown}
                onOpenChange={setShowAlignDropdown}
              >
                <button className="luthor-dropdown-item" onClick={() => { handlers.setAlignment("left"); setShowAlignDropdown(false); }}>
                  <AlignLeftIcon size={16} />
                  <span>Align Left</span>
                </button>
                <button className="luthor-dropdown-item" onClick={() => { handlers.setAlignment("center"); setShowAlignDropdown(false); }}>
                  <AlignCenterIcon size={16} />
                  <span>Align Center</span>
                </button>
                <button className="luthor-dropdown-item" onClick={() => { handlers.setAlignment("right"); setShowAlignDropdown(false); }}>
                  <AlignRightIcon size={16} />
                  <span>Align Right</span>
                </button>
                <button className="luthor-dropdown-item" onClick={() => { handlers.setCaption(); setShowAlignDropdown(false); }}>
                  <TypeIcon size={16} />
                  <span>Set Caption</span>
                </button>
              </Dropdown>
            )}
          </>
        );

      case "emoji":
        if (!hasExtension("emoji") || emojiOptions.length === 0) return null;
        return (
          <Dropdown
            key="emoji"
            trigger={
              <button className="luthor-toolbar-button" title="Insert Emoji">
                <EmojiIcon size={16} />
              </button>
            }
            isOpen={showEmojiDropdown}
            onOpenChange={setShowEmojiDropdown}
          >
            <div className="luthor-emoji-picker-grid" role="listbox" aria-label="Emoji picker">
              {emojiOptions.map((item) => (
                <button
                  key={`${item.emoji}-${item.label}`}
                  type="button"
                  className="luthor-emoji-picker-item"
                  title={item.shortcodes[0] ? `${item.label} (:${item.shortcodes[0]}:)` : item.label}
                  onClick={() => {
                    commands.insertEmoji?.(item.emoji);
                    setShowEmojiDropdown(false);
                  }}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          </Dropdown>
        );

      case "embed":
        if (!hasAnyEmbedExtension) return null;
        return (
          <Dropdown
            key="embed"
            trigger={
              <button className={`luthor-toolbar-button ${isAnyEmbedSelected ? "active" : ""}`} title="Insert Embed">
                <FileCodeIcon size={16} />
              </button>
            }
            isOpen={showEmbedDropdown}
            onOpenChange={setShowEmbedDropdown}
          >
            {hasExtension("iframeEmbed") ? (
              <button className="luthor-dropdown-item" onClick={() => { embedHandlers.insertIframe(); setShowEmbedDropdown(false); }}>
                <LinkIcon size={16} />
                <span>Embed iframe</span>
              </button>
            ) : null}
            {hasExtension("youtubeEmbed") ? (
              <button className="luthor-dropdown-item" onClick={() => { embedHandlers.insertYouTube(); setShowEmbedDropdown(false); }}>
                <ImageIcon size={16} />
                <span>Embed YouTube Video</span>
              </button>
            ) : null}
          </Dropdown>
        );

      case "undo":
        if (!hasExtension("history")) return null;
        return (
          <IconButton key="undo" onClick={() => commands.undo()} disabled={!activeStates.canUndo} title="Undo (Ctrl+Z)">
            <UndoIcon size={16} />
          </IconButton>
        );

      case "redo":
        if (!hasExtension("history")) return null;
        return (
          <IconButton key="redo" onClick={() => commands.redo()} disabled={!activeStates.canRedo} title="Redo (Ctrl+Y)">
            <RedoIcon size={16} />
          </IconButton>
        );

      case "commandPalette":
        return (
          <IconButton key="commandPalette" onClick={() => onCommandPaletteOpen?.()} title="Command Palette (Ctrl+Shift+P)">
            <CommandIcon size={16} />
          </IconButton>
        );

      case "themeToggle":
        return (
          <IconButton key="themeToggle" onClick={toggleTheme} title={isDark ? "Light Mode" : "Dark Mode"}>
            {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
          </IconButton>
        );

      default:
        return null;
    }
  };

  // Use the provided layout or default to TRADITIONAL_TOOLBAR_LAYOUT
  const activeLayout = layout ?? TRADITIONAL_TOOLBAR_LAYOUT;
  const visibleLayout = useMemo(
    () => filterToolbarLayout(activeLayout, hasExtension, toolbarVisibility),
    [activeLayout, hasExtension, toolbarVisibility],
  );

  return (
    <>
      <div className={classNames?.toolbar ?? "luthor-toolbar"} style={toolbarStyleVars as CSSProperties | undefined}>
        {visibleLayout.sections.map((section, sectionIndex) => {
          // Flatten and assign unique keys to all toolbar items, even if renderToolbarItem returns a fragment or array
          const renderedItems = section.items
            .map((itemType, itemIndex) => {
              const element = renderToolbarItem(itemType);
              if (!element) return null;
              // If element is an array, wrap each with a unique key
              if (Array.isArray(element)) {
                return element.map((el, idx) =>
                  el && typeof el === 'object' && 'key' in el && el.key != null
                    ? el
                    : <span key={`toolbar-item-${sectionIndex}-${itemIndex}-${idx}`}>{el}</span>
                );
              }
              // If element is a fragment, wrap with a unique key
              if (element.type === React.Fragment) {
                return <span key={`toolbar-item-${sectionIndex}-${itemIndex}`}>{element}</span>;
              }
              // If element already has a key, return as is
              if (element && typeof element === 'object' && 'key' in element && element.key != null) {
                return element;
              }
              // Otherwise, wrap with a unique key
              return <span key={`toolbar-item-${sectionIndex}-${itemIndex}`}>{element}</span>;
            })
            .flat()
            .filter((item): item is ReactElement => item !== null);

          // Only render section if it has at least one item
          if (renderedItems.length === 0) return null;

          return (
            <div key={sectionIndex} className={classNames?.section ?? "luthor-toolbar-section"}>
              {renderedItems}
            </div>
          );
        })}
      </div>

      {/* Hidden file inputs for image upload */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlers.handleUpload} className="luthor-file-input" />
      <input ref={gifInputRef} type="file" accept="image/gif" onChange={handlers.handleGifUpload} className="luthor-file-input" />

      <Dialog isOpen={showTableDialog} onClose={() => setShowTableDialog(false)} title="Insert Table">
        <div className="luthor-table-dialog">
          <div className="luthor-form-group">
            <label htmlFor="table-rows">Rows:</label>
            <input
              id="table-rows"
              type="number"
              min="1"
              max="20"
              value={tableConfig.rows}
              onChange={(event) => setTableConfig((prev) => ({ ...prev, rows: parseInt(event.target.value) || 1 }))}
              className="luthor-input"
            />
          </div>
          <div className="luthor-form-group">
            <label htmlFor="table-columns">Columns:</label>
            <input
              id="table-columns"
              type="number"
              min="1"
              max="20"
              value={tableConfig.columns}
              onChange={(event) => setTableConfig((prev) => ({ ...prev, columns: parseInt(event.target.value) || 1 }))}
              className="luthor-input"
            />
          </div>
          <div className="luthor-form-group">
            <label className="luthor-checkbox-label">
              <input
                type="checkbox"
                checked={tableConfig.includeHeaders || false}
                onChange={(event) => setTableConfig((prev) => ({ ...prev, includeHeaders: event.target.checked }))}
                className="luthor-checkbox"
              />
              Include headers
            </label>
          </div>
          <div className="luthor-dialog-actions">
            <Button variant="secondary" onClick={() => setShowTableDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                commands.insertTable(tableConfig);
                setShowTableDialog(false);
              }}
            >
              Insert Table
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

