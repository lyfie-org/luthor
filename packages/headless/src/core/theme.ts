import { EditorThemeClasses } from "lexical";
import React from "react";

export const LUTHOR_EDITOR_THEME_TOKENS = [
  "--luthor-bg",
  "--luthor-fg",
  "--luthor-border",
  "--luthor-border-hover",
  "--luthor-border-active",
  "--luthor-accent",
  "--luthor-accent-hover",
  "--luthor-shadow",
  "--luthor-muted",
  "--luthor-muted-fg",
  "--luthor-theme-transition",
  "--luthor-drag-gutter-width",
  "--luthor-line-height-ratio",
  "--luthor-toolbar-bg",
  "--luthor-toolbar-section-border",
  "--luthor-toolbar-button-fg",
  "--luthor-toolbar-button-hover-bg",
  "--luthor-toolbar-button-hover-border",
  "--luthor-toolbar-button-hover-shadow",
  "--luthor-toolbar-button-press-shadow",
  "--luthor-toolbar-button-active-bg",
  "--luthor-toolbar-button-active-border",
  "--luthor-toolbar-button-active-fg",
  "--luthor-toolbar-button-active-shadow",
  "--luthor-toolbar-button-overlay",
  "--luthor-toolbar-button-active-overlay",
  "--luthor-toolbar-color-indicator-border",
  "--luthor-toolbar-highlight-bg",
  "--luthor-quote-bg",
  "--luthor-quote-fg",
  "--luthor-quote-border",
  "--luthor-syntax-comment",
  "--luthor-syntax-keyword",
  "--luthor-syntax-string",
  "--luthor-syntax-number",
  "--luthor-syntax-function",
  "--luthor-syntax-variable",
  "--luthor-floating-bg",
  "--luthor-floating-fg",
  "--luthor-floating-border",
  "--luthor-floating-shadow",
  "--luthor-floating-muted",
  "--luthor-floating-border-hover",
  "--luthor-floating-border-active",
  "--luthor-floating-accent",
  "--luthor-floating-accent-fg",
  "--luthor-preset-bg",
  "--luthor-preset-fg",
  "--luthor-preset-border",
  "--luthor-preset-muted",
  "--luthor-preset-muted-fg",
  "--luthor-preset-accent",
  "--luthor-preset-radius",
  "--luthor-preset-shadow",
  "--luthor-preset-content-padding",
  "--luthor-preset-content-min-height",
] as const;

export type LuthorEditorThemeToken = (typeof LUTHOR_EDITOR_THEME_TOKENS)[number];

export type LuthorEditorThemeOverrides = Partial<Record<LuthorEditorThemeToken, string>>;

