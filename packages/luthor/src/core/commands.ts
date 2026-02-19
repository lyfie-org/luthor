import type { CommandPaletteItem, SlashCommandItem } from "@lyfie/luthor-headless";
import type { CoreEditorCommands } from "./types";

export type KeyboardShortcut = {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  preventDefault?: boolean;
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;

  if (target.closest('[contenteditable="true"]')) return true;

  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select";
}

function isNativeLexicalShortcutConflict(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  if (!isEditableTarget(event.target)) return false;

  const shortcutKey = shortcut.key.toLowerCase();
  const usesPrimaryModifier = !!shortcut.ctrlKey || !!shortcut.metaKey;

  if (!usesPrimaryModifier || shortcut.altKey) return false;

  const isBoldItalicUnderline = shortcutKey === "b" || shortcutKey === "i" || shortcutKey === "u";
  const isLink = shortcutKey === "k";
  const isUndoRedo =
    shortcutKey === "z" ||
    shortcutKey === "y";

  return isBoldItalicUnderline || isLink || isUndoRedo;
}

export type CommandConfig = {
  id: string;
  label: string;
  description?: string;
  category: string;
  action: (commands: CoreEditorCommands) => void;
  shortcuts?: KeyboardShortcut[];
  keywords?: string[];
  condition?: (commands: CoreEditorCommands) => boolean;
};

function supportsCodeLanguageCommands(commands: CoreEditorCommands): boolean {
  return (
    typeof commands.setCodeLanguage === "function" &&
    typeof commands.autoDetectCodeLanguage === "function"
  );
}

function supportsSubscript(commands: CoreEditorCommands): boolean {
  return typeof commands.toggleSubscript === "function";
}

function supportsSuperscript(commands: CoreEditorCommands): boolean {
  return typeof commands.toggleSuperscript === "function";
}

function supportsIframeEmbed(commands: CoreEditorCommands): boolean {
  return typeof commands.insertIframeEmbed === "function";
}

function supportsYouTubeEmbed(commands: CoreEditorCommands): boolean {
  return typeof commands.insertYouTubeEmbed === "function";
}

