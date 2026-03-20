import {
  getCodeLanguageOptions,
  getCodeLanguages,
  $isCodeNode,
  CodeNode,
  normalizeCodeLang,
} from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  registerMarkdownShortcuts,
  TRANSFORMERS,
} from "@lexical/markdown";
import { createPortal } from "react-dom";
import type { LexicalEditor, LexicalNode } from "lexical";
import {
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $nodesOfType,
  HISTORY_MERGE_TAG,
} from "lexical";
import {
  ReactNode,
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BaseExtension } from "../base/BaseExtension";
import {
  type CodeHighlightProviderConfig,
  getFallbackCodeTheme,
} from "./codeHighlightProvider";

const COPY_ICON_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V9Zm2 0h8v10h-8V9Zm-6 8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1h-2V5H5v10h1v2H5Z"/></svg>';

const CHECK_ICON_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.3 5.7a1 1 0 0 1 0 1.4l-9.2 9.2a1 1 0 0 1-1.4 0L3.7 10.3a1 1 0 1 1 1.4-1.4l5.3 5.3 8.5-8.5a1 1 0 0 1 1.4 0Z"/></svg>';

export type CodeIntelligenceCommands = {
  setCodeLanguage: (language: string) => void;
  autoDetectCodeLanguage: () => Promise<string | null>;
  getCurrentCodeLanguage: () => Promise<string | null>;
  getCodeLanguageOptions: () => string[];
  copySelectedCodeBlock: () => Promise<boolean>;
};

export type CodeLanguageOptionsMode = "append" | "replace";

export type CodeLanguageOptionsConfig = {
  mode?: CodeLanguageOptionsMode;
  values: readonly string[];
};

const DEFAULT_LANGUAGE_OPTIONS = [
  "plaintext",
  "typescript",
  "javascript",
  "bash",
  "powershell",
  "python",
  "java",
  "c",
  "cpp",
  "csharp",
  "go",
  "rust",
  "swift",
  "kotlin",
  "php",
  "ruby",
  "sql",
  "markdown",
  "html",
  "css",
  "json",
  "json5",
  "yaml",
  "toml",
  "ini",
  "graphql",
  "docker",
  "xml",
] as const;

const LANGUAGE_ALIASES: Record<string, string> = {
  "c#": "csharp",
  cs: "csharp",
  dockerfile: "docker",
  kt: "kotlin",
  ps1: "powershell",
  pwsh: "powershell",
  rb: "ruby",
  sh: "bash",
  shell: "bash",
  yml: "yaml",
  zsh: "bash",
};

const LANGUAGE_LABEL_OVERRIDES: Record<string, string> = {
  atom: "Atom",
  bash: "Bash",
  c: "C",
  csharp: "C#",
  clike: "C-like",
  cpp: "C++",
  css: "CSS",
  diff: "Diff",
  docker: "Docker",
  go: "Go",
  graphql: "GraphQL",
  html: "HTML",
  ini: "INI",
  java: "Java",
  json: "JSON",
  json5: "JSON5",
  js: "JavaScript",
  kotlin: "Kotlin",
  markup: "Markup",
  markdown: "Markdown",
  mathml: "MathML",
  objc: "Objective-C",
  objectivec: "Objective-C",
  php: "PHP",
  plain: "Plain Text",
  powershell: "PowerShell",
  py: "Python",
  ruby: "Ruby",
  rss: "RSS",
  rust: "Rust",
  sql: "SQL",
  ssml: "SSML",
  svg: "SVG",
  swift: "Swift",
  toml: "TOML",
  txt: "Plain Text",
  typescript: "TypeScript",
  xml: "XML",
  yaml: "YAML",
};

export type CodeIntelligenceConfig = CodeHighlightProviderConfig & {
  maxAutoDetectLength?: number;
  isCopyAllowed?: boolean;
  languageOptions?: readonly string[] | CodeLanguageOptionsConfig;
};

export class CodeIntelligenceExtension extends BaseExtension<
  "codeIntelligence",
  CodeIntelligenceConfig,
  CodeIntelligenceCommands,
  Record<string, never>,
  ReactNode[]
