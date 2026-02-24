import { ExtensiveEditor, type ExtensiveEditorProps } from "../extensive";

export type NotesEditorProps = Omit<ExtensiveEditorProps, "featureFlags"> & {
  showTitle?: boolean;
  title?: string;
  onTitleChange?: (value: string) => void;
  showActions?: boolean;
  onPin?: () => void;
  onArchive?: () => void;
  onColorChange?: (color: string) => void;
  colorOptions?: readonly string[];
};

export function NotesEditor({
  className,
  variantClassName,
  showTitle = true,
  title = "",
  onTitleChange,
  showActions = true,
  onPin,
  onArchive,
  onColorChange,
  colorOptions = ["#fef3c7", "#dbeafe", "#dcfce7"],
  ...props
}: NotesEditorProps) {
  return (
    <div className={["luthor-preset-notes", className].filter(Boolean).join(" ")}>
      {showTitle && (
        <input
          data-testid="notes-title"
          className="luthor-notes-title"
          placeholder="Title"
          value={title}
          onChange={(event) => onTitleChange?.(event.target.value)}
        />
      )}
      {showActions && (
        <div className="luthor-notes-actions" data-testid="notes-actions">
          <button type="button" onClick={onPin} aria-label="Pin note">Pin</button>
          <button type="button" onClick={onArchive} aria-label="Archive note">Archive</button>
          <select aria-label="Change note color" onChange={(event) => onColorChange?.(event.target.value)}>
            {colorOptions.map((color) => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>
        </div>
      )}
      <ExtensiveEditor
        {...props}
        variantClassName={["luthor-preset-notes__variant", variantClassName]
          .filter(Boolean)
          .join(" ")}
        featureFlags={{
          bold: true,
          italic: true,
          underline: true,
          strikethrough: false,
          link: true,
          list: true,
          blockFormat: false,
          table: false,
          image: false,
          iframeEmbed: false,
          youTubeEmbed: false,
          commandPalette: false,
          slashCommand: false,
          draggableBlock: false,
          customNode: false,
          emoji: false,
        }}
        isToolbarEnabled={false}
      />
    </div>
  );
}
