import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type CSSProperties } from "react";
import { clearLexicalSelection, createEditorSystem, createEditorThemeStyleVars, defaultLuthorTheme, mergeThemes, RichText, type LuthorTheme } from "@lyfie/luthor-headless";
import {
  createExtensiveExtensions,
  extensiveExtensions,
  setFloatingToolbarContext,
  resolveFeatureFlags,
  type FeatureFlags,
  type FeatureFlagOverrides,
  type FeatureFlag,
  EXTENSIVE_FEATURE_KEYS,
} from "./extensions";
import {
  CommandPalette,
  SlashCommandMenu,
  EmojiSuggestionMenu,
  commandsToCommandPaletteItems,
  commandsToSlashCommandItems,
  formatJSONSource,
  generateCommands,
  ModeTabs,
  LinkHoverBubble,
  registerKeyboardShortcuts,
  SourceView,
  Toolbar,
  TRADITIONAL_TOOLBAR_LAYOUT,
  BLOCK_HEADING_LEVELS,
  type CoreEditorCommands,
  type BlockHeadingLevel,
  type ToolbarAlignment,
  type ToolbarStyleVars,
  type QuoteStyleVars,
  type DefaultSettings,
  type EditorThemeOverrides,
  type ToolbarLayout,
  type ToolbarVisibility,
  type ToolbarPosition,
  type SlashCommandVisibility,
  type KeyboardShortcut,
  type ShortcutConfig as CommandShortcutConfig,
} from "../../core";
import {
  createDefaultSettingsStyleVarRecord as sharedCreateDefaultSettingsStyleVarRecord,
  createFeatureGuardedCommands as sharedCreateFeatureGuardedCommands,
  createModeCache,
  invalidateModeCache,
  isEditableCommandTarget as sharedIsEditableCommandTarget,
  isModeCached,
  isShortcutMatch as sharedIsShortcutMatch,
  markModeCached,
  mergeToolbarVisibilityWithFeatures as sharedMergeToolbarVisibilityWithFeatures,
  normalizeStyleVarsKey as sharedNormalizeStyleVarsKey,
  type FeatureShortcutSpec,
  type ToolbarFeatureMap,
} from "../_shared";
import { EXTENSIVE_WELCOME_CONTENT_JSON as extensiveWelcomeContent } from "./welcomeContent";
import type {
  CommandPaletteExtension,
  SlashCommandExtension,
  EmojiExtension,
  EmojiCatalogItem,
  CodeHighlightProvider,
  CodeLanguageOptionsConfig,
  FontFamilyOption,
  FontSizeOption,
  LineHeightOption,
} from "@lyfie/luthor-headless";

const { Provider, useEditor } = createEditorSystem<typeof extensiveExtensions>();

export type ExtensiveEditorMode = "visual" | "json";
export type ExtensiveEditorPlaceholder =
  | string
  | {
      visual?: string;
      json?: string;
    };

const DEFAULT_VISUAL_PLACEHOLDER = "Write anything...";
const DEFAULT_JSON_PLACEHOLDER = "Enter JSON document content...";

export interface ExtensiveEditorRef {
  injectJSON: (content: string) => void;
  getJSON: () => string;
}

type JsonTextNode = {
  type: "text";
  version: 1;
  text: string;
  detail: 0;
  format: 0;
  mode: "normal";
  style: "";
};

type JsonParagraphNode = {
  type: "paragraph";
  version: 1;
  format: "";
  indent: 0;
  direction: null;
  children: JsonTextNode[];
};

type JsonDocument = {
  root: {
    type: "root";
    version: 1;
    format: "";
    indent: 0;
    direction: null;
    children: JsonParagraphNode[];
  };
};

function createJSONDocumentFromText(content: string): JsonDocument {
  const normalized = content.replace(/\r\n?/g, "\n").trim();
  const blocks = normalized
    .split(/\n{2,}/)
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter((block) => block.length > 0);

  const children = (blocks.length > 0 ? blocks : [""]).map<JsonParagraphNode>((block) => ({
    type: "paragraph",
    version: 1,
    format: "",
    indent: 0,
    direction: null,
    children: [
      {
        type: "text",
        version: 1,
        text: block,
        detail: 0,
        format: 0,
        mode: "normal",
        style: "",
      },
    ],
  }));

  return {
    root: {
      type: "root",
      version: 1,
      format: "",
      indent: 0,
      direction: null,
      children,
    },
  };
}

function toJSONInput(value: string): string {
  try {
    const parsed = JSON.parse(value);
    return JSON.stringify(parsed);
  } catch {
    return JSON.stringify(createJSONDocumentFromText(value));
  }
}

function normalizeFontFamilyOptionsKey(options?: readonly FontFamilyOption[]): string {
  if (!options || options.length === 0) {
    return "__default__";
  }

  return JSON.stringify(
    options.map((option) => ({
      value: option.value.trim(),
      label: option.label.trim(),
      fontFamily: option.fontFamily.trim(),
      cssImportUrl: option.cssImportUrl?.trim() || "",
    })),
  );
}

function normalizeFontSizeOptionsKey(options?: readonly FontSizeOption[]): string {
  if (!options || options.length === 0) {
    return "__default__";
  }

  return JSON.stringify(
    options.map((option) => ({
      value: String(option.value).trim(),
      label: String(option.label).trim(),
      fontSize: String(option.fontSize).trim(),
    })),
  );
}

function normalizeLineHeightOptionsKey(options?: readonly LineHeightOption[]): string {
  if (!options || options.length === 0) {
    return "__default__";
  }

  return JSON.stringify(
    options.map((option) => ({
      value: String(option.value).trim(),
      label: String(option.label).trim(),
      lineHeight: String(option.lineHeight).trim(),
    })),
  );
}

function normalizeMinimumDefaultLineHeightKey(value: string | number | undefined): string {
  const fallback = "1.5";

  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 1) {
      return fallback;
    }
    return value.toString();
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return fallback;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return fallback;
    }
    return parsed.toString();
  }

  return fallback;
}

function normalizeStyleVarsKey(styleVars?: Record<string, string | undefined>): string {
  return sharedNormalizeStyleVarsKey(styleVars);
}

