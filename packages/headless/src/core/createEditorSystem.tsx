import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  FORMAT_TEXT_COMMAND,
  COMMAND_PRIORITY_EDITOR,
  PASTE_COMMAND,
  SerializedEditorState,
  SerializedLexicalNode,
  TextFormatType,
} from "lexical";
import {
  EditorConfig,
  EditorContextType,
  Extension,
  ExtractCommands,
  ExtractStateQueries,
  BaseCommands,
} from "@lyfie/luthor-headless/extensions/types";
import { defaultLuthorTheme } from "./theme";

// Shared context to avoid mismatches between typed/untyped usage
export const EditorContext = createContext<
  EditorContextType<readonly Extension[]> | null
>(null);

interface ProviderProps<Exts extends readonly Extension[]> {
  children: ReactNode;
  config?: EditorConfig;
  extensions: Exts;
}

/**
 * Creates a typed editor system based on the provided extensions array.
 * This factory function generates a Provider component and useEditor hook
 * that are strongly typed based on the extensions passed to it.
 *
 * @template Exts - Array of extensions that define the editor's capabilities
 * @returns Object containing Provider component and useEditor hook
 *
 * @example
 * ```tsx
 * const extensions = [boldExtension, italicExtension] as const;
 * const { Provider, useEditor } = createEditorSystem<typeof extensions>();
 * ```
 */
