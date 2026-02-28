import {
  LexicalEditor,
  $getSelection,
  $isRangeSelection,
} from "lexical";
import { BaseExtension } from "@lyfie/luthor-headless/extensions/base";
import { ExtensionCategory } from "@lyfie/luthor-headless/extensions/types";
import { BaseExtensionConfig } from "@lyfie/luthor-headless/extensions/types";
import { ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { useBaseEditor as useEditor } from "../../core/createEditorSystem";
import {
  TableNode,
  TableRowNode,
  TableCellNode,
  TableCellHeaderStates,
  $createTableNodeWithDimensions,
  $isTableNode,
  $isTableRowNode,
  $isTableCellNode,
  $findCellNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $getTableRowIndexFromTableCellNode,
  $getTableColumnIndexFromTableCellNode,
  $mergeCells,
  $unmergeCell,
} from "@lexical/table";
import {
  $isTableSelection,
  $insertTableRowAtSelection,
  $insertTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $deleteTableColumnAtSelection,
} from "@lexical/table";
import { $createParagraphNode, $createTextNode } from "lexical";
import {
  ContextMenuItem,
  ContextMenuProvider,
  ContextMenuRenderer,
  contextMenuExtension
} from "@lyfie/luthor-headless/extensions/core/ContextMenuExtension";

/**
 * Table extension configuration options.
 */
export type TableConfig = BaseExtensionConfig & {
  rows?: number;
  columns?: number;
  includeHeaders?: boolean;
  /** Enable right-click context menu */
  enableContextMenu?: boolean;
  /** Custom context menu items - static list or a function that receives commands */
  contextMenuItems?: ContextMenuItem[] | ((commands: TableCommands) => ContextMenuItem[]);
  /** Custom context menu renderer for full headless control */
  contextMenuRenderer?: ContextMenuRenderer;
  /** Context menu extension used to register providers */
  contextMenuExtension?: typeof contextMenuExtension;
  /** Custom table bubble menu renderer */
  tableBubbleRenderer?: (props: TableBubbleRenderProps) => ReactNode;
};

export type TableBubbleRenderProps = {
  headersEnabled: boolean;
  setHeadersEnabled: (enabled: boolean) => void;
  actions: {
    insertRowAbove: () => void;
    insertRowBelow: () => void;
    insertColumnLeft: () => void;
    insertColumnRight: () => void;
    deleteSelectedColumn: () => void;
    deleteSelectedRow: () => void;
    deleteTable: () => void;
  };
};

/**
 * Commands exposed by the Table extension.
 */
export type TableCommands = {
  insertTable: (config: { rows?: number; columns?: number; includeHeaders?: boolean }) => void;
  insertRowAbove: () => void;
  insertRowBelow: () => void;
  insertColumnLeft: () => void;
  insertColumnRight: () => void;
  toggleRowHeader: () => void;
  toggleColumnHeader: () => void;
  mergeSelectedCells: () => void;
  unmergeSelectedCell: () => void;
  deleteRow: () => void;
  deleteColumn: () => void;
  deleteTable: () => void;
  showTableContextMenu: (position: { x: number; y: number }) => void;
};

/**
 * State queries exposed by the Table extension.
 */
export type TableStateQueries = {
  isTableSelected: () => Promise<boolean>;
  isInTableCell: () => Promise<boolean>;
};

function getSelectedTableCell(): TableCellNode | null {
  const selection = $getSelection();

  if ($isTableSelection(selection)) {
    const selectedCell = selection.getNodes().find((node) => $isTableCellNode(node));
    if ($isTableCellNode(selectedCell)) {
      return selectedCell;
    }
  }

  if ($isRangeSelection(selection)) {
    const anchorNode = selection.anchor.getNode();
    const cellNode = $findCellNode(anchorNode);
    if ($isTableCellNode(cellNode)) {
      return cellNode;
    }
  }

  return null;
}

function DefaultTableBubbleMenu({
  headersEnabled,
  setHeadersEnabled,
  actions,
}: TableBubbleRenderProps) {
  return (
    <>
      <button
        type="button"
        className="luthor-table-bubble-button"
        title="Insert row above"
        aria-label="Insert row above"
        onClick={actions.insertRowAbove}
      >
        Row ↑
      </button>
      <button
        type="button"
        className="luthor-table-bubble-button"
        title="Insert row below"
        aria-label="Insert row below"
        onClick={actions.insertRowBelow}
      >
        Row ↓
      </button>
      <button
        type="button"
        className="luthor-table-bubble-button"
        title="Insert column left"
        aria-label="Insert column left"
        onClick={actions.insertColumnLeft}
      >
        Col ←
      </button>
      <button
        type="button"
        className="luthor-table-bubble-button"
        title="Insert column right"
        aria-label="Insert column right"
        onClick={actions.insertColumnRight}
      >
        Col →
      </button>
      <button
        type="button"
        className="luthor-table-bubble-button"
        title="Delete selected column"
        aria-label="Delete selected column"
        onClick={actions.deleteSelectedColumn}
      >
        Del Col
      </button>
      <button
        type="button"
        className="luthor-table-bubble-button"
        title="Delete selected row"
        aria-label="Delete selected row"
        onClick={actions.deleteSelectedRow}
      >
        Del Row
      </button>
      <label className="luthor-table-bubble-checkbox" title="Use first row as table headers">
        <input
          type="checkbox"
          title="Use first row as table headers"
          aria-label="Use first row as table headers"
          checked={headersEnabled}
          onChange={(event) => setHeadersEnabled(event.target.checked)}
        />
        Headers
      </label>
      <button
        type="button"
        className="luthor-table-bubble-button luthor-table-bubble-button-danger"
        title="Delete table"
        aria-label="Delete table"
        onClick={actions.deleteTable}
      >
        Delete Table
      </button>
    </>
  );
}

function TableQuickActionsPlugin({ extension }: { extension: TableExtension }) {
  const { editor } = useEditor();
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [headersEnabled, setHeadersEnabled] = useState(false);
  const [bubblePosition, setBubblePosition] = useState<{ x: number; y: number } | null>(null);
  const viewportRafIdRef = useRef<number | null>(null);

  const runWithSelectedTableCell = (action: (cell: TableCellNode) => void) => {
    if (!editor) {
      return;
    }

    editor.update(() => {
      const selectedCell = getSelectedTableCell();
      if (!selectedCell) {
        return;
      }

      selectedCell.selectStart();
      action(selectedCell);
    });
  };

  const setTableHeaders = (enabled: boolean) => {
    runWithSelectedTableCell((selectedCell) => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(selectedCell);
      const rowNodes = tableNode.getChildren().filter((node): node is TableRowNode => $isTableRowNode(node));

      rowNodes.forEach((rowNode, rowIndex) => {
        const rowCells = rowNode.getChildren().filter((node): node is TableCellNode => $isTableCellNode(node));
        rowCells.forEach((cell) => {
          const rowHeaderState = enabled && rowIndex === 0
            ? TableCellHeaderStates.ROW
            : TableCellHeaderStates.NO_STATUS;
          cell.setHeaderStyles(rowHeaderState, TableCellHeaderStates.ROW);
        });
      });
    });
  };

  useEffect(() => {
    if (!editor) {
      return;
    }

    const rootElement = editor.getRootElement();
    const container = (rootElement?.closest(".luthor-editor-wrapper") as HTMLElement | null)
      || rootElement?.parentElement
      || null;
    setPortalContainer(container);

    const updateBubbleState = () => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection) && !selection.isCollapsed()) {
          setIsVisible(false);
          setBubblePosition(null);
          return;
        }

        const selectedCell = getSelectedTableCell();
        if (!selectedCell) {
          setIsVisible(false);
          setBubblePosition(null);
          return;
        }

        const cellElement = editor.getElementByKey(selectedCell.getKey());
        const tableElement = cellElement?.closest("table");
        if (!tableElement || !container) {
          setIsVisible(false);
          setBubblePosition(null);
          return;
        }

        const tableNode = $getTableNodeFromLexicalNodeOrThrow(selectedCell);
        const rowNodes = tableNode.getChildren().filter((node): node is TableRowNode => $isTableRowNode(node));

        const firstRowCells = rowNodes[0]?.getChildren().filter((node): node is TableCellNode => $isTableCellNode(node)) || [];
        const hasRowHeaders = firstRowCells.length > 0 && firstRowCells.every((cell) => cell.hasHeaderState(TableCellHeaderStates.ROW));
        setHeadersEnabled(hasRowHeaders);

        const containerRect = container.getBoundingClientRect();
        const tableRect = tableElement.getBoundingClientRect();

        setBubblePosition({
          x: tableRect.left - containerRect.left + tableRect.width / 2,
          y: tableRect.top - containerRect.top - 12,
        });
        setIsVisible(true);
      });
    };

    updateBubbleState();

    const unregisterUpdate = editor.registerUpdateListener(() => {
      updateBubbleState();
    });

    const handleViewportChange = () => {
      if (viewportRafIdRef.current !== null) {
        return;
      }
      viewportRafIdRef.current = window.requestAnimationFrame(() => {
        viewportRafIdRef.current = null;
        updateBubbleState();
      });
    };

    window.addEventListener("scroll", handleViewportChange, true);
    window.addEventListener("resize", handleViewportChange);

    return () => {
      unregisterUpdate();
      window.removeEventListener("scroll", handleViewportChange, true);
      window.removeEventListener("resize", handleViewportChange);
      if (viewportRafIdRef.current !== null) {
        cancelAnimationFrame(viewportRafIdRef.current);
        viewportRafIdRef.current = null;
      }
    };
  }, [editor]);

  if (!portalContainer || !isVisible || !bubblePosition || typeof document === "undefined") {
    return null;
  }

  const bubbleActions: TableBubbleRenderProps["actions"] = {
    insertRowAbove: () => runWithSelectedTableCell(() => $insertTableRowAtSelection(false)),
    insertRowBelow: () => runWithSelectedTableCell(() => $insertTableRowAtSelection(true)),
    insertColumnLeft: () => runWithSelectedTableCell(() => $insertTableColumnAtSelection(false)),
    insertColumnRight: () => runWithSelectedTableCell(() => $insertTableColumnAtSelection(true)),
    deleteSelectedColumn: () => runWithSelectedTableCell(() => $deleteTableColumnAtSelection()),
    deleteSelectedRow: () => runWithSelectedTableCell(() => $deleteTableRowAtSelection()),
    deleteTable: () =>
      runWithSelectedTableCell((selectedCell) => {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(selectedCell);
        tableNode.remove();
      }),
  };

  const bubbleContent = extension.config.tableBubbleRenderer
    ? extension.config.tableBubbleRenderer({
      headersEnabled,
      setHeadersEnabled: (enabled) => {
        setHeadersEnabled(enabled);
        setTableHeaders(enabled);
      },
      actions: bubbleActions,
    })
    : (
      <DefaultTableBubbleMenu
        headersEnabled={headersEnabled}
        setHeadersEnabled={(enabled) => {
          setHeadersEnabled(enabled);
          setTableHeaders(enabled);
        }}
        actions={bubbleActions}
      />
    );

  return createPortal(
    <div
      className="luthor-table-bubble-menu"
      style={{
        position: "absolute",
        left: bubblePosition.x,
        top: bubblePosition.y,
        transform: "translate(-50%, -100%)",
        zIndex: 30,
      }}
      onMouseDown={(event) => event.preventDefault()}
    >
      {bubbleContent}
    </div>,
    portalContainer,
  );
}

