import React from "react";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalEditor } from "lexical";
import { ReactNode } from "react";
import { BaseExtension } from "../base";
import { BaseExtensionConfig, ExtensionCategory } from "../types";
import { defaultLuthorTheme } from "../../core/theme";
import { EditorContext } from "../../core/createEditorSystem";

// Base RichText props interface - shared between config and component
export interface BaseRichTextProps {
  contentEditable?: React.ReactElement;
  placeholder?: React.ReactElement | string;
  className?: string;
  classNames?: {
    container?: string;
    contentEditable?: string;
    placeholder?: string;
  };
  styles?: {
    container?: React.CSSProperties;
    contentEditable?: React.CSSProperties;
    placeholder?: React.CSSProperties;
  };
  errorBoundary?: React.ComponentType<{
    children: React.JSX.Element;
    onError: (error: Error) => void;
  }>;
}

export interface RichTextConfig
  extends BaseExtensionConfig,
    BaseRichTextProps {}

// Shared component props - extends base props
type SharedRichTextProps = BaseRichTextProps;

function clampCoordinate(value: number, min: number, max: number): number {
  if (max <= min) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

function resolveCaretPointWithinBlock(editable: HTMLElement, block: HTMLElement, clientX: number, clientY: number) {
  const editableRect = editable.getBoundingClientRect();
  const blockRect = block.getBoundingClientRect();
  const x = clampCoordinate(clientX, editableRect.left + 1, editableRect.right - 1);
  const y = clampCoordinate(clientY, blockRect.top + 1, blockRect.bottom - 1);
  return { x, y };
}

function placeCaretFromPoint(x: number, y: number): void {
  const documentAny = document as Document & {
    caretPositionFromPoint?: (
      caretX: number,
      caretY: number,
    ) => {
      offsetNode: Node;
      offset: number;
    } | null;
    caretRangeFromPoint?: (caretX: number, caretY: number) => Range | null;
  };

  const selection = window.getSelection();
  if (!selection) {
    return;
  }

  const position = documentAny.caretPositionFromPoint?.(x, y);
  if (position) {
    const range = document.createRange();
    range.setStart(position.offsetNode, position.offset);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    return;
  }

  const range = documentAny.caretRangeFromPoint?.(x, y);
  if (!range) {
    return;
  }

  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function moveCaretToNearestLine(editable: HTMLElement, clientX: number, clientY: number): void {
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
  const { x, y } = resolveCaretPointWithinBlock(editable, targetBlock, clientX, clientY);

  editable.focus();
  placeCaretFromPoint(x, y);
}

const SharedRichText: React.FC<SharedRichTextProps> = (props) => {
  const {
    contentEditable,
    placeholder,
    className,
    classNames,
    styles,
    errorBoundary,
  } = props;
  const editorContext = React.useContext(EditorContext);
  const contextConfig = editorContext?.config as
    | {
        placeholder?: unknown;
        classNames?: BaseRichTextProps["classNames"];
        styles?: BaseRichTextProps["styles"];
      }
    | undefined;
  const configPlaceholder =
    typeof contextConfig?.placeholder === "string"
      ? contextConfig.placeholder
      : undefined;
  const configClassNames = contextConfig?.classNames;
  const configStyles = contextConfig?.styles;
  const resolvedPlaceholder = placeholder ?? configPlaceholder ?? "Start writing...";

  // Extract common placeholder props
  const placeholderClassNameFinal =
    classNames?.placeholder ||
    configClassNames?.placeholder ||
    defaultLuthorTheme.richText?.placeholder ||
    "luthor-placeholder";
  const placeholderStyle = {
    position: "absolute" as const,
    pointerEvents: "none" as const,
    zIndex: 1,
    ...configStyles?.placeholder,
    ...styles?.placeholder,
  };

  return (
    <div
      className={
        classNames?.container ||
        configClassNames?.container ||
        className ||
        defaultLuthorTheme.container ||
        "luthor-editor-container"
      }
      onMouseDown={(event) => {
        if (event.button !== 0) {
          return;
        }

        const target = event.target as HTMLElement | null;
        if (!target) {
          return;
        }

        if (target.closest("button, a, input, textarea, select, [role='button']")) {
          return;
        }

        const container = event.currentTarget;
        const editableElement = container.querySelector("[contenteditable='true']") as HTMLElement | null;
        if (!editableElement || editableElement.contains(target)) {
          return;
        }

        event.preventDefault();
        moveCaretToNearestLine(editableElement, event.clientX, event.clientY);
      }}
      style={{
        position: "relative",
        cursor: "text",
        ...configStyles?.container,
        ...styles?.container,
      }}
    >
      <RichTextPlugin
        contentEditable={
          contentEditable || (
            <div style={{ display: "block" }}>
              <ContentEditable
                className={
                  classNames?.contentEditable ||
                  configClassNames?.contentEditable ||
                  defaultLuthorTheme.richText?.contentEditable ||
                  "luthor-content-editable"
                }
                style={{
                  ...configStyles?.contentEditable,
                  ...styles?.contentEditable,
                }}
              />
            </div>
          )
        }
        placeholder={
          typeof resolvedPlaceholder === "string" ? (
            <div className={placeholderClassNameFinal} style={placeholderStyle}>
              {resolvedPlaceholder}
            </div>
          ) : (
            resolvedPlaceholder || (
              <div
                className={placeholderClassNameFinal}
                style={placeholderStyle}
              >
                Start writing...
              </div>
            )
          )
        }
        ErrorBoundary={errorBoundary || DefaultErrorBoundary}
      />
    </div>
  );
};

/**
 * RichTextExtension - Provides core rich text editing functionality
 * Extends BaseExtension to stay consistent with other extensions
 */
export class RichTextExtension extends BaseExtension<
  "richText",
  RichTextConfig,
  Record<string, never>,
  Record<string, never>,
  ReactNode[] // Plugins
> {
  constructor(config: RichTextConfig = {}) {
    super("richText", [ExtensionCategory.Floating]);
    this.config = {
      showInToolbar: false,
      position: "after", // RichText should render after children
      ...config,
    };
  }

  register(editor: LexicalEditor): () => void {
    void editor;
    // No registration needed for RichTextPlugin
    return () => {};
  }

  getPlugins(): ReactNode[] {
    return [<SharedRichText key="rich-text" {...this.config} />];
  }
}

// Preconfigured instance for convenience
export const richTextExtension = new RichTextExtension();

// Standalone RichText component for flexible usage
export type RichTextComponentProps = SharedRichTextProps;

export const RichText: React.FC<RichTextComponentProps> = (props) => {
  return <SharedRichText {...props} />;
};

// Default error boundary for RichTextPlugin
const DefaultErrorBoundary: React.FC<{
  children: React.JSX.Element;
  onError: (error: Error) => void;
}> = ({ children, onError }) => {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error("RichTextPlugin Error:", error);
    onError(error as Error);
    return (
      <div className="editor-error-boundary">
        <h3>Editor Error</h3>
        <p>Something went wrong with the editor. Please refresh the page.</p>
      </div>
    );
  }
};
