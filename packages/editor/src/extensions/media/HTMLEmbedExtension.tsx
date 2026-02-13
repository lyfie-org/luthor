// HTMLEmbedExtension.tsx
// Clean, scalable, headless HTML embed extension that works across all tabs

import React, { useState, ReactNode, useRef } from "react";
import {
  LexicalEditor,
  DecoratorNode,
  NodeKey,
  $getSelection,
  $isRangeSelection,
  $getRoot,
  $getNodeByKey,
  DOMConversionMap,
  DOMConversionOutput,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { BaseExtension } from "../base/BaseExtension";
import { ExtensionCategory, BaseExtensionConfig } from "../types";
import { LuthorTheme } from "../../core/theme";
import { useBaseEditor as useEditor } from "../../core/createEditorSystem"; // Use base for untyped access
import { markdownExtension } from "../export/MarkdownExtension";

// No shared defaults - use core theme

/**
 * Payload for HTML embed content
 */
export type HTMLEmbedPayload = {
  /** HTML content to embed */
  html: string;
  /** Whether to show preview or edit mode */
  preview: boolean;
};

/**
 * HTMLEmbedExtension configuration
 */
export interface HTMLEmbedConfig extends BaseExtensionConfig {
  /** Default HTML for new embeds */
  defaultHtml?: string;
  /** Default to preview mode */
  defaultPreview?: boolean;
  /** Theme class names */
  theme?: {
    container?: string;
    preview?: string;
    editor?: string;
    textarea?: string;
    toggle?: string;
    content?: string;
  };
  /** Custom styles for UI elements */
  styles?: {
    container?: React.CSSProperties;
    preview?: React.CSSProperties;
    editor?: React.CSSProperties;
    textarea?: React.CSSProperties;
    toggle?: React.CSSProperties;
    content?: React.CSSProperties;
  };
  /** Custom container renderer for full headless control */
  containerRenderer?: (props: {
    children: ReactNode;
    className: string;
    style?: React.CSSProperties;
  }) => ReactNode;
  /** Custom preview renderer component */
  previewRenderer?: (props: {
    html: string;
    onToggleEdit: () => void;
    className: string;
    style?: React.CSSProperties;
    toggleClassName: string;
    toggleStyle?: React.CSSProperties;
  }) => ReactNode;
  /** Custom editor renderer component */
  editorRenderer?: (props: {
    html: string;
    onTogglePreview: () => void;
    onSave: () => void;
    className: string;
    style?: React.CSSProperties;
    textareaClassName: string;
    textareaStyle?: React.CSSProperties;
    toggleClassName: string;
    toggleStyle?: React.CSSProperties;
  }) => ReactNode;
  /** Custom toggle button renderer component */
  toggleRenderer?: (props: {
    isPreview: boolean;
    onClick: () => void;
    className: string;
    style?: React.CSSProperties;
  }) => ReactNode;
  /** Markdown extension instance used to register transformers */
  markdownExtension?: typeof markdownExtension;
}

/**
 * Commands exposed by the HTMLEmbedExtension
 */
export type HTMLEmbedCommands = {
  /** Insert an HTML embed with optional initial HTML */
  insertHTMLEmbed: (html?: string) => void;
  /** Toggle between preview and edit modes */
  toggleHTMLPreview: () => void;
};

/**
 * State queries exposed by the HTMLEmbedExtension
 */
export type HTMLEmbedQueries = {
  /** Check whether an HTML embed is selected */
  isHTMLEmbedSelected: () => Promise<boolean>;
  /** Check whether HTML preview mode is active */
  isHTMLPreviewMode: () => Promise<boolean>;
};

/**
 * Serialized representation of an HTMLEmbedNode
 */
type SerializedHTMLEmbedNode = Spread<
  {
    /** HTML content */
    html: string;
    /** Preview mode state */
    preview: boolean;
    /** Node type ID */
    type: "html-embed";
    /** Version for migrations */
    version: 1;
  },
  SerializedLexicalNode
>;

/**
 * HTMLEmbedNode - A Lexical DecoratorNode for custom HTML embeds
 *
 * Allows users to embed custom HTML content in the editor.
 * Supports preview mode (rendered HTML) and edit mode
 * (editable HTML source).
 *
 * @example
 * ```typescript
 * const node = new HTMLEmbedNode({
 *   html: '<div>Hello World</div>',
 *   preview: true
 * });
 * ```
 */
export class HTMLEmbedNode extends DecoratorNode<ReactNode> {
  __payload: HTMLEmbedPayload;

  /**
   * Get the node type identifier
   * @returns Node type string
   */
  static getType(): string {
    return "html-embed";
  }

  /**
   * Clone the node
   * @param node - Node to clone
   * @returns New cloned node instance
   */
  static clone(node: HTMLEmbedNode): HTMLEmbedNode {
    return new HTMLEmbedNode(node.__payload, node.__key);
  }

  /**
   * Constructor for HTMLEmbedNode
   * @param payload - HTML embed payload
   * @param key - Optional node key
   */
  constructor(payload: HTMLEmbedPayload, key?: NodeKey) {
    super(key);
    this.__payload = payload;
  }

  /**
   * Create the DOM element for this node
   * @returns DOM element
   */
  createDOM(): HTMLElement {
    const div = document.createElement("div");
    div.setAttribute("data-lexical-html-embed", "true");
    div.className = "html-embed-container";
    return div;
  }

  /**
   * Update the DOM element (unused with React rendering)
   * @returns Always false to let React handle updates
   */
  updateDOM(): boolean {
    return false; // Let React handle all updates
  }

  /**
   * Import node from JSON serialization
   * @param serialized - Serialized node data
   * @returns New HTMLEmbedNode instance
   */
  static importJSON(serialized: SerializedHTMLEmbedNode): HTMLEmbedNode {
    const payload: HTMLEmbedPayload = {
      html:
        serialized.html ||
        '<div style="padding: 20px;  border-radius: 8px; text-align: center;"><h3>Custom HTML Block</h3><p>Edit this HTML to create your custom embed!</p></div>',
      preview: serialized.preview ?? true,
    };
    return new HTMLEmbedNode(payload);
  }

  /**
   * Export node to JSON serialization
   * @returns Serialized node data
   */
  exportJSON(): SerializedHTMLEmbedNode {
    return {
      type: "html-embed",
      html: this.__payload.html,
      preview: this.__payload.preview,
      version: 1,
    };
  }

  // HTML import/export for HTML tab
  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-html-embed")) {
          return null;
        }
        return {
          conversion: (element: HTMLElement): DOMConversionOutput => {
            const html = element.getAttribute("data-html-content") || "";
            const payload: HTMLEmbedPayload = { html, preview: true };
            return { node: new HTMLEmbedNode(payload) };
          },
          priority: 4,
        };
      },
      p: (domNode: HTMLElement) => {
        // Check if this paragraph contains our html embed div
        const embedDiv = domNode.querySelector(
          'div[data-lexical-html-embed="true"]',
        );
        if (embedDiv) {
          return {
            conversion: (element: HTMLElement): DOMConversionOutput => {
              const embedElement = element.querySelector(
                'div[data-lexical-html-embed="true"]',
              ) as HTMLElement;
              if (embedElement) {
                const html =
                  embedElement.getAttribute("data-html-content") || "";
                const payload: HTMLEmbedPayload = { html, preview: true };
                return { node: new HTMLEmbedNode(payload) };
              }
              return { node: null };
            },
            priority: 4, // Higher priority than normal paragraph conversion
          };
        }
        return null;
      },
    };
  }

  exportDOM(): { element: HTMLElement } {
    const element = document.createElement("div");
    element.setAttribute("data-lexical-html-embed", "true");
    element.setAttribute("data-html-content", this.__payload.html);
    // Don't set innerHTML to avoid duplication - the data-html-content is sufficient
    return { element };
  }

  // Public API for payload management
  getPayload(): HTMLEmbedPayload {
    return this.getLatest().__payload;
  }

  setPayload(payload: Partial<HTMLEmbedPayload>): void {
    const writable = this.getWritable();
    writable.__payload = { ...writable.__payload, ...payload };
  }

  // React component rendering
  decorate(editor: LexicalEditor): ReactNode {
    return (
      <HTMLEmbedComponent
        nodeKey={this.__key}
        payload={this.__payload}
        editor={editor}
      />
    );
  }

  // Lexical node configuration
  isInline(): false {
    return false;
  }

  isKeyboardSelectable(): boolean {
    return true;
  }
}