export function createEditorSystem<Exts extends readonly Extension[]>() {
  /**
   * Hook to access the editor context. Must be used within a Provider.
   *
   * @returns Editor context with commands, state, and utilities
   * @throws Error if used outside of Provider
   */
  function useEditor(): EditorContextType<Exts> {
    const ctx = useContext(EditorContext);
    if (!ctx) throw new Error("useEditor must be used within Provider");
    return ctx as unknown as EditorContextType<Exts>;
  }

  /**
   * Internal provider component that sets up the editor context.
   * Handles extension registration, command aggregation, and state management.
   */
  function ProviderInner({
    children,
    config = {},
    extensions,
  }: ProviderProps<Exts>) {
    const [editor] = useLexicalComposerContext();

    // Lazy commands from extensions + base
    const baseCommands = useMemo<BaseCommands>(
      () => ({
        formatText: (format: TextFormatType, value?: boolean | string) => {
          void value;
          return editor?.dispatchCommand(FORMAT_TEXT_COMMAND, format);
        },
      }),
      [editor],
    );
    const extensionCommands = useMemo(() => {
      if (!editor) {
        return {} as ExtractCommands<Exts>;
      }

      return extensions.reduce(
        (acc, ext) => ({ ...acc, ...ext.getCommands(editor) }),
        {} as ExtractCommands<Exts>,
      );
    }, [extensions, editor]);

    const commands = useMemo(
      () => ({ ...baseCommands, ...extensionCommands }),
      [baseCommands, extensionCommands],
    ) as BaseCommands & ExtractCommands<Exts>;

    // Plugins: Collect and separate by position
    const plugins = useMemo(
      () => extensions.flatMap((ext) => ext.getPlugins?.() || []),
      [extensions],
    );
    const pluginsBefore = useMemo(
      () =>
        extensions
          .filter((ext) => (ext.config?.position || "before") === "before")
          .flatMap((ext) => ext.getPlugins?.() || []),
      [extensions],
    );
    const pluginsAfter = useMemo(
      () =>
        extensions
          .filter((ext) => (ext.config?.position || "before") === "after")
          .flatMap((ext) => ext.getPlugins?.() || []),
      [extensions],
    );

    // Register extensions (this was missing!)
    useEffect(() => {
      if (!editor) return;
      
      // Sort extensions by initPriority (higher numbers first)
      const sortedExtensions = [...extensions].sort((a, b) => {
        const aPriority = a.config?.initPriority ?? 0;
        const bPriority = b.config?.initPriority ?? 0;
        return bPriority - aPriority;
      });
      
      const unregisters = sortedExtensions.map((ext) => ext.register(editor));
      return () => unregisters.forEach((unreg) => unreg && unreg());
    }, [editor, extensions]);

    // Collect state queries (now all Promise-based)
    const stateQueries = useMemo(() => {
      if (!editor) {
        return {} as Record<string, () => Promise<boolean>>;
      }

      return extensions.reduce(
        (acc, ext) => ({
          ...acc,
          ...(ext.getStateQueries ? ext.getStateQueries(editor) : {}),
        }),
        {} as Record<string, () => Promise<boolean>>,
      );
    }, [extensions, editor]);

    // Batched active states
    const [activeStates, setActiveStates] = useState<ExtractStateQueries<Exts>>(
      () => {
        const obj: Record<string, boolean> = {};
        Object.keys(stateQueries).forEach((key) => (obj[key] = false));
        return obj as ExtractStateQueries<Exts>;
      },
    );

    useEffect(() => {
      const stateKeys = Object.keys(stateQueries);

      setActiveStates((previousStates) => {
        const nextStates = {} as ExtractStateQueries<Exts>;

        for (const key of stateKeys) {
          const previousValue = (previousStates as Record<string, boolean>)[key];
          (nextStates as Record<string, boolean>)[key] = previousValue ?? false;
        }

        const previousKeys = Object.keys(previousStates as Record<string, boolean>);
        if (previousKeys.length !== stateKeys.length) {
          return nextStates;
        }

        for (const key of stateKeys) {
          if (
            (previousStates as Record<string, boolean>)[key] !==
            (nextStates as Record<string, boolean>)[key]
          ) {
            return nextStates;
          }
        }

        return previousStates;
      });
    }, [stateQueries]);

    // Reactive state management
    useEffect(() => {
      if (!editor) return;

      let isActive = true;
      let updateVersion = 0;

      const updateStates = async () => {
        const currentVersion = ++updateVersion;
        const queryEntries = Object.entries(stateQueries);

        const promises = queryEntries.map(async ([key, queryFn]) => {
          try {
            const value = await queryFn();
            return [key, value] as [string, boolean];
          } catch {
            return [key, false] as [string, boolean];
          }
        });

        const results = await Promise.all(promises);

        if (!isActive || currentVersion !== updateVersion) {
          return;
        }

        const nextStates = Object.fromEntries(results) as ExtractStateQueries<Exts>;

        setActiveStates((previousStates) => {
          const previousMap = previousStates as Record<string, boolean>;
          const nextMap = nextStates as Record<string, boolean>;
          const previousKeys = Object.keys(previousMap);
          const nextKeys = Object.keys(nextMap);

          if (previousKeys.length !== nextKeys.length) {
            return nextStates;
          }

          for (const key of nextKeys) {
            if (previousMap[key] !== nextMap[key]) {
              return nextStates;
            }
          }

          return previousStates;
        });
      };

      // Initial update
      void updateStates();

      // Listen to editor updates for standard state queries
      const unregisterEditor = editor.registerUpdateListener(() => {
        void updateStates();
      });

      // Listen to extension state changes for reactive extensions
      const unregisterExtensions = extensions
        .map((ext) => {
          const maybeReactiveExtension = ext as Extension & {
            onStateChange?: (listener: () => void) => () => void;
          };

          if (typeof maybeReactiveExtension.onStateChange === "function") {
            return maybeReactiveExtension.onStateChange(() => {
              void updateStates();
            });
          }

          return undefined;
        })
        .filter((unregister): unregister is () => void =>
          typeof unregister === "function",
        );

      return () => {
        isActive = false;
        unregisterEditor();
        unregisterExtensions.forEach((unreg) => unreg());
      };
    }, [editor, stateQueries, extensions]);

    /**
     * Context value containing all editor functionality and state.
     * This is the main interface that components use via the useEditor hook.
     */
    const contextValue: EditorContextType<Exts> = {
      editor,
      config,
      extensions,
      commands,
      activeStates: activeStates as ExtractStateQueries<Exts>,
      stateQueries, // Add stateQueries to context
      listeners: {
        registerUpdate: (
          listener: Parameters<Extension["register"]>[0]["registerUpdateListener"] extends (
            callback: infer T,
            ...args: never[]
          ) => unknown
            ? T
            : never,
        ) =>
          editor?.registerUpdateListener(listener) || (() => {}),
        registerPaste: (listener: (event: ClipboardEvent) => boolean) =>
          editor?.registerCommand(
            PASTE_COMMAND,
            listener,
            COMMAND_PRIORITY_EDITOR,
          ) || (() => {}),
      },
      export: {
        toHTML: async () => "",
        toMarkdown: async () => "",
        toJSON: () => editor?.getEditorState().toJSON(),
      },
      import: {
        fromHTML: async () => {},
        fromMarkdown: async () => {},
        fromJSON: (json: unknown) => {
          if (!editor) {
            return;
          }

          if (typeof json === "string" || (typeof json === "object" && json !== null)) {
            editor.setEditorState(
              editor.parseEditorState(
                json as string | SerializedEditorState<SerializedLexicalNode>,
              ),
            );
          }
        },
      },
      lexical: editor,
      extensionsAPI: {
        add: (ext: Extension) => {
          void ext;
        }, // TODO: Implement dynamic add
        remove: (name: string) => {
          void name;
        },
        reorder: (names: string[]) => {
          void names;
        },
      },
      plugins,
      hasExtension: (name: Exts[number]["name"]) =>
        extensions.some((ext) => ext.name === name),
    };

    return (
      <EditorContext.Provider
        value={
          contextValue as unknown as EditorContextType<readonly Extension[]>
        }
      >
        {pluginsBefore}
        {children}
        {pluginsAfter}
      </EditorContext.Provider>
    );
  }

  /**
   * Main Provider component that wraps the editor in LexicalComposer.
   * This component should be used at the root of your editor component tree.
   *
   * @param props - Provider props including children, config, and extensions
   * @returns React component that provides editor context
   */
  function Provider(props: ProviderProps<Exts>) {
    const nodes = useMemo(() => {
      const allNodes = props.extensions.flatMap(
        (ext: Extension) => ext.getNodes?.() || [],
      );
      return allNodes;
    }, [props.extensions]);

    const initialConfig = useMemo(
      () => ({
        namespace: "modern-editor",
        theme: props.config?.theme || defaultLuthorTheme,
        onError: (error: Error) => {
          console.error("Lexical error:", error);
        },
        nodes,
      }),
      [props.config?.theme, nodes],
    );

    return (
      <LexicalComposer initialConfig={initialConfig}>
        <ProviderInner {...props} />
      </LexicalComposer>
    );
  }
  return { Provider, useEditor };
}

// Base system for untyped use
export const baseEditorSystem = createEditorSystem<readonly Extension[]>();
export const BaseProvider = baseEditorSystem.Provider;
export const useBaseEditor = () => {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useBaseEditor must be used within Provider");
  return ctx;
};

