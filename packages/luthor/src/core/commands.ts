import type { CommandPaletteItem, SlashCommandItem } from "@lyfie/luthor-headless";
import {
  BLOCK_HEADING_LEVELS,
  type BlockHeadingLevel,
  type CoreEditorCommands,
  type SlashCommandVisibility,
} from "./types";

export type KeyboardShortcut = {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  preventDefault?: boolean;
};

export type ShortcutBindingOverride =
  | KeyboardShortcut
  | readonly KeyboardShortcut[]
  | false
  | null;

export type ShortcutConfig = {
  disabledCommandIds?: readonly string[];
  bindings?: Readonly<Record<string, ShortcutBindingOverride>>;
  preventCollisions?: boolean;
  preventNativeConflicts?: boolean;
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;

  if (target.closest('[contenteditable="true"]')) return true;

  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select";
}

function isNativeLexicalShortcutConflict(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  if (!isEditableTarget(event.target)) return false;
  return isNativeShortcutConflict(shortcut);
}

function isNativeShortcutConflict(shortcut: KeyboardShortcut): boolean {
  const shortcutKey = shortcut.key.toLowerCase();
  const usesPrimaryModifier = !!shortcut.ctrlKey || !!shortcut.metaKey;

  if (!usesPrimaryModifier || shortcut.altKey) {
    return false;
  }

  const isBoldItalicUnderline = shortcutKey === "b" || shortcutKey === "i" || shortcutKey === "u";
  const isLink = shortcutKey === "k";
  return isBoldItalicUnderline || isLink;
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

export type CommandGenerationOptions = {
  headingOptions?: readonly BlockHeadingLevel[];
  paragraphLabel?: string;
  slashCommandVisibility?: SlashCommandVisibility;
  isFeatureEnabled?: (feature: string) => boolean;
  shortcutConfig?: ShortcutConfig;
  commandPaletteShortcutOnly?: boolean;
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

function getHeadingShortcutLevel(heading: BlockHeadingLevel): string {
  return heading.slice(1);
}

function getHeadingDescription(heading: BlockHeadingLevel): string {
  switch (heading) {
    case "h1":
      return "Convert to large heading";
    case "h2":
      return "Convert to medium heading";
    case "h3":
      return "Convert to small heading";
    case "h4":
      return "Convert to heading level 4";
    case "h5":
      return "Convert to heading level 5";
    case "h6":
      return "Convert to heading level 6";
  }
}

function resolveHeadingOptions(input?: readonly BlockHeadingLevel[]): BlockHeadingLevel[] {
  if (!input || input.length === 0) {
    return [...BLOCK_HEADING_LEVELS];
  }

  const seen = new Set<BlockHeadingLevel>();
  const resolved: BlockHeadingLevel[] = [];
  for (const heading of input) {
    if (!BLOCK_HEADING_LEVELS.includes(heading) || seen.has(heading)) {
      continue;
    }
    seen.add(heading);
    resolved.push(heading);
  }

  return resolved.length > 0 ? resolved : [...BLOCK_HEADING_LEVELS];
}

function resolveAvailableCommands(
  commands: CoreEditorCommands,
  options?: CommandGenerationOptions,
): CommandConfig[] {
  const resolvedCommands = applyShortcutConfig(generateCommands(options), options?.shortcutConfig);
  return resolvedCommands.filter((command) => !command.condition || command.condition(commands));
}

function isCommandAvailable(
  commands: CoreEditorCommands,
  key: keyof CoreEditorCommands,
): boolean {
  return typeof commands[key] === "function";
}

function normalizeCommandIdList(ids?: readonly string[]): Set<string> {
  if (!ids || ids.length === 0) {
    return new Set();
  }

  const normalized = ids
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  return new Set(normalized);
}

function resolveSlashCommandVisibility(
  visibility?: SlashCommandVisibility,
): { allowlist: Set<string>; denylist: Set<string> } {
  if (!visibility) {
    return { allowlist: new Set(), denylist: new Set() };
  }

  if (Array.isArray(visibility)) {
    const allowlist: string[] = [];
    for (const selection of visibility) {
      for (const [id, enabled] of Object.entries(selection)) {
        if (enabled) {
          allowlist.push(id);
        }
      }
    }

    return { allowlist: normalizeCommandIdList(allowlist), denylist: new Set() };
  }

  const visibilityFilters = visibility as {
    allowlist?: readonly string[];
    denylist?: readonly string[];
  };

  return {
    allowlist: normalizeCommandIdList(visibilityFilters.allowlist),
    denylist: normalizeCommandIdList(visibilityFilters.denylist),
  };
}

function normalizeShortcut(shortcut: KeyboardShortcut): KeyboardShortcut | null {
  const key = shortcut.key.trim();
  if (!key) {
    return null;
  }

  return {
    key,
    ctrlKey: !!shortcut.ctrlKey,
    metaKey: !!shortcut.metaKey,
    shiftKey: !!shortcut.shiftKey,
    altKey: !!shortcut.altKey,
    preventDefault: shortcut.preventDefault,
  };
}

function normalizeShortcutOverride(override: ShortcutBindingOverride): KeyboardShortcut[] {
  if (override === false || override === null) {
    return [];
  }

  const rawShortcuts = Array.isArray(override) ? override : [override];
  const normalized: KeyboardShortcut[] = [];
  for (const rawShortcut of rawShortcuts) {
    const shortcut = normalizeShortcut(rawShortcut);
    if (!shortcut) {
      continue;
    }
    normalized.push(shortcut);
  }
  return normalized;
}

function shortcutSignature(shortcut: KeyboardShortcut): string {
  return [
    shortcut.key.toLowerCase(),
    shortcut.ctrlKey ? "ctrl" : "",
    shortcut.metaKey ? "meta" : "",
    shortcut.shiftKey ? "shift" : "",
    shortcut.altKey ? "alt" : "",
  ].join(":");
}

function applyShortcutConfig(
  commands: readonly CommandConfig[],
  shortcutConfig?: ShortcutConfig,
): CommandConfig[] {
  if (!shortcutConfig) {
    return [...commands];
  }

  const disabledCommandIds = normalizeCommandIdList(shortcutConfig.disabledCommandIds);
  const bindings = shortcutConfig.bindings;
  const preventNativeConflicts = shortcutConfig.preventNativeConflicts !== false;
  const preventCollisions = shortcutConfig.preventCollisions !== false;
  const usedSignatures = new Set<string>();

  const resolvedCommands = commands
    .filter((command) => !disabledCommandIds.has(command.id))
    .map((command) => {
    let nextShortcuts = command.shortcuts ? [...command.shortcuts] : undefined;
    const hasOverride = !!bindings && Object.prototype.hasOwnProperty.call(bindings, command.id);

    if (hasOverride && bindings) {
      const override = bindings[command.id];
      const normalizedOverride = override === undefined
        ? []
        : normalizeShortcutOverride(override);
      nextShortcuts = normalizedOverride.length > 0 ? normalizedOverride : undefined;
    }

    if (nextShortcuts && nextShortcuts.length > 0) {
      const filtered: KeyboardShortcut[] = [];
      for (const shortcut of nextShortcuts) {
        const normalizedShortcut = normalizeShortcut(shortcut);
        if (!normalizedShortcut) {
          continue;
        }
        if (preventNativeConflicts && isNativeShortcutConflict(normalizedShortcut)) {
          continue;
        }

        const signature = shortcutSignature(normalizedShortcut);
        if (preventCollisions && usedSignatures.has(signature)) {
          continue;
        }
        usedSignatures.add(signature);
        filtered.push(normalizedShortcut);
      }
      nextShortcuts = filtered.length > 0 ? filtered : undefined;
    }

    return {
      ...command,
      shortcuts: nextShortcuts,
    };
  });

  return resolvedCommands;
}

export function generateCommands(options?: CommandGenerationOptions): CommandConfig[] {
  const isFeatureEnabled = options?.isFeatureEnabled ?? (() => true);
  const resolvedHeadingOptions = resolveHeadingOptions(options?.headingOptions);
  const resolvedParagraphLabel = options?.paragraphLabel?.trim() || "Paragraph";
  const headingCommands: CommandConfig[] = resolvedHeadingOptions.map((heading) => {
    const headingLevel = getHeadingShortcutLevel(heading);

    return {
      id: `block.heading${headingLevel}`,
      label: `Heading ${headingLevel}`,
      description: getHeadingDescription(heading),
      category: "Block",
      action: (commands) => commands.toggleHeading?.(heading),
      shortcuts: [{ key: headingLevel, ctrlKey: true, altKey: true }],
      keywords: ["heading", heading],
      condition: (commands) => isFeatureEnabled("blockFormat") && isCommandAvailable(commands, "toggleHeading"),
    };
  });

  return [
    {
      id: "format.bold",
      label: "Toggle Bold",
      description: "Make text bold or remove bold formatting",
      category: "Format",
      action: (commands) => commands.toggleBold?.(),
      shortcuts: [{ key: "b", ctrlKey: true }],
      keywords: ["bold", "strong", "format"],
      condition: (commands) => isFeatureEnabled("bold") && isCommandAvailable(commands, "toggleBold"),
    },
    {
      id: "format.italic",
      label: "Toggle Italic",
      description: "Make text italic or remove italic formatting",
      category: "Format",
      action: (commands) => commands.toggleItalic?.(),
      shortcuts: [{ key: "i", ctrlKey: true }],
      keywords: ["italic", "emphasis", "format"],
      condition: (commands) => isFeatureEnabled("italic") && isCommandAvailable(commands, "toggleItalic"),
    },
    {
      id: "format.underline",
      label: "Toggle Underline",
      description: "Add or remove underline formatting",
      category: "Format",
      action: (commands) => commands.toggleUnderline?.(),
      shortcuts: [{ key: "u", ctrlKey: true }],
      keywords: ["underline", "format"],
      condition: (commands) => isFeatureEnabled("underline") && isCommandAvailable(commands, "toggleUnderline"),
    },
    {
      id: "format.strikethrough",
      label: "Toggle Strikethrough",
      description: "Add or remove strikethrough formatting",
      category: "Format",
      action: (commands) => commands.toggleStrikethrough?.(),
      keywords: ["strikethrough", "format"],
      condition: (commands) => isFeatureEnabled("strikethrough") && isCommandAvailable(commands, "toggleStrikethrough"),
    },
    {
      id: "format.subscript",
      label: "Toggle Subscript",
      description: "Format text as subscript",
      category: "Format",
      action: (commands) => commands.toggleSubscript?.(),
      keywords: ["subscript", "format"],
      condition: (commands) => isFeatureEnabled("subscript") && supportsSubscript(commands),
    },
    {
      id: "format.superscript",
      label: "Toggle Superscript",
      description: "Format text as superscript",
      category: "Format",
      action: (commands) => commands.toggleSuperscript?.(),
      keywords: ["superscript", "format"],
      condition: (commands) => isFeatureEnabled("superscript") && supportsSuperscript(commands),
    },
    {
      id: "format.code",
      label: "Toggle Inline Code",
      description: "Format text as inline code",
      category: "Format",
      action: (commands) => commands.formatText?.("code"),
      shortcuts: [{ key: "`", ctrlKey: true }],
      keywords: ["code", "inline", "format"],
      condition: (commands) => isFeatureEnabled("codeFormat") && isCommandAvailable(commands, "formatText"),
    },
    {
      id: "block.paragraph",
      label: resolvedParagraphLabel,
      description: "Convert to paragraph",
      category: "Block",
      action: (commands) => commands.toggleParagraph?.(),
      shortcuts: [{ key: "0", ctrlKey: true, altKey: true }],
      keywords: ["paragraph", "text"],
      condition: (commands) => isFeatureEnabled("blockFormat") && isCommandAvailable(commands, "toggleParagraph"),
    },
    ...headingCommands,
    {
      id: "block.quote",
      label: "Quote",
      description: "Convert to blockquote",
      category: "Block",
      action: (commands) => commands.toggleQuote?.(),
      keywords: ["quote", "blockquote"],
      condition: (commands) => isFeatureEnabled("blockFormat") && isCommandAvailable(commands, "toggleQuote"),
    },
    {
      id: "block.align-left",
      label: "Align Left",
      description: "Align selected blocks to the left",
      category: "Block",
      action: (commands) => commands.setTextAlignment?.("left"),
      keywords: ["align", "left", "text"],
      condition: (commands) => isFeatureEnabled("blockFormat") && isCommandAvailable(commands, "setTextAlignment"),
    },
    {
      id: "block.align-center",
      label: "Align Center",
      description: "Center-align selected blocks",
      category: "Block",
      action: (commands) => commands.setTextAlignment?.("center"),
      keywords: ["align", "center", "text"],
      condition: (commands) => isFeatureEnabled("blockFormat") && isCommandAvailable(commands, "setTextAlignment"),
    },
    {
      id: "block.align-right",
      label: "Align Right",
      description: "Align selected blocks to the right",
      category: "Block",
      action: (commands) => commands.setTextAlignment?.("right"),
      keywords: ["align", "right", "text"],
      condition: (commands) => isFeatureEnabled("blockFormat") && isCommandAvailable(commands, "setTextAlignment"),
    },
    {
      id: "block.align-justify",
      label: "Justify",
      description: "Justify selected blocks",
      category: "Block",
      action: (commands) => commands.setTextAlignment?.("justify"),
      keywords: ["align", "justify", "text"],
      condition: (commands) => isFeatureEnabled("blockFormat") && isCommandAvailable(commands, "setTextAlignment"),
    },
    {
      id: "block.codeblock",
      label: "Code Block",
      description: "Convert to code block",
      category: "Block",
      action: (commands) => commands.toggleCodeBlock?.(),
      shortcuts: [{ key: "`", ctrlKey: true, shiftKey: true }],
      keywords: ["code", "block"],
      condition: (commands) => isFeatureEnabled("code") && isCommandAvailable(commands, "toggleCodeBlock"),
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
      condition: (commands) => isFeatureEnabled("codeIntelligence") && supportsCodeLanguageCommands(commands),
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
      condition: (commands) => isFeatureEnabled("codeIntelligence") && supportsCodeLanguageCommands(commands),
    },
    {
      id: "list.bullet",
      label: "Bullet List",
      description: "Create or toggle bullet list",
      category: "List",
      action: (commands) => commands.toggleUnorderedList?.(),
      shortcuts: [{ key: "l", ctrlKey: true, shiftKey: true }],
      keywords: ["list", "bullet"],
      condition: (commands) => isFeatureEnabled("list") && isCommandAvailable(commands, "toggleUnorderedList"),
    },
    {
      id: "list.numbered",
      label: "Numbered List",
      description: "Create or toggle numbered list",
      category: "List",
      action: (commands) => commands.toggleOrderedList?.(),
      shortcuts: [{ key: "l", ctrlKey: true, altKey: true }],
      keywords: ["list", "numbered"],
      condition: (commands) => isFeatureEnabled("list") && isCommandAvailable(commands, "toggleOrderedList"),
    },
    {
      id: "list.check",
      label: "Checklist",
      description: "Create or toggle checklist",
      category: "List",
      action: (commands) => commands.toggleCheckList?.(),
      shortcuts: [{ key: "x", ctrlKey: true, shiftKey: true }],
      keywords: ["list", "check", "todo", "task"],
      condition: (commands) => isFeatureEnabled("list") && isCommandAvailable(commands, "toggleCheckList"),
    },
    {
      id: "link.insert",
      label: "Insert Link",
      description: "Insert or edit a link",
      category: "Insert",
      action: (commands) => commands.insertLink?.(),
      shortcuts: [{ key: "k", ctrlKey: true }],
      keywords: ["link", "url"],
      condition: (commands) => isFeatureEnabled("link") && isCommandAvailable(commands, "insertLink"),
    },
    {
      id: "link.remove",
      label: "Remove Link",
      description: "Remove link formatting",
      category: "Format",
      action: (commands) => commands.removeLink?.(),
      shortcuts: [{ key: "k", ctrlKey: true, shiftKey: true }],
      keywords: ["unlink", "remove", "link"],
      condition: (commands) => isFeatureEnabled("link") && isCommandAvailable(commands, "removeLink"),
    },
    {
      id: "insert.horizontal-rule",
      label: "Insert Horizontal Rule",
      description: "Insert a horizontal line separator",
      category: "Insert",
      action: (commands) => commands.insertHorizontalRule?.(),
      keywords: ["horizontal", "rule", "hr", "divider", "separator"],
      condition: (commands) => isFeatureEnabled("horizontalRule") && isCommandAvailable(commands, "insertHorizontalRule"),
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
          commands.insertImage?.({ src, alt });
        }
      },
      keywords: ["image", "photo"],
      condition: (commands) => isFeatureEnabled("image") && isCommandAvailable(commands, "insertImage"),
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
        commands.insertImage?.({ src, alt: "GIF" });
      },
      keywords: ["gif", "animated", "image"],
      condition: (commands) => isFeatureEnabled("image") && isCommandAvailable(commands, "insertImage"),
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
        if (shortcodeMatch) {
          const shortcode = shortcodeMatch[1];
          if (!shortcode) {
            return;
          }

          if (typeof commands.resolveEmojiShortcode === "function") {
            const match = commands.resolveEmojiShortcode(shortcode);
            if (match?.emoji) {
              commands.insertEmoji(match.emoji);
              return;
            }
          } else if (typeof commands.getEmojiSuggestions === "function") {
            const [match] = commands.getEmojiSuggestions(shortcode);
            if (match?.emoji) {
              commands.insertEmoji(match.emoji);
              return;
            }
          }
        }

        commands.insertEmoji(value);
      },
      keywords: ["emoji", "reaction", "symbol", "smile"],
      condition: (commands) => isFeatureEnabled("emoji") && supportsEmoji(commands),
    },
    {
      id: "insert.table",
      label: "Insert Table",
      description: "Insert a 3x3 table",
      category: "Insert",
      action: (commands) => commands.insertTable?.({ rows: 3, columns: 3, includeHeaders: true }),
      keywords: ["table", "grid"],
      condition: (commands) => isFeatureEnabled("table") && isCommandAvailable(commands, "insertTable"),
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
      condition: (commands) => isFeatureEnabled("iframeEmbed") && supportsIframeEmbed(commands),
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
      condition: (commands) => isFeatureEnabled("youTubeEmbed") && supportsYouTubeEmbed(commands),
    },
    {
      id: "edit.undo",
      label: "Undo",
      description: "Undo the last action",
      category: "Edit",
      action: (commands) => commands.undo?.(),
      shortcuts: [{ key: "z", ctrlKey: true }],
      keywords: ["undo", "revert"],
      condition: (commands) => isFeatureEnabled("history") && isCommandAvailable(commands, "undo"),
    },
    {
      id: "edit.redo",
      label: "Redo",
      description: "Redo the last undone action",
      category: "Edit",
      action: (commands) => commands.redo?.(),
      shortcuts: [
        { key: "y", ctrlKey: true },
        { key: "z", ctrlKey: true, shiftKey: true },
      ],
      keywords: ["redo", "repeat"],
      condition: (commands) => isFeatureEnabled("history") && isCommandAvailable(commands, "redo"),
    },
    {
      id: "palette.show",
      label: "Show Command Palette",
      description: "Open the command palette",
      category: "View",
      action: (commands) => commands.showCommandPalette?.(),
      shortcuts: [{ key: "p", ctrlKey: true, shiftKey: true }],
      keywords: ["command", "palette"],
      condition: (commands) => isFeatureEnabled("commandPalette") && isCommandAvailable(commands, "showCommandPalette"),
    },
  ];
}