function supportsEmoji(commands: CoreEditorCommands): boolean {
  return typeof commands.insertEmoji === "function";
}

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
      id: "format.subscript",
      label: "Toggle Subscript",
      description: "Format text as subscript",
      category: "Format",
      action: (commands) => commands.toggleSubscript?.(),
      keywords: ["subscript", "format"],
      condition: supportsSubscript,
    },
    {
      id: "format.superscript",
      label: "Toggle Superscript",
      description: "Format text as superscript",
      category: "Format",
      action: (commands) => commands.toggleSuperscript?.(),
      keywords: ["superscript", "format"],
      condition: supportsSuperscript,
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
      id: "block.align-left",
      label: "Align Left",
      description: "Align selected blocks to the left",
      category: "Block",
      action: (commands) => commands.setTextAlignment("left"),
      keywords: ["align", "left", "text"],
    },
    {
      id: "block.align-center",
      label: "Align Center",
      description: "Center-align selected blocks",
      category: "Block",
      action: (commands) => commands.setTextAlignment("center"),
      keywords: ["align", "center", "text"],
    },
    {
      id: "block.align-right",
      label: "Align Right",
      description: "Align selected blocks to the right",
      category: "Block",
      action: (commands) => commands.setTextAlignment("right"),
      keywords: ["align", "right", "text"],
    },
    {
      id: "block.align-justify",
      label: "Justify",
      description: "Justify selected blocks",
      category: "Block",
      action: (commands) => commands.setTextAlignment("justify"),
      keywords: ["align", "justify", "text"],
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
      id: "block.code-language",
      label: "Set Code Language",
      description: "Set language for selected code block",
      category: "Block",
      action: (commands) => {
        if (!commands.setCodeLanguage) return;
        const language = prompt("Code language (e.g. ts, css, python):")?.trim();
        if (!language) return;
        commands.setCodeLanguage(language);
      },
      keywords: ["code", "language", "syntax"],
      condition: supportsCodeLanguageCommands,
    },
    {
      id: "block.code-language.auto",
      label: "Auto-Detect Code Language",
      description: "Detect language from selected code block",
      category: "Block",
      action: (commands) => {
        void commands.autoDetectCodeLanguage?.();
      },
      keywords: ["code", "language", "auto", "detect"],
      condition: supportsCodeLanguageCommands,
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
      id: "list.check",
      label: "Checklist",
      description: "Create or toggle checklist",
      category: "List",
      action: (commands) => commands.toggleCheckList(),
      shortcuts: [{ key: "x", ctrlKey: true, shiftKey: true }],
      keywords: ["list", "check", "todo", "task"],
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
      keywords: ["horizontal", "rule", "hr", "divider", "separator"],
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
      id: "insert.gif",
      label: "Insert GIF",
      description: "Insert an animated GIF from URL",
      category: "Insert",
      action: (commands) => {
        const src = prompt("Enter GIF URL:");
        if (!src) {
          return;
        }
        commands.insertImage({ src, alt: "GIF" });
      },
      keywords: ["gif", "animated", "image"],
    },
    {
      id: "insert.emoji",
      label: "Insert Emoji",
      description: "Insert an emoji character",
      category: "Insert",
      action: (commands) => {
        const value = prompt("Enter emoji or shortcode (example :sparkles:):")?.trim();
        if (!value || typeof commands.insertEmoji !== "function") {
          return;
        }

        const shortcodeMatch = value.match(/^:([a-z0-9_+-]+):$/i);
        if (shortcodeMatch && typeof commands.getEmojiSuggestions === "function") {
          const [match] = commands.getEmojiSuggestions(shortcodeMatch[1]);
          if (match?.emoji) {
            commands.insertEmoji(match.emoji);
            return;
          }
        }

        commands.insertEmoji(value);
      },
      keywords: ["emoji", "reaction", "symbol", "smile"],
      condition: supportsEmoji,
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
      id: "insert.iframe",
      label: "Insert iframe",
      description: "Insert an iframe embed from URL",
      category: "Insert",
      action: (commands) => {
        if (typeof commands.insertIframeEmbed !== "function") {
          return;
        }

        const inputUrl = prompt("Enter iframe URL:");
        if (!inputUrl) return;

        commands.insertIframeEmbed(inputUrl);
      },
      keywords: ["iframe", "embed", "url"],
      condition: supportsIframeEmbed,
    },
    {
      id: "insert.youtube",
      label: "Insert YouTube Video",
      description: "Insert an embedded YouTube video",
      category: "Insert",
      action: (commands) => {
        if (typeof commands.insertYouTubeEmbed !== "function") {
          return;
        }

        const inputUrl = prompt("Enter YouTube URL:");
        if (!inputUrl) return;

        commands.insertYouTubeEmbed(inputUrl);
      },
      keywords: ["youtube", "video", "embed"],
      condition: supportsYouTubeEmbed,
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

export function commandsToCommandPaletteItems(commands: CoreEditorCommands): CommandPaletteItem[] {
  return generateCommands().map((command) => ({
    id: command.id,
    label: command.label,
    description: command.description,
    category: command.category,
    action: () => command.action(commands),
    keywords: command.keywords,
    shortcut: command.shortcuts?.[0] ? formatShortcut(command.shortcuts[0]) : undefined,
  }));
}

export function commandsToSlashCommandItems(commands: CoreEditorCommands): SlashCommandItem[] {
  const creatableBlockCommandIds = new Set([
    "block.heading1",
    "block.heading2",
    "block.heading3",
    "block.paragraph",
    "block.quote",
    "block.codeblock",
  ]);

  const isCreatableSlashCommand = (command: CommandConfig): boolean => {
    if (command.category === "Insert" || command.category === "List") {
      return true;
    }

    if (command.category === "Block") {
      return creatableBlockCommandIds.has(command.id);
    }

    return false;
  };

  return generateCommands()
    .filter(isCreatableSlashCommand)
    .map((command) => ({
      id: command.id,
      label: command.label,
      description: command.description,
      category: command.category,
      action: () => command.action(commands),
      keywords: command.keywords,
      shortcut: command.shortcuts?.[0] ? formatShortcut(command.shortcuts[0]) : undefined,
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

export function registerKeyboardShortcuts(commands: CoreEditorCommands, element: HTMLElement = document.body): () => void {
  const commandConfigs = generateCommands();

  const handleKeyDown = (event: KeyboardEvent) => {
    for (const config of commandConfigs) {
      if (!config.shortcuts) continue;

      for (const shortcut of config.shortcuts) {
        if (isNativeLexicalShortcutConflict(event, shortcut)) {
          continue;
        }

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