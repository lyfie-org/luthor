import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
  $getListDepth,
} from "@lexical/list";
import {
  COMMAND_PRIORITY_LOW,
  INDENT_CONTENT_COMMAND,
  KEY_SPACE_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  $isParagraphNode,
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { ReactNode } from "react";
import { LexicalEditor, $getSelection, $isRangeSelection, $createParagraphNode } from "lexical";
import { BaseExtension } from "@lyfie/luthor-headless/extensions/base";
import { ExtensionCategory } from "@lyfie/luthor-headless/extensions/types";
import { ListNode, ListItemNode, $isListNode, $isListItemNode } from "@lexical/list";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";

const MAX_LIST_DEPTH = 9;

const ORDERED_LIST_PATTERNS = {
  "decimal-alpha-roman": ["decimal", "lower-alpha", "lower-roman"],
  "decimal-hierarchical": ["decimal"],
  "upper-roman-upper-alpha": [
    "upper-roman",
    "upper-alpha",
    "decimal",
    "lower-alpha",
    "decimal",
    "lower-alpha",
    "lower-roman",
    "lower-alpha",
    "lower-roman",
  ],
  "upper-alpha-lower-alpha": [
    "upper-alpha",
    "lower-alpha",
    "lower-roman",
    "decimal",
    "lower-alpha",
    "lower-roman",
    "decimal",
    "lower-alpha",
    "lower-roman",
  ],
  "decimal-leading-zero-alpha": [
    "decimal-leading-zero",
    "lower-alpha",
    "lower-roman",
    "decimal",
    "lower-alpha",
    "lower-roman",
    "decimal",
    "lower-alpha",
    "lower-roman",
  ],
} as const;

const UNORDERED_LIST_PATTERNS = {
  "disc-circle-square": ["disc", "circle", "square"],
  "disc-arrow-square": ["disc", '"\u27a4"', "square"],
  "square-circle-disc": ["square", "circle", "disc"],
  "arrow-diamond-square": ['"\u27a4"', '"\u25c6"', "square"],
  "star-circle-square": ['"\u2605"', "circle", "square"],
  "arrow-circle-square": ['"\u27a4"', "circle", "square"],
} as const;

type OrderedListPattern = keyof typeof ORDERED_LIST_PATTERNS;
type UnorderedListPattern = keyof typeof UNORDERED_LIST_PATTERNS;

type OrderedListSuffix = "dot" | "paren";
type CheckListVariant = "strikethrough" | "plain";

const DEFAULT_ORDERED_PATTERN: OrderedListPattern = "decimal-alpha-roman";
const DEFAULT_UNORDERED_PATTERN: UnorderedListPattern = "disc-circle-square";

function parseInlineStyle(styleText: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const part of styleText.split(";")) {
    const item = part.trim();
    if (!item) continue;
    const index = item.indexOf(":");
    if (index <= 0) continue;
    const key = item.slice(0, index).trim();
    const value = item.slice(index + 1).trim();
    if (!key) continue;
    map.set(key, value);
  }
  return map;
}

function stringifyInlineStyle(styleMap: Map<string, string>): string {
  return Array.from(styleMap.entries())
    .map(([key, value]) => `${key}: ${value}`)
    .join("; ");
}

function setStyleEntries(node: ListNode, entries: Record<string, string | null>): void {
  const currentStyle = node.getStyle();
  const styleMap = parseInlineStyle(currentStyle);
  let changed = false;

  for (const [key, value] of Object.entries(entries)) {
    const existingValue = styleMap.get(key);
    if (value === null || value === "") {
      if (styleMap.delete(key)) {
        changed = true;
      }
      continue;
    }

    if (existingValue !== value) {
      styleMap.set(key, value);
      changed = true;
    }
  }

  if (!changed) {
    return;
  }

  node.setStyle(stringifyInlineStyle(styleMap));
}

function readStyleValue(node: ListNode, key: string): string | null {
  const styleMap = parseInlineStyle(node.getStyle());
  return styleMap.get(key) ?? null;
}

