import { jsonToMarkdown } from "@lyfie/luthor-headless";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { formatMarkdownSource } from "../../core/source-format";
import type { LuthorTheme } from "@lyfie/luthor-headless";
import {
  ExtensiveEditor,
  type ExtensiveEditorProps,
  type ExtensiveEditorRef,
} from "../extensive";
import type { ShortcutBindingOverride, ShortcutConfig } from "../../core";

const EMPTY_DOCUMENT_JSON = JSON.stringify({
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "",
            type: "text",
            version: 1,
          },
        ],
        direction: null,
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: null,
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
});

type SizeValue = number | string;

export type ChatWindowOutputFormat = "md" | "json";

export type ChatWindowEditorSendPayload = {
  format: ChatWindowOutputFormat;
  text: string;
  markdown: string;
  json: string;
};

export type ChatWindowFormattingOptions = {
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
};

export type ChatWindowToolbarButton = {
  id: string;
  content: ReactNode;
  ariaLabel: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
};

export type ChatWindowEditorProps = {
  className?: string;
  variantClassName?: string;
  initialTheme?: "light" | "dark";
  onThemeChange?: (theme: "light" | "dark") => void;
  theme?: Partial<LuthorTheme>;
  defaultContent?: string;
  showDefaultContent?: boolean;
  placeholder?: ExtensiveEditorProps["placeholder"];
  formattingOptions?: ChatWindowFormattingOptions;
  onSend?: (payload: ChatWindowEditorSendPayload) => void;
  outputFormat?: ChatWindowOutputFormat;
  clearOnSend?: boolean;
  allowEmptySend?: boolean;
  submitOnEnter?: boolean;
  allowShiftEnter?: boolean;
  minHeight?: SizeValue;
  maxHeight?: SizeValue;
  minWidth?: SizeValue;
  maxWidth?: SizeValue;
  showBottomToolbar?: boolean;
  toolbarButtons?: readonly ChatWindowToolbarButton[];
  toolbarClassName?: string;
  toolbarStyle?: CSSProperties;
  showSendButton?: boolean;
  sendButtonPlacement?: "inside" | "right";
  sendButtonContent?: ReactNode;
  sendButtonAriaLabel?: string;
  sendButtonClassName?: string;
  scrollAreaClassName?: string;
};

function toCssSize(value: SizeValue): string {
  return typeof value === "number" ? `${value}px` : value;
}

function getNumericPixels(value: SizeValue, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return fallback;
    }

    const parsed = Number.parseFloat(trimmed.replace("px", ""));
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function toMarkdown(json: string): string {
  try {
    const parsed = json ? JSON.parse(json) : undefined;
    return formatMarkdownSource(jsonToMarkdown(parsed));
  } catch {
    return "";
  }
}

