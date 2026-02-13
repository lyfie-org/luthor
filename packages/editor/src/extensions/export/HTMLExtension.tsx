import { LexicalEditor } from "lexical";
import { BaseExtension } from "@lyfie/luthor/extensions/base";
import { ExtensionCategory } from "@lyfie/luthor/extensions/types";
import { ReactNode } from "react";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import {
  $getRoot,
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
} from "lexical";

/**
 * Commands exposed by the HTML extension.
 */
export type HTMLCommands = {
  /** Export current editor content as an HTML string */
  exportToHTML: () => string;
  /** Import HTML into the editor, replacing current content */
  importFromHTML: (html: string, opts?: { preventFocus?: boolean }) => Promise<void>;
};

/**
 * State queries exposed by the HTML extension.
 */
export type HTMLStateQueries = {
  /** Check whether HTML export is available (always true) */
  canExportHTML: () => Promise<boolean>;
};

/**
 * HTML extension for import/export of HTML content.
 * Converts between Lexical editor state and HTML strings.
 *
 * @example
 * ```tsx
 * const extensions = [htmlExtension] as const;
 * const { Provider, useEditor } = createEditorSystem<typeof extensions>();
 *
 * function MyEditor() {
 *   const { commands } = useEditor();
 *
 *   const handleExport = () => {
 *     const html = commands.exportToHTML();
 *     console.log('Exported HTML:', html);
 *   };
 *
 *   const handleImport = () => {
 *     const html = '<p>Hello <strong>world</strong>!</p>';
 *     commands.importFromHTML(html);
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleExport}>Export HTML</button>
 *       <button onClick={handleImport}>Import HTML</button>
 *     </div>
 *   );
 * }
 * ```
 */
export class HTMLExtension extends BaseExtension<
  "html",
  {},
  HTMLCommands,
  HTMLStateQueries,
  ReactNode[]
> {
  /**
   * Creates a new HTML extension.
   */
  constructor() {
    super("html", [ExtensionCategory.Toolbar]);
  }

  /**
   * Registers the extension with the Lexical editor.
   * No special registration needed for HTML functionality.
   *
   * @param editor - Lexical editor instance
   * @returns Cleanup function
   */
  register(editor: LexicalEditor): () => void {
    return () => {
      // Cleanup if needed
    };
  }

  /**
   * Returns commands exposed by this extension.
   *
   * @param editor - Lexical editor instance
   * @returns Object containing HTML import/export commands
   */
  getCommands(editor: LexicalEditor): HTMLCommands {
    return {
      exportToHTML: () => {
        return editor.getEditorState().read(() => {
          return $generateHtmlFromNodes(editor);
        });
      },

      importFromHTML: (html: string, opts?: { preventFocus?: boolean }) => {
        return new Promise((resolve) => {
          editor.update(
            () => {
              try {
                const root = $getRoot();
                root.clear();

                if (html.trim()) {
                  // Parse HTML properly to avoid wrapper issues
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(html, "text/html");

                  // Generate nodes from the body to avoid extra wrappers
                  const nodes = $generateNodesFromDOM(editor, doc);

                  // Insert nodes directly to root
                  if (nodes && nodes.length > 0) {
                    nodes.forEach((node: any) => {
                      if (node) {
                        root.append(node);
                      }
                    });
                  } else {
                    root.append($createParagraphNode());
                  }
                } else {
                  root.append($createParagraphNode());
                }
                if (!opts?.preventFocus) {
                  $getRoot().selectEnd(); // Reset selection to avoid stale references
                }
              } catch (error) {
                console.error("Error importing HTML:", error);
                const root = $getRoot();
                root.clear();
                root.append($createParagraphNode());
              }
            },
            { discrete: true, onUpdate: resolve },
          );
        });
      },
    };
  }

  /**
   * Returns state query functions for this extension.
   *
   * @param editor - Lexical editor instance
   * @returns Object containing state query functions
   */
  getStateQueries(editor: LexicalEditor): HTMLStateQueries {
    return {
      canExportHTML: async () => true,
    };
  }
}

/**
 * Preconfigured HTML extension instance.
 * Ready for use in extension arrays.
 */
export const htmlExtension = new HTMLExtension();