function findNearestListNode(node: any): ListNode | null {
  let current = node;
  while (current) {
    if ($isListNode(current)) {
      return current;
    }
    current = current.getParent();
  }
  return null;
}

function findTopListNode(node: ListNode): ListNode {
  let current = node;
  while (true) {
    const parent = current.getParent();
    if (!$isListItemNode(parent)) {
      return current;
    }
    const parentList = parent.getParent();
    if (!$isListNode(parentList)) {
      return current;
    }
    current = parentList;
  }
}

function getListDepthWithinRoot(node: ListNode, topListNode: ListNode): number {
  const absolute = $getListDepth(node);
  const topAbsolute = $getListDepth(topListNode);
  return absolute - topAbsolute;
}

function resolveMarkerStyle(sequence: readonly string[], depth: number): string {
  const index = depth % sequence.length;
  return sequence[index] ?? sequence[0] ?? "disc";
}

function isCustomMarkerStyle(markerStyle: string): boolean {
  return markerStyle.startsWith('"') && markerStyle.endsWith('"');
}

function parseOrderedListShortcut(text: string): {
  pattern: OrderedListPattern;
  suffix: OrderedListSuffix;
} | null {
  const normalized = text.trim();
  if (!normalized) {
    return null;
  }

  const numericMatch = normalized.match(/^(\d+)([.)])$/);
  if (numericMatch) {
    const numberToken = numericMatch[1] ?? "";
    const suffixToken = numericMatch[2] ?? ".";
    return {
      pattern:
        numberToken.length > 1 && numberToken.startsWith("0")
          ? "decimal-leading-zero-alpha"
          : "decimal-alpha-roman",
      suffix: suffixToken === ")" ? "paren" : "dot",
    };
  }

  const upperRomanMatch = normalized.match(/^([IVXLCDM]+)([.)])$/);
  if (upperRomanMatch) {
    const suffixToken = upperRomanMatch[2] ?? ".";
    return {
      pattern: "upper-roman-upper-alpha",
      suffix: suffixToken === ")" ? "paren" : "dot",
    };
  }

  const upperAlphaMatch = normalized.match(/^([A-Z]+)([.)])$/);
  if (upperAlphaMatch) {
    const suffixToken = upperAlphaMatch[2] ?? ".";
    return {
      pattern: "upper-alpha-lower-alpha",
      suffix: suffixToken === ")" ? "paren" : "dot",
    };
  }

  return null;
}

function collectSelectedTopListNodes(selection: any): ListNode[] {
  const map = new Map<string, ListNode>();
  const nodes = selection.getNodes();

  for (const node of nodes) {
    const listNode = findNearestListNode(node);
    if (!listNode) continue;
    const topListNode = findTopListNode(listNode);
    map.set(topListNode.getKey(), topListNode);
  }

  if (map.size === 0) {
    const anchorList = findNearestListNode(selection.anchor.getNode());
    if (anchorList) {
      const topListNode = findTopListNode(anchorList);
      map.set(topListNode.getKey(), topListNode);
    }
  }

  return [...map.values()];
}

function isSelectionAtMaxListDepth(selection: any): boolean {
  const listNode = findNearestListNode(selection.anchor.getNode());
  if (!listNode) return false;
  return $getListDepth(listNode) >= MAX_LIST_DEPTH;
}

/**
 * Commands exposed by the list extension.
 */
