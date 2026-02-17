import type { CommandPaletteItem } from "@lyfie/luthor-headless";

export type EditorCommands = Record<string, any>;

export type KeyboardShortcut = {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  preventDefault?: boolean;
};

export type CommandConfig = {
  id: string;
  label: string;
  description?: string;
  category: string;
  action: (commands: EditorCommands) => void;
  shortcuts?: KeyboardShortcut[];
  keywords?: string[];
  condition?: (commands: EditorCommands) => boolean;
};

export function generateCommands(): CommandConfig[] {
  return [
    {
      id: "format.bold",
      label: "Toggle Bold",
      description: "Make text bold or remove bold formatting",
      category: "Format",
      action: (commands) => commands.toggleBold(),
      shortcuts: [{ key: "b", ctrlKey: true }],
      keywords: ["bold", "strong", "format"],
    },
    {
      id: "format.italic",
      label: "Toggle Italic",
      description: "Make text italic or remove italic formatting",
      category: "Format",
      action: (commands) => commands.toggleItalic(),
      shortcuts: [{ key: "i", ctrlKey: true }],
      keywords: ["italic", "emphasis", "format"],
    },
    {
      id: "format.underline",
      label: "Toggle Underline",
      description: "Add or remove underline formatting",
      category: "Format",
      action: (commands) => commands.toggleUnderline(),
      shortcuts: [{ key: "u", ctrlKey: true }],
      keywords: ["underline", "format"],
    },
    {
      id: "format.strikethrough",
      label: "Toggle Strikethrough",
      description: "Add or remove strikethrough formatting",
      category: "Format",
      action: (commands) => commands.toggleStrikethrough(),
      keywords: ["strikethrough", "format"],
    },
    {
      id: "format.code",
      label: "Toggle Inline Code",
      description: "Format text as inline code",
      category: "Format",
      action: (commands) => commands.formatText("code"),
      shortcuts: [{ key: "`", ctrlKey: true }],
      keywords: ["code", "inline", "format"],
    },
    {
      id: "block.heading1",
      label: "Heading 1",
      description: "Convert to large heading",
      category: "Block",
      action: (commands) => commands.toggleHeading("h1"),
      shortcuts: [{ key: "1", ctrlKey: true, altKey: true }],
      keywords: ["heading", "h1"],
    },
    {
      id: "block.heading2",
      label: "Heading 2",
      description: "Convert to medium heading",
      category: "Block",
      action: (commands) => commands.toggleHeading("h2"),
      shortcuts: [{ key: "2", ctrlKey: true, altKey: true }],
      keywords: ["heading", "h2"],
    },
    {
      id: "block.heading3",
      label: "Heading 3",
      description: "Convert to small heading",
      category: "Block",
      action: (commands) => commands.toggleHeading("h3"),
      shortcuts: [{ key: "3", ctrlKey: true, altKey: true }],
      keywords: ["heading", "h3"],
    },
    {
      id: "block.paragraph",
      label: "Paragraph",
      description: "Convert to paragraph",
      category: "Block",
      action: (commands) => commands.toggleParagraph(),
      shortcuts: [{ key: "0", ctrlKey: true, altKey: true }],
      keywords: ["paragraph", "text"],
    },
    {
      id: "block.quote",
      label: "Quote",
      description: "Convert to blockquote",
      category: "Block",
      action: (commands) => commands.toggleQuote(),
      keywords: ["quote", "blockquote"],
    },
    {
      id: "block.codeblock",
      label: "Code Block",
      description: "Convert to code block",
      category: "Block",
      action: (commands) => commands.toggleCodeBlock(),
      shortcuts: [{ key: "`", ctrlKey: true, shiftKey: true }],
      keywords: ["code", "block"],
    },
    {
      id: "list.bullet",
      label: "Bullet List",
      description: "Create or toggle bullet list",
      category: "List",
      action: (commands) => commands.toggleUnorderedList(),
      shortcuts: [{ key: "l", ctrlKey: true, shiftKey: true }],
      keywords: ["list", "bullet"],
    },
    {
      id: "list.numbered",
      label: "Numbered List",
      description: "Create or toggle numbered list",
      category: "List",
      action: (commands) => commands.toggleOrderedList(),
      shortcuts: [{ key: "l", ctrlKey: true, altKey: true }],
      keywords: ["list", "numbered"],
    },
    {
      id: "link.insert",
      label: "Insert Link",
      description: "Insert or edit a link",
      category: "Insert",
      action: (commands) => commands.insertLink(),
      shortcuts: [{ key: "k", ctrlKey: true }],
      keywords: ["link", "url"],
    },
    {
      id: "link.remove",
      label: "Remove Link",
      description: "Remove link formatting",
      category: "Format",
      action: (commands) => commands.removeLink(),
      shortcuts: [{ key: "k", ctrlKey: true, shiftKey: true }],
      keywords: ["unlink", "remove", "link"],
    },
    {
      id: "insert.horizontal-rule",
      label: "Insert Horizontal Rule",
      description: "Insert a horizontal line separator",
      category: "Insert",
      action: (commands) => commands.insertHorizontalRule(),
      keywords: ["horizontal", "rule"],
    },
    {
      id: "insert.image",
      label: "Insert Image",
      description: "Insert an image from URL",
      category: "Insert",
      action: (commands) => {
        const src = prompt("Enter image URL:");
        if (src) {
          const alt = prompt("Enter alt text:") || "";
          commands.insertImage({ src, alt });
        }
      },
      keywords: ["image", "photo"],
    },
    {
      id: "insert.table",
      label: "Insert Table",
      description: "Insert a 3x3 table",
      category: "Insert",
      action: (commands) => commands.insertTable({ rows: 3, columns: 3, includeHeaders: true }),
      keywords: ["table", "grid"],
    },
    {
      id: "insert.html-embed",
      label: "Insert HTML Embed",
      description: "Insert a custom HTML block",
      category: "Insert",
      action: (commands) => commands.insertHTMLEmbed(),
      keywords: ["html", "embed"],
    },
    {
      id: "edit.undo",
      label: "Undo",
      description: "Undo the last action",
      category: "Edit",
      action: (commands) => commands.undo(),
      shortcuts: [{ key: "z", ctrlKey: true }],
      keywords: ["undo", "revert"],
    },
    {
      id: "edit.redo",
      label: "Redo",
      description: "Redo the last undone action",
      category: "Edit",
      action: (commands) => commands.redo(),
      shortcuts: [
        { key: "y", ctrlKey: true },
        { key: "z", ctrlKey: true, shiftKey: true },
      ],
      keywords: ["redo", "repeat"],
    },
    {
      id: "palette.show",
      label: "Show Command Palette",
      description: "Open the command palette",
      category: "View",
      action: (commands) => commands.showCommandPalette(),
      shortcuts: [{ key: "p", ctrlKey: true, shiftKey: true }],
      keywords: ["command", "palette"],
    },
  ];
}