> {
  private languageOptions: string[] = [];

  constructor() {
    super("codeIntelligence");
    this.config = {
      isCopyAllowed: true,
    };
  }

  register(editor: LexicalEditor): () => void {
    this.languageOptions = this.getLanguageOptions();

    const unregisterMarkdownShortcuts = registerMarkdownShortcuts(
      editor,
      TRANSFORMERS,
    );

    const unregisterUpdate = editor.registerUpdateListener(
      ({ dirtyElements, dirtyLeaves }) => {
        const hasContentChanges =
          dirtyElements.size > 0 || dirtyLeaves.size > 0;

        if (hasContentChanges) {
          this.ensureCodeBlockThemes(editor);
        }
      },
    );

    queueMicrotask(() => {
      this.ensureCodeBlockThemes(editor);
    });

    return () => {
      unregisterMarkdownShortcuts();
      unregisterUpdate();
      this.languageOptions = [];
    };
  }

  getPlugins(): ReactNode[] {
    return [
      createElement(CodeBlockControlsPlugin, {
        key: "code-intelligence-controls",
        extension: this,
      }),
    ];
  }

  getCommands(editor: LexicalEditor): CodeIntelligenceCommands {
    return {
      setCodeLanguage: (language: string) => {
        const normalized = normalizeLanguage(language);
        const theme = this.getThemeForLanguage(normalized);
        editor.update(() => {
          this.getSelectionCodeNodes().forEach((node) => {
            node.setLanguage(normalized ?? "plain");
            node.setTheme(theme);
          });
        });
      },
      autoDetectCodeLanguage: async () => {
        void editor;
        return null;
      },
      getCurrentCodeLanguage: () =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const nodes = this.getSelectionCodeNodes();
            resolve(nodes[0]?.getLanguage() ?? null);
          });
        }),
      getCodeLanguageOptions: () => this.getLanguageOptions(),
      copySelectedCodeBlock: async () => {
        if (!this.isCopyAllowed()) {
          return false;
        }

        const target = await this.getPrimaryCodeBlockText(editor);
        if (!target || !target.text.trim()) {
          return false;
        }

        return writeTextToClipboard(target.text);
      },
    };
  }

  isCopyAllowed(): boolean {
    return this.config.isCopyAllowed !== false;
  }

  getLanguageOptionsSnapshot(): string[] {
    return this.languageOptions.length
      ? [...this.languageOptions]
      : this.getLanguageOptions();
  }

  getCodeBlocksSnapshot(editor: LexicalEditor): CodeBlockSnapshot[] {
    return editor.getEditorState().read(() =>
      $nodesOfType(CodeNode).map((node) => {
        const normalized = normalizeLanguage(node.getLanguage());

        return {
          key: node.getKey(),
          language: normalized ?? "plain",
          text: node.getTextContent(),
        };
      }),
    );
  }

  setCodeBlockLanguage(
    editor: LexicalEditor,
    nodeKey: string,
    selectedLanguage: string,
  ): void {
    if (!editor.isEditable()) {
      return;
    }

    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (!node || !$isCodeNode(node)) {
        return;
      }

      const normalized = normalizeLanguage(selectedLanguage);
      node.setLanguage(normalized ?? "plain");
      node.setTheme(this.getThemeForLanguage(normalized));
    });
  }

  getCodeBlockText(editor: LexicalEditor, nodeKey: string): string {
    return editor.getEditorState().read(() => {
      const node = $getNodeByKey(nodeKey);
      if (!node || !$isCodeNode(node)) {
        return "";
      }
      return node.getTextContent();
    });
  }

  private getThemeForLanguage(language: string | null | undefined): string | null {
    const normalized = normalizeLanguage(language);
    if (!normalized || normalized === "plain") {
      return getFallbackCodeTheme();
    }
    return "prism";
  }

  private ensureCodeBlockThemes(editor: LexicalEditor): void {
    const updates = editor.getEditorState().read(() => {
      return $nodesOfType(CodeNode)
        .map((node) => {
          const currentTheme =
            (
              node as unknown as {
                getTheme?: () => string | null | undefined;
              }
            ).getTheme?.() ?? "";
          const theme = this.getThemeForLanguage(node.getLanguage());
          return {
            key: node.getKey(),
            nextTheme: theme ?? getFallbackCodeTheme(),
            currentTheme,
          };
        })
        .filter((entry) => entry.currentTheme !== entry.nextTheme);
    });

    if (updates.length === 0) {
      return;
    }

    editor.update(
      () => {
        updates.forEach((entry) => {
          const node = $getNodeByKey(entry.key);
          if (!node || !$isCodeNode(node)) {
            return;
          }
          node.setTheme(entry.nextTheme);
        });
      },
      {
        tag: HISTORY_MERGE_TAG,
      },
    );
  }

  private getSelectionCodeNodes(): CodeNode[] {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return [];

    const allNodes = selection.getNodes();
    const codeNodes = new Map<string, CodeNode>();

    allNodes.forEach((node) => {
      const codeNode = this.getNearestCodeNode(node);
      if (!codeNode) return;
      codeNodes.set(codeNode.getKey(), codeNode);
    });

    return Array.from(codeNodes.values());
  }

  private getNearestCodeNode(node: LexicalNode): CodeNode | null {
    let current: LexicalNode | null = node;

    while (current) {
      if ($isCodeNode(current)) {
        return current;
      }
      current = current.getParent();
    }

    return null;
  }

  private getLanguageOptions(): string[] {
    const normalizedDefaultLanguages = DEFAULT_LANGUAGE_OPTIONS
      .map((lang) => normalizeLanguage(lang))
      .filter((lang): lang is string => !!lang);

    const languageOptionsConfig = resolveLanguageOptionsConfig(
      this.config.languageOptions,
    );
    if (!languageOptionsConfig) {
      return toSortedUniqueLanguageOptions(normalizedDefaultLanguages);
    }

    const configuredOptions = normalizeConfiguredLanguageOptions(
      languageOptionsConfig.values,
    );

    if (languageOptionsConfig.mode === "replace") {
      return toSortedUniqueLanguageOptions(configuredOptions);
    }

    return toSortedUniqueLanguageOptions([
      ...normalizedDefaultLanguages,
      ...configuredOptions,
    ]);
  }

  private async getPrimaryCodeBlockText(
    editor: LexicalEditor,
  ): Promise<{ key: string; text: string } | null> {
    return new Promise((resolve) => {
      editor.getEditorState().read(() => {
        const nodes = this.getSelectionCodeNodes();
        const node = nodes[0];
        if (!node) {
          resolve(null);
          return;
        }
        const text = node.getTextContent().trim();
        if (!text) {
          resolve(null);
          return;
        }
        resolve({ key: node.getKey(), text });
      });
    });
  }

}