export type ListCommands = {
  /** Toggle a bullet list for the current selection */
  toggleUnorderedList: () => void;
  /** Toggle a numbered list for the current selection */
  toggleOrderedList: () => void;
  /** Toggle a checklist for the current selection */
  toggleCheckList: () => void;
  /** Indent the current list item (nest deeper) */
  indentList: () => void;
  /** Outdent the current list item (unnest) */
  outdentList: () => void;
  /** Create a nested bullet list at the current selection */
  insertNestedUnorderedList: () => void;
  /** Create a nested numbered list at the current selection */
  insertNestedOrderedList: () => void;
  /** Apply an ordered list pattern to the selected list tree */
  setOrderedListPattern: (pattern: OrderedListPattern) => void;
  /** Toggle ordered list marker suffix between "1." and "1)" */
  setOrderedListSuffix: (suffix: OrderedListSuffix) => void;
  /** Apply an unordered list marker pattern to the selected list tree */
  setUnorderedListPattern: (pattern: UnorderedListPattern) => void;
  /** Switch checklist behavior between strike and plain text */
  setCheckListVariant: (variant: CheckListVariant) => void;
};

/**
 * List extension for managing ordered and unordered lists.
 * Provides functionality to convert paragraphs to lists and vice versa.
 *
 * @example
 * ```tsx
 * const extensions = [listExtension] as const;
 * const { Provider, useEditor } = createEditorSystem<typeof extensions>();
 *
 * function MyEditor() {
 *   const { commands, activeStates } = useEditor();
 *   return (
 *     <div>
 *       <button
 *         onClick={() => commands.toggleUnorderedList()}
 *         className={activeStates.unorderedList ? 'active' : ''}
 *       >
 *         Bullet List
 *       </button>
 *       <button
 *         onClick={() => commands.toggleOrderedList()}
 *         className={activeStates.orderedList ? 'active' : ''}
 *       >
 *         Numbered List
 *       </button>
 *       <button onClick={() => commands.indentList()}>Indent</button>
 *       <button onClick={() => commands.outdentList()}>Outdent</button>
 *       <button onClick={() => commands.insertNestedUnorderedList()}>Nested Bullet</button>
 *       <button onClick={() => commands.insertNestedOrderedList()}>Nested Numbered</button>
 *     </div>
 *   );
 * }
 * ```
 */
export class ListExtension extends BaseExtension<
  "list",
  any,
  ListCommands,
  {
    unorderedList: () => Promise<boolean>;
    orderedList: () => Promise<boolean>;
    checkList: () => Promise<boolean>;
  },
  ReactNode[]
