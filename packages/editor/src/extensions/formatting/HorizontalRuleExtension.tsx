import { LexicalEditor, $getSelection, $isRangeSelection } from "lexical";
import {
  INSERT_HORIZONTAL_RULE_COMMAND,
  $isHorizontalRuleNode,
  $createHorizontalRuleNode,
  HorizontalRuleNode,
} from "@lexical/react/LexicalHorizontalRuleNode";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { BaseExtension } from "@lyfie/luthor/extensions/base";
import { ExtensionCategory } from "@lyfie/luthor/extensions/types";
import React from "react";
import type { LexicalNode, ElementNode } from "lexical";

/**
 * Horizontal rule transformer for Markdown
 * Supports --- / *** / ___ syntax
 */
export const HORIZONTAL_RULE_TRANSFORMER = {
  dependencies: [HorizontalRuleNode],
  export: (node: LexicalNode) => {
    if (!$isHorizontalRuleNode(node)) return null;
    return "---";
  },
  regExp: /^(?:---|\*\*\*|___)\s*$/,
  replace: (
    parentNode: ElementNode,
    children: LexicalNode[],
    match: string[],
  ) => {
    const hrNode = $createHorizontalRuleNode();
    parentNode.replace(hrNode);
  },
  type: "element" as const,
};

/**
 * Commands exposed by the horizontal rule extension.
 */
export type HorizontalRuleCommands = {
  insertHorizontalRule: () => void;
};

/**
 * State queries exposed by the horizontal rule extension.
 */
export type HorizontalRuleStateQueries = {
  isHorizontalRuleSelected: () => Promise<boolean>;
};

/**
 * Horizontal rule extension for inserting dividers.
 * Provides commands to insert and manage horizontal rules in the editor.
 *
 * @example
 * ```tsx
 * const extensions = [horizontalRuleExtension] as const;
 * const { Provider, useEditor } = createEditorSystem<typeof extensions>();
 *
 * function MyEditor() {
 *   const { commands } = useEditor();
 *   return (
 *     <button onClick={() => commands.insertHorizontalRule()}>
 *       Insert HR
 *     </button>
 *   );
 * }
 * ```
 */
export class HorizontalRuleExtension extends BaseExtension<
  "horizontalRule",
  any,
  HorizontalRuleCommands,
  HorizontalRuleStateQueries,
  React.ReactElement[]
> {
  /**
   * Creates a new horizontal rule extension.
   */
  constructor() {
    super("horizontalRule", [ExtensionCategory.Toolbar]);
  }

  /**
   * Registers the extension with the editor.
   * No special registration needed because Lexical handles HR commands.
   *
   * @param editor - Lexical editor instance
   * @returns Cleanup function
   */
  register(editor: LexicalEditor): () => void {
    return () => {};
  }

  /**
   * Returns Lexical nodes provided by this extension.
   *
   * @returns Array containing the HorizontalRuleNode
   */
  getNodes(): any[] {
    return [HorizontalRuleNode];
  }

  /**
   * Returns React plugins provided by this extension.
   *
   * @returns Array containing the HorizontalRulePlugin
   */
  getPlugins(): React.ReactElement[] {
    return [<HorizontalRulePlugin key="horizontal-rule" />];
  }

  /**
   * Returns commands exposed by this extension.
   *
   * @param editor - Lexical editor instance
   * @returns Object with horizontal rule command functions
   */
  getCommands(editor: LexicalEditor): HorizontalRuleCommands {
    return {
      insertHorizontalRule: () => {
        editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
      },
    };
  }

  /**
   * Returns state query functions exposed by this extension.
   *
   * @param editor - Lexical editor instance
   * @returns Object with horizontal rule state query functions
   */
  getStateQueries(editor: LexicalEditor): HorizontalRuleStateQueries {
    return {
      isHorizontalRuleSelected: () =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if (selection && $isRangeSelection(selection)) {
              const nodes = selection.getNodes();
              const hasHorizontalRule = nodes.some((node: any) =>
                $isHorizontalRuleNode(node),
              );
              resolve(hasHorizontalRule);
            } else {
              resolve(false);
            }
          });
        }),
    };
  }
}

/**
 * Preconfigured horizontal rule extension instance.
 * Ready for use in extension arrays.
 */
export const horizontalRuleExtension = new HorizontalRuleExtension();

export default horizontalRuleExtension;