type CodeBlockSnapshot = {
  key: string;
  language: string;
  text: string;
};

type CodeBlockControlModel = {
  key: string;
  language: string;
  top: number;
  left: number;
  width: number;
};

const CODEBLOCK_HEADER_HEIGHT = 34;

function CodeBlockControlsPlugin({
  extension,
}: {
  extension: CodeIntelligenceExtension;
}) {
  const [editor] = useLexicalComposerContext();
  const [isEditorEditable, setIsEditorEditable] = useState(() => editor.isEditable());
  const [controls, setControls] = useState<CodeBlockControlModel[]>([]);
  const [copyStateByNodeKey, setCopyStateByNodeKey] = useState<
    Record<string, "copied" | "error">
  >({});
  const rafIdRef = useRef<number | null>(null);
  const feedbackTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const languageOptions = useMemo(() => {
    return extension.getLanguageOptionsSnapshot();
  }, [extension]);
  const languageOptionEntries = useMemo(() => {
    return languageOptions.map((id) => ({
      id,
      label: getLanguageDisplayLabel(id),
    }));
  }, [languageOptions]);

  const buildControlModels = useCallback((): CodeBlockControlModel[] => {
    const portalRoot = getCodeblockControlsPortalRoot(editor);
    if (!portalRoot) {
      return [];
    }

    const portalRect = portalRoot.getBoundingClientRect();
    const snapshots = extension.getCodeBlocksSnapshot(editor);
    const models: CodeBlockControlModel[] = [];

    snapshots.forEach((block) => {
      const codeElement = editor.getElementByKey(block.key) as HTMLElement | null;
      if (!codeElement || !codeElement.isConnected) {
        return;
      }

      codeElement.classList.add("luthor-code-block--interactive");
      const rect = codeElement.getBoundingClientRect();
      const width = Math.max(120, Math.round(rect.width));
      const top = Math.max(
        0,
        Math.round(rect.top - portalRect.top - CODEBLOCK_HEADER_HEIGHT),
      );
      const left = Math.max(0, Math.round(rect.left - portalRect.left));

      models.push({
        key: block.key,
        language: block.language,
        top,
        left,
        width,
      });
    });

    return models;
  }, [editor, extension]);

  const syncControls = useCallback(() => {
    const next = buildControlModels();
    setControls((previous) => {
      if (areControlModelsEqual(previous, next)) {
        return previous;
      }
      return next;
    });
  }, [buildControlModels]);

  const scheduleSyncControls = useCallback(() => {
    if (rafIdRef.current !== null) {
      return;
    }

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      syncControls();
    });
  }, [syncControls]);

  const clearFeedbackTimer = useCallback((nodeKey: string) => {
    const timer = feedbackTimersRef.current.get(nodeKey);
    if (timer) {
      clearTimeout(timer);
      feedbackTimersRef.current.delete(nodeKey);
    }
  }, []);

  const setFeedbackState = useCallback(
    (nodeKey: string, state: "copied" | "error") => {
      clearFeedbackTimer(nodeKey);
      setCopyStateByNodeKey((previous) => ({ ...previous, [nodeKey]: state }));

      const timer = setTimeout(() => {
        setCopyStateByNodeKey((previous) => {
          if (!(nodeKey in previous)) {
            return previous;
          }

          const next = { ...previous };
          delete next[nodeKey];
          return next;
        });
        feedbackTimersRef.current.delete(nodeKey);
      }, 1200);

      feedbackTimersRef.current.set(nodeKey, timer);
    },
    [clearFeedbackTimer],
  );

  const handleLanguageChange = useCallback(
    (nodeKey: string, value: string) => {
      if (!isEditorEditable) {
        return;
      }

      extension.setCodeBlockLanguage(editor, nodeKey, value);
      scheduleSyncControls();
    },
    [editor, extension, isEditorEditable, scheduleSyncControls],
  );

  const canCopy = extension.isCopyAllowed();

  const handleCopyClick = useCallback(
    async (nodeKey: string) => {
      if (!canCopy) {
        return;
      }

      const text = extension.getCodeBlockText(editor, nodeKey);
      if (!text.trim()) {
        return;
      }

      const copied = await writeTextToClipboard(text);
      if (copied) {
        setFeedbackState(nodeKey, "copied");
        return;
      }

      setFeedbackState(nodeKey, "error");
    },
    [canCopy, editor, extension, setFeedbackState],
  );

  useEffect(() => {
    return editor.registerEditableListener(setIsEditorEditable);
  }, [editor]);

  useEffect(() => {
    scheduleSyncControls();

    let initialFrameCount = 0;
    let initialFrameId: number | null = null;
    const syncAcrossInitialFrames = () => {
      scheduleSyncControls();
      initialFrameCount += 1;
      if (initialFrameCount >= 20) {
        return;
      }
      initialFrameId = requestAnimationFrame(syncAcrossInitialFrames);
    };
    initialFrameId = requestAnimationFrame(syncAcrossInitialFrames);

    const unregisterUpdate = editor.registerUpdateListener(() => {
      scheduleSyncControls();
    });

    const onViewportChange = () => {
      scheduleSyncControls();
    };

    const feedbackTimers = feedbackTimersRef.current;

    window.addEventListener("scroll", onViewportChange, true);
    window.addEventListener("resize", onViewportChange, { passive: true });

    return () => {
      unregisterUpdate();
      window.removeEventListener("scroll", onViewportChange, true);
      window.removeEventListener("resize", onViewportChange);
      if (initialFrameId !== null) {
        cancelAnimationFrame(initialFrameId);
      }
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      feedbackTimers.forEach((timer) => clearTimeout(timer));
      feedbackTimers.clear();
    };
  }, [editor, scheduleSyncControls]);

  useEffect(() => {
    const activeNodeKeys = new Set(controls.map((control) => control.key));

    setCopyStateByNodeKey((previous) => {
      let changed = false;
      const next: Record<string, "copied" | "error"> = {};

      Object.entries(previous).forEach(([nodeKey, state]) => {
        if (activeNodeKeys.has(nodeKey)) {
          next[nodeKey] = state;
          return;
        }

        changed = true;
        clearFeedbackTimer(nodeKey);
      });

      return changed ? next : previous;
    });
  }, [clearFeedbackTimer, controls]);

  if (typeof document === "undefined" || controls.length === 0) {
    return null;
  }

  const portalRoot = getCodeblockControlsPortalRoot(editor);

  if (!portalRoot) {
    return null;
  }

  return createPortal(
    createElement(
      "div",
      { className: "luthor-codeblock-controls-layer", "aria-hidden": false },
      controls.map((control) => {
        const feedbackState = copyStateByNodeKey[control.key];
        const copyClassName = [
          "luthor-codeblock-copy",
          feedbackState === "copied" ? "is-copied" : "",
          feedbackState === "error" ? "is-copy-error" : "",
        ]
          .filter(Boolean)
          .join(" ");

        const copyTitle =
          feedbackState === "copied"
            ? "Copied"
            : feedbackState === "error"
              ? "Copy failed"
              : "Copy to clipboard";

        return createElement(
          "div",
          {
            key: control.key,
            className: "luthor-codeblock-controls",
            "data-code-node-key": control.key,
            style: {
              position: "absolute",
              top: `${control.top}px`,
              left: `${control.left}px`,
              width: `${control.width}px`,
            },
          },
          createElement(
            "span",
            { className: "luthor-codeblock-controls-left" },
            createElement(
              "select",
              {
                className: "luthor-codeblock-language",
                value: control.language,
                "aria-label": "Code language",
                disabled: !isEditorEditable,
                "aria-disabled": !isEditorEditable,
                onChange: (event: Event) => {
                  const target = event.target as HTMLSelectElement;
                  handleLanguageChange(control.key, target.value);
                },
              },
              languageOptionEntries.map((option) =>
                createElement("option", { key: option.id, value: option.id }, option.label),
              ),
            ),
          ),
          createElement(
            "span",
            { className: "luthor-codeblock-controls-right" },
            canCopy
              ? createElement("button", {
                  className: copyClassName,
                  type: "button",
                  "aria-label": "Copy code",
                  title: copyTitle,
                  "data-tooltip": copyTitle,
                  onMouseDown: (event: MouseEvent) => {
                    event.preventDefault();
                  },
                  onClick: () => {
                    void handleCopyClick(control.key);
                  },
                  dangerouslySetInnerHTML: {
                    __html: feedbackState === "copied" ? CHECK_ICON_SVG : COPY_ICON_SVG,
                  },
                })
              : null,
          ),
        );
      }),
    ),
    portalRoot,
  );
}