/**
 * Table extension for table operations in the editor.
 * Provides commands for inserting and manipulating tables.
 */
export class TableExtension extends BaseExtension<
  "table",
  TableConfig,
  TableCommands,
  TableStateQueries,
  ReactNode[]
> {
  getContextMenuItems(commands: TableCommands): ContextMenuItem[] {
    if (typeof this.config.contextMenuItems === 'function') {
      return this.config.contextMenuItems(commands);
    }
    if (Array.isArray(this.config.contextMenuItems)) {
      return this.config.contextMenuItems;
    }
    return this.defaultContextMenuItems(commands);
  }

  private defaultContextMenuItems = (commands: TableCommands): ContextMenuItem[] => [
    {
      label: "Insert Row Above",
      action: () => commands.insertRowAbove(),
    },
    {
      label: "Insert Row Below",
      action: () => commands.insertRowBelow(),
    },
    {
      label: "Insert Column Left",
      action: () => commands.insertColumnLeft(),
    },
    {
      label: "Insert Column Right",
      action: () => commands.insertColumnRight(),
    },
    {
      separator: true,
      label: "",
      action: () => {},
    },
    {
      label: "Toggle Row Header",
      action: () => commands.toggleRowHeader(),
    },
    {
      label: "Toggle Column Header",
      action: () => commands.toggleColumnHeader(),
    },
    {
      label: "Merge Cells",
      action: () => commands.mergeSelectedCells(),
    },
    {
      label: "Split Cell",
      action: () => commands.unmergeSelectedCell(),
    },
    {
      separator: true,
      label: "",
      action: () => {},
    },
    {
      label: "Delete Row",
      action: () => commands.deleteRow(),
    },
    {
      label: "Delete Column",
      action: () => commands.deleteColumn(),
    },
    {
      label: "Delete Table",
      action: () => commands.deleteTable(),
    },
  ];

  constructor(config?: Partial<TableConfig>) {
    super("table", [ExtensionCategory.Toolbar]);
    this.config = {
      rows: 3,
      columns: 3,
      includeHeaders: false,
      enableContextMenu: true,
      contextMenuItems: this.defaultContextMenuItems,
      ...config,
    };
  }

  configure(config: Partial<TableConfig>): this {
    this.config = { ...this.config, ...config };
    // Merge context menu items if provided
    if (config.contextMenuItems) {
      this.config.contextMenuItems = config.contextMenuItems;
    }
    return this;
  }

  register(editor: LexicalEditor): () => void {
    let unregisterContextMenuProvider: (() => void) | undefined;

    // Register our context menu provider if context menu is enabled
    if (this.config.enableContextMenu) {
      const contextMenuExt = this.config.contextMenuExtension || contextMenuExtension;

      if (contextMenuExt) {
        const provider: ContextMenuProvider = {
          id: 'table',
          priority: 10, // Higher priority for tables

          canHandle: ({ target, selection }) => {
            // Check if we're in a table cell
            const tableCell = target.closest('td, th, [data-lexical-table-cell]');
            if (!tableCell) return false;

            // Additional check via selection if needed
            if ($isTableSelection(selection)) return true;

            // Check via DOM
            return tableCell.tagName === 'TD' || tableCell.tagName === 'TH';
          },

          getItems: ({ editor }) => {
            const commands = this.getCommands(editor);
            return this.getContextMenuItems(commands);
          },

          renderer: this.config.contextMenuRenderer || contextMenuExt.config?.defaultRenderer,
        };

        const commands = contextMenuExt.getCommands(editor);
        commands.registerProvider(provider);

        unregisterContextMenuProvider = () => {
          const commands = contextMenuExt.getCommands(editor);
          if (commands) {
            commands.unregisterProvider('table');
          }
        };
      }
    }

    return () => {
      unregisterContextMenuProvider?.();
    };
  }

  getNodes(): any[] {
    return [TableNode, TableRowNode, TableCellNode];
  }

  getCommands(editor: LexicalEditor): TableCommands {
    return {
      insertTable: (config: { rows?: number; columns?: number; includeHeaders?: boolean }) => {
        const { rows = 3, columns = 3, includeHeaders = false } = config;

        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const tableNode = $createTableNodeWithDimensions(rows, columns, includeHeaders);
            selection.insertNodes([tableNode]);
          }
        });
      },
      insertRowAbove: () => {
        editor.update(() => {
          $insertTableRowAtSelection(false); // false = insert above
        });
      },
      insertRowBelow: () => {
        editor.update(() => {
          $insertTableRowAtSelection(true); // true = insert below
        });
      },
      insertColumnLeft: () => {
        editor.update(() => {
          $insertTableColumnAtSelection(false); // false = insert left
        });
      },
      insertColumnRight: () => {
        editor.update(() => {
          $insertTableColumnAtSelection(true); // true = insert right
        });
      },
      toggleRowHeader: () => {
        editor.update(() => {
          const activeCell = getSelectedTableCell();
          if (!activeCell) {
            return;
          }

          const tableNode = $getTableNodeFromLexicalNodeOrThrow(activeCell);
          const rowIndex = $getTableRowIndexFromTableCellNode(activeCell);
          const rowNode = tableNode.getChildren()[rowIndex];
          if (!$isTableRowNode(rowNode)) {
            return;
          }

          const rowCells = rowNode.getChildren().filter((node): node is TableCellNode => $isTableCellNode(node));
          const enableHeader = !rowCells.every((cell) => cell.hasHeaderState(TableCellHeaderStates.ROW));
          const nextHeaderState = enableHeader ? TableCellHeaderStates.ROW : TableCellHeaderStates.NO_STATUS;

          rowCells.forEach((cell) => {
            cell.setHeaderStyles(nextHeaderState, TableCellHeaderStates.ROW);
          });
        });
      },
      toggleColumnHeader: () => {
        editor.update(() => {
          const activeCell = getSelectedTableCell();
          if (!activeCell) {
            return;
          }

          const tableNode = $getTableNodeFromLexicalNodeOrThrow(activeCell);
          const columnIndex = $getTableColumnIndexFromTableCellNode(activeCell);
          const rowNodes = tableNode.getChildren().filter((node): node is TableRowNode => $isTableRowNode(node));

          const columnCells = rowNodes
            .map((rowNode) => rowNode.getChildren()[columnIndex])
            .filter((node): node is TableCellNode => $isTableCellNode(node));

          const enableHeader = !columnCells.every((cell) => cell.hasHeaderState(TableCellHeaderStates.COLUMN));
          const nextHeaderState = enableHeader ? TableCellHeaderStates.COLUMN : TableCellHeaderStates.NO_STATUS;

          columnCells.forEach((cell) => {
            cell.setHeaderStyles(nextHeaderState, TableCellHeaderStates.COLUMN);
          });
        });
      },
      mergeSelectedCells: () => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isTableSelection(selection)) {
            return;
          }

          const cellNodes = selection.getNodes().filter((node): node is TableCellNode => $isTableCellNode(node));
          if (cellNodes.length < 2) {
            return;
          }

          $mergeCells(cellNodes);
        });
      },
      unmergeSelectedCell: () => {
        editor.update(() => {
          $unmergeCell();
        });
      },
      deleteRow: () => {
        editor.update(() => {
          $deleteTableRowAtSelection();
        });
      },
      deleteColumn: () => {
        editor.update(() => {
          $deleteTableColumnAtSelection();
        });
      },
      deleteTable: () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isTableSelection(selection)) {
            selection.getNodes().forEach((node) => {
              if ($isTableNode(node)) {
                node.remove();
              }
            });
          }
        });
      },
      showTableContextMenu: (_position: { x: number; y: number }) => {
        void _position;
        // This will be implemented when the extension system allows cross-extension commands
        // For now, this is a placeholder
      },
    };
  }

  getStateQueries(editor: LexicalEditor): TableStateQueries {
    return {
      isTableSelected: async () => {
        return editor.getEditorState().read(() => {
          const selection = $getSelection();
          return $isTableSelection(selection);
        });
      },
      isInTableCell: async () => {
        return editor.getEditorState().read(() => {
          const selection = $getSelection();
          if (!selection || typeof selection !== 'object' || !('anchor' in selection) || !('focus' in selection)) return false;

          try {
            const anchorNode = (selection as any).anchor.getNode();
            const focusNode = (selection as any).focus.getNode();

            return $isTableCellNode(anchorNode) || $isTableCellNode(focusNode);
          } catch {
            return false;
          }
        });
      },
    };
  }

  getPlugins(): ReactNode[] {
    return [<TablePlugin key="table-plugin" />, <TableQuickActionsPlugin key="table-quick-actions-plugin" extension={this} />];
  }
}