function positionCaretInFirstLine(editable: HTMLElement, clientX: number) {
  editable.focus();
  const firstBlock = editable.firstElementChild ?? editable;
  const firstRect = firstBlock.getBoundingClientRect();
  const y = firstRect.top + Math.max(1, Math.min(firstRect.height - 1, firstRect.height / 2));

  const documentAny = document as Document & {
    caretPositionFromPoint?: (
      x: number,
      y: number,
    ) => {
      offsetNode: Node;
      offset: number;
    } | null;
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };

  const position = documentAny.caretPositionFromPoint?.(clientX, y);
  if (position) {
    const selection = window.getSelection();
    if (!selection) {
      return;
    }
    const range = document.createRange();
    range.setStart(position.offsetNode, position.offset);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    return;
  }

  const range = documentAny.caretRangeFromPoint?.(clientX, y);
  if (!range) {
    return;
  }

  const selection = window.getSelection();
  if (!selection) {
    return;
  }
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

export function ChatWindowEditor({
  className,
  variantClassName,
  initialTheme,
  onThemeChange,
  theme,
  defaultContent,
  showDefaultContent = false,
  placeholder,
  formattingOptions,
  onSend,
  outputFormat = "md",
  clearOnSend = true,
  allowEmptySend = false,
  submitOnEnter = false,
  allowShiftEnter = true,
  minHeight = 56,
  maxHeight = 220,
  minWidth = 240,
  maxWidth = "100%",
  showBottomToolbar = true,
  toolbarButtons = [],
  toolbarClassName,
  toolbarStyle,
  showSendButton = true,
  sendButtonPlacement = "inside",
  sendButtonContent = "Send",
  sendButtonAriaLabel = "Send message",
  sendButtonClassName,
  scrollAreaClassName,
}: ChatWindowEditorProps) {
  const editorRef = useRef<ExtensiveEditorRef | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [editorHeight, setEditorHeight] = useState(() => getNumericPixels(minHeight, 56));
  const minHeightPx = useMemo(() => getNumericPixels(minHeight, 56), [minHeight]);
  const maxHeightPx = useMemo(() => getNumericPixels(maxHeight, 220), [maxHeight]);
  const resolvedFormattingOptions = useMemo(
    () => ({
      bold: formattingOptions?.bold !== false,
      italic: formattingOptions?.italic !== false,
      strikethrough: formattingOptions?.strikethrough !== false,
    }),
    [formattingOptions],
  );
  const shortcutConfig = useMemo<ShortcutConfig>(() => {
    const disabledCommandIds = ["history.undo", "history.redo"];

    const bindings: Record<string, ShortcutBindingOverride> = {
      "format.bold": [{ key: "b", ctrlKey: true }, { key: "b", metaKey: true }],
      "format.italic": [{ key: "i", ctrlKey: true }, { key: "i", metaKey: true }],
      "format.strikethrough": [
        { key: "x", ctrlKey: true, shiftKey: true },
        { key: "x", metaKey: true, shiftKey: true },
      ],
      "format.code": false,
      "block.codeblock": false,
    };

    return {
      disabledCommandIds,
      bindings,
    };
  }, []);

  const resolveOutput = useCallback(() => {
    const json = editorRef.current?.getJSON() ?? EMPTY_DOCUMENT_JSON;
    const markdown = toMarkdown(json);
    return {
      json,
      markdown,
      text: outputFormat === "json" ? json : markdown,
    };
  }, [outputFormat]);

  const dispatchSend = useCallback(() => {
    if (!onSend) {
      return;
    }

    const output = resolveOutput();
    if (!allowEmptySend && !output.markdown.trim()) {
      return;
    }

    onSend({
      format: outputFormat,
      text: output.text,
      markdown: output.markdown,
      json: output.json,
    });

    if (clearOnSend) {
      editorRef.current?.injectJSON(EMPTY_DOCUMENT_JSON);
    }
  }, [allowEmptySend, clearOnSend, onSend, outputFormat, resolveOutput]);

  const recalculateHeight = useCallback(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const editable = root.querySelector(".luthor-content-editable") as HTMLElement | null;
    if (!editable) {
      return;
    }

    const next = Math.max(minHeightPx, Math.min(maxHeightPx, editable.scrollHeight));
    setEditorHeight(next);
  }, [maxHeightPx, minHeightPx]);

  const handleKeyDownCapture = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!submitOnEnter || event.key !== "Enter" || event.nativeEvent.isComposing) {
        return;
      }

      if (event.shiftKey && allowShiftEnter) {
        return;
      }

      event.preventDefault();
      dispatchSend();
    },
    [allowShiftEnter, dispatchSend, submitOnEnter],
  );

  const handleEditorMouseDownCapture = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      if (
        target.closest("button, a, input, textarea, [contenteditable='true']") ||
        target.closest(".luthor-chat-window-bottom-toolbar")
      ) {
        return;
      }

      const root = rootRef.current;
      const editable = root?.querySelector(".luthor-content-editable") as HTMLElement | null;
      if (!editable) {
        return;
      }

      event.preventDefault();
      positionCaretInFirstLine(editable, event.clientX);
    },
    [],
  );

  useEffect(() => {
    recalculateHeight();
  }, [recalculateHeight]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const editable = root.querySelector(".luthor-content-editable") as HTMLElement | null;
    if (!editable) {
      return;
    }

    const handleInput = () => recalculateHeight();
    editable.addEventListener("input", handleInput);
    editable.addEventListener("keyup", handleInput);
    editable.addEventListener("paste", handleInput);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => recalculateHeight())
        : null;
    resizeObserver?.observe(editable);

    const mutationObserver = new MutationObserver(() => recalculateHeight());
    mutationObserver.observe(editable, { childList: true, subtree: true, characterData: true });

    return () => {
      editable.removeEventListener("input", handleInput);
      editable.removeEventListener("keyup", handleInput);
      editable.removeEventListener("paste", handleInput);
      resizeObserver?.disconnect();
      mutationObserver.disconnect();
    };
  }, [recalculateHeight]);

  useEffect(() => {
    const root = rootRef.current;
    const scrollArea = root?.querySelector(".luthor-richtext-container") as HTMLElement | null;
    if (!scrollArea) {
      return;
    }

    if (!scrollAreaClassName) {
      return;
    }

    const classes = scrollAreaClassName.split(/\s+/).filter(Boolean);
    if (classes.length === 0) {
      return;
    }

    scrollArea.classList.add(...classes);
    return () => {
      scrollArea.classList.remove(...classes);
    };
  }, [scrollAreaClassName]);

  const rootStyle = useMemo(
    () =>
      ({
        "--luthor-chat-min-height": toCssSize(minHeight),
        "--luthor-chat-max-height": toCssSize(maxHeight),
        "--luthor-chat-current-height": `${editorHeight}px`,
        "--luthor-chat-min-width": toCssSize(minWidth),
        "--luthor-chat-max-width": toCssSize(maxWidth),
      }) as CSSProperties,
    [editorHeight, maxHeight, maxWidth, minHeight, minWidth],
  );

  return (
    <div
      ref={rootRef}
      className={[
        "luthor-preset-chat-window",
        showSendButton && sendButtonPlacement === "inside" ? "luthor-preset-chat-window--send-inside" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={rootStyle}
      onKeyDownCapture={handleKeyDownCapture}
      onMouseDownCapture={handleEditorMouseDownCapture}
    >
      <div className="luthor-chat-window-composer-row">
        <div className="luthor-chat-window-composer-shell">
          <ExtensiveEditor
            ref={editorRef}
            initialTheme={initialTheme}
            onThemeChange={onThemeChange}
            theme={theme}
            defaultContent={defaultContent}
            showDefaultContent={showDefaultContent}
            placeholder={placeholder}
            variantClassName={["luthor-preset-chat-window__variant", variantClassName]
              .filter(Boolean)
              .join(" ")}
            isToolbarEnabled={false}
            availableModes={["visual"]}
            initialMode="visual"
            shortcutConfig={shortcutConfig}
            featureFlags={{
              bold: resolvedFormattingOptions.bold,
              italic: resolvedFormattingOptions.italic,
              underline: false,
              strikethrough: resolvedFormattingOptions.strikethrough,
              fontFamily: false,
              fontSize: false,
              lineHeight: false,
              textColor: false,
              textHighlight: false,
              subscript: false,
              superscript: false,
              link: false,
              horizontalRule: false,
              table: false,
              list: false,
              image: false,
              blockFormat: false,
              code: false,
              codeIntelligence: false,
              codeFormat: false,
              iframeEmbed: false,
              youTubeEmbed: false,
              floatingToolbar: false,
              contextMenu: false,
              commandPalette: false,
              slashCommand: false,
              emoji: false,
              draggableBlock: false,
              customNode: false,
              themeToggle: false,
              history: false,
            }}
          />
          {showSendButton && sendButtonPlacement === "inside" && (
            <button
              type="button"
              className={[
                "luthor-chat-window-action",
                "luthor-chat-window-action-send",
                "luthor-chat-window-action-send--inside",
                sendButtonClassName,
              ]
                .filter(Boolean)
                .join(" ")}
              data-testid="chat-send-button"
              onClick={dispatchSend}
              aria-label={sendButtonAriaLabel}
            >
              {sendButtonContent}
            </button>
          )}
          {showBottomToolbar && (
            <div
              className={["luthor-chat-window-bottom-toolbar", toolbarClassName]
                .filter(Boolean)
                .join(" ")}
              style={toolbarStyle}
              data-testid="chat-actions"
            >
              {toolbarButtons.map((button) => (
                <button
                  key={button.id}
                  type="button"
                  className={["luthor-chat-window-action", button.className].filter(Boolean).join(" ")}
                  aria-label={button.ariaLabel}
                  disabled={button.disabled}
                  title={button.title}
                  onClick={button.onClick}
                >
                  {button.content}
                </button>
              ))}
            </div>
          )}
        </div>
        {showSendButton && sendButtonPlacement === "right" && (
          <button
            type="button"
            className={[
              "luthor-chat-window-action",
              "luthor-chat-window-action-send",
              "luthor-chat-window-action-send--right",
              sendButtonClassName,
            ]
              .filter(Boolean)
              .join(" ")}
            data-testid="chat-send-button"
            onClick={dispatchSend}
            aria-label={sendButtonAriaLabel}
          >
            {sendButtonContent}
          </button>
        )}
      </div>
    </div>
  );
}