function areControlModelsEqual(
  current: CodeBlockControlModel[],
  next: CodeBlockControlModel[],
): boolean {
  if (current.length !== next.length) {
    return false;
  }

  for (let index = 0; index < current.length; index += 1) {
    const currentItem = current[index];
    const nextItem = next[index];
    if (!currentItem || !nextItem) {
      return false;
    }

    if (
      currentItem.key !== nextItem.key ||
      currentItem.language !== nextItem.language ||
      currentItem.top !== nextItem.top ||
      currentItem.left !== nextItem.left ||
      currentItem.width !== nextItem.width
    ) {
      return false;
    }
  }

  return true;
}

async function writeTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      void 0;
    }
  }

  if (typeof document === "undefined") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  textarea.style.top = "0";
  textarea.style.left = "0";
  document.body.appendChild(textarea);

  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    const successful = document.execCommand("copy");
    return successful;
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}

function getCodeblockControlsPortalRoot(editor: LexicalEditor): HTMLElement | null {
  const rootElement = editor.getRootElement() as HTMLElement | null;
  if (!rootElement) {
    return null;
  }

  const richTextContainer = rootElement.closest(
    ".luthor-richtext-container",
  ) as HTMLElement | null;
  if (richTextContainer) {
    return richTextContainer;
  }

  const editorContainer = rootElement.closest(
    ".luthor-editor-container",
  ) as HTMLElement | null;
  if (editorContainer) {
    return editorContainer;
  }

  return rootElement.parentElement as HTMLElement | null;
}