export function commandsToCommandPaletteItems(
  commands: EditorCommands,
): CommandPaletteItem[] {
  return generateCommands().map((cmd) => ({
    id: cmd.id,
    label: cmd.label,
    description: cmd.description,
    category: cmd.category,
    action: () => cmd.action(commands),
    keywords: cmd.keywords,
    shortcut: cmd.shortcuts?.[0] ? formatShortcut(cmd.shortcuts[0]) : undefined,
  }));
}

function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  if (shortcut.ctrlKey) parts.push("Ctrl");
  if (shortcut.metaKey) parts.push("Cmd");
  if (shortcut.altKey) parts.push("Alt");
  if (shortcut.shiftKey) parts.push("Shift");
  parts.push(shortcut.key.toUpperCase());
  return parts.join("+");
}

export function registerKeyboardShortcuts(
  commands: EditorCommands,
  element: HTMLElement = document.body,
): () => void {
  const commandConfigs = generateCommands();

  const handleKeyDown = (event: KeyboardEvent) => {
    for (const config of commandConfigs) {
      if (!config.shortcuts) continue;

      for (const shortcut of config.shortcuts) {
        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          !!event.ctrlKey === !!shortcut.ctrlKey &&
          !!event.metaKey === !!shortcut.metaKey &&
          !!event.shiftKey === !!shortcut.shiftKey &&
          !!event.altKey === !!shortcut.altKey
        ) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }

          if (!config.condition || config.condition(commands)) {
            config.action(commands);
          }
          return;
        }
      }
    }
  };

  element.addEventListener("keydown", handleKeyDown);
  return () => element.removeEventListener("keydown", handleKeyDown);
}
