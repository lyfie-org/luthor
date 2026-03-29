/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import {
  LexicalEditor,
  TextFormatType,
  EditorThemeClasses,
  KlassConstructor,
  LexicalNode,
  LexicalNodeReplacement,
} from "lexical";
import { ComponentType, CSSProperties, ReactNode } from "react";

export type LexicalNodeRegistration =
  | KlassConstructor<typeof LexicalNode>
  | LexicalNodeReplacement;

/** Extension category buckets */
export enum ExtensionCategory {
  Toolbar = "toolbar",
  Sidebar = "sidebar",
  ContextMenu = "contextmenu",
  Floating = "floating",
  // Extend as needed
}

/** Shared base config for extensions */
export interface BaseExtensionConfig {
  showInToolbar?: boolean;
  category?: ExtensionCategory[];
  position?: "before" | "after";
  /** Initialization priority; higher registers first (default: 0) */
  initPriority?: number;
  [key: string]: unknown;
}

/** Toolbar item configuration */
export interface ToolbarItem {
  label: string;
  onClick: () => void;
  isActive?: () => boolean;
  component?: React.ComponentType<Record<string, unknown>>;
}

/**
 * Core extension contract implemented by all extensions.
 * Defines the required API surface for Luthor extensions.
 *
 * @template Name - Exact literal type of the extension name
 * @template Config - Extension configuration type
 * @template Commands - Command map exposed by the extension
 * @template StateQueries - State query function map
 * @template Plugins - React plugins exposed by the extension
 */
export interface Extension<
  Name extends string = string,
  Config extends BaseExtensionConfig = BaseExtensionConfig,
  Commands extends Record<string, unknown> = Record<string, never>,
  StateQueries extends Record<string, () => Promise<boolean>> = Record<
    string,
    never
  >,
  Plugins extends ReactNode[] = ReactNode[],
> {
  /** Unique identifier for this extension */
  name: Name;

  /** Category groups for this extension */
  category: ExtensionCategory[];

  /** Extension configuration */
  config: Config;

  /** Supported text formats */
  supportedFormats?: readonly TextFormatType[];

  /** Update extension settings */
  configure?: (
    config: Partial<Config>,
  ) => Extension<Name, Config, Commands, StateQueries, Plugins>;

  /** Register the extension with Lexical */
  register: (editor: LexicalEditor) => () => void;

  /** Override the extension UI component */
  overrideUI?: (
    CustomUI: ComponentType<{
      selected?: boolean;
      className?: string;
      style?: CSSProperties;
      [key: string]: unknown;
    }>,
  ) => Extension<Name, Config, Commands, StateQueries, Plugins>;

  /** Override node rendering logic */
  overrideNodeRender?: (overrides: {
    createDOM?: (config: unknown) => HTMLElement;
    updateDOM?: (prev: unknown, next: unknown, dom: HTMLElement) => boolean;
  }) => Extension<Name, Config, Commands, StateQueries, Plugins>;

  /** Return custom Lexical nodes */
  getNodes?: () => LexicalNodeRegistration[];

  /** Return React plugins */
  getPlugins: () => Plugins;

  /** Provide commands exposed by the extension */
  getCommands: (editor: LexicalEditor) => Commands;

  /** Return state query functions */
  getStateQueries?: (editor: LexicalEditor) => StateQueries;

  /** Legacy toolbar items hook */
  // getToolbarItems?(): ToolbarItem<Commands>[];
}

// Merge commands (uses unknown for distribution)
type MergeCommands<T> = {
  [K in UnionKeys<T>]: T extends { [P in K]: infer V } ? V : never;
};

// Merge state queries (values as boolean for distribution)
type MergeStateQueries<T> = {
  [K in UnionKeys<T>]: boolean;
};

// Infer unions from the extensions array
export type ExtractNames<Exts extends readonly Extension[]> =
  Exts[number]["name"];
export type ExtractCommands<Exts extends readonly Extension[]> = MergeCommands<
  ReturnType<Exts[number]["getCommands"]>
>;
export type ExtractPlugins<Exts extends readonly Extension[]> = ReturnType<
  Exts[number]["getPlugins"]
>[number];

// Helper for union keys
type UnionKeys<T> = T extends unknown ? keyof T : never;

// Extract state queries the same way
export type ExtractStateQueries<Exts extends readonly Extension[]> =
  MergeStateQueries<ReturnType<NonNullable<Exts[number]["getStateQueries"]>>>;

// Base commands that are always available
export interface BaseCommands {
  formatText: (format: TextFormatType, value?: boolean | string) => void;
}

/**
 * Editor system context type, parameterized by the extensions array.
 * Exposes typed commands, state, and utilities.
 *
 * @template Exts - Extensions array that defines available functionality
 */
export interface EditorContextType<Exts extends readonly Extension[]> {
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
  stateQueries: Record<string, () => Promise<unknown>>;

  /** Event listener registration */
  listeners: {
    registerUpdate: (
      listener: (state: unknown) => void,
    ) => (() => void) | undefined;
    registerPaste: (
      listener: (event: ClipboardEvent) => boolean,
    ) => (() => void) | undefined;
  };

  /** Export helpers for formats */
  export: {
    toJSON: () => unknown;
  };

  /** Import helpers for formats */
  import: {
    fromJSON: (json: unknown) => void;
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
}

// Assumes EditorConfig is defined elsewhere; add if needed
export interface EditorConfig {
  theme?: EditorThemeClasses;
  [key: string]: unknown;
}