function normalizeLanguage(language: string | null | undefined): string | null {
  const normalized = toCanonicalLanguageId(language);
  if (!normalized || !isSupportedLanguage(normalized)) {
    return null;
  }

  return normalized;
}

function isSupportedLanguage(language: string): boolean {
  const normalized = toCanonicalLanguageId(language);
  if (!normalized) {
    return false;
  }

  return getSupportedLanguageIds().has(normalized);
}

function getSupportedLanguageIds(): Set<string> {
  const supported = new Set<string>();
  const canonicalOptions = getCodeLanguageOptions()
    .map(([id]) => toCanonicalLanguageId(id))
    .filter((id): id is string => !!id);
  const runtimeLanguages = getCodeLanguages()
    .map((id) => toCanonicalLanguageId(id))
    .filter((id): id is string => !!id);

  canonicalOptions.forEach((id) => supported.add(id));
  runtimeLanguages.forEach((id) => supported.add(id));
  return supported;
}

function toCanonicalLanguageId(language: string | null | undefined): string | null {
  if (!language) {
    return null;
  }

  const trimmed = language.trim().toLowerCase();
  if (!trimmed || trimmed === "auto") {
    return null;
  }

  const withAlias = applyLanguageAlias(trimmed);
  const normalized = normalizeCodeLang(withAlias);
  if (!normalized || normalized === "auto") {
    return null;
  }

  const canonical = applyLanguageAlias(normalized.trim().toLowerCase());
  if (!canonical || canonical === "auto") {
    return null;
  }

  return canonical;
}

