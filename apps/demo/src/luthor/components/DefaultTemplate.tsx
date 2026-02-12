"use client";

import React, { useState, useEffect, useMemo, useRef, forwardRef } from "react";
import { useTheme } from "next-themes";
import {
  // Core system
  createEditorSystem,

  // Extensions
  boldExtension,
  italicExtension,
  underlineExtension,
  strikethroughExtension,
  linkExtension,
  horizontalRuleExtension,
  TableExtension,
  listExtension,
  historyExtension,
  imageExtension,
  blockFormatExtension,
  htmlExtension,
  MarkdownExtension,
  codeExtension,
  codeFormatExtension,
  HTMLEmbedExtension,
  floatingToolbarExtension,
  contextMenuExtension,
  commandPaletteExtension,
  DraggableBlockExtension,

  // Utilities
  ALL_MARKDOWN_TRANSFORMERS,

  // Types
  type ExtractCommands,
  type ExtractStateQueries,
  type BaseCommands,
} from "@lyfie/luthor";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import type { LexicalEditor } from "lexical";
import { TextBolderIcon, TextItalic, TextUnderline, TextStrikethrough, ListBullets, ListNumbers, ArrowCounterClockwise, ArrowClockwise, Sun, Moon, Image, TextAlignLeft, TextAlignCenter, TextAlignRight, UploadSimple, LinkSimple, LinkBreak, Minus, Code, Terminal, Table, FileCode, Eye, PencilSimple, Command, TextT, Quotes, TextIndent, TextOutdent } from "@phosphor-icons/react";
import { Select, Dropdown, Dialog } from "./components";
import {
  commandsToCommandPaletteItems,
  registerKeyboardShortcuts,
} from "./commands";
import { CommandPalette } from "./CommandPalette";
import { createPortal } from "react-dom";
import { defaultTheme } from "./theme";
import "./styles.css";

type TableConfig = {
  rows?: number;
  columns?: number;
  includeHeaders?: boolean;
};

// Create markdown extension instance
const markdownExt = new MarkdownExtension().configure({
  customTransformers: ALL_MARKDOWN_TRANSFORMERS,
});

// Define extensions array
export const extensions = [
  boldExtension,
  italicExtension,
  underlineExtension,
  strikethroughExtension,
  linkExtension.configure({
    linkSelectedTextOnPaste: true,
    autoLinkText: true,
    autoLinkUrls: true,
  }),
  horizontalRuleExtension,
  new TableExtension().configure({
    enableContextMenu: true,
    markdownExtension: markdownExt,
  }),
  listExtension,
  historyExtension,
  imageExtension,
  blockFormatExtension,
  htmlExtension,
  markdownExt,
  codeExtension,
  codeFormatExtension,
  new HTMLEmbedExtension().configure({
    markdownExtension: markdownExt,
  }),
  floatingToolbarExtension,
  contextMenuExtension,
  commandPaletteExtension,
  new DraggableBlockExtension().configure({}),
] as const;

// Create typed editor system
const { Provider, useEditor } = createEditorSystem<typeof extensions>();

// Extract types
type EditorCommands = BaseCommands & ExtractCommands<typeof extensions>;
type EditorStateQueries = ExtractStateQueries<typeof extensions>;
type ExtensionNames = (typeof extensions)[number]["name"];

// Editor modes
type EditorMode = "visual" | "html" | "markdown";

// Ref interface for external control
export interface DefaultTemplateRef {
  injectMarkdown: (content: string) => void;
  injectHTML: (content: string) => void;
  getMarkdown: () => string;
  getHTML: () => string;
}