function isNonEmptyThemeValue(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function createEditorThemeStyleVars(overrides?: LuthorEditorThemeOverrides): React.CSSProperties | undefined {
  if (!overrides) {
    return undefined;
  }

  const style: Record<string, string> = {};
  for (const token of LUTHOR_EDITOR_THEME_TOKENS) {
    const value = overrides[token];
    if (isNonEmptyThemeValue(value)) {
      style[token] = value;
    }
  }

  return Object.keys(style).length > 0 ? (style as React.CSSProperties) : undefined;
}

/**
 * Enhanced theme type that extends Lexical's EditorThemeClasses
 * with better TypeScript support and additional properties
 */
export interface LuthorTheme extends EditorThemeClasses {
  // Custom properties for Luthor
  toolbar?: {
    button?: string;
    buttonActive?: string;
    buttonDisabled?: string;
    group?: string;
  };
  container?: string;
  wrapper?: string;
  contextMenu?: {
    container?: string;
    item?: string;
    itemDisabled?: string;
  };
  draggable?: {
    handle?: string;
    handleActive?: string;
    handleHover?: string;
    handleDragging?: string;
    blockDragging?: string;
    dropIndicator?: string;
    upButton?: string;
    downButton?: string;
    blockIsDragging?: string;
    buttonStack?: string;
    styles?: {
      handle?: React.CSSProperties;
      handleActive?: React.CSSProperties;
      handleHover?: React.CSSProperties;
      handleDragging?: React.CSSProperties;
      blockDragging?: React.CSSProperties;
      dropIndicator?: React.CSSProperties;
      upButton?: React.CSSProperties;
      downButton?: React.CSSProperties;
      blockIsDragging?: React.CSSProperties;
      buttonStack?: React.CSSProperties;
    };
  };
  floatingToolbar?: {
    container?: string;
    button?: string;
    buttonActive?: string;
    styles?: {
      container?: React.CSSProperties;
      button?: React.CSSProperties;
      buttonActive?: React.CSSProperties;
    };
  };
  // Styles for inline CSS properties
  styles?: {
    toolbar?: {
      button?: React.CSSProperties;
      buttonActive?: React.CSSProperties;
      buttonDisabled?: React.CSSProperties;
      group?: React.CSSProperties;
    };
    container?: React.CSSProperties;
    wrapper?: React.CSSProperties;
    draggable?: {
      handle?: React.CSSProperties;
      handleHover?: React.CSSProperties;
      handleDragging?: React.CSSProperties;
      blockDragging?: React.CSSProperties;
      dropIndicator?: React.CSSProperties;
      upButton?: React.CSSProperties;
      downButton?: React.CSSProperties;
      blockIsDragging?: React.CSSProperties;
      buttonStack?: React.CSSProperties;
    };
    floatingToolbar?: {
      container?: React.CSSProperties;
      button?: React.CSSProperties;
      buttonActive?: React.CSSProperties;
    };
  };
}

/**
 * Default Luthor theme with sensible defaults
 */
export const defaultLuthorTheme: LuthorTheme = {
  // Lexical's built-in theme properties
  text: {
    bold: "luthor-text-bold",
    italic: "luthor-text-italic",
    underline: "luthor-text-underline",
    strikethrough: "luthor-text-strikethrough",
    code: "luthor-text-code",
  },
  list: {
    ul: "luthor-list-ul",
    ol: "luthor-list-ol",
    listitem: "luthor-list-li",
    listitemChecked: "luthor-list-item-checked",
    listitemUnchecked: "luthor-list-item-unchecked",
    nested: {
      list: "luthor-list-nested",
      listitem: "luthor-list-nested-item",
    },
  },
  quote: "luthor-quote",
  heading: {
    h1: "luthor-heading-h1",
    h2: "luthor-heading-h2",
    h3: "luthor-heading-h3",
    h4: "luthor-heading-h4",
    h5: "luthor-heading-h5",
    h6: "luthor-heading-h6",
  },
  paragraph: "luthor-paragraph",
  link: "luthor-link",
  image: "lexical-image",
  hr: "luthor-hr",
  table: "luthor-table",
  tableRow: "luthor-table-row",
  tableCell: "luthor-table-cell",
  tableCellHeader: "luthor-table-cell-header",
  code: "luthor-code-block",
  codeHighlight: {
    atrule: "luthor-code-atrule",
    attr: "luthor-code-attr",
    boolean: "luthor-code-boolean",
    builtin: "luthor-code-builtin",
    cdata: "luthor-code-cdata",
    char: "luthor-code-char",
    class: "luthor-code-class",
    "class-name": "luthor-code-class-name",
    comment: "luthor-code-comment",
    constant: "luthor-code-constant",
    deleted: "luthor-code-deleted",
    doctype: "luthor-code-doctype",
    entity: "luthor-code-entity",
    function: "luthor-code-function",
    important: "luthor-code-important",
    inserted: "luthor-code-inserted",
    keyword: "luthor-code-keyword",
    namespace: "luthor-code-namespace",
    number: "luthor-code-number",
    operator: "luthor-code-operator",
    prolog: "luthor-code-prolog",
    property: "luthor-code-property",
    punctuation: "luthor-code-punctuation",
    regex: "luthor-code-regex",
    selector: "luthor-code-selector",
    string: "luthor-code-string",
    symbol: "luthor-code-symbol",
    tag: "luthor-code-tag",
    url: "luthor-code-url",
    variable: "luthor-code-variable",
  },

  // Custom Luthor properties
  toolbar: {
    button: "luthor-toolbar-button",
    buttonActive: "luthor-toolbar-button-active",
    buttonDisabled: "luthor-toolbar-button-disabled",
    group: "luthor-toolbar-group",
  },
  container: "luthor-editor-container",
  wrapper: "luthor-editor-wrapper",
  editor: "luthor-editor",
  contentEditable: "luthor-content-editable",
  contextMenu: {
    container: "luthor-context-menu",
    item: "luthor-context-menu-item",
    itemDisabled: "luthor-context-menu-item-disabled",
  },
  draggable: {
    handle: "luthor-draggable-handle",
    handleActive: "luthor-draggable-handle-active",
    handleHover: "luthor-draggable-handle-hover",
    handleDragging: "luthor-draggable-handle-dragging",
    blockDragging:
      "luthor-draggable-block-dragging opacity-50 transition-opacity duration-200",
    dropIndicator: "luthor-draggable-drop-indicator",
    upButton: "luthor-draggable-up-button",
    downButton: "luthor-draggable-down-button",
    blockIsDragging: "luthor-draggable-block-is-dragging",
    buttonStack: "luthor-draggable-button-stack",
  },
  floatingToolbar: {
    container: "luthor-floating-toolbar",
    button: "luthor-floating-toolbar-button",
    buttonActive: "luthor-floating-toolbar-button-active",
  },
  richText: {
    contentEditable: "luthor-content-editable",
    placeholder: "luthor-placeholder",
  },
};

/**
 * Helper function to merge themes
 */
export function mergeThemes(
  baseTheme: LuthorTheme,
  overrideTheme: Partial<LuthorTheme>,
): LuthorTheme {
  return {
    ...baseTheme,
    ...overrideTheme,
    text: {
      ...baseTheme.text,
      ...overrideTheme.text,
    },
    list: {
      ...baseTheme.list,
      ...overrideTheme.list,
      nested: {
        ...baseTheme.list?.nested,
        ...overrideTheme.list?.nested,
      },
    },
    heading: {
      ...baseTheme.heading,
      ...overrideTheme.heading,
    },
    codeHighlight: {
      ...baseTheme.codeHighlight,
      ...overrideTheme.codeHighlight,
    },
    toolbar: {
      ...baseTheme.toolbar,
      ...overrideTheme.toolbar,
    },
    draggable: {
      ...baseTheme.draggable,
      ...overrideTheme.draggable,
      styles: {
        ...baseTheme.draggable?.styles,
        ...overrideTheme.draggable?.styles,
      },
    },
    floatingToolbar: {
      ...baseTheme.floatingToolbar,
      ...overrideTheme.floatingToolbar,
      styles: {
        ...baseTheme.floatingToolbar?.styles,
        ...overrideTheme.floatingToolbar?.styles,
      },
    },
    richText: {
      ...baseTheme.richText,
      ...overrideTheme.richText,
    },
    styles: {
      toolbar: {
        ...baseTheme.styles?.toolbar,
        ...overrideTheme.styles?.toolbar,
      },
      draggable: {
        ...baseTheme.styles?.draggable,
        ...overrideTheme.styles?.draggable,
      },
      floatingToolbar: {
        ...baseTheme.styles?.floatingToolbar,
        ...overrideTheme.styles?.floatingToolbar,
      },
      ...overrideTheme.styles,
    },
  };
}

/**
 * Type guard to check if a theme is a LuthorTheme
 */
export function isLuthorTheme(theme: any): theme is LuthorTheme {
  return theme && typeof theme === "object";
}
