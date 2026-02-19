import {
  LexicalEditor,
  $getSelection,
  $isRangeSelection,
  PASTE_COMMAND,
  $createTextNode,
} from "lexical";
import {
  $isLinkNode,
  TOGGLE_LINK_COMMAND,
  LinkNode,
  AutoLinkNode,
  $createLinkNode,
} from "@lexical/link";
import { BaseExtension } from "@lyfie/luthor-headless/extensions/base";
import {
  BaseExtensionConfig,
  ExtensionCategory,
} from "@lyfie/luthor-headless/extensions/types";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { AutoLinkPlugin } from "@lexical/react/LexicalAutoLinkPlugin";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import React from "react";

/**
 * Link extension configuration.
 */
export interface LinkConfig extends BaseExtensionConfig {
  /**
   * Automatically link URLs as you type in the editor.
   * Uses real-time pattern matching. Default: false
   */
  autoLinkText?: boolean;
  /**
   * Automatically link URLs when pasted into the editor.
   * When false, pasted URLs remain plain text. Default: true
   */
  autoLinkUrls?: boolean;
  /**
   * Link selected text when pasting URLs over it.
   * When true: selected text becomes a link with the pasted URL.
   * When false: selected text is replaced with the pasted URL and then linked. Default: true
   */
  linkSelectedTextOnPaste?: boolean;
  /** URL validation function (default: basic URL regex) */
  validateUrl?: (url: string) => boolean;
  /** Enable click navigation on links rendered inside the editor. Default: true */
  clickableLinks?: boolean;
  /** Open clicked links in a new tab when click navigation is enabled. Default: true */
  openLinksInNewTab?: boolean;
}

/**
 * Commands exposed by the link extension.
 */
export type LinkCommands = {
  insertLink: (url?: string, text?: string) => void;
  removeLink: () => void;
};

/**
 * State queries exposed by the link extension.
 */
export type LinkStateQueries = {
  isLink: () => Promise<boolean>;
  isTextSelected: () => Promise<boolean>;
};

/**
 * Link extension for creating and managing hyperlinks.
 *
 * Features:
 * - Manual link creation via commands
 * - Built-in paste handling (creates links when pasting URLs)
 * - Optional auto-linking while typing
 * - Click to follow links, click again to edit
 *
 * Uses Lexical's built-in LinkPlugin which handles:
 * - Pasting URLs over selected text (converts selection to a link)
 * - Pasting URLs at the cursor (creates a new link)
 * - Link editing and validation
 *
 * @example
 * ```tsx
 * const extensions = [
 *   linkExtension.configure({
 *     autoLinkText: true, // Optional: auto-link while typing
 *     autoLinkUrls: true, // Optional: auto-link pasted URLs
 *     linkSelectedTextOnPaste: false // Optional: replace selected text rather than linking it
 *   })
 * ] as const;
 *
 * function MyEditor() {
 *   const { commands, activeStates } = useEditor();
 *   return (
 *     <button
 *       onClick={() => commands.insertLink()}
 *       className={activeStates.isLink ? 'active' : ''}
 *     >
 *       Link
 *     </button>
 *   );
 * }
 * ```
 */
export class LinkExtension extends BaseExtension<
  "link",
  LinkConfig,
  LinkCommands,
  LinkStateQueries,
  React.ReactElement[]