// React Component - Clean and headless design
const HTMLEmbedComponent: React.FC<{
  nodeKey: NodeKey;
  payload: HTMLEmbedPayload;
  editor: LexicalEditor;
}> = ({ nodeKey, payload, editor }) => {
  const { config, extensions } = useEditor();
  // Fetch extension-specific config (for renderers, per-extension overrides)
  const embedExtension = extensions.find(
    (ext: any) => ext.name === "htmlEmbed",
  ) as HTMLEmbedExtension | undefined;
  const embedConfig = embedExtension?.config as HTMLEmbedConfig | undefined;

  // Global theme section
  const globalHtmlEmbedTheme = config?.theme?.htmlEmbed || {};

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update payload in Lexical state
  const updatePayload = (newPayload: Partial<HTMLEmbedPayload>) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey) as HTMLEmbedNode;
      if (node) {
        node.setPayload(newPayload);
      }
    });
  };

  const togglePreview = () => {
    // Save current content before switching to preview
    if (!payload.preview && textareaRef.current) {
      const html = textareaRef.current.value;
      if (html !== payload.html) {
        updatePayload({ html });
      }
    }
    updatePayload({ preview: !payload.preview });
  };

  const handleSave = () => {
    if (textareaRef.current) {
      const html = textareaRef.current.value;
      if (html !== payload.html) {
        updatePayload({ html });
      }
    }
    updatePayload({ preview: true });
  };

  // Merged styles: extension config -> global theme (no defaults since core theme doesn't have them)
  const mergedStyles = {
    container: {
      ...embedConfig?.styles?.container,
      ...globalHtmlEmbedTheme.styles?.container,
    },
    preview: {
      ...embedConfig?.styles?.preview,
      ...globalHtmlEmbedTheme.styles?.preview,
    },
    editor: {
      ...embedConfig?.styles?.editor,
      ...globalHtmlEmbedTheme.styles?.editor,
    },
    textarea: {
      ...embedConfig?.styles?.textarea,
      ...globalHtmlEmbedTheme.styles?.textarea,
    },
    toggle: {
      ...embedConfig?.styles?.toggle,
      ...globalHtmlEmbedTheme.styles?.toggle,
    },
    content: {
      ...embedConfig?.styles?.content,
      ...globalHtmlEmbedTheme.styles?.content,
    },
  };

  // Merged theme classes: extension config -> global theme (core theme provides defaults)
  const mergedThemeClasses = {
    container:
      embedConfig?.theme?.container || globalHtmlEmbedTheme.container || "",
    preview: embedConfig?.theme?.preview || globalHtmlEmbedTheme.preview || "",
    editor: embedConfig?.theme?.editor || globalHtmlEmbedTheme.editor || "",
    textarea:
      embedConfig?.theme?.textarea || globalHtmlEmbedTheme.textarea || "",
    toggle: embedConfig?.theme?.toggle || globalHtmlEmbedTheme.toggle || "",
    content: embedConfig?.theme?.content || globalHtmlEmbedTheme.content || "",
  };

  // Default renderers
  const defaultContainerRenderer = ({
    children,
    className,
    style,
  }: {
    children: ReactNode;
    className: string;
    style?: React.CSSProperties;
  }) => (
    <div className={className} style={style}>
      {children}
    </div>
  );

  const defaultPreviewRenderer = ({
    html,
    onToggleEdit,
    className,
    style,
    toggleClassName,
    toggleStyle,
  }: {
    html: string;
    onToggleEdit: () => void;
    className: string;
    style?: React.CSSProperties;
    toggleClassName: string;
    toggleStyle?: React.CSSProperties;
  }) => (
    <div className={className} style={style}>
      <div
        className={mergedThemeClasses.content}
        style={mergedStyles.content}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {embedConfig?.toggleRenderer ? (
        embedConfig.toggleRenderer({
          isPreview: true,
          onClick: onToggleEdit,
          className: toggleClassName,
          style: toggleStyle,
        })
      ) : (
        <button
          className={toggleClassName}
          style={toggleStyle}
          onClick={onToggleEdit}
          title="Edit HTML"
          type="button"
        >
          ✏️ Edit
        </button>
      )}
    </div>
  );

  const defaultEditorRenderer = ({
    html,
    onTogglePreview,
    onSave,
    className,
    style,
    textareaClassName,
    textareaStyle,
    toggleClassName,
    toggleStyle,
  }: {
    html: string;
    onTogglePreview: () => void;
    onSave: () => void;
    className: string;
    style?: React.CSSProperties;
    textareaClassName: string;
    textareaStyle?: React.CSSProperties;
    toggleClassName: string;
    toggleStyle?: React.CSSProperties;
  }) => (
    <div className={className} style={style}>
      <textarea
        ref={textareaRef}
        className={textareaClassName}
        style={textareaStyle}
        defaultValue={html}
        placeholder="Enter HTML here..."
      />
      {embedConfig?.toggleRenderer ? (
        embedConfig.toggleRenderer({
          isPreview: false,
          onClick: onSave,
          className: toggleClassName,
          style: toggleStyle,
        })
      ) : (
        <button
          className={toggleClassName}
          style={toggleStyle}
          onClick={onSave}
          title="Preview HTML"
          type="button"
        >
          👁️ Preview
        </button>
      )}
    </div>
  );

  // Use custom renderers from extension config if provided, otherwise defaults
  const ContainerRenderer =
    embedConfig?.containerRenderer || defaultContainerRenderer;
  const PreviewRenderer =
    embedConfig?.previewRenderer || defaultPreviewRenderer;
  const EditorRenderer = embedConfig?.editorRenderer || defaultEditorRenderer;

  return (
    <ContainerRenderer
      className={mergedThemeClasses.container}
      style={mergedStyles.container}
    >
      {payload.preview ? (
        <PreviewRenderer
          html={payload.html}
          onToggleEdit={togglePreview}
          className={mergedThemeClasses.preview}
          style={mergedStyles.preview}
          toggleClassName={mergedThemeClasses.toggle}
          toggleStyle={mergedStyles.toggle}
        />
      ) : (
        <EditorRenderer
          html={payload.html}
          onTogglePreview={togglePreview}
          onSave={handleSave}
          className={mergedThemeClasses.editor}
          style={mergedStyles.editor}
          textareaClassName={mergedThemeClasses.textarea}
          textareaStyle={mergedStyles.textarea}
          toggleClassName={mergedThemeClasses.toggle}
          toggleStyle={mergedStyles.toggle}
        />
      )}
    </ContainerRenderer>
  );
};