function normalizeLanguageOptionsKey(
  options?: readonly string[] | CodeLanguageOptionsConfig,
): string {
  if (!options) {
    return "__default__";
  }

  if (Array.isArray(options)) {
    return JSON.stringify({
      mode: "append",
      values: options.map((option) => option.trim()),
    });
  }

  const config = options as CodeLanguageOptionsConfig;
  const values = Array.isArray(config.values) ? config.values : [];

  return JSON.stringify({
    mode: config.mode ?? "append",
    values: values.map((option) => option.trim()),
  });
}

function createDefaultSettingsStyleVarRecord(defaultSettings?: DefaultSettings): Record<string, string> | undefined {
  return sharedCreateDefaultSettingsStyleVarRecord(defaultSettings);
}

function normalizeFeatureFlagsKey(overrides?: FeatureFlagOverrides): string {
  const resolved = resolveFeatureFlags(overrides);
  return JSON.stringify(
    EXTENSIVE_FEATURE_KEYS.map((key) => [key, resolved[key]]),
  );
}

function isEditableCommandTarget(target: EventTarget | null): boolean {
  return sharedIsEditableCommandTarget(target);
}

const FEATURE_SHORTCUT_SPECS: readonly FeatureShortcutSpec<FeatureFlag>[] = [
  { feature: "bold", key: "b", requiresPrimary: true },
  { feature: "italic", key: "i", requiresPrimary: true },
  { feature: "underline", key: "u", requiresPrimary: true },
  { feature: "link", key: "k", requiresPrimary: true },
  { feature: "history", key: "z", requiresPrimary: true },
  { feature: "history", key: "y", requiresPrimary: true },
  { feature: "history", key: "z", requiresPrimary: true, shift: true },
  { feature: "commandPalette", key: "p", requiresPrimary: true, shift: true },
  { feature: "codeFormat", key: "`", requiresPrimary: true },
  { feature: "code", key: "`", requiresPrimary: true, shift: true },
  { feature: "list", key: "l", requiresPrimary: true, shift: true },
  { feature: "list", key: "l", requiresPrimary: true, alt: true },
  { feature: "list", key: "x", requiresPrimary: true, shift: true },
  { feature: "blockFormat", key: "0", requiresPrimary: true, alt: true },
  { feature: "blockFormat", key: "1", requiresPrimary: true, alt: true },
  { feature: "blockFormat", key: "2", requiresPrimary: true, alt: true },
  { feature: "blockFormat", key: "3", requiresPrimary: true, alt: true },
  { feature: "blockFormat", key: "4", requiresPrimary: true, alt: true },
  { feature: "blockFormat", key: "5", requiresPrimary: true, alt: true },
  { feature: "blockFormat", key: "6", requiresPrimary: true, alt: true },
];

function isShortcutMatch(event: KeyboardEvent, shortcut: FeatureShortcutSpec): boolean {
  return sharedIsShortcutMatch(event, shortcut);
}

function createFeatureGuardedCommands(
  commands: CoreEditorCommands,
  featureFlags: FeatureFlags,
  isInCodeBlock: boolean,
): CoreEditorCommands {
  return sharedCreateFeatureGuardedCommands(commands, featureFlags, isInCodeBlock);
}

const TOOLBAR_FEATURE_MAP: ToolbarFeatureMap<FeatureFlag> = {
  fontFamily: "fontFamily",
  fontSize: "fontSize",
  lineHeight: "lineHeight",
  textColor: "textColor",
  textHighlight: "textHighlight",
  bold: "bold",
  italic: "italic",
  underline: "underline",
  strikethrough: "strikethrough",
  subscript: "subscript",
  superscript: "superscript",
  code: "codeFormat",
  link: "link",
  blockFormat: "blockFormat",
  quote: "blockFormat",
  alignLeft: "blockFormat",
  alignCenter: "blockFormat",
  alignRight: "blockFormat",
  alignJustify: "blockFormat",
  codeBlock: "code",
  unorderedList: "list",
  orderedList: "list",
  checkList: "list",
  indentList: "list",
  outdentList: "list",
  horizontalRule: "horizontalRule",
  table: "table",
  image: "image",
  emoji: "emoji",
  embed: ["iframeEmbed", "youTubeEmbed"],
  undo: "history",
  redo: "history",
  commandPalette: "commandPalette",
  themeToggle: "themeToggle",
};

function mergeToolbarVisibilityWithFeatures(
  toolbarVisibility: ToolbarVisibility | undefined,
  featureFlags: FeatureFlags,
): ToolbarVisibility {
  return sharedMergeToolbarVisibilityWithFeatures(
    toolbarVisibility,
    featureFlags,
    TOOLBAR_FEATURE_MAP,
  );
}

function normalizeHeadingOptions(input?: readonly BlockHeadingLevel[]): BlockHeadingLevel[] {
  if (!input || input.length === 0) {
    return [...BLOCK_HEADING_LEVELS];
  }

  const seen = new Set<BlockHeadingLevel>();
  const normalized: BlockHeadingLevel[] = [];
  for (const heading of input) {
    if (!BLOCK_HEADING_LEVELS.includes(heading) || seen.has(heading)) {
      continue;
    }

    seen.add(heading);
    normalized.push(heading);
  }

  return normalized.length > 0 ? normalized : [...BLOCK_HEADING_LEVELS];
}

function normalizeSlashCommandVisibilityKey(visibility?: SlashCommandVisibility): string {
  if (!visibility) {
    return "__default__";
  }

  if (Array.isArray(visibility)) {
    const seen = new Set<string>();
    const allowlist: string[] = [];
    for (const selection of visibility) {
      for (const [id, enabled] of Object.entries(selection)) {
        const normalizedId = id.trim();
        if (!enabled || !normalizedId || seen.has(normalizedId)) {
          continue;
        }
        seen.add(normalizedId);
        allowlist.push(normalizedId);
      }
    }

    if (allowlist.length === 0) {
      return "__default__";
    }

    return JSON.stringify({ allowlist, denylist: [] });
  }

  const normalize = (ids?: readonly string[]): string[] => {
    if (!ids || ids.length === 0) {
      return [];
    }

    const seen = new Set<string>();
    const normalized: string[] = [];
    for (const id of ids) {
      const value = id.trim();
      if (!value || seen.has(value)) {
        continue;
      }
      seen.add(value);
      normalized.push(value);
    }
    return normalized;
  };

  const visibilityFilters = visibility as {
    allowlist?: readonly string[];
    denylist?: readonly string[];
  };
  const allowlist = normalize(visibilityFilters.allowlist);
  const denylist = normalize(visibilityFilters.denylist);
  if (allowlist.length === 0 && denylist.length === 0) {
    return "__default__";
  }

  return JSON.stringify({ allowlist, denylist });
}

