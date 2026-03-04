import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
  $getListDepth,
} from "@lexical/list";
import {
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  INDENT_CONTENT_COMMAND,
  KEY_SPACE_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  $isParagraphNode,
  $getRoot,
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { ReactNode } from "react";
import { LexicalEditor, $getSelection, $isRangeSelection, $createParagraphNode } from "lexical";
import { BaseExtension } from "@lyfie/luthor-headless/extensions/base";
import { ExtensionCategory } from "@lyfie/luthor-headless/extensions/types";
import { ListNode, ListItemNode, $isListNode, $isListItemNode } from "@lexical/list";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { $isTextNode, type TextNode } from "lexical";

const DEFAULT_MAX_LIST_DEPTH = 9;

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
  "arrow-diamond-disc": ['"\u25b8"', '"\u25c6"', "disc"],
  "square-square-square": ["square", "square", "square"],
  "arrow-circle-square": ['"\u25b8"', "circle", "square"],
} as const;

type OrderedListPattern = keyof typeof ORDERED_LIST_PATTERNS;
type UnorderedListPattern = keyof typeof UNORDERED_LIST_PATTERNS;

type OrderedListSuffix = "dot" | "paren";
type CheckListVariant = "strikethrough" | "plain";
type ListType = "bullet" | "number" | "check";

const DEFAULT_ORDERED_PATTERN: OrderedListPattern = "decimal-alpha-roman";
const DEFAULT_UNORDERED_PATTERN: UnorderedListPattern = "disc-circle-square";
const CHECKLIST_VARIANT_TOKEN = "--luthor-checklist-variant";
const UNORDERED_PATTERN_TOKEN = "--luthor-unordered-pattern";
const UNORDERED_PATTERN_TEXT_TOKEN = "--luthor-unordered-pattern-token";
const UNORDERED_MARKER_KIND_TOKEN = "--luthor-unordered-marker-kind";

const LEGACY_UNORDERED_PATTERN_ALIAS: Record<string, UnorderedListPattern> = {
  "disc-arrow-square": "arrow-circle-square",
  "square-circle-disc": "disc-circle-square",
  "arrow-diamond-square": "arrow-diamond-disc",
  "star-circle-square": "disc-circle-square",
};

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