// Extension class
export class HTMLEmbedExtension extends BaseExtension<
  "htmlEmbed",
  HTMLEmbedConfig,
  HTMLEmbedCommands,
  HTMLEmbedQueries,
  ReactNode[]
> {
  constructor(config?: Partial<HTMLEmbedConfig>) {
    super("htmlEmbed", [ExtensionCategory.Toolbar]);

    // Default configuration
    this.config = {
      defaultHtml:
        '<div style="padding: 20px; border-radius: 8px; text-align: center;"><h3>Custom HTML Block</h3><p>Edit this HTML to create your custom embed!</p></div>',
      defaultPreview: false,
      ...config,
    } as HTMLEmbedConfig;
  }

  register(editor: LexicalEditor): () => void {
    // Register its markdown transformer with markdown extension
    const mdExtension = this.config.markdownExtension || markdownExtension;
    try {
      mdExtension.registerTransformer?.(HTML_EMBED_MARKDOWN_TRANSFORMER as any);
    } catch (e) {
      console.warn('[HTMLEmbedExtension] failed to register html embed markdown transformer', e);
    }
    return () => {};
  }

  getNodes(): any[] {
    return [HTMLEmbedNode];
  }

  getPlugins(): ReactNode[] {
    // No plugins needed - theme is accessed via useEditor hook
    return [];
  }

  getCommands(editor: LexicalEditor): HTMLEmbedCommands {
    return {
      insertHTMLEmbed: (html?: string) => {
        editor.update(() => {
          const payload: HTMLEmbedPayload = {
            html: html || this.config.defaultHtml!,
            preview: this.config.defaultPreview!,
          };

          const node = new HTMLEmbedNode(payload);
          const selection = $getSelection();

          if ($isRangeSelection(selection)) {
            selection.insertNodes([node]);
          } else {
            $getRoot().append(node);
          }
        });
      },

      toggleHTMLPreview: () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const nodes = selection.getNodes();
            nodes.forEach((node) => {
              if (node instanceof HTMLEmbedNode) {
                const payload = node.getPayload();
                node.setPayload({ preview: !payload.preview });
              }
            });
          }
        });
      },
    };
  }

  getStateQueries(editor: LexicalEditor): HTMLEmbedQueries {
    return {
      isHTMLEmbedSelected: () =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const hasHTMLEmbed = selection
                .getNodes()
                .some((node) => node instanceof HTMLEmbedNode);
              resolve(hasHTMLEmbed);
            } else {
              resolve(false);
            }
          });
        }),

      isHTMLPreviewMode: () =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const embedNode = selection
                .getNodes()
                .find((node) => node instanceof HTMLEmbedNode) as HTMLEmbedNode;
              resolve(embedNode ? embedNode.getPayload().preview : false);
            } else {
              resolve(false);
            }
          });
        }),
    };
  }
}