function normalizeCommandIdList(ids?: readonly string[]): string[] {
  if (!ids || ids.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const id of ids) {
    const value = id.trim();
    if (!value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    normalized.push(value);
  }

  return normalized;
}

function isKeyboardShortcutMatch(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  return (
    event.key.toLowerCase() === shortcut.key.toLowerCase() &&
    !!event.ctrlKey === !!shortcut.ctrlKey &&
    !!event.metaKey === !!shortcut.metaKey &&
    !!event.shiftKey === !!shortcut.shiftKey &&
    !!event.altKey === !!shortcut.altKey
  );
}

function normalizeShortcutConfigKey(shortcutConfig?: CommandShortcutConfig): string {
  if (!shortcutConfig) {
    return "__default__";
  }

  const disabledCommandIds = Array.isArray(shortcutConfig.disabledCommandIds)
    ? [...shortcutConfig.disabledCommandIds]
      .map((id) => id.trim())
      .filter((id) => id.length > 0)
      .sort((left, right) => left.localeCompare(right))
    : [];

  const bindings = shortcutConfig.bindings
    ? Object.entries(shortcutConfig.bindings)
      .map(([commandId, override]) => {
        if (override === false || override === null) {
          return [commandId, false] as const;
        }

        const shortcuts = Array.isArray(override) ? override : [override];
        const normalizedShortcuts = shortcuts
          .map((shortcut) => ({
            key: shortcut.key.trim(),
            ctrlKey: !!shortcut.ctrlKey,
            metaKey: !!shortcut.metaKey,
            shiftKey: !!shortcut.shiftKey,
            altKey: !!shortcut.altKey,
            preventDefault: shortcut.preventDefault,
          }))
          .filter((shortcut) => shortcut.key.length > 0)
          .sort((left, right) => {
            const leftKey = `${left.key}:${left.ctrlKey ? 1 : 0}:${left.metaKey ? 1 : 0}:${left.shiftKey ? 1 : 0}:${left.altKey ? 1 : 0}`;
            const rightKey = `${right.key}:${right.ctrlKey ? 1 : 0}:${right.metaKey ? 1 : 0}:${right.shiftKey ? 1 : 0}:${right.altKey ? 1 : 0}`;
            return leftKey.localeCompare(rightKey);
          });

        if (normalizedShortcuts.length === 0) {
          return [commandId, false] as const;
        }

        return [commandId, normalizedShortcuts] as const;
      })
      .sort(([left], [right]) => left.localeCompare(right))
    : [];

  return JSON.stringify({
    disabledCommandIds,
    bindings,
    preventCollisions: shortcutConfig.preventCollisions !== false,
    preventNativeConflicts: shortcutConfig.preventNativeConflicts !== false,
  });
}

function ExtensiveEditorContent({
  isDark,
  toggleTheme,
  visualPlaceholder,
  jsonPlaceholder,
  initialMode,
  availableModes,
  onReady,
  toolbarLayout,
  toolbarVisibility,
  toolbarPosition,
  toolbarAlignment,
  toolbarClassName,
  toolbarStyleVars,
  isToolbarEnabled,
  headingOptions,
  paragraphLabel,
  syncHeadingOptionsWithCommands,
  slashCommandVisibility,
  shortcutConfig,
  commandPaletteShortcutOnly,
  featureFlags,
}: {
  isDark: boolean;
  toggleTheme: () => void;
  visualPlaceholder: string;
  jsonPlaceholder: string;
  initialMode: ExtensiveEditorMode;
  availableModes: readonly ExtensiveEditorMode[];
  onReady?: (methods: ExtensiveEditorRef) => void;
  toolbarLayout?: ToolbarLayout;
  toolbarVisibility?: ToolbarVisibility;
  toolbarPosition: ToolbarPosition;
  toolbarAlignment: ToolbarAlignment;
  toolbarClassName?: string;
  toolbarStyleVars?: ToolbarStyleVars;
  isToolbarEnabled: boolean;
  headingOptions?: readonly BlockHeadingLevel[];
  paragraphLabel?: string;
  syncHeadingOptionsWithCommands: boolean;
  slashCommandVisibility?: SlashCommandVisibility;
  shortcutConfig?: CommandShortcutConfig;
  commandPaletteShortcutOnly: boolean;
  featureFlags: FeatureFlags;
}) {
  const {
    commands,
    hasExtension,
    activeStates,
    lexical: editor,
    extensions,
    export: exportApi,
    import: importApi,
  } = useEditor();
  const [mode, setMode] = useState<ExtensiveEditorMode>(initialMode);
  const [content, setContent] = useState({ json: "" });
  const [convertingMode, setConvertingMode] = useState<ExtensiveEditorMode | null>(null);
  const [sourceError, setSourceError] = useState<{ mode: ExtensiveEditorMode; error: string } | null>(null);
  const [commandPaletteState, setCommandPaletteState] = useState({
    isOpen: false,
    commands: [] as ReturnType<typeof commandsToCommandPaletteItems>,
  });
  const [slashCommandState, setSlashCommandState] = useState({
    isOpen: false,
    query: "",
    position: null as { x: number; y: number } | null,
    commands: [] as ReturnType<typeof commandsToSlashCommandItems>,
  });
  const [emojiSuggestionState, setEmojiSuggestionState] = useState({
    isOpen: false,
    query: "",
    position: null as { x: number; y: number } | null,
    suggestions: [] as EmojiCatalogItem[],
  });
  const readyRef = useRef(false);
  const resolvedHeadingOptions = useMemo(
    () => normalizeHeadingOptions(headingOptions),
    [headingOptions],
  );
  const commandHeadingOptions = syncHeadingOptionsWithCommands ? resolvedHeadingOptions : undefined;
  const commandParagraphLabel = syncHeadingOptionsWithCommands ? paragraphLabel : undefined;
  const isInCodeBlock = activeStates.isInCodeBlock === true;
  const safeCommands = useMemo(
    () => createFeatureGuardedCommands(commands as CoreEditorCommands, featureFlags, isInCodeBlock),
    [commands, featureFlags, isInCodeBlock],
  );
  const isFeatureEnabled = useMemo(
    () => (feature: string) => {
      if (!Object.prototype.hasOwnProperty.call(featureFlags, feature)) {
        return true;
      }

      return featureFlags[feature as FeatureFlag] !== false;
    },
    [featureFlags],
  );
  const resolvedToolbarVisibility = useMemo(
    () => mergeToolbarVisibilityWithFeatures(toolbarVisibility, featureFlags),
    [toolbarVisibility, featureFlags],
  );
  const isDraggableBoxEnabled = featureFlags.draggableBlock !== false;
  const slashCommandVisibilityKey = normalizeSlashCommandVisibilityKey(slashCommandVisibility);
  const stableSlashCommandVisibilityRef = useRef<SlashCommandVisibility | undefined>(slashCommandVisibility);
  const stableSlashCommandVisibilityKeyRef = useRef(slashCommandVisibilityKey);
  const shortcutConfigKey = normalizeShortcutConfigKey(shortcutConfig);
  const stableShortcutConfigRef = useRef<CommandShortcutConfig | undefined>(shortcutConfig);
  const stableShortcutConfigKeyRef = useRef(shortcutConfigKey);
  const disabledCommandIds = useMemo(
    () => normalizeCommandIdList(shortcutConfig?.disabledCommandIds),
    [shortcutConfig?.disabledCommandIds],
  );
  const disabledCommandIdsSet = useMemo(
    () => new Set(disabledCommandIds),
    [disabledCommandIds],
  );
  const blockedDefaultShortcuts = useMemo<KeyboardShortcut[]>(() => {
    if (disabledCommandIdsSet.size === 0) {
      return [];
    }

    return generateCommands({
      headingOptions: commandHeadingOptions,
      paragraphLabel: commandParagraphLabel,
      isFeatureEnabled,
    })
      .filter((command) => disabledCommandIdsSet.has(command.id))
      .flatMap((command) => command.shortcuts ?? []);
  }, [
    disabledCommandIdsSet,
    commandHeadingOptions,
    commandParagraphLabel,
    isFeatureEnabled,
  ]);

  if (stableSlashCommandVisibilityKeyRef.current !== slashCommandVisibilityKey) {
    stableSlashCommandVisibilityKeyRef.current = slashCommandVisibilityKey;
    stableSlashCommandVisibilityRef.current = slashCommandVisibility;
  }

  if (stableShortcutConfigKeyRef.current !== shortcutConfigKey) {
    stableShortcutConfigKeyRef.current = shortcutConfigKey;
    stableShortcutConfigRef.current = shortcutConfig;
  }
  
  // Lazy conversion state: track which formats are valid cache
  const cacheValidRef = useRef(createModeCache<ExtensiveEditorMode>(["visual"]));
  const editorChangeCountRef = useRef(0);

  useEffect(() => {
    setFloatingToolbarContext(
      safeCommands,
      activeStates,
      isDark ? "dark" : "light",
      isFeatureEnabled,
    );
  }, [safeCommands, activeStates, isDark, isFeatureEnabled]);

  const methods = useMemo<ExtensiveEditorRef>(
    () => {
      const injectJSON = (value: string) => {
        setTimeout(() => {
          try {
            const parsed = JSON.parse(value);
            importApi.fromJSON(parsed);
          } catch (error) {
            console.error("Failed to inject JSON:", error);
            return;
          }
        }, 100);
      };
      const getJSON = () => formatJSONSource(JSON.stringify(exportApi.toJSON()));
      return {
        injectJSON,
        getJSON,
        
        
      };
    },
    [exportApi, importApi],
  );

  useEffect(() => {
    if (!editor || !safeCommands) return;

    const commandApi = safeCommands as CoreEditorCommands;
    const paletteItems = commandsToCommandPaletteItems(commandApi, {
      headingOptions: commandHeadingOptions,
      paragraphLabel: commandParagraphLabel,
      isFeatureEnabled,
      shortcutConfig: stableShortcutConfigRef.current,
      commandPaletteShortcutOnly,
    });
    if (typeof commandApi.registerCommand === "function") {
      paletteItems.forEach((cmd) => commandApi.registerCommand(cmd));
    }
    const slashItems = commandsToSlashCommandItems(commandApi, {
      headingOptions: commandHeadingOptions,
      paragraphLabel: commandParagraphLabel,
      slashCommandVisibility: stableSlashCommandVisibilityRef.current,
      isFeatureEnabled,
      shortcutConfig: stableShortcutConfigRef.current,
    });
    if (typeof commandApi.setSlashCommands === "function") {
      commandApi.setSlashCommands(slashItems);
    } else {
      slashItems.forEach((cmd) => commandApi.registerSlashCommand?.(cmd));
    }

    const unregisterShortcuts = registerKeyboardShortcuts(commandApi, document.body, {
      headingOptions: commandHeadingOptions,
      paragraphLabel: commandParagraphLabel,
      isFeatureEnabled,
      shortcutConfig: stableShortcutConfigRef.current,
      scope: () => editor.getRootElement(),
    });

    if (!readyRef.current) {
      readyRef.current = true;
      onReady?.(methods);
    }

    return () => {
      unregisterShortcuts();
      if (typeof commandApi.unregisterCommand === "function") {
        paletteItems.forEach((cmd) => commandApi.unregisterCommand(cmd.id));
      }
      if (typeof commandApi.setSlashCommands === "function") {
        commandApi.setSlashCommands([]);
      } else {
        slashItems.forEach((cmd) => commandApi.unregisterSlashCommand?.(cmd.id));
      }
    };
  }, [
    editor,
    safeCommands,
    methods,
    onReady,
    commandHeadingOptions,
    commandParagraphLabel,
    slashCommandVisibilityKey,
    shortcutConfigKey,
    isFeatureEnabled,
    commandPaletteShortcutOnly,
  ]);

  useEffect(() => {
    const resolveScopeElement = () => editor?.getRootElement();
    const disabledShortcutSpecs = FEATURE_SHORTCUT_SPECS.filter(
      (shortcut) => featureFlags[shortcut.feature] === false,
    );

    if (disabledShortcutSpecs.length === 0) {
      return;
    }

    const handleKeydown = (event: KeyboardEvent) => {
      const scopeElement = resolveScopeElement();
      if (scopeElement && event.target instanceof Node && !scopeElement.contains(event.target)) {
        return;
      }

      if (!isEditableCommandTarget(event.target)) {
        return;
      }

      const isDisabledFeatureShortcut = disabledShortcutSpecs.some((shortcut) => {
        return isShortcutMatch(event, shortcut);
      });

      if (!isDisabledFeatureShortcut) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    };

    document.addEventListener("keydown", handleKeydown, true);
    return () => {
      document.removeEventListener("keydown", handleKeydown, true);
    };
  }, [editor, featureFlags]);

  useEffect(() => {
    const commandPaletteExtension = extensions.find(
      (ext: any) => ext.name === "commandPalette",
    ) as CommandPaletteExtension | undefined;

    if (!commandPaletteExtension || !commandPaletteExtension.subscribe) return;

    return commandPaletteExtension.subscribe((isOpen, items) => {
      const filteredItems = items.filter((item) => {
        if (disabledCommandIdsSet.has(item.id)) {
          return false;
        }

        if (commandPaletteShortcutOnly) {
          const hasShortcut = typeof item.shortcut === "string" && item.shortcut.trim().length > 0;
          return hasShortcut;
        }

        return true;
      });

      setCommandPaletteState({ isOpen, commands: filteredItems });
    });
  }, [extensions, disabledCommandIdsSet, commandPaletteShortcutOnly]);

  useEffect(() => {
    if (blockedDefaultShortcuts.length === 0) {
      return;
    }

    const resolveScopeElement = () => editor?.getRootElement();

    const handleKeydown = (event: KeyboardEvent) => {
      const scopeElement = resolveScopeElement();
      if (scopeElement && event.target instanceof Node && !scopeElement.contains(event.target)) {
        return;
      }

      if (!isEditableCommandTarget(event.target)) {
        return;
      }

      const isBlockedShortcut = blockedDefaultShortcuts.some((shortcut) => {
        return isKeyboardShortcutMatch(event, shortcut);
      });

      if (!isBlockedShortcut) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    };

    document.addEventListener("keydown", handleKeydown, true);
    return () => {
      document.removeEventListener("keydown", handleKeydown, true);
    };
  }, [editor, blockedDefaultShortcuts]);

  useEffect(() => {
    const slashCommandExtension = extensions.find(
      (ext: any) => ext.name === "slashCommand",
    ) as SlashCommandExtension | undefined;

    if (!slashCommandExtension || !slashCommandExtension.subscribe) return;

    return slashCommandExtension.subscribe((state) => {
      setSlashCommandState({
        isOpen: state.isOpen,
        query: state.query,
        position: state.position,
        commands: state.commands,
      });
    });
  }, [extensions]);

  useEffect(() => {
    const emojiExtension = extensions.find(
      (ext: any) => ext.name === "emoji",
    ) as EmojiExtension | undefined;

    if (!emojiExtension || !emojiExtension.subscribe) return;

    return emojiExtension.subscribe((state) => {
      setEmojiSuggestionState({
        isOpen: state.isOpen,
        query: state.query,
        position: state.position,
        suggestions: state.suggestions,
      });
    });
  }, [extensions]);

  useEffect(() => {
    if (!editor || !exportApi) return;

    const unsubscribe = editor.registerUpdateListener(() => {
      // When visual editor changes, mark all cached formats as stale
      // This prevents stale cache but doesn't do any actual export work
      editorChangeCountRef.current += 1;
      invalidateModeCache(cacheValidRef.current, ["visual"]);
    });

    return unsubscribe;
  }, [editor, exportApi]);

  const handleModeChange = async (newMode: ExtensiveEditorMode) => {
    if (!availableModes.includes(newMode)) {
      return;
    }

    try {
      // Clear any previous errors when attempting to switch modes
      setSourceError(null);

      // Step 1: Import edited content from source tabs
      if (mode === "json" && newMode !== "json") {
        const parsed = JSON.parse(content.json);
        importApi.fromJSON(parsed);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      if (mode === "visual" && newMode !== "visual") {
        if (editor) {
          clearLexicalSelection(editor);
        }
        editor?.getRootElement()?.blur();
      }

      // Immediately switch mode so UI shows new view
      setMode(newMode);

      // Step 2: Lazy export - only convert format if not cached
      // This ensures smooth tab switching with progressive conversion
      if (newMode === "json" && mode !== "json") {
        if (!isModeCached(cacheValidRef.current, "json")) {
          setConvertingMode("json");
          await new Promise((resolve) => setTimeout(resolve, 50));
          try {
            const json = formatJSONSource(JSON.stringify(exportApi.toJSON()));
            setContent((prev) => ({ ...prev, json }));
            markModeCached(cacheValidRef.current, "json");
          } finally {
            setConvertingMode(null);
          }
        }
      }

      if (newMode === "visual") {
        setTimeout(() => editor?.focus(), 100);
      }
    } catch (error) {
      // If an error occurs while importing, show it and keep the user in the current mode
      const errorMessage = error instanceof Error ? error.message : "Invalid format - could not parse content";
      setSourceError({ mode: mode, error: errorMessage });
      // Don't change mode if import fails
    }
  };

  const toolbarNode = isToolbarEnabled ? (
    <Toolbar
      commands={safeCommands}
      hasExtension={(name: string) => hasExtension(name as any)}
      activeStates={activeStates}
      isDark={isDark}
      toggleTheme={toggleTheme}
      onCommandPaletteOpen={() => {
        if (featureFlags.commandPalette !== false) {
          safeCommands.showCommandPalette();
        }
      }}
      imageUploadHandler={(file) => ((extensions.find((ext: any) => ext.name === "image") as any)?.config?.uploadHandler?.(file) ?? Promise.resolve(URL.createObjectURL(file)))}
      layout={toolbarLayout ?? TRADITIONAL_TOOLBAR_LAYOUT}
      toolbarVisibility={resolvedToolbarVisibility}
      toolbarStyleVars={toolbarStyleVars}
      headingOptions={resolvedHeadingOptions}
      paragraphLabel={paragraphLabel}
      classNames={{
        toolbar: `luthor-toolbar luthor-toolbar--align-${toolbarAlignment}${toolbarClassName ? ` ${toolbarClassName}` : ""}`,
      }}
    />
  ) : null;
  const shouldRenderTopToolbar = mode === "visual" && isToolbarEnabled && toolbarPosition === "top";
  const shouldRenderBottomToolbar = mode === "visual" && isToolbarEnabled && toolbarPosition === "bottom";

  return (
    <>
      <div className="luthor-editor-header">
        <ModeTabs 
          mode={mode} 
          onModeChange={handleModeChange} 
          availableModes={availableModes}
          isConverting={convertingMode}
        />
        {shouldRenderTopToolbar && (
          <div className="luthor-editor-toolbar-slot luthor-editor-toolbar-slot--top">{toolbarNode}</div>
        )}
      </div>
      <div
        className={`luthor-editor${isDraggableBoxEnabled ? "" : " luthor-editor--draggable-disabled"}`}
        data-mode={mode}
      >
        <div
          className={`luthor-editor-visual-shell${mode === "visual" ? "" : " is-hidden"}${isDraggableBoxEnabled ? "" : " luthor-editor-visual-shell--no-gutter"}`}
          aria-hidden={mode !== "visual"}
        >
          {isDraggableBoxEnabled && (
            <div className="luthor-editor-visual-gutter" aria-hidden="true" />
          )}
          <RichText
            placeholder={visualPlaceholder}
            classNames={{
              container: "luthor-richtext-container luthor-preset-extensive__container",
              contentEditable: "luthor-content-editable luthor-preset-extensive__content",
              placeholder: "luthor-placeholder luthor-preset-extensive__placeholder",
            }}
          />
        </div>
        {mode !== "visual" && (
          <div className="luthor-source-panel">
            {sourceError && sourceError.mode === mode && (
              <div className="luthor-source-error">
                <div className="luthor-source-error-icon">⚠️</div>
                <div className="luthor-source-error-message">
                  <strong>Invalid JSON</strong>
                  <p>{sourceError.error}</p>
                  <small>Fix the errors above and try switching modes again</small>
                </div>
              </div>
            )}
            {mode === "json" && (
              <SourceView value={content.json} onChange={(value) => setContent((prev) => ({ ...prev, json: value }))} placeholder={jsonPlaceholder} />
            )}
          </div>
        )}
      </div>
      <LinkHoverBubble
        editor={editor}
        commands={safeCommands}
        editorTheme={isDark ? "dark" : "light"}
        disabled={mode !== "visual"}
      />
      {shouldRenderBottomToolbar && (
        <div className="luthor-editor-toolbar-slot luthor-editor-toolbar-slot--bottom">{toolbarNode}</div>
      )}
      <CommandPalette
        isOpen={commandPaletteState.isOpen}
        onClose={() => safeCommands.hideCommandPalette()}
        commands={commandPaletteState.commands}
      />
      <SlashCommandMenu
        isOpen={slashCommandState.isOpen}
        query={slashCommandState.query}
        position={slashCommandState.position}
        commands={slashCommandState.commands}
        onClose={() => safeCommands.closeSlashMenu?.()}
        onExecute={(commandId) => {
          safeCommands.executeSlashCommand?.(commandId);
        }}
      />
      <EmojiSuggestionMenu
        isOpen={emojiSuggestionState.isOpen}
        query={emojiSuggestionState.query}
        position={emojiSuggestionState.position}
        suggestions={emojiSuggestionState.suggestions}
        onClose={() => safeCommands.closeEmojiSuggestions?.()}
        onExecute={(emoji) => {
          safeCommands.executeEmojiSuggestion?.(emoji);
        }}
      />
    </>
  );
}

export interface ExtensiveEditorProps {
  className?: string;
  onReady?: (methods: ExtensiveEditorRef) => void;
  initialTheme?: "light" | "dark";
  onThemeChange?: (theme: "light" | "dark") => void;
  theme?: Partial<LuthorTheme>;
  defaultContent?: string;
  showDefaultContent?: boolean;
  placeholder?: ExtensiveEditorPlaceholder;
  initialMode?: ExtensiveEditorMode;
  availableModes?: readonly ExtensiveEditorMode[];
  variantClassName?: string;
  toolbarLayout?: ToolbarLayout;
  toolbarVisibility?: ToolbarVisibility;
  toolbarPosition?: ToolbarPosition;
  toolbarAlignment?: ToolbarAlignment;
  toolbarClassName?: string;
  toolbarStyleVars?: ToolbarStyleVars;
  quoteClassName?: string;
  quoteStyleVars?: QuoteStyleVars;
  defaultSettings?: DefaultSettings;
  editorThemeOverrides?: EditorThemeOverrides;
  isToolbarEnabled?: boolean;
  fontFamilyOptions?: readonly FontFamilyOption[];
  fontSizeOptions?: readonly FontSizeOption[];
  lineHeightOptions?: readonly LineHeightOption[];
  minimumDefaultLineHeight?: string | number;
  scaleByRatio?: boolean;
  headingOptions?: readonly BlockHeadingLevel[];
  paragraphLabel?: string;
  syncHeadingOptionsWithCommands?: boolean;
  slashCommandVisibility?: SlashCommandVisibility;
  shortcutConfig?: CommandShortcutConfig;
  commandPaletteShortcutOnly?: boolean;
  isDraggableBoxEnabled?: boolean;
  featureFlags?: FeatureFlagOverrides;
  syntaxHighlighting?: "auto" | "disabled";
  codeHighlightProvider?: CodeHighlightProvider | null;
  loadCodeHighlightProvider?: () => Promise<CodeHighlightProvider | null>;
  maxAutoDetectCodeLength?: number;
  isCopyAllowed?: boolean;
  languageOptions?: readonly string[] | CodeLanguageOptionsConfig;
}

export const ExtensiveEditor = forwardRef<ExtensiveEditorRef, ExtensiveEditorProps>(
  ({
    className,
    onReady,
    initialTheme = "light",
    onThemeChange,
    theme,
    defaultContent,
    showDefaultContent = true,
    placeholder = DEFAULT_VISUAL_PLACEHOLDER,
    initialMode = "visual",
    availableModes = ["visual", "json"],
    variantClassName,
    toolbarLayout,
    toolbarVisibility,
    toolbarPosition = "top",
    toolbarAlignment = "left",
    toolbarClassName,
    toolbarStyleVars,
    quoteClassName,
    quoteStyleVars,
    defaultSettings,
    editorThemeOverrides,
    isToolbarEnabled = true,
    fontFamilyOptions,
    fontSizeOptions,
    lineHeightOptions,
    minimumDefaultLineHeight = 1.5,
    scaleByRatio = false,
    headingOptions,
    paragraphLabel,
    syncHeadingOptionsWithCommands = true,
    slashCommandVisibility,
    shortcutConfig,
    commandPaletteShortcutOnly = false,
    isDraggableBoxEnabled,
    featureFlags,
    syntaxHighlighting,
    codeHighlightProvider,
    loadCodeHighlightProvider,
    maxAutoDetectCodeLength,
    isCopyAllowed = true,
    languageOptions,
  }, ref) => {
    const [editorTheme, setEditorTheme] = useState<"light" | "dark">(initialTheme);
    const isDark = editorTheme === "dark";
    const resolvedInitialMode = availableModes.includes(initialMode)
      ? initialMode
      : (availableModes[0] ?? "visual");

    const toggleTheme = () => setEditorTheme(isDark ? "light" : "dark");
    const resolvedPlaceholders = useMemo(() => {
      if (typeof placeholder === "string") {
        return {
          visual: placeholder,
          json: DEFAULT_JSON_PLACEHOLDER,
        };
      }

      return {
        visual: placeholder.visual ?? DEFAULT_VISUAL_PLACEHOLDER,
        json: placeholder.json ?? DEFAULT_JSON_PLACEHOLDER,
      };
    }, [placeholder]);

    useEffect(() => {
      setEditorTheme(initialTheme);
    }, [initialTheme]);

    useEffect(() => {
      onThemeChange?.(editorTheme);
    }, [editorTheme, onThemeChange]);

    const fontFamilyOptionsKey = useMemo(
      () => normalizeFontFamilyOptionsKey(fontFamilyOptions),
      [fontFamilyOptions],
    );
    const fontSizeOptionsKey = useMemo(
      () => normalizeFontSizeOptionsKey(fontSizeOptions),
      [fontSizeOptions],
    );
    const lineHeightOptionsKey = useMemo(
      () => normalizeLineHeightOptionsKey(lineHeightOptions),
      [lineHeightOptions],
    );
    const minimumDefaultLineHeightKey = useMemo(
      () => normalizeMinimumDefaultLineHeightKey(minimumDefaultLineHeight),
      [minimumDefaultLineHeight],
    );
    const syntaxHighlightKey = syntaxHighlighting ?? "unset";
    const maxAutoDetectKey =
      typeof maxAutoDetectCodeLength === "number"
        ? maxAutoDetectCodeLength.toString()
        : "unset";
    const languageOptionsKey = useMemo(
      () => normalizeLanguageOptionsKey(languageOptions),
      [languageOptions],
    );
    const copyAllowedKey = isCopyAllowed ? "copy-on" : "copy-off";
    const effectiveFeatureFlags = useMemo<FeatureFlagOverrides | undefined>(() => {
      if (typeof isDraggableBoxEnabled !== "boolean") {
        return featureFlags;
      }

      return {
        ...(featureFlags ?? {}),
        draggableBlock: isDraggableBoxEnabled,
      };
    }, [featureFlags, isDraggableBoxEnabled]);
    const featureFlagsKey = useMemo(
      () => normalizeFeatureFlagsKey(effectiveFeatureFlags),
      [effectiveFeatureFlags],
    );
    const resolvedFeatureFlags = useMemo(
      () => resolveFeatureFlags(effectiveFeatureFlags),
      [effectiveFeatureFlags],
    );
    const extensionsKey = `${fontFamilyOptionsKey}::${fontSizeOptionsKey}::${lineHeightOptionsKey}::${minimumDefaultLineHeightKey}::${scaleByRatio ? "ratio-on" : "ratio-off"}::${syntaxHighlightKey}::${maxAutoDetectKey}::${copyAllowedKey}::${languageOptionsKey}::${featureFlagsKey}`;
    const stableFontFamilyOptionsRef = useRef<readonly FontFamilyOption[] | undefined>(fontFamilyOptions);
    const stableFontSizeOptionsRef = useRef<readonly FontSizeOption[] | undefined>(fontSizeOptions);
    const stableLineHeightOptionsRef = useRef<readonly LineHeightOption[] | undefined>(lineHeightOptions);
    const stableMinimumDefaultLineHeightRef = useRef<string | number | undefined>(minimumDefaultLineHeight);
    const stableFeatureFlagsRef = useRef<FeatureFlagOverrides | undefined>(effectiveFeatureFlags);
    const stableLanguageOptionsRef = useRef<
      readonly string[] | CodeLanguageOptionsConfig | undefined
    >(languageOptions);
    const stableCodeHighlightProviderRef = useRef<CodeHighlightProvider | null | undefined>(codeHighlightProvider);
    const stableLoadCodeHighlightProviderRef = useRef<
      (() => Promise<CodeHighlightProvider | null>) | undefined
    >(loadCodeHighlightProvider);
    const stableExtensionsKeyRef = useRef(extensionsKey);

    if (
      stableExtensionsKeyRef.current !== extensionsKey ||
      stableCodeHighlightProviderRef.current !== codeHighlightProvider ||
      stableLoadCodeHighlightProviderRef.current !== loadCodeHighlightProvider
    ) {
      stableExtensionsKeyRef.current = extensionsKey;
      stableFontFamilyOptionsRef.current = fontFamilyOptions;
      stableFontSizeOptionsRef.current = fontSizeOptions;
      stableLineHeightOptionsRef.current = lineHeightOptions;
      stableMinimumDefaultLineHeightRef.current = minimumDefaultLineHeight;
      stableFeatureFlagsRef.current = effectiveFeatureFlags;
      stableLanguageOptionsRef.current = languageOptions;
      stableCodeHighlightProviderRef.current = codeHighlightProvider;
      stableLoadCodeHighlightProviderRef.current = loadCodeHighlightProvider;
    }

    const memoizedExtensionsRef = useRef<{
      key: string;
      value: ReturnType<typeof createExtensiveExtensions>;
    } | null>(null);

    if (!memoizedExtensionsRef.current || memoizedExtensionsRef.current.key !== extensionsKey) {
      const nextConfig = {
        fontFamilyOptions: stableFontFamilyOptionsRef.current,
        fontSizeOptions: stableFontSizeOptionsRef.current,
        lineHeightOptions: stableLineHeightOptionsRef.current,
        minimumDefaultLineHeight: stableMinimumDefaultLineHeightRef.current,
        scaleByRatio,
        ...(syntaxHighlighting !== undefined
          ? { syntaxHighlighting }
          : {}),
        ...(stableCodeHighlightProviderRef.current !== undefined
          ? { codeHighlightProvider: stableCodeHighlightProviderRef.current }
          : {}),
        ...(stableLoadCodeHighlightProviderRef.current !== undefined
          ? { loadCodeHighlightProvider: stableLoadCodeHighlightProviderRef.current }
          : {}),
        ...(maxAutoDetectCodeLength !== undefined
          ? { maxAutoDetectCodeLength }
          : {}),
        isCopyAllowed,
        ...(stableLanguageOptionsRef.current !== undefined
          ? { languageOptions: stableLanguageOptionsRef.current }
          : {}),
        ...(typeof isDraggableBoxEnabled === "boolean"
          ? { isDraggableBoxEnabled }
          : {}),
        ...(stableFeatureFlagsRef.current ? { featureFlags: stableFeatureFlagsRef.current } : {}),
      };

      memoizedExtensionsRef.current = {
        key: extensionsKey,
        value: createExtensiveExtensions(nextConfig),
      };
    }
    const memoizedExtensions = memoizedExtensionsRef.current.value;
    const editorThemeConfig = useMemo(() => {
      const mergedTheme = mergeThemes(defaultLuthorTheme, theme ?? {});
      if (!quoteClassName) {
        return mergedTheme;
      }

      return {
        ...mergedTheme,
        quote: `${mergedTheme.quote ?? ""} ${quoteClassName}`.trim(),
      };
    }, [theme, quoteClassName]);
    const editorThemeOverridesKey = useMemo(
      () => normalizeStyleVarsKey(editorThemeOverrides),
      [editorThemeOverrides],
    );
    const quoteStyleVarsKey = useMemo(
      () => normalizeStyleVarsKey(quoteStyleVars),
      [quoteStyleVars],
    );
    const defaultSettingsVars = useMemo(
      () => createDefaultSettingsStyleVarRecord(defaultSettings),
      [defaultSettings],
    );
    const defaultSettingsKey = useMemo(
      () => normalizeStyleVarsKey(defaultSettingsVars),
      [defaultSettingsVars],
    );

    const wrapperStyleVars = useMemo(() => {
      void defaultSettingsKey;
      void editorThemeOverridesKey;
      void quoteStyleVarsKey;
      const defaultVars = defaultSettingsVars as CSSProperties | undefined;
      const editorThemeVars = createEditorThemeStyleVars(editorThemeOverrides);
      const quoteVars = quoteStyleVars as CSSProperties | undefined;
      const lineHeightVars = {
        "--luthor-default-line-height": minimumDefaultLineHeightKey,
      } as CSSProperties;
      if (!defaultVars && !editorThemeVars && !quoteVars) {
        return lineHeightVars;
      }

      return {
        ...(defaultVars ?? {}),
        ...(editorThemeVars as CSSProperties | undefined),
        ...(quoteVars ?? {}),
        ...lineHeightVars,
      };
    }, [
      minimumDefaultLineHeightKey,
      defaultSettingsVars,
      editorThemeOverrides,
      quoteStyleVars,
      defaultSettingsKey,
      editorThemeOverridesKey,
      quoteStyleVarsKey,
    ]);

    const [methods, setMethods] = useState<ExtensiveEditorRef | null>(null);
    useImperativeHandle(ref, () => methods as ExtensiveEditorRef, [methods]);

    const handleReady = (m: ExtensiveEditorRef) => {
      setMethods(m);
      // Auto-inject default welcome content if enabled
      if (showDefaultContent && defaultContent === undefined) {
        m.injectJSON(JSON.stringify(extensiveWelcomeContent));
      } else if (defaultContent) {
        m.injectJSON(toJSONInput(defaultContent));
      }
      onReady?.(m);
    };

    return (
      <div
        className={`luthor-preset luthor-preset-extensive luthor-editor-wrapper ${variantClassName || ""} ${className || ""}`.trim()}
        data-editor-theme={editorTheme}
        style={wrapperStyleVars}
      >
        <Provider extensions={memoizedExtensions} config={{ theme: editorThemeConfig }}>
          <ExtensiveEditorContent
            isDark={isDark}
            toggleTheme={toggleTheme}
            visualPlaceholder={resolvedPlaceholders.visual}
            jsonPlaceholder={resolvedPlaceholders.json}
            initialMode={resolvedInitialMode}
            availableModes={availableModes}
            onReady={handleReady}
            toolbarLayout={toolbarLayout}
            toolbarVisibility={toolbarVisibility}
            toolbarPosition={toolbarPosition}
            toolbarAlignment={toolbarAlignment}
            toolbarClassName={toolbarClassName}
            toolbarStyleVars={toolbarStyleVars}
            isToolbarEnabled={isToolbarEnabled}
            headingOptions={headingOptions}
            paragraphLabel={paragraphLabel}
            syncHeadingOptionsWithCommands={syncHeadingOptionsWithCommands}
            slashCommandVisibility={slashCommandVisibility}
            shortcutConfig={shortcutConfig}
            commandPaletteShortcutOnly={commandPaletteShortcutOnly}
            featureFlags={resolvedFeatureFlags}
          />
        </Provider>
      </div>
    );
  },
);

ExtensiveEditor.displayName = "ExtensiveEditor";