export function commandsToCommandPaletteItems(
  commands: CoreEditorCommands,
  options?: CommandGenerationOptions,
): CommandPaletteItem[] {
  const shortcutOnly = options?.commandPaletteShortcutOnly === true;

  return resolveAvailableCommands(commands, options)
    .filter((command) => !shortcutOnly || (!!command.shortcuts && command.shortcuts.length > 0))
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

export function commandsToSlashCommandItems(
  commands: CoreEditorCommands,
  options?: CommandGenerationOptions,
): SlashCommandItem[] {
  const creatableBlockCommandIds = new Set(["block.paragraph", "block.quote", "block.codeblock"]);

  const isCreatableSlashCommand = (command: CommandConfig): boolean => {
    if (command.category === "Insert" || command.category === "List") {
      return true;
    }

    if (command.category === "Block") {
      if (command.id.startsWith("block.heading")) {
        return true;
      }

      return creatableBlockCommandIds.has(command.id);
    }

    return false;
  };

  const { allowlist, denylist } = resolveSlashCommandVisibility(options?.slashCommandVisibility);
  const hasAllowlist = allowlist.size > 0;

  return resolveAvailableCommands(commands, options)
    .filter(isCreatableSlashCommand)
    .filter((command) => {
      if (denylist.has(command.id)) {
        return false;
      }
      if (!hasAllowlist) {
        return true;
      }
      return allowlist.has(command.id);
    })
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

export function registerKeyboardShortcuts(
  commands: CoreEditorCommands,
  element: HTMLElement = document.body,
  options?: CommandGenerationOptions & {
    scope?: HTMLElement | null | (() => HTMLElement | null);
  },
): () => void {
  const commandConfigs = resolveAvailableCommands(commands, options);
  const isShortcutKeyMatch = (event: KeyboardEvent, shortcut: KeyboardShortcut) => {
    if (event.key.toLowerCase() === shortcut.key.toLowerCase()) {
      return true;
    }

    // Support backquote shortcuts across layouts where Shift+` yields "~" in event.key.
    if (shortcut.key === "`" && event.code === "Backquote") {
      return true;
    }

    return false;
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const scopeElement = typeof options?.scope === "function"
      ? options.scope()
      : options?.scope;
    if (scopeElement && event.target instanceof Node && !scopeElement.contains(event.target)) {
      return;
    }

    for (const config of commandConfigs) {
      if (!config.shortcuts) continue;

      for (const shortcut of config.shortcuts) {
        if (
          options?.shortcutConfig?.preventNativeConflicts !== false &&
          isNativeLexicalShortcutConflict(event, shortcut)
        ) {
          continue;
        }

        if (
          isShortcutKeyMatch(event, shortcut) &&
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
