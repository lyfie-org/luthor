import { useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  CodeBlockIcon,
  CodeIcon,
  CommandIcon,
  FileCodeIcon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  MoonIcon,
  PencilIcon,
  RedoIcon,
  UndoIcon,
  SunIcon,
  TableIcon,
  TypeIcon,
  UnderlineIcon,
  UnlinkIcon,
  UploadIcon,
  EyeIcon,
  IndentIcon,
  OutdentIcon,
  QuoteIcon,
  StrikethroughIcon,
} from "./icons";
import { Button, Dialog, Dropdown, IconButton, Select } from "./ui";
import type { CoreEditorActiveStates, CoreEditorCommands, CoreToolbarClassNames, InsertTableConfig, ImageAlignment } from "./types";

function useImageHandlers(commands: CoreEditorCommands, imageUploadHandler?: (file: File) => Promise<string>) {
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
      handleUpload: async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        let src: string;
        if (imageUploadHandler) {
          try {
            src = await imageUploadHandler(file);
          } catch {
            alert("Failed to upload image");
            return;
          }
        } else {
          src = URL.createObjectURL(file);
        }
        commands.insertImage({ src, alt: file.name, file });
        event.target.value = "";
      },
      setAlignment: (alignment: ImageAlignment) => {
        commands.setImageAlignment(alignment);
      },
      setCaption: () => {
        const newCaption = prompt("Enter caption:") || "";
        commands.setImageCaption(newCaption);
      },
    }),
    [commands, imageUploadHandler],
  );

  return { handlers, fileInputRef };
}

export interface ToolbarProps {
  commands: CoreEditorCommands;
  hasExtension: (name: string) => boolean;
  activeStates: CoreEditorActiveStates;
  isDark: boolean;
  toggleTheme: () => void;
  onCommandPaletteOpen: () => void;
  imageUploadHandler?: (file: File) => Promise<string>;
  classNames?: CoreToolbarClassNames;
}

