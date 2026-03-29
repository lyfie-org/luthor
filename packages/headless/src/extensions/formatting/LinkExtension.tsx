/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import {
  LexicalEditor,
  $getSelection,
  $isRangeSelection,
  PASTE_COMMAND,
  $createTextNode,
  $getNodeByKey,
  LexicalNode,
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
  updateLink: (url: string, rel?: string, target?: string) => boolean;
  removeLink: () => void;
  getCurrentLink: () => Promise<{
    url: string;
    rel: string | null;
    target: string | null;
  } | null>;
  getLinkByKey: (linkNodeKey: string) => Promise<{
    url: string;
    rel: string | null;
    target: string | null;
  } | null>;
  updateLinkByKey: (
    linkNodeKey: string,
    url: string,
    rel?: string,
    target?: string,
  ) => boolean;
  removeLinkByKey: (linkNodeKey: string) => boolean;
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
  private lastSelectedLinkNodeKey: string | null = null;

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

    const unregisterSelectionTracking = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const linkNode = this.getSelectedLinkNode();
        if (linkNode) {
          this.lastSelectedLinkNodeKey = linkNode.getKey();
          return;
        }

        if (this.lastSelectedLinkNodeKey) {
          const cachedNode = $getNodeByKey(this.lastSelectedLinkNodeKey);
          if (!$isLinkNode(cachedNode)) {
            this.lastSelectedLinkNodeKey = null;
          }
        }
      });
    });

    return () => {
      unregisterPaste();
      unregisterSelectionTracking();
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
    const normalizeUrl = (value: string): string => value.trim();
    const validateUrl = (value: string): boolean =>
      value.length > 0 && !!this.config.validateUrl?.(value);

    const applyLinkAttributes = (
      linkNode: LinkNode,
      url: string,
      rel?: string,
      target?: string,
    ) => {
      linkNode.setURL(url);
      if (typeof rel !== "undefined") {
        linkNode.setRel(rel.trim() || null);
      }
      if (typeof target !== "undefined") {
        linkNode.setTarget(target.trim() || null);
      }
    };

    return {
      insertLink: (url?: string, text?: string) => {
        if (url) {
          const normalizedUrl = normalizeUrl(url);
          if (!validateUrl(normalizedUrl)) {
            return;
          }

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
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, normalizedUrl);
        } else {
          // Prompt for URL if not provided
          const linkUrl = prompt("Enter URL:");
          if (linkUrl) {
            const normalizedUrl = normalizeUrl(linkUrl);
            if (!validateUrl(normalizedUrl)) {
              return;
            }

            editor.dispatchCommand(TOGGLE_LINK_COMMAND, normalizedUrl);
          }
        }
      },

      updateLink: (url: string, rel?: string, target?: string): boolean => {
        const normalizedUrl = normalizeUrl(url);
        if (!validateUrl(normalizedUrl)) {
          return false;
        }

        let didUpdate = false;
        editor.update(() => {
          const linkNode = this.getSelectedLinkNode() ?? this.getCachedLinkNode();
          if (linkNode) {
            applyLinkAttributes(linkNode, normalizedUrl, rel, target);
            this.lastSelectedLinkNodeKey = linkNode.getKey();
            didUpdate = true;
            return;
          }

          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            didUpdate = false;
            return;
          }

          editor.dispatchCommand(TOGGLE_LINK_COMMAND, {
            url: normalizedUrl,
            rel: typeof rel === "undefined" ? null : rel.trim() || null,
            target: typeof target === "undefined" ? null : target.trim() || null,
          });
          didUpdate = true;
        });

        return didUpdate;
      },

      removeLink: () => {
        let removed = false;
        editor.update(() => {
          const linkNode = this.getSelectedLinkNode() ?? this.getCachedLinkNode();
          if (linkNode) {
            const children = linkNode.getChildren();
            for (const child of children) {
              linkNode.insertBefore(child);
            }
            linkNode.remove();
            this.lastSelectedLinkNodeKey = null;
            removed = true;
            return;
          }

          editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
        });

        if (!removed) {
          this.lastSelectedLinkNodeKey = null;
        }
      },

      getCurrentLink: () =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const linkNode = this.getSelectedLinkNode() ?? this.getCachedLinkNode();
            if (!linkNode) {
              resolve(null);
              return;
            }

            resolve(this.serializeLinkNode(linkNode));
          });
        }),

      getLinkByKey: (linkNodeKey: string) =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const linkNode = this.getLinkNodeByKey(linkNodeKey);
            if (!linkNode) {
              resolve(null);
              return;
            }

            resolve(this.serializeLinkNode(linkNode));
          });
        }),

      updateLinkByKey: (
        linkNodeKey: string,
        url: string,
        rel?: string,
        target?: string,
      ): boolean => {
        const normalizedUrl = normalizeUrl(url);
        if (!validateUrl(normalizedUrl)) {
          return false;
        }

        let didUpdate = false;
        editor.update(() => {
          const linkNode = this.getLinkNodeByKey(linkNodeKey);
          if (!linkNode) {
            didUpdate = false;
            return;
          }

          applyLinkAttributes(linkNode, normalizedUrl, rel, target);
          this.lastSelectedLinkNodeKey = linkNode.getKey();
          didUpdate = true;
        });

        return didUpdate;
      },

      removeLinkByKey: (linkNodeKey: string): boolean => {
        let didRemove = false;
        editor.update(() => {
          const linkNode = this.getLinkNodeByKey(linkNodeKey);
          if (!linkNode) {
            didRemove = false;
            return;
          }

          this.removeLinkNode(linkNode);
          this.lastSelectedLinkNodeKey = null;
          didRemove = true;
        });

        return didRemove;
      },
    };
  }

  private serializeLinkNode(linkNode: LinkNode): {
    url: string;
    rel: string | null;
    target: string | null;
  } {
    return {
      url: linkNode.getURL(),
      rel: linkNode.getRel(),
      target: linkNode.getTarget(),
    };
  }

  private removeLinkNode(linkNode: LinkNode): void {
    const children = linkNode.getChildren();
    for (const child of children) {
      linkNode.insertBefore(child);
    }
    linkNode.remove();
  }

  private getLinkNodeByKey(linkNodeKey: string): LinkNode | null {
    const normalizedKey = linkNodeKey.trim();
    if (!normalizedKey) {
      return null;
    }

    const node = $getNodeByKey(normalizedKey);
    if (!$isLinkNode(node)) {
      return null;
    }

    return node;
  }

  private getSelectedLinkNode(): LinkNode | null {
    const selection = $getSelection();
    if (!selection || !$isRangeSelection(selection)) {
      return null;
    }

    const anchorNode = selection.anchor.getNode();
    const focusNode = selection.focus.getNode();
    const nodes = selection.getNodes();
    const candidates: LexicalNode[] = [anchorNode, focusNode, ...nodes];

    for (const candidate of candidates) {
      if ($isLinkNode(candidate)) {
        return candidate;
      }

      const parent = candidate.getParent();
      if (parent && $isLinkNode(parent)) {
        return parent;
      }
    }

    return null;
  }

  private getCachedLinkNode(): LinkNode | null {
    if (!this.lastSelectedLinkNodeKey) {
      return null;
    }

    const node = $getNodeByKey(this.lastSelectedLinkNodeKey);
    if ($isLinkNode(node)) {
      return node;
    }

    this.lastSelectedLinkNodeKey = null;
    return null;
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