// Markdown Transformer - Properly implemented for Lexical 0.35
export const HTML_EMBED_MARKDOWN_TRANSFORMER = {
  dependencies: [HTMLEmbedNode],
  export: (node: any) => {
    // Check if this is our HTML embed node
    if (
      node &&
      typeof node.getType === "function" &&
      node.getType() === "html-embed"
    ) {
      try {
        const payload = node.getPayload();
        const result = "```html-embed\n" + payload.html + "\n```";
        return result;
      } catch (error) {
        console.error("❌ Error exporting HTML embed:", error);
        return null;
      }
    }

    return null;
  },
  regExpStart: /^```html-embed\s*$/,
  regExpEnd: {
    optional: true as const,
    regExp: /^```$/
  },
  replace: (rootNode: any, children: any, startMatch: any, endMatch: any, linesInBetween: any, isImport: boolean) => {
    // Combine the lines in between to get the HTML content
    const html = linesInBetween.join('\n');
    
    try {
      const payload: HTMLEmbedPayload = { html, preview: true };
      const node = new HTMLEmbedNode(payload);
      rootNode.append(node);
    } catch (error) {
      console.error("❌ Error creating HTML embed node:", error);
    }
  },
  type: "multiline-element" as const,
};

// Export instances
export const htmlEmbedExtension = new HTMLEmbedExtension();