// Hook for image handling logic
function useImageHandlers(commands: EditorCommands, editor: LexicalEditor | null) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlers = useMemo(
    () => ({
      insertFromUrl: () => {
        const src = prompt("Enter image URL:");
        if (!src) return;
        const alt = prompt("Enter alt text:") || "";
        const caption = prompt("Enter caption (optional):") || undefined;
        commands.insertImage({ src, alt, caption });
      },
      insertFromFile: () => fileInputRef.current?.click(),
      handleUpload: async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        let src: string;
        if (imageExtension.config.uploadHandler) {
          try {
            src = await imageExtension.config.uploadHandler(file);
          } catch (error) {
            alert("Failed to upload image");
            return;
          }
        } else {
          src = URL.createObjectURL(file);
        }
        commands.insertImage({ src, alt: file.name, file });
        e.target.value = "";
      },
      setAlignment: (alignment: "left" | "center" | "right" | "none") => {
        commands.setImageAlignment(alignment);
      },
      setCaption: () => {
        const newCaption = prompt("Enter caption:") || "";
        commands.setImageCaption(newCaption);
      },
    }),
    [commands],
  );

  return { handlers, fileInputRef };
}

// Floating Toolbar Component
function FloatingToolbarRenderer() {
  const { commands, activeStates, extensions, hasExtension } = useEditor();

  const [isVisible, setIsVisible] = useState(false);
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; positionFromRight?: boolean } | null>(null);

  const floatingExtension = extensions.find((ext) => ext.name === "floatingToolbar") as any;

  useEffect(() => {
    if (!floatingExtension) return;

    const checkState = () => {
      const visible = floatingExtension.getIsVisible();
      const rect = floatingExtension.getSelectionRect();
      setIsVisible(visible);
      setSelectionRect(rect);
    };

    const interval = setInterval(checkState, 200);
    return () => clearInterval(interval);
  }, [floatingExtension]);

  if (!isVisible || !selectionRect) return null;

  const isImageSelected = activeStates.imageSelected;

  return createPortal(
    <div
      className="luthor-floating-toolbar"
      style={{
        position: "absolute",
        top: selectionRect.y,
        ...(selectionRect.positionFromRight ? { right: 10, left: "auto" } : { left: selectionRect.x, right: "auto" }),
        zIndex: 50,
        maxWidth: 400,
        flexWrap: "wrap",
        pointerEvents: "auto",
      }}
    >
      {isImageSelected ? (
        <>
          <button onClick={() => commands.setImageAlignment("left")} className={`luthor-toolbar-button ${activeStates.isImageAlignedLeft ? "active" : ""}`} title="Align Left">
            <TextAlignLeft size={14} />
          </button>
          <button onClick={() => commands.setImageAlignment("center")} className={`luthor-toolbar-button ${activeStates.isImageAlignedCenter ? "active" : ""}`} title="Align Center">
            <TextAlignCenter size={14} />
          </button>
          <button onClick={() => commands.setImageAlignment("right")} className={`luthor-toolbar-button ${activeStates.isImageAlignedRight ? "active" : ""}`} title="Align Right">
            <TextAlignRight size={14} />
          </button>
          <div className="w-px h-6 bg-border mx-1" />
          <button onClick={() => commands.setImageCaption(prompt("Enter caption:") || "")} className="luthor-toolbar-button" title="Edit Caption">
            <TextT size={14} />
          </button>
        </>
      ) : (
        <>
          <button onClick={() => commands.toggleBold()} className={`luthor-toolbar-button ${activeStates.bold ? "active" : ""}`} title="Bold">
            <TextBolderIcon size={14} />
          </button>
          <button onClick={() => commands.toggleItalic()} className={`luthor-toolbar-button ${activeStates.italic ? "active" : ""}`} title="Italic">
            <TextItalic size={14} />
          </button>
          <button onClick={() => commands.toggleUnderline()} className={`luthor-toolbar-button ${activeStates.underline ? "active" : ""}`} title="Underline">
            <TextUnderline size={14} />
          </button>
          <button onClick={() => commands.toggleStrikethrough()} className={`luthor-toolbar-button ${activeStates.strikethrough ? "active" : ""}`} title="Strikethrough">
            <TextStrikethrough size={14} />
          </button>
          <div className="w-px h-6 bg-border mx-1" />
          <button onClick={() => commands.formatText("code")} className={`luthor-toolbar-button ${activeStates.code ? "active" : ""}`} title="Inline Code">
            <Code size={14} />
          </button>
          <button onClick={() => activeStates.isLink ? commands.removeLink() : commands.insertLink()} className={`luthor-toolbar-button ${activeStates.isLink ? "active" : ""}`} title={activeStates.isLink ? "Remove Link" : "Insert Link"}>
            {activeStates.isLink ? <LinkBreak size={14} /> : <LinkSimple size={14} />}
          </button>
          <div className="w-px h-6 bg-border mx-1" />
          {hasExtension("blockFormat") && (
            <>
              <button onClick={() => commands.toggleParagraph()} className={`luthor-toolbar-button ${!activeStates.isH1 && !activeStates.isH2 && !activeStates.isH3 && !activeStates.isH4 && !activeStates.isH5 && !activeStates.isH6 && !activeStates.isQuote ? "active" : ""}`} title="Paragraph">
                P
              </button>
              <button onClick={() => commands.toggleHeading("h1")} className={`luthor-toolbar-button ${activeStates.isH1 ? "active" : ""}`} title="Heading 1">
                H1
              </button>
              <button onClick={() => commands.toggleHeading("h2")} className={`luthor-toolbar-button ${activeStates.isH2 ? "active" : ""}`} title="Heading 2">
                H2
              </button>
              <button onClick={() => commands.toggleHeading("h3")} className={`luthor-toolbar-button ${activeStates.isH3 ? "active" : ""}`} title="Heading 3">
                H3
              </button>
              <button onClick={() => commands.toggleQuote()} className={`luthor-toolbar-button ${activeStates.isQuote ? "active" : ""}`} title="Quote">
                <Quotes size={14} />
              </button>
              {hasExtension("code") && (
                <button onClick={() => commands.toggleCodeBlock()} className={`luthor-toolbar-button ${activeStates.isInCodeBlock ? "active" : ""}`} title="Code Block">
                  <Terminal size={14} />
                </button>
              )}
              <div className="w-px h-6 bg-border mx-1" />
            </>
          )}
          {hasExtension("list") && (
            <>
              <button onClick={() => commands.toggleUnorderedList()} className={`luthor-toolbar-button ${activeStates.unorderedList ? "active" : ""}`} title="Bullet List">
                <ListBullets size={14} />
              </button>
              <button onClick={() => commands.toggleOrderedList()} className={`luthor-toolbar-button ${activeStates.orderedList ? "active" : ""}`} title="Numbered List">
                <ListNumbers size={14} />
              </button>
            </>
          )}
        </>
      )}
    </div>,
    document.body,
  );
}

