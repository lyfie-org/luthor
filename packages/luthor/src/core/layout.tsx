/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { CoreEditorMode } from "./types";

const SOURCE_VIEW_MIN_HEIGHT = 400;
const SOURCE_VIEW_DEFAULT_FONT_SIZE = 14;
const SOURCE_VIEW_MONOSPACE_WIDTH_FACTOR = 0.6;
const SOURCE_VIEW_DEFAULT_TAB_SIZE = 2;

function getLogicalSourceLines(value: string): string[] {
  if (!value) {
    return [""];
  }
  return value.split("\n");
}

function buildSequentialLineNumberText(lineCount: number): string {
  return Array.from({ length: Math.max(1, lineCount) }, (_, index) => `${index + 1}`).join("\n");
}

function parseCssPixelValue(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getMonospaceCharacterWidth(style: CSSStyleDeclaration): number {
  const fontSize = parseCssPixelValue(style.fontSize) || SOURCE_VIEW_DEFAULT_FONT_SIZE;
  const fallback = fontSize * SOURCE_VIEW_MONOSPACE_WIDTH_FACTOR;

  if (typeof document === "undefined") {
    return fallback;
  }

  try {
    if (!document.body) {
      return fallback;
    }

    const sample = "0000000000";
    const probe = document.createElement("span");
    probe.textContent = sample;
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    probe.style.whiteSpace = "pre";
    probe.style.font = style.font;
    probe.style.fontFamily = style.fontFamily;
    probe.style.fontSize = style.fontSize;
    probe.style.fontWeight = style.fontWeight;
    probe.style.letterSpacing = style.letterSpacing;
    probe.style.lineHeight = style.lineHeight;
    probe.style.padding = "0";
    probe.style.border = "0";
    probe.style.margin = "0";
    document.body.appendChild(probe);
    const measuredWidth = probe.getBoundingClientRect().width;
    probe.remove();

    if (Number.isFinite(measuredWidth) && measuredWidth > 0) {
      return measuredWidth / sample.length;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function getWrapColumnsPerRow(textarea: HTMLTextAreaElement): number {
  const style = window.getComputedStyle(textarea);
  const horizontalPadding =
    parseCssPixelValue(style.paddingLeft) + parseCssPixelValue(style.paddingRight);
  const usableWidth = Math.max(0, textarea.clientWidth - horizontalPadding);
  if (usableWidth <= 0) {
    return 0;
  }

  const characterWidth = getMonospaceCharacterWidth(style);
  if (characterWidth <= 0) {
    return 0;
  }

  return Math.max(1, Math.floor(usableWidth / characterWidth));
}

function getWrapTabSize(textarea: HTMLTextAreaElement): number {
  const style = window.getComputedStyle(textarea);
  const parsedTabSize = Number.parseInt(style.tabSize, 10);
  if (Number.isFinite(parsedTabSize) && parsedTabSize > 0) {
    return parsedTabSize;
  }
  return SOURCE_VIEW_DEFAULT_TAB_SIZE;
}

function estimateWrappedVisualRows(line: string, columnsPerRow: number, tabSize: number): number {
  if (columnsPerRow <= 0) {
    return 1;
  }

  let columnsUsed = 0;
  for (const character of line) {
    if (character === "\t") {
      const remainder = columnsUsed % tabSize;
      const tabAdvance = remainder === 0 ? tabSize : tabSize - remainder;
      columnsUsed += tabAdvance;
      continue;
    }
    columnsUsed += 1;
  }

  return Math.max(1, Math.ceil(columnsUsed / columnsPerRow));
}

function buildWrappedLineNumberText(
  lines: string[],
  columnsPerRow: number,
  tabSize: number,
): string {
  if (columnsPerRow <= 0) {
    return buildSequentialLineNumberText(lines.length);
  }

  const visualRows: string[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    visualRows.push(`${index + 1}`);
    const wrappedRows = estimateWrappedVisualRows(lines[index] ?? "", columnsPerRow, tabSize);
    for (let wrappedIndex = 1; wrappedIndex < wrappedRows; wrappedIndex += 1) {
      visualRows.push("");
    }
  }

  return visualRows.join("\n");
}

export function ModeTabs({
  mode,
  onModeChange,
  labels,
  availableModes,
  isConverting,
}: {
  mode: CoreEditorMode;
  onModeChange: (mode: CoreEditorMode) => void;
  labels?: Partial<Record<CoreEditorMode, string>>;
  availableModes?: readonly CoreEditorMode[];
  isConverting?: CoreEditorMode | null;
}) {
  type CanonicalMode = Exclude<CoreEditorMode, "visual">;
  const toCanonicalMode = (value: CoreEditorMode): CanonicalMode =>
    value === "visual" ? "visual-editor" : value;
  const preferredVisualMode: CoreEditorMode = (availableModes ?? []).includes("visual-editor")
    ? "visual-editor"
    : "visual";
  const fromCanonicalMode = (value: CanonicalMode): CoreEditorMode => {
    if (value === "visual-editor") {
      return preferredVisualMode;
    }
    return value;
  };

  const orderedModes: CanonicalMode[] = ["visual-only", "visual-editor", "json", "markdown", "html"];
  const sourceModes = availableModes ?? ["visual-only", "visual-editor", "json", "markdown", "html"];
  const modeSet = new Set<CanonicalMode>(sourceModes.map(toCanonicalMode));
  const modes = orderedModes.filter((candidate) => modeSet.has(candidate));
  const activeMode = toCanonicalMode(mode);
  const convertingMode = isConverting ? toCanonicalMode(isConverting) : null;
  const tabLabels: Record<CanonicalMode, string> = {
    "visual-only": labels?.["visual-only"] ?? "Visual Only",
    "visual-editor": labels?.["visual-editor"] ?? labels?.visual ?? "Visual Editor",
    json: labels?.json ?? "JSON",
    markdown: labels?.markdown ?? "Markdown",
    html: labels?.html ?? "HTML",
  };

  return (
    <div className="luthor-mode-tabs">
      {modes.map((tabMode) => (
        <button
          key={tabMode}
          className={`luthor-mode-tab ${activeMode === tabMode ? "active" : ""}`}
          onClick={() => onModeChange(fromCanonicalMode(tabMode))}
        >
          {tabLabels[tabMode]}
          {convertingMode === tabMode && <span className="luthor-tab-converting-spinner" />}
        </button>
      ))}
    </div>
  );
}

export function SourceView({
  value,
  onChange,
  placeholder,
  className,
  wrap,
  showLineNumbers = true,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  wrap?: "soft" | "hard" | "off";
  showLineNumbers?: boolean;
}) {
  const sourceRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const isWrapped = (wrap ?? "off") !== "off";
  const logicalLines = useMemo(() => getLogicalSourceLines(value), [value]);
  const lineCount = logicalLines.length;
  const [wrapColumnsPerRow, setWrapColumnsPerRow] = useState(0);
  const [wrapTabSize, setWrapTabSize] = useState(SOURCE_VIEW_DEFAULT_TAB_SIZE);

  const recalculateWrapLayout = useCallback(() => {
    if (!showLineNumbers || !isWrapped) {
      setWrapColumnsPerRow(0);
      setWrapTabSize(SOURCE_VIEW_DEFAULT_TAB_SIZE);
      return;
    }

    const textarea = sourceRef.current;
    if (!textarea) {
      return;
    }

    const nextColumnsPerRow = getWrapColumnsPerRow(textarea);
    const nextTabSize = getWrapTabSize(textarea);

    setWrapColumnsPerRow((previousColumnsPerRow) => {
      return previousColumnsPerRow === nextColumnsPerRow
        ? previousColumnsPerRow
        : nextColumnsPerRow;
    });
    setWrapTabSize((previousTabSize) => {
      return previousTabSize === nextTabSize ? previousTabSize : nextTabSize;
    });
  }, [isWrapped, showLineNumbers]);

  const lineNumberText = useMemo(() => {
    if (!isWrapped) {
      return buildSequentialLineNumberText(lineCount);
    }

    if (wrapColumnsPerRow <= 0) {
      return buildSequentialLineNumberText(lineCount);
    }

    return buildWrappedLineNumberText(logicalLines, wrapColumnsPerRow, wrapTabSize);
  }, [isWrapped, lineCount, logicalLines, wrapColumnsPerRow, wrapTabSize]);

  const sourceClassName = `luthor-source-view${className ? ` ${className}` : ""}`;

  useLayoutEffect(() => {
    const textarea = sourceRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    const textareaChromeHeight = Math.max(0, textarea.offsetHeight - textarea.clientHeight);
    const nextHeight = Math.max(textarea.scrollHeight + textareaChromeHeight + 1, SOURCE_VIEW_MIN_HEIGHT);
    textarea.style.height = `${nextHeight}px`;
  }, [value]);

  useLayoutEffect(() => {
    recalculateWrapLayout();
  }, [recalculateWrapLayout, value]);

  useEffect(() => {
    if (!showLineNumbers || !isWrapped) {
      return;
    }

    const textarea = sourceRef.current;
    if (!textarea || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      recalculateWrapLayout();
    });
    observer.observe(textarea);
    return () => {
      observer.disconnect();
    };
  }, [isWrapped, recalculateWrapLayout, showLineNumbers]);

  useEffect(() => {
    if (!showLineNumbers) {
      return;
    }

    const textarea = sourceRef.current;
    const gutter = gutterRef.current;
    if (!textarea || !gutter) {
      return;
    }

    const syncScroll = () => {
      gutter.scrollTop = textarea.scrollTop;
    };

    syncScroll();
    textarea.addEventListener("scroll", syncScroll, { passive: true });
    return () => {
      textarea.removeEventListener("scroll", syncScroll);
    };
  }, [lineNumberText, showLineNumbers]);

  if (!showLineNumbers) {
    return (
      <textarea
        ref={sourceRef}
        className={sourceClassName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        wrap={wrap ?? "off"}
      />
    );
  }

  return (
    <div
      className="luthor-source-view-shell"
      style={
        {
          "--luthor-source-line-number-gutter-width": `${Math.max(2, String(lineCount).length)}ch`,
        } as CSSProperties
      }
    >
      <div
        ref={gutterRef}
        className="luthor-source-view-line-numbers"
        aria-hidden="true"
      >
        {lineNumberText}
      </div>
      <textarea
        ref={sourceRef}
        className={`${sourceClassName} luthor-source-view--with-line-numbers`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        wrap={wrap ?? "off"}
      />
    </div>
  );
}