/**
 * Preconfigured Table extension instance.
 * Ready for use in extension arrays.
 */
export const tableExtension = new TableExtension();

/**
 * Table Markdown transformer
 * Supports standard GitHub Flavored Markdown table syntax.
 */
export const TABLE_MARKDOWN_TRANSFORMER = {
  dependencies: [TableNode, TableRowNode, TableCellNode],
  export: (node: any) => {
    if (!$isTableNode(node)) {
      return null;
    }

    const rows = node.getChildren();
    if (rows.length === 0) return null;

    const tableData: string[][] = [];
    rows.forEach((row: any) => {
      if (!$isTableRowNode(row)) {
        return;
      }
      const cells = row.getChildren();
      const rowData: string[] = [];
      cells.forEach((cell: any) => {
        if (!$isTableCellNode(cell)) {
          return;
        }
        const textContent = cell.getTextContent().trim();
        rowData.push(textContent);
      });
      if (rowData.length > 0) tableData.push(rowData);
    });

    if (tableData.length === 0) return null;

    const markdownLines: string[] = [];
    if (tableData[0]) {
      markdownLines.push("| " + tableData[0].join(" | ") + " |");
    }

    const colCount = tableData[0]?.length || 1;
    const separator = "| " + Array(colCount).fill("---").join(" | ") + " |";
    markdownLines.push(separator);

    for (let i = 1; i < tableData.length; i++) {
      const row = tableData[i] || [];
      const paddedRow = [...row];
      while (paddedRow.length < colCount) paddedRow.push("");
      markdownLines.push("| " + paddedRow.join(" | ") + " |");
    }

    return markdownLines.join("\n");
  },
  regExpStart: /^\|.*\|$/,
  regExpEnd: {
    optional: true as const,
    regExp: /^$/
  },
  replace: (rootNode: any, children: any, startMatch: any, endMatch: any, linesInBetween: any, _isImport: boolean) => {
    void _isImport;
    // Combine the start line with lines in between to get all table lines
    const allLines = [startMatch[0], ...(linesInBetween || [])];
    
    // Filter lines that look like table rows
    const tableLines = allLines.filter((line: string) => {
      const trimmed = line.trim();
      return trimmed && trimmed.includes('|') && trimmed.split('|').length > 1;
    });
    
    if (tableLines.length < 2) {
      return;
    }
    
    // Parse the table data
    const rows: string[][] = [];
    tableLines.forEach((line: string) => {
      const cells = line.split('|').slice(1, -1).map((cell: string) => cell.trim());
      if (cells.length > 0) {
        rows.push(cells);
      }
    });
    
    if (rows.length === 0 || !rows[0]) {
      return;
    }
    
    // Filter out separator rows (rows with only dashes and colons)
    const dataRows = rows.filter((row: string[]) => 
      !row.every((cell: string) => /^:?-+:?$/.test(cell))
    );
    
    if (dataRows.length === 0) {
      return;
    }
    
    const tableNode = $createTableNodeWithDimensions(dataRows.length, Math.max(...dataRows.map(r => r.length)), false);
    
    const tableRows = tableNode.getChildren();
    dataRows.forEach((rowData, rowIndex) => {
      const tableRow = tableRows[rowIndex];
      if ($isTableRowNode(tableRow)) {
        const cells = tableRow.getChildren();
        rowData.forEach((cellText, cellIndex) => {
          if (cellIndex < cells.length) {
            const cell = cells[cellIndex];
            if ($isTableCellNode(cell)) {
              cell.clear();
              const paragraph = $createParagraphNode();
              if (cellText) {
                paragraph.append($createTextNode(cellText));
              }
              cell.append(paragraph);
            }
          }
        });
      }
    });
    
    rootNode.append(tableNode);
  },
  type: "multiline-element" as const,
};