function applyLanguageAlias(language: string): string {
  return LANGUAGE_ALIASES[language] ?? language;
}

export const codeIntelligenceExtension = new CodeIntelligenceExtension();

function resolveLanguageOptionsConfig(
  languageOptions:
    | readonly string[]
    | CodeLanguageOptionsConfig
    | undefined,
): CodeLanguageOptionsConfig | null {
  if (!languageOptions) {
    return null;
  }

  if (Array.isArray(languageOptions)) {
    return {
      mode: "append",
      values: languageOptions,
    };
  }

  const config = languageOptions as CodeLanguageOptionsConfig;

  return {
    mode: config.mode ?? "append",
    values: Array.isArray(config.values) ? config.values : [],
  };
}

function normalizeConfiguredLanguageOptions(
  languageOptions: readonly string[],
): string[] {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const option of languageOptions) {
    const rawValue = option.trim();
    if (!rawValue) {
      continue;
    }

    const normalizedValue = normalizeLanguage(rawValue);
    if (!normalizedValue) {
      throw new Error(
        `[CodeIntelligenceExtension] Invalid language option "${option}". ` +
          `Use a supported language ID or alias (excluding "auto").`,
      );
    }

    if (seen.has(normalizedValue)) {
      throw new Error(
        `[CodeIntelligenceExtension] Duplicate language option "${option}". ` +
          `It resolves to "${normalizedValue}", which is already configured.`,
      );
    }

    seen.add(normalizedValue);
    normalized.push(normalizedValue);
  }

  return normalized;
}

function toSortedUniqueLanguageOptions(languageOptions: readonly string[]): string[] {
  return Array.from(new Set(languageOptions)).sort((left, right) =>
    left.localeCompare(right),
  );
}

function getLanguageDisplayLabel(languageId: string): string {
  const normalized = normalizeLanguage(languageId)
    ?? toCanonicalLanguageId(languageId)
    ?? languageId.trim().toLowerCase();

  if (!normalized) {
    return "Plain Text";
  }

  return LANGUAGE_LABEL_OVERRIDES[normalized]
    ?? humanizeLanguageIdentifier(normalized);
}

function humanizeLanguageIdentifier(languageId: string): string {
  const normalized = languageId.trim();
  if (!normalized) {
    return "Plain Text";
  }

  return normalized
    .split(/[-_]+/)
    .filter((token) => token.length > 0)
    .map((token) =>
      token.length <= 2
        ? token.toUpperCase()
        : `${token[0]?.toUpperCase() ?? ""}${token.slice(1)}`,
    )
    .join(" ");
}

export const __TEST_ONLY_CODE_INTELLIGENCE_INTERNALS = {
  getLanguageDisplayLabel,
} as const;