// Toolbar Component
function Toolbar({
  commands,
  hasExtension,
  activeStates,
  isDark,
  toggleTheme,
  onCommandPaletteOpen,
}: {
  commands: EditorCommands;
  hasExtension: (name: ExtensionNames) => boolean;
  activeStates: EditorStateQueries;
  isDark: boolean;
  toggleTheme: () => void;
  onCommandPaletteOpen: () => void;
}) {
  const { lexical: editor } = useEditor();
  const { handlers, fileInputRef } = useImageHandlers(commands, editor);
  const [showImageDropdown, setShowImageDropdown] = useState(false);
  const [showAlignDropdown, setShowAlignDropdown] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [tableConfig, setTableConfig] = useState<TableConfig>({
    rows: 3,
    columns: 3,
    includeHeaders: false,
  });

  const blockFormatOptions = [
    { value: "p", label: "Paragraph" },
    { value: "h1", label: "Heading 1" },
    { value: "h2", label: "Heading 2" },
    { value: "h3", label: "Heading 3" },
    { value: "h4", label: "Heading 4" },
    { value: "h5", label: "Heading 5" },
    { value: "h6", label: "Heading 6" },
    { value: "quote", label: "Quote" },
  ];

  const currentBlockFormat =
    activeStates.isH1 ? "h1" :
    activeStates.isH2 ? "h2" :
    activeStates.isH3 ? "h3" :
    activeStates.isH4 ? "h4" :
    activeStates.isH5 ? "h5" :
    activeStates.isH6 ? "h6" :
    activeStates.isQuote ? "quote" :
    "p";

  const handleBlockFormatChange = (value: string) => {
    if (value === "p") commands.toggleParagraph();
    else if (value.startsWith("h")) commands.toggleHeading(value as "h1" | "h2" | "h3" | "h4" | "h5" | "h6");
    else if (value === "quote") commands.toggleQuote();
  };

  return (
    <>
      <div className="luthor-toolbar">
        {/* Text Formatting */}
        <div className="luthor-toolbar-section">
          <button onClick={() => commands.toggleBold()} className={`luthor-toolbar-button ${activeStates.bold ? "active" : ""}`} title="Bold (Ctrl+B)"><TextBolderIcon size={16} /></button>
          <button onClick={() => commands.toggleItalic()} className={`luthor-toolbar-button ${activeStates.italic ? "active" : ""}`} title="Italic (Ctrl+I)"><TextItalic size={16} /></button>
          <button onClick={() => commands.toggleUnderline()} className={`luthor-toolbar-button ${activeStates.underline ? "active" : ""}`} title="Underline (Ctrl+U)"><TextUnderline size={16} /></button>
          <button onClick={() => commands.toggleStrikethrough()} className={`luthor-toolbar-button ${activeStates.strikethrough ? "active" : ""}`} title="Strikethrough"><TextStrikethrough size={16} /></button>
          <button onClick={() => commands.formatText("code")} className={`luthor-toolbar-button ${activeStates.code ? "active" : ""}`} title="Inline Code"><Code size={16} /></button>
          <button onClick={() => activeStates.isLink ? commands.removeLink() : commands.insertLink()} className={`luthor-toolbar-button ${activeStates.isLink ? "active" : ""}`} title={activeStates.isLink ? "Remove Link" : "Insert Link"}>
            {activeStates.isLink ? <LinkBreak size={16} /> : <LinkSimple size={16} />}
          </button>
        </div>

        {/* Block Format */}
        {hasExtension("blockFormat") && (
          <div className="luthor-toolbar-section">
            <Select value={currentBlockFormat} onValueChange={handleBlockFormatChange} options={blockFormatOptions} placeholder="Format" />
            {hasExtension("code") && (
              <button onClick={() => commands.toggleCodeBlock()} className={`luthor-toolbar-button ${activeStates.isInCodeBlock ? "active" : ""}`} title="Code Block"><Terminal size={16} /></button>
            )}
          </div>
        )}

        {/* Lists */}
        {hasExtension("list") && (
          <div className="luthor-toolbar-section">
            <button onClick={() => commands.toggleUnorderedList()} className={`luthor-toolbar-button ${activeStates.unorderedList ? "active" : ""}`} title="Bullet List"><ListBullets size={16} /></button>
            <button onClick={() => commands.toggleOrderedList()} className={`luthor-toolbar-button ${activeStates.orderedList ? "active" : ""}`} title="Numbered List"><ListNumbers size={16} /></button>
            {(activeStates.unorderedList || activeStates.orderedList) && (
              <>
                <button onClick={() => commands.indentList()} className="luthor-toolbar-button" title="Indent List"><TextIndent size={14} /></button>
                <button onClick={() => commands.outdentList()} className="luthor-toolbar-button" title="Outdent List"><TextOutdent size={14} /></button>
              </>
            )}
          </div>
        )}

        {/* Horizontal Rule */}
        {hasExtension("horizontalRule") && (
          <div className="luthor-toolbar-section">
            <button onClick={() => commands.insertHorizontalRule()} className="luthor-toolbar-button" title="Insert Horizontal Rule"><Minus size={16} /></button>
          </div>
        )}

        {/* Table */}
        {hasExtension("table") && (
          <div className="luthor-toolbar-section">
            <button onClick={() => setShowTableDialog(true)} className="luthor-toolbar-button" title="Insert Table (Ctrl+Shift+T)"><Table size={16} /></button>
          </div>
        )}

        {/* Image */}
        {hasExtension("image") && (
          <div className="luthor-toolbar-section">
            <Dropdown
              trigger={<button className={`luthor-toolbar-button ${activeStates.imageSelected ? "active" : ""}`} title="Insert Image"><Image size={16} /></button>}
              isOpen={showImageDropdown}
              onOpenChange={setShowImageDropdown}
            >
              <button className="luthor-dropdown-item" onClick={() => { handlers.insertFromUrl(); setShowImageDropdown(false); }}><LinkSimple size={16} /> From URL</button>
              <button className="luthor-dropdown-item" onClick={() => { handlers.insertFromFile(); setShowImageDropdown(false); }}><UploadSimple size={16} /> Upload File</button>
            </Dropdown>
            {activeStates.imageSelected && (
              <Dropdown
                trigger={<button className="luthor-toolbar-button" title="Align Image"><TextAlignCenter size={16} /></button>}
                isOpen={showAlignDropdown}
                onOpenChange={setShowAlignDropdown}
              >
                <button className="luthor-dropdown-item" onClick={() => { handlers.setAlignment("left"); setShowAlignDropdown(false); }}><TextAlignLeft size={16} /> Align Left</button>
                <button className="luthor-dropdown-item" onClick={() => { handlers.setAlignment("center"); setShowAlignDropdown(false); }}><TextAlignCenter size={16} /> Align Center</button>
                <button className="luthor-dropdown-item" onClick={() => { handlers.setAlignment("right"); setShowAlignDropdown(false); }}><TextAlignRight size={16} /> Align Right</button>
                <button className="luthor-dropdown-item" onClick={() => { handlers.setCaption(); setShowAlignDropdown(false); }}><TextT size={16} /> Set Caption</button>
              </Dropdown>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlers.handleUpload} className="luthor-file-input" />
          </div>
        )}

        {/* HTML Embed */}
        {hasExtension("htmlEmbed") && (
          <div className="luthor-toolbar-section">
            <button onClick={() => commands.insertHTMLEmbed()} className={`luthor-toolbar-button ${activeStates.isHTMLEmbedSelected ? "active" : ""}`} title="Insert HTML Embed"><FileCode size={16} /></button>
            {activeStates.isHTMLEmbedSelected && (
              <button onClick={() => commands.toggleHTMLPreview()} className="luthor-toolbar-button" title="Toggle Preview/Edit">
                {activeStates.isHTMLPreviewMode ? <Eye size={16} /> : <PencilSimple size={16} />}
              </button>
            )}
          </div>
        )}

        {/* History */}
        {hasExtension("history") && (
          <div className="luthor-toolbar-section">
            <button onClick={() => commands.undo()} disabled={!activeStates.canUndo} className="luthor-toolbar-button" title="Undo (Ctrl+Z)"><ArrowCounterClockwise size={16} /></button>
            <button onClick={() => commands.redo()} disabled={!activeStates.canRedo} className="luthor-toolbar-button" title="Redo (Ctrl+Y)"><ArrowClockwise size={16} /></button>
          </div>
        )}

        {/* Command Palette */}
        <div className="luthor-toolbar-section">
          <button onClick={onCommandPaletteOpen} className="luthor-toolbar-button" title="Command Palette (Ctrl+K)"><Command size={16} /></button>
        </div>

        {/* Theme Toggle */}
        <div className="luthor-toolbar-section">
          <button onClick={toggleTheme} className="luthor-toolbar-button" title={isDark ? "Light Mode" : "Dark Mode"}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      {/* Table Dialog */}
      <Dialog isOpen={showTableDialog} onClose={() => setShowTableDialog(false)} title="Insert Table">
        <div className="luthor-table-dialog">
          <div className="luthor-form-group">
            <label htmlFor="table-rows">Rows:</label>
            <input id="table-rows" type="number" min="1" max="20" value={tableConfig.rows} onChange={(e) => setTableConfig((prev) => ({ ...prev, rows: parseInt(e.target.value) || 1 }))} className="luthor-input" />
          </div>
          <div className="luthor-form-group">
            <label htmlFor="table-columns">Columns:</label>
            <input id="table-columns" type="number" min="1" max="20" value={tableConfig.columns} onChange={(e) => setTableConfig((prev) => ({ ...prev, columns: parseInt(e.target.value) || 1 }))} className="luthor-input" />
          </div>
          <div className="luthor-form-group">
            <label className="luthor-checkbox-label">
              <input type="checkbox" checked={tableConfig.includeHeaders || false} onChange={(e) => setTableConfig((prev) => ({ ...prev, includeHeaders: e.target.checked }))} className="luthor-checkbox" />
              Include headers
            </label>
          </div>
          <div className="luthor-dialog-actions">
            <button onClick={() => setShowTableDialog(false)} className="luthor-button-secondary">Cancel</button>
            <button onClick={() => { commands.insertTable(tableConfig); setShowTableDialog(false); }} className="luthor-button-primary">Insert Table</button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

// Mode Tabs Component
function ModeTabs({ mode, onModeChange }: { mode: EditorMode; onModeChange: (mode: EditorMode) => void }) {
  return (
    <div className="luthor-mode-tabs">
      <button className={`luthor-mode-tab ${mode === "visual" ? "active" : ""}`} onClick={() => onModeChange("visual")}>Visual</button>
      <button className={`luthor-mode-tab ${mode === "html" ? "active" : ""}`} onClick={() => onModeChange("html")}>HTML</button>
      <button className={`luthor-mode-tab ${mode === "markdown" ? "active" : ""}`} onClick={() => onModeChange("markdown")}>Markdown</button>
    </div>
  );
}

// HTML Source View
function HTMLSourceView({ htmlContent, onHtmlChange }: { htmlContent: string; onHtmlChange: (html: string) => void }) {
  return <textarea className="luthor-html-view" value={htmlContent} onChange={(e) => onHtmlChange(e.target.value)} placeholder="Enter HTML content..." spellCheck={false} />;
}

// Markdown Source View
function MarkdownSourceView({ markdownContent, onMarkdownChange }: { markdownContent: string; onMarkdownChange: (markdown: string) => void }) {
  return <textarea className="luthor-html-view" value={markdownContent} onChange={(e) => onMarkdownChange(e.target.value)} placeholder="Enter Markdown content..." spellCheck={false} />;
}

// Error Boundary
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Editor Content Component
function EditorContent({
  className,
  isDark,
  toggleTheme,
  onReady,
}: {
  className?: string;
  isDark: boolean;
  toggleTheme: () => void;
  onReady?: (methods: DefaultTemplateRef) => void;
}) {
  const { commands, hasExtension, activeStates, lexical: editor } = useEditor();
  const [mode, setMode] = useState<EditorMode>("visual");
  const [content, setContent] = useState({ html: "", markdown: "" });
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const commandsRef = useRef<EditorCommands>(commands);
  const readyRef = useRef(false);

  useEffect(() => {
    commandsRef.current = commands;
  }, [commands]);

  const methods = useMemo<DefaultTemplateRef>(
    () => ({
      injectMarkdown: (content: string) => {
        setTimeout(() => {
          if (editor) {
            editor.update(() => {
              commandsRef.current.importFromMarkdown(content, { immediate: true, preventFocus: true });
            });
          }
        }, 100); // Small delay to ensure editor is ready
      },
      injectHTML: (content: string) => {
        setTimeout(() => {
          if (editor) {
            editor.update(() => {
              commandsRef.current.importFromHTML(content, { preventFocus: true });
            });
          }
        }, 100);
      },
      getMarkdown: () => commandsRef.current.exportToMarkdown(),
      getHTML: () => commandsRef.current.exportToHTML(),
    }),
    [editor],
  );

  useEffect(() => {
    if (!editor || !commands) return;

    const paletteCommands = commandsToCommandPaletteItems(commands);
    paletteCommands.forEach((cmd) => commands.registerCommand(cmd));

    const originalShowCommand = commands.showCommandPalette;
    (commands as any).showCommandPalette = () => setCommandPaletteOpen(true);

    const unregisterShortcuts = registerKeyboardShortcuts(commands, document.body);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    if (!readyRef.current) {
      readyRef.current = true;
      onReady?.(methods);
    }

    return () => {
      unregisterShortcuts();
      document.removeEventListener("keydown", handleKeyDown);
      (commands as any).showCommandPalette = originalShowCommand;
    };
  }, [editor, commands, onReady, methods]);

  const handleHtmlChange = (html: string) => setContent((prev) => ({ ...prev, html }));

  const handleMarkdownChange = (markdown: string) => setContent((prev) => ({ ...prev, markdown }));

  const handleModeChange = async (newMode: EditorMode) => {
    // Import when leaving markdown/html mode to visual
    if (mode === "markdown" && newMode !== "markdown" && hasExtension("markdown")) {
      await commands.importFromMarkdown(content.markdown, { immediate: true });
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    if (mode === "html" && newMode !== "html" && hasExtension("html")) {
      await commands.importFromHTML(content.html);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Export when entering markdown/html mode from visual
    if (newMode === "markdown" && mode !== "markdown" && hasExtension("markdown")) {
      await new Promise(resolve => setTimeout(resolve, 50));
      const markdown = commands.exportToMarkdown();
      setContent((prev) => ({ ...prev, markdown }));
    }
    if (newMode === "html" && mode !== "html" && hasExtension("html")) {
      await new Promise(resolve => setTimeout(resolve, 50));
      const html = commands.exportToHTML();
      setContent((prev) => ({ ...prev, html }));
    }
    
    setMode(newMode);
    if (newMode === "visual") {
      setTimeout(() => editor?.focus(), 100);
    }
  };

  return (
    <>
      <div className="luthor-editor-header">
        <ModeTabs mode={mode} onModeChange={handleModeChange} />
        {mode === "visual" && (
          <Toolbar
            commands={commands}
            hasExtension={hasExtension}
            activeStates={activeStates}
            isDark={isDark}
            toggleTheme={toggleTheme}
            onCommandPaletteOpen={() => setCommandPaletteOpen(true)}
          />
        )}
      </div>
      <div className="luthor-editor">
        <div className="flex flex-col flex-1" style={{ display: mode === "visual" ? "flex" : "none" }}>
          <RichTextPlugin
            contentEditable={<ContentEditable className="luthor-content-editable" />}
            placeholder={<div className="luthor-placeholder">Start typing...</div>}
            ErrorBoundary={ErrorBoundary}
          />
          <FloatingToolbarRenderer />
        </div>
        {mode === "html" && <HTMLSourceView htmlContent={content.html} onHtmlChange={handleHtmlChange} />}
        {mode === "markdown" && <MarkdownSourceView markdownContent={content.markdown} onMarkdownChange={handleMarkdownChange} />}
      </div>
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} commands={commandsToCommandPaletteItems(commands)} />
    </>
  );
}

// Main DefaultTemplate Component
interface DefaultTemplateProps {
  className?: string;
  onReady?: (methods: DefaultTemplateRef) => void;
}

export const DefaultTemplate = forwardRef<DefaultTemplateRef, DefaultTemplateProps>(({ className, onReady }, ref) => {
  const { theme: globalTheme } = useTheme();
  const [editorTheme, setEditorTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (globalTheme === "dark" || globalTheme === "light") {
      setEditorTheme(globalTheme);
    }
  }, [globalTheme]);

  const isDark = editorTheme === "dark";

  useEffect(() => {
    imageExtension.configure({
      uploadHandler: async (file: File) => URL.createObjectURL(file),
      defaultAlignment: "center",
      resizable: true,
      pasteListener: { insert: true, replace: true },
      debug: false,
    });
  }, []);

  const toggleTheme = () => setEditorTheme(isDark ? "light" : "dark");

  // Expose methods via ref
  const [methods, setMethods] = useState<DefaultTemplateRef | null>(null);
  React.useImperativeHandle(ref, () => methods as DefaultTemplateRef, [methods]);

  const handleReady = (m: DefaultTemplateRef) => {
    setMethods(m);
    onReady?.(m);
  };

  return (
    <div className={`luthor-editor-wrapper ${className || ""}`} data-editor-theme={editorTheme}>
      <Provider extensions={extensions} config={{ theme: defaultTheme }}>
        <EditorContent className={className} isDark={isDark} toggleTheme={toggleTheme} onReady={handleReady} />
      </Provider>
    </div>
  );
});

DefaultTemplate.displayName = "DefaultTemplate";