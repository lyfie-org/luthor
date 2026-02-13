import { RegisteredCodeSnippet } from "@/app/(docs)/lib/types";

const TYPE_DEFINITIONS_CODES: RegisteredCodeSnippet[] = [
  {
    id: "type-definitions-editor-config",
    code: `export interface EditorConfig {
  /** Theme settings for node types */
  theme?: LuthorTheme;
  /** Placeholder text when the editor is empty */
  placeholder?: string;
  /** Additional config options */
  [key: string]: any;
}`,
    language: "typescript",
    title: "EditorConfig Interface",
    description: "Configuration options for the Lexical editor",
  },
  {
    id: "type-definitions-node-theme",
    code: `export interface NodeTheme {
  /** CSS class for the node */
  className?: string;
  /** Inline styles for the node */
  style?: CSSProperties;
}`,
    language: "typescript",
    title: "NodeTheme Interface",
    description: "Theme configuration for individual nodes",
  },
  {
    id: "type-definitions-editor-context-type",
    code: `export interface EditorContextType<Exts extends readonly Extension[]> {
  /** Lexical editor instance */
  editor: LexicalEditor | null;
  /** Editor settings */
  config: EditorConfig;
  /** Registered extensions list */
  extensions: Exts;
  /** Commands aggregated from all extensions */
  commands: any;
  /** Active state flags from all extensions */
  activeStates: any;
  /** Listener hooks for editor updates */
  listeners: {
    /** Register a listener for editor state changes */
    registerUpdate: (listener: (state: any) => void) => () => void;
    /** Register a node mutation listener (optional) */
    registerMutation?: (listener: (mutations: any) => void) => () => void;
    /** Register a paste listener */
    registerPaste: (listener: (event: ClipboardEvent) => boolean) => () => void;
  };
  /** Export helpers */
  export: {
    /** Export editor content as HTML */
    toHTML: () => Promise<string>;
    /** Export editor content as Markdown */
    toMarkdown: () => Promise<string>;
    /** Export editor content as JSON */
    toJSON: () => any;
  };
  /** Import helpers */
  import: {
    /** Import HTML into the editor */
    fromHTML: (html: string) => Promise<void>;
    /** Import Markdown into the editor */
    fromMarkdown: (md: string) => Promise<void>;
    /** Import JSON into the editor */
    fromJSON: (json: any) => void;
  };
  /** Direct access to the Lexical editor */
  lexical: LexicalEditor | null;
  /** Runtime API for managing extensions */
  extensionsAPI: {
    /** Add an extension */
    add: (ext: Extension) => void;
    /** Remove an extension by name */
    remove: (name: string) => void;
    /** Reorder extensions by name list */
    reorder: (names: string[]) => void;
  };
  /** React plugins contributed by extensions */
  plugins: ReactNode[];
  /** Plugins rendered before children */
  pluginsBefore: ReactNode[];
  /** Plugins rendered after children */
  pluginsAfter: ReactNode[];
  /** Check whether an extension is registered */
  hasExtension: (name: Exts[number]['name']) => boolean;
}`,
    language: "typescript",
    title: "EditorContextType Interface",
    description: "Main context type for the Lexical editor with extensions",
  },
  {
    id: "type-definitions-extension-category-enum",
    code: `export enum ExtensionCategory {
  Toolbar = 'toolbar',
  Sidebar = 'sidebar',
  ContextMenu = 'contextmenu',
  Floating = 'floating',
  // Extend as needed
}`,
    language: "typescript",
    title: "ExtensionCategory Enum",
    description: "Categories that extensions can belong to",
  },
  {
    id: "type-definitions-base-extension-config",
    code: `export interface BaseExtensionConfig {
  showInToolbar?: boolean;
  category?: ExtensionCategory[];
  position?: 'before' | 'after';
  [key: string]: any;
}`,
    language: "typescript",
    title: "BaseExtensionConfig Interface",
    description: "Base configuration interface for all extensions",
  },
  {
    id: "type-definitions-extension-interface",
    code: `export interface Extension<Name extends string = string, Config extends BaseExtensionConfig = BaseExtensionConfig, Commands extends Record<string, any> = {}, StateQueries extends Record<string, () => Promise<boolean>> = {}, Plugins extends ReactNode[] = ReactNode[]> {
  /** Unique identifier for the extension */
  name: Name;

  /** Categories for this extension */
  category: ExtensionCategory[];

  /** Extension configuration */
  config: Config;

  /** Supported text formats */
  supportedFormats?: readonly TextFormatType[];

  /** Update extension settings */
  configure?: (config: Partial<Config>) => Extension<Name, Config, Commands, StateQueries, Plugins>;

  /** Register the extension with Lexical */
  register: (editor: LexicalEditor) => () => void;

  /** Override the extension UI component */
  overrideUI?: (CustomUI: ComponentType<{ selected?: boolean; className?: string; style?: CSSProperties; [key: string]: any }>) => Extension<Name, Config, Commands, StateQueries, Plugins>;

  /** Override node rendering behavior */
  overrideNodeRender?: (overrides: { createDOM?: (config: any) => HTMLElement; updateDOM?: (prev: any, next: any, dom: HTMLElement) => boolean }) => Extension<Name, Config, Commands, StateQueries, Plugins>;

  /** Return custom Lexical nodes */
  getNodes?: () => any[];

  /** Return React plugins */
  getPlugins: () => Plugins;

  /** Get commands provided by the extension */
  getCommands: (editor: LexicalEditor) => Commands;

  /** Return state query functions */
  getStateQueries?: (editor: LexicalEditor) => StateQueries;

  /** Legacy toolbar items */
  // getToolbarItems?(): ToolbarItem<Commands>[];
}`,
    language: "typescript",
    title: "Extension Interface",
    description: "Core extension interface that all extensions must implement",
  },
  {
    id: "type-definitions-base-commands",
    code: `export interface BaseCommands {
  formatText: (format: TextFormatType, value?: boolean | string) => void;
}`,
    language: "typescript",
    title: "BaseCommands Interface",
    description: "Base commands that are always available",
  },
  {
    id: "type-definitions-extract-types",
    code: `// Infer unions from the extensions array
export type ExtractNames<Exts extends readonly Extension[]> = Exts[number]['name'];
export type ExtractCommands<Exts extends readonly Extension[]> = MergeCommands<
  ReturnType<Exts[number]['getCommands']>
>;
export type ExtractPlugins<Exts extends readonly Extension[]> = ReturnType<Exts[number]['getPlugins']>[number];

// Extract state queries the same way
export type ExtractStateQueries<Exts extends readonly Extension[]> = MergeStateQueries<
  ReturnType<NonNullable<Exts[number]['getStateQueries']>>
>;`,
    language: "typescript",
    title: "Type Extraction Utilities",
    description:
      "Utility types for extracting information from extension arrays",
  },
  {
    id: "type-definitions-editor-context-type-extensions",
    code: `export interface EditorContextType<Exts extends readonly Extension[]> {
  /** Underlying Lexical editor instance */
  editor: LexicalEditor | null;

  /** Editor settings */
  config?: EditorConfig;

  /** Loaded extensions list */
  extensions: Exts;

  /** Commands available from all extensions */
  commands: BaseCommands & ExtractCommands<Exts>;

  /** Current state for all extensions */
  activeStates: ExtractStateQueries<Exts>;

  /** State query functions from extensions */
  stateQueries: Record<string, () => Promise<any>>;

  /** Event listener registration */
  listeners: {
    registerUpdate: (listener: (state: any) => void) => (() => void) | undefined;
    registerPaste: (listener: (event: ClipboardEvent) => boolean) => (() => void) | undefined;
  };

  /** Export helpers for formats */
  export: {
    toHTML: () => Promise<string>;
    toMarkdown: () => Promise<string>;
    toJSON: () => any;
  };

  /** Import helpers for formats */
  import: {
    fromHTML: (html: string) => Promise<void>;
    fromMarkdown: (md: string) => Promise<void>;
    fromJSON: (json: any) => void;
  };

  /** Alias of the raw Lexical editor */
  lexical: LexicalEditor | null;

  /** Dynamic extensions API */
  extensionsAPI: {
    add: (ext: Extension) => void;
    remove: (name: string) => void;
    reorder: (names: string[]) => void;
  };

  /** React plugins collected from extensions */
  plugins: ExtractPlugins<Exts>[];

  /** Check whether a specific extension is loaded */
  hasExtension: (name: ExtractNames<Exts>) => boolean;
}`,
    language: "typescript",
    title: "EditorContextType (Extensions)",
    description:
      "Context type for the editor system, generic over the extensions array",
  },
  {
    id: "type-definitions-typed-extension-usage",
    code: `const extensions = [
  boldExtension,
  italicExtension,
  linkExtension
] as const;

type MyEditorContext = EditorContextType<typeof extensions>;

// You now have full type safety
const MyEditor: React.FC = () => {
  const { commands, activeStates } = useEditor();
  // commands includes all available commands with proper types
  // activeStates includes state queries with boolean types
};`,
    language: "typescript",
    title: "Typed Extension Usage",
    description: "Creating type-safe extension arrays and editor contexts",
  },
];

export default TYPE_DEFINITIONS_CODES;