export function Toolbar({
  commands,
  hasExtension,
  activeStates,
  isDark,
  toggleTheme,
  onCommandPaletteOpen,
  imageUploadHandler,
  classNames,
}: ToolbarProps) {
  const { handlers, fileInputRef } = useImageHandlers(commands, imageUploadHandler);
  const [showImageDropdown, setShowImageDropdown] = useState(false);
  const [showAlignDropdown, setShowAlignDropdown] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [tableConfig, setTableConfig] = useState<InsertTableConfig>({
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
  ];

  const currentBlockFormat =
    activeStates.isH1 ? "h1" :
    activeStates.isH2 ? "h2" :
    activeStates.isH3 ? "h3" :
    activeStates.isH4 ? "h4" :
    activeStates.isH5 ? "h5" :
    activeStates.isH6 ? "h6" :
    "p";

  const handleBlockFormatChange = (value: string) => {
    if (value === "p") commands.toggleParagraph();
    else if (value.startsWith("h")) commands.toggleHeading(value as "h1" | "h2" | "h3" | "h4" | "h5" | "h6");
  };

  return (
    <>
      <div className={classNames?.toolbar ?? "luthor-toolbar"}>
        <div className={classNames?.section ?? "luthor-toolbar-section"}>
          <IconButton onClick={() => commands.toggleBold()} active={activeStates.bold} title="Bold (Ctrl+B)">
            <BoldIcon size={16} />
          </IconButton>
          <IconButton onClick={() => commands.toggleItalic()} active={activeStates.italic} title="Italic (Ctrl+I)">
            <ItalicIcon size={16} />
          </IconButton>
          <IconButton onClick={() => commands.toggleUnderline()} active={activeStates.underline} title="Underline (Ctrl+U)">
            <UnderlineIcon size={16} />
          </IconButton>
          <IconButton onClick={() => commands.toggleStrikethrough()} active={activeStates.strikethrough} title="Strikethrough">
            <StrikethroughIcon size={16} />
          </IconButton>
          <IconButton onClick={() => commands.formatText("code")} active={activeStates.code} title="Inline Code">
            <CodeIcon size={16} />
          </IconButton>
          <IconButton
            onClick={() => (activeStates.isLink ? commands.removeLink() : commands.insertLink())}
            active={activeStates.isLink}
            title={activeStates.isLink ? "Remove Link" : "Insert Link"}
          >
            {activeStates.isLink ? <UnlinkIcon size={16} /> : <LinkIcon size={16} />}
          </IconButton>
        </div>

        {hasExtension("blockFormat") && (
          <div className={classNames?.section ?? "luthor-toolbar-section"}>
            <Select value={currentBlockFormat} onValueChange={handleBlockFormatChange} options={blockFormatOptions} placeholder="Format" />
            <IconButton onClick={() => commands.toggleQuote()} active={activeStates.isQuote} title="Quote">
              <QuoteIcon size={16} />
            </IconButton>
            <IconButton onClick={() => commands.setTextAlignment("left")} active={activeStates.isTextAlignedLeft} title="Align Left">
              <AlignLeftIcon size={16} />
            </IconButton>
            <IconButton onClick={() => commands.setTextAlignment("center")} active={activeStates.isTextAlignedCenter} title="Align Center">
              <AlignCenterIcon size={16} />
            </IconButton>
            <IconButton onClick={() => commands.setTextAlignment("right")} active={activeStates.isTextAlignedRight} title="Align Right">
              <AlignRightIcon size={16} />
            </IconButton>
            <IconButton onClick={() => commands.setTextAlignment("justify")} active={activeStates.isTextAlignedJustify} title="Justify">
              <AlignJustifyIcon size={16} />
            </IconButton>
            {hasExtension("code") && (
              <IconButton onClick={() => commands.toggleCodeBlock()} active={activeStates.isInCodeBlock} title="Code Block">
                <CodeBlockIcon size={16} />
              </IconButton>
            )}
          </div>
        )}

        {hasExtension("list") && (
          <div className={classNames?.section ?? "luthor-toolbar-section"}>
            <IconButton onClick={() => commands.toggleUnorderedList()} active={activeStates.unorderedList} title="Bullet List">
              <ListIcon size={16} />
            </IconButton>
            <IconButton onClick={() => commands.toggleOrderedList()} active={activeStates.orderedList} title="Numbered List">
              <ListOrderedIcon size={16} />
            </IconButton>
            {(activeStates.unorderedList || activeStates.orderedList) && (
              <>
                <IconButton onClick={() => commands.indentList()} title="Indent List">
                  <IndentIcon size={14} />
                </IconButton>
                <IconButton onClick={() => commands.outdentList()} title="Outdent List">
                  <OutdentIcon size={14} />
                </IconButton>
              </>
            )}
          </div>
        )}

        {hasExtension("horizontalRule") && (
          <div className={classNames?.section ?? "luthor-toolbar-section"}>
            <IconButton onClick={() => commands.insertHorizontalRule()} title="Insert Horizontal Rule">
              <MinusIcon size={16} />
            </IconButton>
          </div>
        )}

        {hasExtension("table") && (
          <div className={classNames?.section ?? "luthor-toolbar-section"}>
            <IconButton onClick={() => setShowTableDialog(true)} title="Insert Table">
              <TableIcon size={16} />
            </IconButton>
          </div>
        )}

        {hasExtension("image") && (
          <div className={classNames?.section ?? "luthor-toolbar-section"}>
            <Dropdown
              trigger={
                <button className={`luthor-toolbar-button ${activeStates.imageSelected ? "active" : ""}`} title="Insert Image">
                  <ImageIcon size={16} />
                </button>
              }
              isOpen={showImageDropdown}
              onOpenChange={setShowImageDropdown}
            >
              <button className="luthor-dropdown-item" onClick={() => { handlers.insertFromUrl(); setShowImageDropdown(false); }}>
                <LinkIcon size={16} />
                <span>From URL</span>
              </button>
              <button className="luthor-dropdown-item" onClick={() => { handlers.insertFromFile(); setShowImageDropdown(false); }}>
                <UploadIcon size={16} />
                <span>Upload File</span>
              </button>
            </Dropdown>
            {activeStates.imageSelected && (
              <Dropdown
                trigger={
                  <button className="luthor-toolbar-button" title="Align Image">
                    <AlignCenterIcon size={16} />
                  </button>
                }
                isOpen={showAlignDropdown}
                onOpenChange={setShowAlignDropdown}
              >
                <button className="luthor-dropdown-item" onClick={() => { handlers.setAlignment("left"); setShowAlignDropdown(false); }}>
                  <AlignLeftIcon size={16} />
                  <span>Align Left</span>
                </button>
                <button className="luthor-dropdown-item" onClick={() => { handlers.setAlignment("center"); setShowAlignDropdown(false); }}>
                  <AlignCenterIcon size={16} />
                  <span>Align Center</span>
                </button>
                <button className="luthor-dropdown-item" onClick={() => { handlers.setAlignment("right"); setShowAlignDropdown(false); }}>
                  <AlignRightIcon size={16} />
                  <span>Align Right</span>
                </button>
                <button className="luthor-dropdown-item" onClick={() => { handlers.setCaption(); setShowAlignDropdown(false); }}>
                  <TypeIcon size={16} />
                  <span>Set Caption</span>
                </button>
              </Dropdown>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlers.handleUpload} className="luthor-file-input" />
          </div>
        )}

        {hasExtension("htmlEmbed") && (
          <div className={classNames?.section ?? "luthor-toolbar-section"}>
            <IconButton onClick={() => commands.insertHTMLEmbed()} active={activeStates.isHTMLEmbedSelected} title="Insert HTML Embed">
              <FileCodeIcon size={16} />
            </IconButton>
            {activeStates.isHTMLEmbedSelected && (
              <IconButton onClick={() => commands.toggleHTMLPreview()} title="Toggle Preview/Edit">
                {activeStates.isHTMLPreviewMode ? <EyeIcon size={16} /> : <PencilIcon size={16} />}
              </IconButton>
            )}
          </div>
        )}

        {hasExtension("history") && (
          <div className={classNames?.section ?? "luthor-toolbar-section"}>
            <IconButton onClick={() => commands.undo()} disabled={!activeStates.canUndo} title="Undo (Ctrl+Z)">
              <UndoIcon size={16} />
            </IconButton>
            <IconButton onClick={() => commands.redo()} disabled={!activeStates.canRedo} title="Redo (Ctrl+Y)">
              <RedoIcon size={16} />
            </IconButton>
          </div>
        )}

        <div className={classNames?.section ?? "luthor-toolbar-section"}>
          <IconButton onClick={onCommandPaletteOpen} title="Command Palette (Ctrl+Shift+P)">
            <CommandIcon size={16} />
          </IconButton>
        </div>

        <div className={classNames?.section ?? "luthor-toolbar-section"}>
          <IconButton onClick={toggleTheme} title={isDark ? "Light Mode" : "Dark Mode"}>
            {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
          </IconButton>
        </div>
      </div>

      <Dialog isOpen={showTableDialog} onClose={() => setShowTableDialog(false)} title="Insert Table">
        <div className="luthor-table-dialog">
          <div className="luthor-form-group">
            <label htmlFor="table-rows">Rows:</label>
            <input
              id="table-rows"
              type="number"
              min="1"
              max="20"
              value={tableConfig.rows}
              onChange={(event) => setTableConfig((prev) => ({ ...prev, rows: parseInt(event.target.value) || 1 }))}
              className="luthor-input"
            />
          </div>
          <div className="luthor-form-group">
            <label htmlFor="table-columns">Columns:</label>
            <input
              id="table-columns"
              type="number"
              min="1"
              max="20"
              value={tableConfig.columns}
              onChange={(event) => setTableConfig((prev) => ({ ...prev, columns: parseInt(event.target.value) || 1 }))}
              className="luthor-input"
            />
          </div>
          <div className="luthor-form-group">
            <label className="luthor-checkbox-label">
              <input
                type="checkbox"
                checked={tableConfig.includeHeaders || false}
                onChange={(event) => setTableConfig((prev) => ({ ...prev, includeHeaders: event.target.checked }))}
                className="luthor-checkbox"
              />
              Include headers
            </label>
          </div>
          <div className="luthor-dialog-actions">
            <Button variant="secondary" onClick={() => setShowTableDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                commands.insertTable(tableConfig);
                setShowTableDialog(false);
              }}
            >
              Insert Table
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}