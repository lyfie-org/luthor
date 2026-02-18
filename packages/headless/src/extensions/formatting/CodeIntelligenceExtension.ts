import {
  $isCodeNode,
  CODE_LANGUAGE_MAP,
  CodeNode,
  normalizeCodeLang,
} from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { registerMarkdownShortcuts, TRANSFORMERS } from "@lexical/markdown";
import { createPortal } from "react-dom";
import type { LexicalEditor, LexicalNode } from "lexical";
import {
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $nodesOfType,
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

type HighlightJsLike = {
  highlightAuto: (
    code: string,
    languageSubset?: string[],
  ) => { language?: string };
};

const COPY_ICON_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V9Zm2 0h8v10h-8V9Zm-6 8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1h-2V5H5v10h1v2H5Z"/></svg>';

const CHECK_ICON_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.3 5.7a1 1 0 0 1 0 1.4l-9.2 9.2a1 1 0 0 1-1.4 0L3.7 10.3a1 1 0 1 1 1.4-1.4l5.3 5.3 8.5-8.5a1 1 0 0 1 1.4 0Z"/></svg>';

export type CodeIntelligenceCommands = {
  setCodeLanguage: (language: string) => void;
  autoDetectCodeLanguage: () => Promise<string | null>;
  getCurrentCodeLanguage: () => Promise<string | null>;
  getCodeLanguageOptions: () => string[];
};

const DEFAULT_LANGUAGE_OPTIONS = [
  "plaintext",
  "typescript",
  "javascript",
  "tsx",
  "jsx",
  "json",
  "html",
  "css",
  "bash",
  "python",
  "java",
  "c",
  "cpp",
  "go",
  "rust",
  "sql",
  "yaml",
  "markdown",
] as const;

export class CodeIntelligenceExtension extends BaseExtension<
  "codeIntelligence",
  {},
  CodeIntelligenceCommands,
  {},
  ReactNode[]
> {
  private autoModeNodeKeys = new Set<string>();
  private failedDetectionTextByNodeKey = new Map<string, string>();
  private autoDetectScheduled = false;
  private languageOptions: string[] = [];
  private highlightJsPromise: Promise<HighlightJsLike | null> | null = null;

  constructor() {
    super("codeIntelligence");
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

        if (hasContentChanges && !this.autoDetectScheduled) {
          this.autoDetectScheduled = true;
          queueMicrotask(() => {
            this.autoDetectScheduled = false;
            void this.autoDetectLanguageForUnlabeledBlocks(editor);
          });
        }

        this.pruneTransientNodeState(editor);
      },
    );

    return () => {
      unregisterMarkdownShortcuts();
      unregisterUpdate();
      this.languageOptions = [];
      this.autoModeNodeKeys.clear();
      this.failedDetectionTextByNodeKey.clear();
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
            this.autoModeNodeKeys.delete(node.getKey());
            this.failedDetectionTextByNodeKey.delete(node.getKey());
            node.setLanguage(normalized ?? null);
            node.setTheme(theme);
          });
        });
      },
      autoDetectCodeLanguage: async () => {
        const target = await this.getPrimaryCodeBlockText(editor);
        if (!target) {
          return null;
        }

        const detected = await this.detectLanguage(target.text);
        if (!detected) {
          return null;
        }

        editor.update(() => {
          const node = target.key
            ? (($getNodeByKey(target.key) as CodeNode | null) ?? null)
            : null;

          if (node && $isCodeNode(node)) {
            node.setLanguage(detected);
            node.setTheme(this.getThemeForLanguage(detected));
            return;
          }

          this.getSelectionCodeNodes().forEach((codeNode) => {
            codeNode.setLanguage(detected);
            codeNode.setTheme(this.getThemeForLanguage(detected));
          });
        });

        return detected;
      },
      getCurrentCodeLanguage: () =>
        new Promise((resolve) => {
          editor.getEditorState().read(() => {
            const nodes = this.getSelectionCodeNodes();
            resolve(nodes[0]?.getLanguage() ?? null);
          });
        }),
      getCodeLanguageOptions: () => this.getLanguageOptions(),
    };
  }

  getLanguageOptionsSnapshot(): string[] {
    return this.languageOptions.length
      ? [...this.languageOptions]
      : this.getLanguageOptions();
  }

  getCodeBlocksSnapshot(editor: LexicalEditor): CodeBlockSnapshot[] {
    const snapshots = editor.getEditorState().read(() =>
      $nodesOfType(CodeNode).map((node) => {
        const key = node.getKey();
        const normalized = normalizeLanguage(node.getLanguage());
        const isAuto = this.autoModeNodeKeys.has(key) || !normalized;

        if (isAuto) {
          this.autoModeNodeKeys.add(key);
        } else {
          this.autoModeNodeKeys.delete(key);
        }

        return {
          key,
          language: isAuto ? "auto" : (normalized as string),
          text: node.getTextContent(),
        };
      }),
    );

    const activeKeys = new Set(snapshots.map((item) => item.key));
    this.autoModeNodeKeys.forEach((nodeKey) => {
      if (!activeKeys.has(nodeKey)) {
        this.autoModeNodeKeys.delete(nodeKey);
      }
    });
    this.failedDetectionTextByNodeKey.forEach((_value, nodeKey) => {
      if (!activeKeys.has(nodeKey)) {
        this.failedDetectionTextByNodeKey.delete(nodeKey);
      }
    });

    return snapshots;
  }

  setCodeBlockLanguage(
    editor: LexicalEditor,
    nodeKey: string,
    selectedLanguage: string,
  ): void {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (!node || !$isCodeNode(node)) {
        return;
      }

      if (selectedLanguage === "auto") {
        this.autoModeNodeKeys.add(nodeKey);
        this.failedDetectionTextByNodeKey.delete(nodeKey);
        node.setLanguage(null);
        node.setTheme(this.getThemeForLanguage(null));
        return;
      }

      this.autoModeNodeKeys.delete(nodeKey);
      this.failedDetectionTextByNodeKey.delete(nodeKey);

      const normalized = normalizeLanguage(selectedLanguage);
      node.setLanguage(normalized ?? null);
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

  private async autoDetectLanguageForUnlabeledBlocks(
    editor: LexicalEditor,
  ): Promise<void> {
    const pending = editor
      .getEditorState()
      .read(() =>
        $nodesOfType(CodeNode)
          .filter((node) => {
            if (
              !this.autoModeNodeKeys.has(node.getKey()) &&
              !!normalizeLanguage(node.getLanguage())
            ) {
              return false;
            }
            return node.getTextContent().trim().length > 0;
          })
          .map((node) => ({
            key: node.getKey(),
            text: node.getTextContent(),
          })),
      );

    if (!pending.length) {
      return;
    }

    for (const block of pending) {
      const failedText = this.failedDetectionTextByNodeKey.get(block.key);
      if (failedText === block.text) {
        continue;
      }

      const detected = await this.detectLanguage(block.text);

      if (!detected) {
        this.failedDetectionTextByNodeKey.set(block.key, block.text);
        continue;
      }

      this.failedDetectionTextByNodeKey.delete(block.key);

      editor.update(() => {
        const node = $getNodeByKey(block.key);
        if (!node || !$isCodeNode(node)) {
          return;
        }

        if (
          !this.autoModeNodeKeys.has(block.key) &&
          !!normalizeLanguage(node.getLanguage())
        ) {
          return;
        }

        const currentLanguage = normalizeLanguage(node.getLanguage());
        if (currentLanguage === detected) {
          return;
        }

        node.setLanguage(detected);
        node.setTheme(this.getThemeForLanguage(detected));
      });
    }
  }

  private getThemeForLanguage(language: string | null | undefined): string | null {
    if (!language) {
      return null;
    }

    const normalized = normalizeLanguage(language) ?? "plain";
    const family = resolveLanguageFamily(normalized);
    return `lang-${family}`;
  }

  private pruneTransientNodeState(editor: LexicalEditor): void {
    const activeNodeKeys = editor.getEditorState().read(() =>
      new Set($nodesOfType(CodeNode).map((node) => node.getKey())),
    );

    this.autoModeNodeKeys.forEach((nodeKey) => {
      if (!activeNodeKeys.has(nodeKey)) {
        this.autoModeNodeKeys.delete(nodeKey);
      }
    });

    this.failedDetectionTextByNodeKey.forEach((_value, nodeKey) => {
      if (!activeNodeKeys.has(nodeKey)) {
        this.failedDetectionTextByNodeKey.delete(nodeKey);
      }
    });
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

  private async detectLanguage(source: string): Promise<string | null> {
    if (!source.trim()) {
      return null;
    }

    const highlightJs = await this.loadHighlightJs();
    if (!highlightJs) {
      return null;
    }

    try {
      const result = highlightJs.highlightAuto(source, this.getLanguageOptions());
      return normalizeLanguage(result?.language ?? null);
    } catch {
      return null;
    }
  }

  private getLanguageOptions(): string[] {
    const lexicalLanguages = Object.keys(CODE_LANGUAGE_MAP || {});
    const merged = new Set<string>([
      ...DEFAULT_LANGUAGE_OPTIONS,
      ...lexicalLanguages,
    ]);

    const normalizedUnique = new Set<string>();

    Array.from(merged)
      .map((lang) => normalizeLanguage(lang))
      .filter((lang): lang is string => !!lang)
      .forEach((lang) => normalizedUnique.add(lang));

    return Array.from(normalizedUnique).sort((a, b) => a.localeCompare(b));
  }

  private async loadHighlightJs(): Promise<HighlightJsLike | null> {
    if (this.highlightJsPromise) {
      return this.highlightJsPromise;
    }

    this.highlightJsPromise = (async () => {
      try {
        const dynamicImport = new Function(
          "moduleName",
          "return import(moduleName)",
        ) as (moduleName: string) => Promise<Record<string, unknown>>;

        const module = await dynamicImport("highlight.js/lib/core");
        const candidate = (module.default ?? module) as HighlightJsLike;
        if (candidate && typeof candidate.highlightAuto === "function") {
          return candidate;
        }
        return null;
      } catch {
        return null;
      }
    })();

    return this.highlightJsPromise;
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
  const [controls, setControls] = useState<CodeBlockControlModel[]>([]);
  const [copyStateByNodeKey, setCopyStateByNodeKey] = useState<
    Record<string, "copied" | "error">
  >({});
  const rafIdRef = useRef<number | null>(null);
  const feedbackTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const languageOptions = useMemo(() => {
    const options = extension.getLanguageOptionsSnapshot();
    return ["auto", ...options.filter((option) => option !== "auto")];
  }, [extension]);

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
      extension.setCodeBlockLanguage(editor, nodeKey, value);
      scheduleSyncControls();
    },
    [editor, extension, scheduleSyncControls],
  );

  const handleCopyClick = useCallback(
    async (nodeKey: string) => {
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
    [editor, extension, setFeedbackState],
  );

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

    window.addEventListener("resize", onViewportChange, { passive: true });

    return () => {
      unregisterUpdate();
      window.removeEventListener("resize", onViewportChange);
      if (initialFrameId !== null) {
        cancelAnimationFrame(initialFrameId);
      }
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      feedbackTimersRef.current.forEach((timer) => clearTimeout(timer));
      feedbackTimersRef.current.clear();
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
                onChange: (event: Event) => {
                  const target = event.target as HTMLSelectElement;
                  handleLanguageChange(control.key, target.value);
                },
              },
              languageOptions.map((option) =>
                createElement("option", { key: option, value: option }, option),
              ),
            ),
          ),
          createElement(
            "span",
            { className: "luthor-codeblock-controls-right" },
            createElement("button", {
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
            }),
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

function resolveLanguageFamily(language: string): string {
  const lang = language.toLowerCase();

  if (["javascript", "typescript", "jsx", "tsx", "json"].includes(lang)) {
    return "javascript";
  }

  if (["html", "xml", "svg", "markdown", "md"].includes(lang)) {
    return "markup";
  }

  if (["css", "scss", "sass", "less"].includes(lang)) {
    return "styles";
  }

  if (["python", "py"].includes(lang)) {
    return "python";
  }

  if (["bash", "shell", "sh", "zsh", "powershell"].includes(lang)) {
    return "shell";
  }

  if (["sql", "postgres", "mysql"].includes(lang)) {
    return "sql";
  }

  if (["rust", "go", "java", "c", "cpp", "csharp", "kotlin", "swift"].includes(lang)) {
    return "systems";
  }

  return "default";
}

function normalizeLanguage(language: string | null | undefined): string | null {
  if (!language) return null;

  const trimmed = language.trim().toLowerCase();
  if (!trimmed || trimmed === "auto") return null;

  const normalized = normalizeCodeLang(trimmed);
  if (!normalized || normalized === "auto") return null;

  return normalized;
}

export const codeIntelligenceExtension = new CodeIntelligenceExtension();