function setStyleEntries(
  node: {
    getStyle: () => string;
    setStyle: (style: string) => unknown;
  },
  entries: Record<string, string | null>,
): void {
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

function readStyleValue(
  node: {
    getStyle: () => string;
  },
  key: string,
): string | null {
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

function resolveUnorderedPatternToken(rawPattern: string | null): UnorderedListPattern {
  if (rawPattern && Object.hasOwn(UNORDERED_LIST_PATTERNS, rawPattern)) {
    return rawPattern as UnorderedListPattern;
  }

  if (rawPattern && Object.hasOwn(LEGACY_UNORDERED_PATTERN_ALIAS, rawPattern)) {
    return LEGACY_UNORDERED_PATTERN_ALIAS[rawPattern] ?? DEFAULT_UNORDERED_PATTERN;
  }

  return DEFAULT_UNORDERED_PATTERN;
}

function isCustomMarkerStyle(markerStyle: string): boolean {
  return markerStyle.startsWith('"') && markerStyle.endsWith('"');
}

type UnorderedMarkerKind = "disc" | "circle" | "square" | "arrow" | "diamond";

function resolveUnorderedMarkerKind(markerStyle: string): UnorderedMarkerKind {
  if (isCustomMarkerStyle(markerStyle)) {
    const normalized = markerStyle.toLowerCase();
    const literalMarker = normalized.slice(1, -1);
    if (normalized.includes("\\25c6") || literalMarker === "\u25c6") {
      return "diamond";
    }
    if (
      normalized.includes("\\25b8") ||
      normalized.includes("\\27a4") ||
      literalMarker === "\u25b8" ||
      literalMarker === "\u27a4"
    ) {
      return "arrow";
    }
    return "arrow";
  }

  switch (markerStyle) {
    case "disc":
      return "disc";
    case "circle":
      return "circle";
    case "square":
      return "square";
    default:
      return "disc";
  }
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

  const upperRomanMatch = normalized.match(/^([IVXLCDMivxlcdm]+)([.)])$/);
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

function isSelectionAtMaxListDepth(selection: any, maxListDepth: number): boolean {
  const listNode = findNearestListNode(selection.anchor.getNode());
  if (!listNode) return false;
  return $getListDepth(listNode) >= maxListDepth;
}

function collectListItemContentTextNodes(listItemNode: ListItemNode): TextNode[] {
  const textNodes: TextNode[] = [];
  const queue = [...listItemNode.getChildren()];

  while (queue.length > 0) {
    const node = queue.shift() as any;
    if ($isListNode(node)) {
      continue;
    }
    if ($isTextNode(node)) {
      textNodes.push(node);
      continue;
    }
    if (typeof node.getChildren === "function") {
      queue.push(...node.getChildren());
    }
  }

  return textNodes;
}

function collectNestedListsFromListItem(listItemNode: ListItemNode): ListNode[] {
  const nestedLists: ListNode[] = [];
  const queue = [...listItemNode.getChildren()];

  while (queue.length > 0) {
    const node = queue.shift() as any;
    if ($isListNode(node)) {
      nestedLists.push(node);
      // Stop here so each list node is traversed by the outer stack exactly once.
      continue;
    }
    if (typeof node.getChildren === "function") {
      queue.push(...node.getChildren());
    }
  }
  return nestedLists;
}

function shouldRenderUnorderedMarker(listItemNode: ListItemNode): boolean {
  // Hide marker for structural wrapper items that only exist to hold nested lists.
  // Empty paragraph wrappers should not produce their own marker.
  let hasVisibleContent = false;
  const queue = [...listItemNode.getChildren()];

  while (queue.length > 0) {
    const node = queue.shift() as any;
    if ($isListNode(node)) {
      continue;
    }
    if ($isTextNode(node) && node.getTextContent().trim().length > 0) {
      hasVisibleContent = true;
      break;
    }
    if (typeof node.getChildren === "function") {
      queue.push(...node.getChildren());
    }
  }

  if (hasVisibleContent) {
    return true;
  }

  return collectNestedListsFromListItem(listItemNode).length === 0;
}

function setUnorderedPatternTokenOnListItemContent(
  listItemNode: ListItemNode,
  pattern: UnorderedListPattern | null,
): void {
  const queue = [...listItemNode.getChildren()];
  while (queue.length > 0) {
    const node = queue.shift() as any;
    if ($isListNode(node)) {
      continue;
    }
    if (typeof node.getStyle === "function" && typeof node.setStyle === "function") {
      setStyleEntries(node, {
        [UNORDERED_PATTERN_TEXT_TOKEN]: pattern,
      });
    }
    if (typeof node.getChildren === "function") {
      queue.push(...node.getChildren());
    }
  }
}

function readUnorderedPatternTokenFromListItemContent(
  listItemNode: ListItemNode,
): UnorderedListPattern | null {
  const queue = [...listItemNode.getChildren()];
  while (queue.length > 0) {
    const node = queue.shift() as any;
    if ($isListNode(node)) {
      continue;
    }
    if (typeof node.getStyle === "function") {
      const token = readStyleValue(node, UNORDERED_PATTERN_TEXT_TOKEN);
      if (token) {
        return resolveUnorderedPatternToken(token);
      }
    }
    if (typeof node.getChildren === "function") {
      queue.push(...node.getChildren());
    }
  }

  return null;
}

function readChecklistVariantFromListItems(topListNode: ListNode): CheckListVariant | null {
  const stack: ListNode[] = [topListNode];
  while (stack.length > 0) {
    const node = stack.pop() as ListNode;
    if (node.getListType() !== "check") {
      continue;
    }

    for (const child of node.getChildren()) {
      if (!$isListItemNode(child)) continue;

      const textNodes = collectListItemContentTextNodes(child);
      for (const textNode of textNodes) {
        const token = readStyleValue(textNode, CHECKLIST_VARIANT_TOKEN);
        if (token === "plain") {
          return "plain";
        }
      }

      stack.push(...collectNestedListsFromListItem(child));
    }
  }

  return null;
}

function readUnorderedPatternFromListItems(topListNode: ListNode): UnorderedListPattern | null {
  const stack: ListNode[] = [topListNode];
  while (stack.length > 0) {
    const node = stack.pop() as ListNode;
    if (node.getListType() !== "bullet") {
      continue;
    }

    for (const child of node.getChildren()) {
      if (!$isListItemNode(child)) continue;

      const token = readStyleValue(child, UNORDERED_PATTERN_TOKEN);
      const pattern = resolveUnorderedPatternToken(token);
      if (token && Object.hasOwn(UNORDERED_LIST_PATTERNS, pattern)) {
        return pattern;
      }

      const contentPattern = readUnorderedPatternTokenFromListItemContent(child);
      if (contentPattern) {
        return contentPattern;
      }

      stack.push(...collectNestedListsFromListItem(child));
    }
  }

  return null;
}

function resolveUnorderedPattern(topListNode: ListNode): UnorderedListPattern {
  const itemPattern = readUnorderedPatternFromListItems(topListNode);
  if (itemPattern) {
    return itemPattern;
  }

  const listStyleToken = readStyleValue(topListNode, UNORDERED_PATTERN_TOKEN);
  return resolveUnorderedPatternToken(listStyleToken);
}

function resolveCheckListVariant(topListNode: ListNode): CheckListVariant {
  const listStyleToken = readStyleValue(topListNode, CHECKLIST_VARIANT_TOKEN);
  if (listStyleToken === "plain") {
    return "plain";
  }

  const itemToken = readChecklistVariantFromListItems(topListNode);
  return itemToken ?? "strikethrough";
}

type ListSelectionContext = {
  listNode: ListNode | null;
  listItemNode: ListItemNode | null;
  topListNode: ListNode | null;
};

function getSelectionListContext(selection: any): ListSelectionContext {
  let current = selection.anchor.getNode();
  let listNode: ListNode | null = null;
  let listItemNode: ListItemNode | null = null;

  while (current) {
    if (!listItemNode && $isListItemNode(current)) {
      listItemNode = current;
    }
    if ($isListNode(current)) {
      listNode = current;
      break;
    }
    current = current.getParent();
  }

  const topListNode = listNode ? findTopListNode(listNode) : null;
  return { listNode, listItemNode, topListNode };
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
  /** Rebuild list style tokens after state import/rehydration */
  rehydrateListStyles: () => void;
};

export type ListExtensionConfig = {
  /** Maximum lexical list depth including the top-level list. */
  maxDepth?: number;
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
  ListExtensionConfig,
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
  constructor(config: ListExtensionConfig = {}) {
    super("list", [ExtensionCategory.Toolbar]);
    this.config = config;
  }

  private getMaxListDepth(): number {
    const configured = this.config.maxDepth;
    if (!Number.isFinite(configured)) {
      return DEFAULT_MAX_LIST_DEPTH;
    }
    const normalized = Math.floor(configured as number);
    return normalized >= 1 ? normalized : DEFAULT_MAX_LIST_DEPTH;
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
    const unregisterListItemStyleTransform = editor.registerNodeTransform(
      ListItemNode,
      (node) => {
        const parent = node.getParent();
        if ($isListNode(parent)) {
          this.syncListNodeStyles(parent);
        }
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
      COMMAND_PRIORITY_EDITOR,
    );

    return () => {
      unregisterListStyleTransform();
      unregisterListItemStyleTransform();
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
          if (!$isRangeSelection(selection)) {
            return;
          }

          const context = getSelectionListContext(selection);
          if (context.topListNode) {
            if (context.topListNode.getListType() === "bullet") {
              if (context.listItemNode && context.listItemNode.getIndent() > 0) {
                editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
              } else {
                $setBlocksType(selection, $createParagraphNode);
              }
              return;
            }

            this.convertTopListType(context.topListNode, "bullet");
            return;
          }

          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        });
      },
      toggleOrderedList: () => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return;
          }

          const context = getSelectionListContext(selection);
          if (context.topListNode) {
            if (context.topListNode.getListType() === "number") {
              if (context.listItemNode && context.listItemNode.getIndent() > 0) {
                editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
              } else {
                $setBlocksType(selection, $createParagraphNode);
              }
              return;
            }

            this.convertTopListType(context.topListNode, "number");
            return;
          }

          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        });
      },
      toggleCheckList: () => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return;
          }

          const context = getSelectionListContext(selection);
          if (context.topListNode) {
            if (context.topListNode.getListType() === "check") {
              if (context.listItemNode && context.listItemNode.getIndent() > 0) {
                editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
              } else {
                $setBlocksType(selection, $createParagraphNode);
              }
              return;
            }

            this.convertTopListType(context.topListNode, "check");
            return;
          }

          editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
        });
      },
      indentList: () => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return;
          }

          if (isSelectionAtMaxListDepth(selection, this.getMaxListDepth())) {
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
          if (
            !$isRangeSelection(selection) ||
            isSelectionAtMaxListDepth(selection, this.getMaxListDepth())
          ) {
            return;
          }
          editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        });
      },
      insertNestedOrderedList: () => {
        editor.update(() => {
          const selection = $getSelection();
          if (
            !$isRangeSelection(selection) ||
            isSelectionAtMaxListDepth(selection, this.getMaxListDepth())
          ) {
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

          const activeSelection = $getSelection();
          if (!$isRangeSelection(activeSelection)) {
            return;
          }

          const topListNodes = collectSelectedTopListNodes(activeSelection);
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

          const activeSelection = $getSelection();
          if (!$isRangeSelection(activeSelection)) {
            return;
          }

          const topListNodes = collectSelectedTopListNodes(activeSelection);
          for (const topListNode of topListNodes) {
            this.applyUnorderedPattern(topListNode, pattern);
          }
        });
      },
      setCheckListVariant: (variant) => {
        let shouldInsertChecklist = false;

        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return;
          }

          const topListNodes = collectSelectedTopListNodes(selection);
          if (topListNodes.length === 0) {
            shouldInsertChecklist = true;
            return;
          }

          for (const topListNode of topListNodes) {
            if (topListNode.getListType() !== "check") {
              this.convertTopListType(topListNode, "check");
            }
            this.applyCheckListVariant(topListNode, variant);
          }
        });

        if (!shouldInsertChecklist) {
          return;
        }

        editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
        editor.update(() => {
          const activeSelection = $getSelection();
          if (!$isRangeSelection(activeSelection)) {
            return;
          }

          const topListNodes = collectSelectedTopListNodes(activeSelection);
          for (const topListNode of topListNodes) {
            if (topListNode.getListType() !== "check") {
              this.convertTopListType(topListNode, "check");
            }
            this.applyCheckListVariant(topListNode, variant);
          }
        });
      },
      rehydrateListStyles: () => {
        editor.update(() => {
          const root = $getRoot();
          const queue = [...root.getChildren()];
          const topListNodes = new Map<string, ListNode>();

          while (queue.length > 0) {
            const node = queue.shift() as any;
            if ($isListNode(node)) {
              const top = findTopListNode(node);
              topListNodes.set(top.getKey(), top);
            }
            if (typeof node.getChildren === "function") {
              queue.push(...node.getChildren());
            }
          }

          for (const topListNode of topListNodes.values()) {
            if (topListNode.getListType() === "number") {
              const pattern = (readStyleValue(topListNode, "--luthor-ordered-pattern") ??
                DEFAULT_ORDERED_PATTERN) as OrderedListPattern;
              const safePattern = Object.hasOwn(ORDERED_LIST_PATTERNS, pattern)
                ? pattern
                : DEFAULT_ORDERED_PATTERN;
              const suffix = readStyleValue(topListNode, "--luthor-ordered-suffix") === "paren"
                ? "paren"
                : "dot";
              this.applyOrderedPattern(topListNode, safePattern);
              this.applyOrderedSuffix(topListNode, suffix);
              continue;
            }

            if (topListNode.getListType() === "bullet") {
              const pattern = resolveUnorderedPattern(topListNode);
              this.applyUnorderedPattern(topListNode, pattern);
              continue;
            }

            if (topListNode.getListType() === "check") {
              const variant = resolveCheckListVariant(topListNode);
              this.applyCheckListVariant(topListNode, variant);
            }
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
        stack.push(...collectNestedListsFromListItem(child));
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
        stack.push(...collectNestedListsFromListItem(child));
      }
    }
  }

  private applyUnorderedPattern(topListNode: ListNode, pattern: UnorderedListPattern): void {
    if (topListNode.getListType() !== "bullet") {
      return;
    }

    const sequence = UNORDERED_LIST_PATTERNS[pattern];
    setStyleEntries(topListNode, {
      [UNORDERED_PATTERN_TOKEN]: pattern,
    });

    const stack: ListNode[] = [topListNode];
    while (stack.length > 0) {
      const node = stack.pop() as ListNode;
      if (node.getListType() !== "bullet") {
        continue;
      }

      const depth = getListDepthWithinRoot(node, topListNode);
      const markerStyle = resolveMarkerStyle(sequence, depth);
      const markerKind = resolveUnorderedMarkerKind(markerStyle);

      setStyleEntries(node, {
        [UNORDERED_PATTERN_TOKEN]: pattern,
        "list-style-type": "none",
        "--luthor-unordered-marker-content": null,
        [UNORDERED_MARKER_KIND_TOKEN]: null,
      });

      for (const child of node.getChildren()) {
        if (!$isListItemNode(child)) continue;
        setStyleEntries(child, {
          [UNORDERED_PATTERN_TOKEN]: pattern,
          "--luthor-unordered-marker-content": null,
          [UNORDERED_MARKER_KIND_TOKEN]: shouldRenderUnorderedMarker(child)
            ? markerKind
            : null,
        });
        setUnorderedPatternTokenOnListItemContent(child, pattern);
        stack.push(...collectNestedListsFromListItem(child));
      }
    }
  }

  private applyCheckListVariant(topListNode: ListNode, variant: CheckListVariant): void {
    if (topListNode.getListType() !== "check") {
      return;
    }

    const stack: ListNode[] = [topListNode];
    while (stack.length > 0) {
      const node = stack.pop() as ListNode;
      if (node.getListType() !== "check") {
        continue;
      }

      setStyleEntries(node, {
        "--luthor-checklist-variant": variant,
        "--luthor-unordered-marker-content": null,
        [UNORDERED_MARKER_KIND_TOKEN]: null,
        "--luthor-unordered-pattern": null,
        "--luthor-ordered-pattern": null,
        "--luthor-ordered-suffix": null,
        "list-style-type": null,
      });

      for (const child of node.getChildren()) {
        if (!$isListItemNode(child)) continue;
        setStyleEntries(child, {
          "--luthor-checklist-variant": variant,
          [UNORDERED_PATTERN_TOKEN]: null,
          "--luthor-unordered-marker-content": null,
          [UNORDERED_MARKER_KIND_TOKEN]: null,
        });
        setUnorderedPatternTokenOnListItemContent(child, null);
        const textNodes = collectListItemContentTextNodes(child);
        for (const textNode of textNodes) {
          setStyleEntries(textNode, {
            [CHECKLIST_VARIANT_TOKEN]: variant === "plain" ? "plain" : null,
          });
        }
        stack.push(...collectNestedListsFromListItem(child));
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
      const pattern = resolveUnorderedPattern(topListNode);

      const sequence = UNORDERED_LIST_PATTERNS[pattern];
      const depth = getListDepthWithinRoot(node, topListNode);
      const markerStyle = resolveMarkerStyle(sequence, depth);
      const markerKind = resolveUnorderedMarkerKind(markerStyle);

      setStyleEntries(node, {
        [UNORDERED_PATTERN_TOKEN]: pattern,
        "list-style-type": "none",
        "--luthor-unordered-marker-content": null,
        [UNORDERED_MARKER_KIND_TOKEN]: null,
      });

      for (const child of node.getChildren()) {
        if (!$isListItemNode(child)) continue;
        setStyleEntries(child, {
          [UNORDERED_PATTERN_TOKEN]: pattern,
          "--luthor-unordered-marker-content": null,
          [UNORDERED_MARKER_KIND_TOKEN]: shouldRenderUnorderedMarker(child)
            ? markerKind
            : null,
        });
        setUnorderedPatternTokenOnListItemContent(child, pattern);
      }
      return;
    }

    if (topListNode.getListType() === "check") {
      const variant = resolveCheckListVariant(topListNode);
      setStyleEntries(node, {
        "--luthor-checklist-variant": variant,
        "--luthor-unordered-marker-content": null,
        [UNORDERED_MARKER_KIND_TOKEN]: null,
        "--luthor-unordered-pattern": null,
        "--luthor-ordered-pattern": null,
        "--luthor-ordered-suffix": null,
        "list-style-type": null,
      });

      for (const child of node.getChildren()) {
        if (!$isListItemNode(child)) continue;
        setStyleEntries(child, {
          "--luthor-checklist-variant": variant,
          [UNORDERED_PATTERN_TOKEN]: null,
          "--luthor-unordered-marker-content": null,
          [UNORDERED_MARKER_KIND_TOKEN]: null,
        });
        const textNodes = collectListItemContentTextNodes(child);
        for (const textNode of textNodes) {
          setStyleEntries(textNode, {
            [CHECKLIST_VARIANT_TOKEN]: variant === "plain" ? "plain" : null,
          });
        }
      }
    }
  }

  private convertTopListType(topListNode: ListNode, nextType: ListType): void {
    const stack: ListNode[] = [topListNode];
    while (stack.length > 0) {
      const node = stack.pop() as ListNode;
      node.setListType(nextType);

      for (const child of node.getChildren()) {
        if (!$isListItemNode(child)) continue;
        stack.push(...collectNestedListsFromListItem(child));
      }
    }

    if (nextType === "number") {
      const rawPattern = readStyleValue(topListNode, "--luthor-ordered-pattern");
      const pattern = rawPattern && Object.hasOwn(ORDERED_LIST_PATTERNS, rawPattern)
        ? (rawPattern as OrderedListPattern)
        : DEFAULT_ORDERED_PATTERN;
      const suffix = readStyleValue(topListNode, "--luthor-ordered-suffix") === "paren"
        ? "paren"
        : "dot";
      this.applyOrderedPattern(topListNode, pattern);
      this.applyOrderedSuffix(topListNode, suffix);
      return;
    }

    if (nextType === "bullet") {
      const pattern = resolveUnorderedPattern(topListNode);
      this.applyUnorderedPattern(topListNode, pattern);
      return;
    }

    const variant = resolveCheckListVariant(topListNode);
    this.applyCheckListVariant(topListNode, variant);
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

export const __TEST_ONLY_LIST_INTERNALS = {
  resolveUnorderedPatternToken,
  resolveUnorderedMarkerKind,
  unorderedPatternKeys: Object.keys(UNORDERED_LIST_PATTERNS),
} as const;

