import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
} from "@lexical/list";
import { INDENT_CONTENT_COMMAND, OUTDENT_CONTENT_COMMAND } from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { ReactNode } from "react";
import { LexicalEditor, $getSelection, $isRangeSelection, $createParagraphNode } from "lexical";
import { BaseExtension } from "@lyfie/luthor-headless/extensions/base";
import { ExtensionCategory } from "@lyfie/luthor-headless/extensions/types";
import { ListNode, ListItemNode, $isListNode, $isListItemNode } from "@lexical/list";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";

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
    void editor;
    return () => {};
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
    return [<ListPlugin key="list-plugin" />, <CheckListPlugin key="check-list-plugin" />];
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

          let node: any = selection.anchor.getNode();
          while (node) {
            if ($isListNode(node)) {
              if (node.getListType() === "check") {
                return;
              }
              break;
            }
            node = node.getParent();
          }

          editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
        });
      },
      outdentList: () => {
        editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
      },
      insertNestedUnorderedList: () => {
        editor.update(() => {
          editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        });
      },
      insertNestedOrderedList: () => {
        editor.update(() => {
          editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        });
      },
    };
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

