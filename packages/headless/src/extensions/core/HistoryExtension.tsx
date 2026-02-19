import {
  UNDO_COMMAND,
  REDO_COMMAND,
  CLEAR_HISTORY_COMMAND,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
  COMMAND_PRIORITY_LOW,
} from "lexical";
import { LexicalEditor } from "lexical";
import { BaseExtension } from "@lyfie/luthor-headless/extensions/base";
import { ExtensionCategory } from "@lyfie/luthor-headless/extensions/types";
import { ReactNode } from "react";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";

/**
 * Commands exposed by the history extension.
 */
export type HistoryCommands = {
  /** Undo the most recent action */
  undo: () => void;
  /** Redo the most recently undone action */
  redo: () => void;
  /** Clear the full history stack */
  clearHistory: () => void;
};

/**
 * History extension that provides undo/redo functionality.
 * Integrates with Lexical's built-in history system to offer
 * undo and redo capabilities with state tracking.
 *
 * @example
 * ```tsx
 * const extensions = [historyExtension] as const;
 * const { Provider, useEditor } = createEditorSystem<typeof extensions>();
 *
 * function MyEditor() {
 *   const { commands, activeStates } = useEditor();
 *   return (
 *     <div>
 *       <button
 *         onClick={() => commands.undo()}
 *         disabled={!activeStates.canUndo}
 *       >
 *         Undo
 *       </button>
 *       <button
 *         onClick={() => commands.redo()}
 *         disabled={!activeStates.canRedo}
 *       >
 *         Redo
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export class HistoryExtension extends BaseExtension<
  "history",
  any,
  HistoryCommands,
  { canUndo: () => Promise<boolean>; canRedo: () => Promise<boolean> },
  ReactNode[]
> {
  private canUndoState: boolean = false;
  private canRedoState: boolean = false;

  /**
   * Creates a new history extension.
   */
  constructor() {
    super("history", [ExtensionCategory.Toolbar]);
  }

  /**
   * Registers the extension with the Lexical editor.
   * Sets up listeners for undo/redo state changes.
   *
   * @param editor - Lexical editor instance
   * @returns Cleanup function
   */
  register(editor: LexicalEditor): () => void {
    const unregisterUndo = editor.registerCommand(
      CAN_UNDO_COMMAND,
      (payload: boolean) => {
        this.canUndoState = payload;
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );

    const unregisterRedo = editor.registerCommand(
      CAN_REDO_COMMAND,
      (payload: boolean) => {
        this.canRedoState = payload;
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );

    return () => {
      unregisterUndo();
      unregisterRedo();
    };
  }

  /**
   * Returns React plugins required for history support.
   *
   * @returns Array containing the HistoryPlugin component
   */
  getPlugins(): ReactNode[] {
    return [<HistoryPlugin key="history-plugin" />];
  }

  /**
   * Returns commands exposed by this extension.
   *
   * @param editor - Lexical editor instance
   * @returns Object containing history commands
   */
  getCommands(editor: LexicalEditor): HistoryCommands {
    return {
      undo: () => {
        editor.focus();
        editor.dispatchCommand(UNDO_COMMAND, undefined);
      },
      redo: () => {
        editor.focus();
        editor.dispatchCommand(REDO_COMMAND, undefined);
      },
      clearHistory: () =>
        editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined),
    };
  }

  /**
   * Returns state query functions for undo/redo availability.
   *
   * @param editor - Lexical editor instance
   * @returns Object containing state query functions
   */
  getStateQueries(editor: LexicalEditor): {
    canUndo: () => Promise<boolean>;
    canRedo: () => Promise<boolean>;
  } {
    void editor;
    return {
      canUndo: async () => this.canUndoState,
      canRedo: async () => this.canRedoState,
    };
  }
}

/**
 * Preconfigured history extension instance.
 * Ready for use in extension arrays.
 */
export const historyExtension = new HistoryExtension();