> {
  /**
   * Creates a new link extension instance.
   */
  constructor() {
    super("link", [ExtensionCategory.Toolbar]);
    this.config = {
      autoLinkText: false,
      clickableLinks: true,
      openLinksInNewTab: true,
      linkSelectedTextOnPaste: true, // Link selected text when pasting URLs
      validateUrl: (url: string) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      },
    };
  }

  /**
   * Registers the extension with the editor.
   * Configures URL paste handling.
   */
  register(editor: LexicalEditor): () => void {
    // Handle URL pasting with custom logic
    const unregisterPaste = editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        const pastedText = clipboardData.getData("text/plain");
        if (!pastedText) return false;

        // Check if pasted text is a valid URL
        if (this.config.validateUrl!(pastedText)) {
          // If autoLinkUrls is false, don't handle the paste
          if (!this.config.autoLinkUrls) {
            return false;
          }

          event.preventDefault();

          editor.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;

            if (selection.isCollapsed()) {
              // No text selected - create new link
              const linkNode = $createLinkNode(pastedText);
              linkNode.append($createTextNode(pastedText));
              selection.insertNodes([linkNode]);
            } else {
              // Text is selected - handle based on linkSelectedTextOnPaste option
              if (this.config.linkSelectedTextOnPaste) {
                // Link the selected text with the pasted URL
                editor.dispatchCommand(TOGGLE_LINK_COMMAND, pastedText);
              } else {
                // Replace selected text with the pasted URL and link it
                selection.insertText(pastedText);
                // Apply link to the newly inserted text
                const newSelection = $getSelection();
                if (newSelection && $isRangeSelection(newSelection)) {
                  const nodes = newSelection.getNodes();
                  const firstNode = nodes[0];
                  if (firstNode) {
                    editor.dispatchCommand(TOGGLE_LINK_COMMAND, pastedText);
                  }
                }
              }
            }
          });

          return true;
        }

        return false;
      },
      3, // Higher priority than LinkPlugin's default
    );

    return () => {
      unregisterPaste();
    };
  }

  /**
   * Returns Lexical nodes exposed by this extension.
   */
  getNodes(): any[] {
    const nodes = [LinkNode];
    if (this.config.autoLinkText) {
      nodes.push(AutoLinkNode);
    }
    return nodes;
  }

  /**
   * Returns React plugins exposed by this extension.
   */
  getPlugins(): React.ReactElement[] {
    const plugins: React.ReactElement[] = [];

    // Always include LinkPlugin for basic link functionality
    // Our paste handler will override its behavior when needed
    plugins.push(
      <LinkPlugin key="link-plugin" validateUrl={this.config.validateUrl} />,
    );

    if (this.config.clickableLinks !== false) {
      plugins.push(
        <ClickableLinkPlugin
          key="clickable-link"
          newTab={this.config.openLinksInNewTab !== false}
        />,
      );
    }

    // Optional: Auto-link as you type
    if (this.config.autoLinkText) {
      const urlMatcher = (text: string) => {
        const urlRegex =
          /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_.+~#?&//=]*)/g;
        const match = urlRegex.exec(text);
        if (match && this.config.validateUrl!(match[0])) {
          return {
            text: match[0],
            url: match[0],
            index: match.index,
            length: match[0].length,
          };
        }
        return null;
      };

      plugins.push(<AutoLinkPlugin key="auto-link" matchers={[urlMatcher]} />);
    }

    return plugins;
  }

  /**
   * Returns command handlers exposed by this extension.
   */
  getCommands(editor: LexicalEditor): LinkCommands {
    return {
      insertLink: (url?: string, text?: string) => {
        if (url) {
          // If text is provided, insert it first, then apply link
          if (text) {
            editor.update(() => {
              const selection = $getSelection();
              if (selection) {
                selection.insertText(text);
              }
            });
          }
          // Apply link to current selection
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
        } else {
          // Prompt for URL if not provided
          const linkUrl = prompt("Enter URL:");
          if (linkUrl) {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl);
          }
        }
      },

      removeLink: () => {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      },
    };
  }

  /**
   * Returns state query functions exposed by this extension.
   */
  getStateQueries(editor: LexicalEditor): LinkStateQueries {
    return {
      isLink: () =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if (selection && $isRangeSelection(selection)) {
              const nodes = selection.getNodes();
              const node = nodes[0];
              if (node) {
                const parent = node.getParent();
                resolve($isLinkNode(parent) || $isLinkNode(node));
              } else {
                resolve(false);
              }
            } else {
              resolve(false);
            }
          });
        }),

      isTextSelected: () =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if (selection && $isRangeSelection(selection)) {
              // Check if there's actual text selected (not just a collapsed cursor)
              resolve(!selection.isCollapsed());
            } else {
              resolve(false);
            }
          });
        }),
    };
  }
}

/**
 * Preconfigured link extension instance.
 * Ready for use in extension arrays.
 */
export const linkExtension = new LinkExtension();

export default linkExtension;