> {
  /**
   * Creates a new list extension instance.
   */
  constructor() {
    super("list", [ExtensionCategory.Toolbar]);
  }

  /**
   * Registers the extension with Lexical.
   * No special registration needed because Lexical handles list commands.
   *
   * @param editor - Lexical editor instance
   * @returns Cleanup function (no-op for lists)
   */
  register(editor: LexicalEditor): () => void {
    const unregisterListStyleTransform = editor.registerNodeTransform(
      ListNode,
      (node) => {
        this.syncListNodeStyles(node);
      },
    );

    const unregisterOrderedShortcut = editor.registerCommand<KeyboardEvent>(
      KEY_SPACE_COMMAND,
      (event) => {
        let handled = false;
        editor.update(() => {
          handled = this.handleOrderedListShortcut(editor);
        });

        if (handled) {
          event.preventDefault();
        }

        return handled;
      },
      COMMAND_PRIORITY_LOW,
    );

    return () => {
      unregisterListStyleTransform();
      unregisterOrderedShortcut();
    };
  }

  /**
   * Returns Lexical nodes needed for list functionality.
   *
   * @returns Array containing ListNode and ListItemNode
   */
  getNodes() {
    return [ListNode, ListItemNode];
  }

  /**
   * Returns React plugins needed for list functionality.
   *
   * @returns Array containing the ListPlugin component
   */
  getPlugins(): ReactNode[] {
    return [
      <ListPlugin key="list-plugin" hasStrictIndent />,
      <CheckListPlugin key="check-list-plugin" />,
    ];
  }

  /**
   * Returns command handlers exposed by this extension.
   *
   * @param editor - Lexical editor instance
   * @returns Object containing list toggle commands
   */
  getCommands(editor: LexicalEditor): ListCommands {
    return {
      toggleUnorderedList: () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode();
            let parent = anchorNode.getParent();
            let listNode: any = null;
            let listItemNode: any = null;
            while (parent) {
              if ($isListItemNode(parent)) {
                listItemNode = parent;
              }
              if ($isListNode(parent)) {
                listNode = parent;
                break;
              }
              parent = parent.getParent();
            }

            if (listNode) {
              if (listNode.getListType() === "bullet") {
                // If already an unordered list, check if we can outdent
                if (listItemNode && listItemNode.getIndent() > 0) {
                  // If nested, outdent instead of removing list
                  editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
                } else {
                  // If at top level, convert to paragraph
                  $setBlocksType(selection, $createParagraphNode);
                }
              } else {
                // If it's an ordered list, convert to unordered
                editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
              }
            } else {
              // No list, create unordered list
              editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
            }
          }
        });
      },
      toggleOrderedList: () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode();
            let parent = anchorNode.getParent();
            let listNode: any = null;
            let listItemNode: any = null;
            while (parent) {
              if ($isListItemNode(parent)) {
                listItemNode = parent;
              }
              if ($isListNode(parent)) {
                listNode = parent;
                break;
              }
              parent = parent.getParent();
            }

            if (listNode) {
              if (listNode.getListType() === "number") {
                // If already an ordered list, check if we can outdent
                if (listItemNode && listItemNode.getIndent() > 0) {
                  // If nested, outdent instead of removing list
                  editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
                } else {
                  // If at top level, convert to paragraph
                  $setBlocksType(selection, $createParagraphNode);
                }
              } else {
                // If it's an unordered list, convert to ordered
                editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
              }
            } else {
              // No list, create ordered list
              editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
            }
          }
        });
      },
      toggleCheckList: () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode();
            let parent = anchorNode.getParent();
            let listNode: any = null;
            let listItemNode: any = null;
            while (parent) {
              if ($isListItemNode(parent)) {
                listItemNode = parent;
              }
              if ($isListNode(parent)) {
                listNode = parent;
                break;
              }
              parent = parent.getParent();
            }

            if (listNode) {
              if (listNode.getListType() === "check") {
                if (listItemNode && listItemNode.getIndent() > 0) {
                  editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
                } else {
                  $setBlocksType(selection, $createParagraphNode);
                }
              } else {
                editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
              }
            } else {
              editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
            }
          }
        });
      },
      indentList: () => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return;
          }

          if (isSelectionAtMaxListDepth(selection)) {
            return;
          }

          editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
        });
      },
      outdentList: () => {
        editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
      },
      insertNestedUnorderedList: () => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || isSelectionAtMaxListDepth(selection)) {
            return;
          }
          editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        });
      },
      insertNestedOrderedList: () => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || isSelectionAtMaxListDepth(selection)) {
            return;
          }
          editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        });
      },
      setOrderedListPattern: (pattern) => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return;
          }

          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);

          const topListNodes = collectSelectedTopListNodes(selection);
          for (const topListNode of topListNodes) {
            this.applyOrderedPattern(topListNode, pattern);
          }
        });
      },
      setOrderedListSuffix: (suffix) => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return;
          }

          const topListNodes = collectSelectedTopListNodes(selection);
          for (const topListNode of topListNodes) {
            if (topListNode.getListType() !== "number") {
              continue;
            }

            this.applyOrderedSuffix(topListNode, suffix);
          }
        });
      },
      setUnorderedListPattern: (pattern) => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return;
          }

          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);

          const topListNodes = collectSelectedTopListNodes(selection);
          for (const topListNode of topListNodes) {
            this.applyUnorderedPattern(topListNode, pattern);
          }
        });
      },
      setCheckListVariant: (variant) => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return;
          }

          editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);

          const topListNodes = collectSelectedTopListNodes(selection);
          for (const topListNode of topListNodes) {
            if (topListNode.getListType() !== "check") {
              continue;
            }

            setStyleEntries(topListNode, {
              "--luthor-checklist-variant": variant,
            });
          }
        });
      },
    };
  }

  private applyOrderedPattern(topListNode: ListNode, pattern: OrderedListPattern): void {
    if (topListNode.getListType() !== "number") {
      return;
    }

    const sequence = ORDERED_LIST_PATTERNS[pattern];
    const suffix = readStyleValue(topListNode, "--luthor-ordered-suffix") ?? "dot";
    setStyleEntries(topListNode, {
      "--luthor-ordered-pattern": pattern,
      "--luthor-ordered-suffix": suffix,
    });

    const stack: ListNode[] = [topListNode];
    while (stack.length > 0) {
      const node = stack.pop() as ListNode;
      if (node.getListType() !== "number") {
        continue;
      }

      const depth = getListDepthWithinRoot(node, topListNode);
      const markerStyle = resolveMarkerStyle(sequence, depth);
      const hierarchical = pattern === "decimal-hierarchical";

      setStyleEntries(node, {
        "--luthor-ordered-pattern": pattern,
        "--luthor-ordered-suffix": suffix,
        "list-style-type": hierarchical ? "none" : markerStyle,
      });

      for (const child of node.getChildren()) {
        if (!$isListItemNode(child)) continue;
        const nested = child.getFirstChild();
        if ($isListNode(nested)) {
          stack.push(nested);
        }
      }
    }
  }

  private applyOrderedSuffix(topListNode: ListNode, suffix: OrderedListSuffix): void {
    const stack: ListNode[] = [topListNode];
    while (stack.length > 0) {
      const node = stack.pop() as ListNode;
      if (node.getListType() !== "number") {
        continue;
      }

      setStyleEntries(node, {
        "--luthor-ordered-suffix": suffix,
      });

      for (const child of node.getChildren()) {
        if (!$isListItemNode(child)) continue;
        const nested = child.getFirstChild();
        if ($isListNode(nested)) {
          stack.push(nested);
        }
      }
    }
  }

  private applyUnorderedPattern(topListNode: ListNode, pattern: UnorderedListPattern): void {
    if (topListNode.getListType() !== "bullet") {
      return;
    }

    const sequence = UNORDERED_LIST_PATTERNS[pattern];
    setStyleEntries(topListNode, {
      "--luthor-unordered-pattern": pattern,
    });

    const stack: ListNode[] = [topListNode];
    while (stack.length > 0) {
      const node = stack.pop() as ListNode;
      if (node.getListType() !== "bullet") {
        continue;
      }

      const depth = getListDepthWithinRoot(node, topListNode);
      const markerStyle = resolveMarkerStyle(sequence, depth);
      const customMarker = isCustomMarkerStyle(markerStyle);

      setStyleEntries(node, {
        "--luthor-unordered-pattern": pattern,
        "list-style-type": customMarker ? "none" : markerStyle,
        "--luthor-unordered-marker-content": customMarker ? markerStyle : null,
      });

      for (const child of node.getChildren()) {
        if (!$isListItemNode(child)) continue;
        const nested = child.getFirstChild();
        if ($isListNode(nested)) {
          stack.push(nested);
        }
      }
    }
  }

  private syncListNodeStyles(node: ListNode): void {
    const topListNode = findTopListNode(node);

    if (topListNode.getListType() === "number") {
      const pattern = (readStyleValue(topListNode, "--luthor-ordered-pattern") ??
        DEFAULT_ORDERED_PATTERN) as OrderedListPattern;
      if (!Object.hasOwn(ORDERED_LIST_PATTERNS, pattern)) {
        return;
      }

      const sequence = ORDERED_LIST_PATTERNS[pattern];
      const depth = getListDepthWithinRoot(node, topListNode);
      const markerStyle = resolveMarkerStyle(sequence, depth);
      const hierarchical = pattern === "decimal-hierarchical";
      const suffix = readStyleValue(topListNode, "--luthor-ordered-suffix") ?? "dot";

      setStyleEntries(node, {
        "--luthor-ordered-pattern": pattern,
        "--luthor-ordered-suffix": suffix,
        "list-style-type": hierarchical ? "none" : markerStyle,
      });
      return;
    }

    if (topListNode.getListType() === "bullet") {
      const pattern = (readStyleValue(topListNode, "--luthor-unordered-pattern") ??
        DEFAULT_UNORDERED_PATTERN) as UnorderedListPattern;
      if (!Object.hasOwn(UNORDERED_LIST_PATTERNS, pattern)) {
        return;
      }

      const sequence = UNORDERED_LIST_PATTERNS[pattern];
      const depth = getListDepthWithinRoot(node, topListNode);
      const markerStyle = resolveMarkerStyle(sequence, depth);
      const customMarker = isCustomMarkerStyle(markerStyle);

      setStyleEntries(node, {
        "--luthor-unordered-pattern": pattern,
        "list-style-type": customMarker ? "none" : markerStyle,
        "--luthor-unordered-marker-content": customMarker ? markerStyle : null,
      });
      return;
    }

    if (topListNode.getListType() === "check") {
      const variant = readStyleValue(topListNode, "--luthor-checklist-variant") ?? "strikethrough";
      setStyleEntries(node, {
        "--luthor-checklist-variant": variant,
        "--luthor-unordered-marker-content": null,
        "--luthor-unordered-pattern": null,
        "--luthor-ordered-pattern": null,
        "--luthor-ordered-suffix": null,
        "list-style-type": null,
      });
    }
  }

  private handleOrderedListShortcut(editor: LexicalEditor): boolean {
    const selection = $getSelection();
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
      return false;
    }

    const anchorNode = selection.anchor.getNode();
    if (findNearestListNode(anchorNode)) {
      return false;
    }

    let current: any = anchorNode;
    while (current && !$isParagraphNode(current)) {
      current = current.getParent();
    }
    if (!$isParagraphNode(current)) {
      return false;
    }

    const paragraph = current;
    const shortcut = parseOrderedListShortcut(paragraph.getTextContent());
    if (!shortcut) {
      return false;
    }

    paragraph.clear();
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);

    const activeSelection = $getSelection();
    if (!$isRangeSelection(activeSelection)) {
      return true;
    }

    const topListNodes = collectSelectedTopListNodes(activeSelection);
    for (const topListNode of topListNodes) {
      if (topListNode.getListType() !== "number") {
        continue;
      }
      this.applyOrderedPattern(topListNode, shortcut.pattern);
      this.applyOrderedSuffix(topListNode, shortcut.suffix);
    }

    return true;
  }

  /**
   * Returns state query functions for list state.
   *
   * @param editor - Lexical editor instance
   * @returns Object containing state query functions for list types
   */
  getStateQueries(editor: LexicalEditor): {
    unorderedList: () => Promise<boolean>;
    orderedList: () => Promise<boolean>;
    checkList: () => Promise<boolean>;
  } {
    return {
      unorderedList: () =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) {
              resolve(false);
              return;
            }
            let node: any = selection.anchor.getNode();
            while (node) {
              if ($isListNode(node)) {
                resolve(node.getListType() === "bullet");
                return;
              }
              node = node.getParent();
            }
            resolve(false);
          });
        }),
      orderedList: () =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) {
              resolve(false);
              return;
            }
            let node: any = selection.anchor.getNode();
            while (node) {
              if ($isListNode(node)) {
                resolve(node.getListType() === "number");
                return;
              }
              node = node.getParent();
            }
            resolve(false);
          });
        }),
      checkList: () =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) {
              resolve(false);
              return;
            }
            let node: any = selection.anchor.getNode();
            while (node) {
              if ($isListNode(node)) {
                resolve(node.getListType() === "check");
                return;
              }
              node = node.getParent();
            }
            resolve(false);
          });
        }),
    };
  }
}

/**
 * Preconfigured list extension instance.
 * Ready for use in extension arrays.
 */
export const listExtension = new ListExtension();

