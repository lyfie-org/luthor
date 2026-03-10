import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import {
  createEditorSystem,
  htmlToJSON,
  jsonToHTML,
  jsonToMarkdown,
  markdownToJSON,
  RichText,
} from "@lyfie/luthor-headless";
import { ModeTabs, SourceView, formatHTMLSource, formatJSONSource, formatMarkdownSource } from "../../core";
import {
  createExtensiveExtensions,
  extensiveExtensions,
  type ExtensiveEditorProps,
  type ExtensiveEditorRef,
  type FeatureFlagOverrides,
} from "../extensive";

const { Provider, useEditor } = createEditorSystem<typeof extensiveExtensions>();

export const HEADLESS_EDITOR_DEFAULT_MODES = ["visual", "json", "markdown", "html"] as const;

const HEADLESS_MODE_LABELS = {
  visual: "Visual",
  json: "JSON",
  markdown: "MD",
  html: "HTML",
} as const;

const SOURCE_MODE_ERROR_TITLE = {
  json: "Invalid JSON",
  markdown: "Invalid Markdown",
  html: "Invalid HTML",
} as const;

const DEFAULT_VISUAL_PLACEHOLDER = "Start writing...";
const DEFAULT_JSON_PLACEHOLDER = "Enter JSON document content...";
const DEFAULT_MARKDOWN_PLACEHOLDER = "Enter Markdown content...";
const DEFAULT_HTML_PLACEHOLDER = "Enter HTML content...";

const HEADLESS_DEFAULT_CONTENT_MD = `## Hi there,

this is a *basic* example of **Luthor Headless**. It covers simple text styles and lists:

- That's a bullet list with one item.
- ... and one more item.

Try a code block next:

\`\`\`
console.log("hello from luthor");
\`\`\`
`;

const HEADLESS_DEFAULT_CONTENT_JSON = markdownToJSON(HEADLESS_DEFAULT_CONTENT_MD);

const EMPTY_DOCUMENT = {
  root: {
    type: "root",
    version: 1,
    format: "",
    indent: 0,
    direction: null,
    children: [
      {
        type: "paragraph",
        version: 1,
        format: "",
        indent: 0,
        direction: null,
        children: [
          {
            type: "text",
            version: 1,
            text: "",
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
          },
        ],
      },
    ],
  },
};

export const HEADLESS_EDITOR_DEFAULT_FEATURE_FLAGS: FeatureFlagOverrides = {
  bold: true,
  italic: true,
  underline: false,
  strikethrough: true,
  fontFamily: false,
  fontSize: false,
  lineHeight: false,
  textColor: false,
  textHighlight: false,
  subscript: false,
  superscript: false,
  link: false,
  horizontalRule: true,
  table: false,
  list: true,
  history: true,
  image: false,
  blockFormat: true,
  code: true,
  codeIntelligence: false,
  codeFormat: true,
  tabIndent: true,
  enterKeyBehavior: true,
  iframeEmbed: false,
  youTubeEmbed: false,
  floatingToolbar: false,
  contextMenu: false,
  commandPalette: false,
  slashCommand: false,
  emoji: false,
  draggableBlock: false,
  customNode: false,
  themeToggle: false,
};

type HeadlessActiveStates = {
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  isParagraph?: boolean;
  isH1?: boolean;
  isH2?: boolean;
  isH3?: boolean;
  isH4?: boolean;
  isH5?: boolean;
  isH6?: boolean;
  unorderedList?: boolean;
  orderedList?: boolean;
  isInCodeBlock?: boolean;
  isQuote?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
};

type HeadlessEditorSourceMode = Exclude<HeadlessEditorPresetMode, "visual">;

type HeadlessEditorContentState = {
  json: string;
  markdown: string;
  html: string;
};

type HeadlessEditorSourceError = {
  mode: HeadlessEditorSourceMode;
  error: string;
};

type HeadlessEditorMethods = {
  injectJSON: (content: string) => void;
  getJSON: () => string;
};

export type HeadlessEditorPresetMode = (typeof HEADLESS_EDITOR_DEFAULT_MODES)[number];

export type HeadlessEditorPresetProps = Omit<
  ExtensiveEditorProps,
  "featureFlags" | "availableModes" | "initialMode" | "defaultEditorView"
> & {
  initialMode?: HeadlessEditorPresetMode;
  defaultEditorView?: HeadlessEditorPresetMode;
  featureFlags?: FeatureFlagOverrides;
};

function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return "Unable to process the current source content.";
}

function parseVisualJSON(value: unknown): unknown {
  if (value && typeof value === "object") {
    return value;
  }
  return EMPTY_DOCUMENT;
}

function parseJSONSource(value: string): unknown {
  const trimmed = value.trim();
  if (!trimmed) {
    return EMPTY_DOCUMENT;
  }
  return JSON.parse(trimmed);
}

function parseSourceToJSON(mode: HeadlessEditorSourceMode, value: string): unknown {
  switch (mode) {
    case "json":
      return parseJSONSource(value);
    case "markdown":
      return markdownToJSON(value);
    case "html":
      return htmlToJSON(value);
  }
}

function convertJSONToSource(mode: HeadlessEditorSourceMode, value: unknown): string {
  const parsed = parseVisualJSON(value);
  switch (mode) {
    case "json":
      return formatJSONSource(JSON.stringify(parsed));
    case "markdown":
      return formatMarkdownSource(jsonToMarkdown(parsed as Parameters<typeof jsonToMarkdown>[0]));
    case "html":
      return formatHTMLSource(jsonToHTML(parsed as Parameters<typeof jsonToHTML>[0]));
  }
}

function resolvePlaceholders(
  placeholder: ExtensiveEditorProps["placeholder"],
): HeadlessEditorContentState & { visual: string } {
  if (typeof placeholder === "string" || typeof placeholder === "undefined") {
    return {
      visual: placeholder ?? DEFAULT_VISUAL_PLACEHOLDER,
      json: DEFAULT_JSON_PLACEHOLDER,
      markdown: DEFAULT_MARKDOWN_PLACEHOLDER,
      html: DEFAULT_HTML_PLACEHOLDER,
    };
  }

  return {
    visual: placeholder.visual ?? DEFAULT_VISUAL_PLACEHOLDER,
    json: placeholder.json ?? DEFAULT_JSON_PLACEHOLDER,
    markdown: placeholder.markdown ?? DEFAULT_MARKDOWN_PLACEHOLDER,
    html: placeholder.html ?? DEFAULT_HTML_PLACEHOLDER,
  };
}

function HeadlessEditorContent({
  initialMode,
  placeholders,
  onReady,
}: {
  initialMode: HeadlessEditorPresetMode;
  placeholders: HeadlessEditorContentState & { visual: string };
  onReady?: (methods: HeadlessEditorMethods) => void;
}) {
  const { activeStates, commands, export: exportApi, import: importApi } = useEditor();
  const [mode, setMode] = useState<HeadlessEditorPresetMode>(initialMode);
  const [sourceState, setSourceState] = useState<HeadlessEditorContentState>({
    json: "",
    markdown: "",
    html: "",
  });
  const [sourceError, setSourceError] = useState<HeadlessEditorSourceError | null>(null);
  const readyRef = useRef(false);
  const typedActiveStates = activeStates as HeadlessActiveStates;

  const syncSourceStateFromVisual = useCallback((): HeadlessEditorContentState => {
    const visualJSON = parseVisualJSON(exportApi.toJSON());
    const next = {
      json: convertJSONToSource("json", visualJSON),
      markdown: convertJSONToSource("markdown", visualJSON),
      html: convertJSONToSource("html", visualJSON),
    };
    setSourceState(next);
    return next;
  }, [exportApi]);

  const setVisualFromSource = useCallback(
    (sourceMode: HeadlessEditorSourceMode, sourceValue: string): unknown => {
      const parsedJSON = parseSourceToJSON(sourceMode, sourceValue);
      importApi.fromJSON(parsedJSON);
      return parsedJSON;
    },
    [importApi],
  );

  const editorMethods = useMemo<HeadlessEditorMethods>(
    () => ({
      injectJSON: (content: string) => {
        try {
          const parsed = parseJSONSource(content);
          importApi.fromJSON(parsed);
          setSourceError(null);
          void syncSourceStateFromVisual();
        } catch (error) {
          setSourceError({
            mode: "json",
            error: sanitizeErrorMessage(error),
          });
        }
      },
      getJSON: () => convertJSONToSource("json", exportApi.toJSON()),
    }),
    [exportApi, importApi, syncSourceStateFromVisual],
  );

  useEffect(() => {
    if (!onReady || readyRef.current) {
      return;
    }
    readyRef.current = true;
    onReady(editorMethods);
  }, [editorMethods, onReady]);

  const handleModeChange = useCallback(
    (nextMode: HeadlessEditorPresetMode) => {
      if (nextMode === mode) {
        return;
      }

      if (mode === "visual") {
        if (nextMode !== "visual") {
          try {
            void syncSourceStateFromVisual();
            setSourceError(null);
          } catch (error) {
            setSourceError({
              mode: nextMode,
              error: sanitizeErrorMessage(error),
            });
            return;
          }
        }

        setMode(nextMode);
        return;
      }

      try {
        const currentSource = sourceState[mode];
        const parsedJSON = setVisualFromSource(mode, currentSource);

        if (nextMode === "visual") {
          setSourceError(null);
          setMode("visual");
          return;
        }

        const convertedSource = convertJSONToSource(nextMode, parsedJSON);
        setSourceState((previousState) => ({
          ...previousState,
          [nextMode]: convertedSource,
        }));
        setSourceError(null);
        setMode(nextMode);
      } catch (error) {
        setSourceError({
          mode,
          error: sanitizeErrorMessage(error),
        });
      }
    },
    [mode, setVisualFromSource, sourceState, syncSourceStateFromVisual],
  );

  const clearMarks = useCallback(() => {
    if (mode !== "visual") {
      return;
    }

    if (typedActiveStates.bold) commands.toggleBold?.();
    if (typedActiveStates.italic) commands.toggleItalic?.();
    if (typedActiveStates.strikethrough) commands.toggleStrikethrough?.();
    if (typedActiveStates.code) commands.formatText?.("code");
    commands.removeLink?.();
  }, [commands, mode, typedActiveStates.bold, typedActiveStates.code, typedActiveStates.italic, typedActiveStates.strikethrough]);

  const clearNodes = useCallback(() => {
    if (mode !== "visual") {
      return;
    }

    if (typedActiveStates.unorderedList) commands.toggleUnorderedList?.();
    if (typedActiveStates.orderedList) commands.toggleOrderedList?.();
    if (typedActiveStates.isQuote) commands.toggleQuote?.();
    if (typedActiveStates.isInCodeBlock) commands.toggleCodeBlock?.();
    commands.toggleParagraph?.();
  }, [
    commands,
    mode,
    typedActiveStates.isInCodeBlock,
    typedActiveStates.isQuote,
    typedActiveStates.orderedList,
    typedActiveStates.unorderedList,
  ]);

  const insertHardBreak = useCallback(() => {
    if (mode !== "visual") {
      return;
    }

    commands.insertHardBreak?.();
  }, [commands, mode]);

  const isVisualMode = mode === "visual";

  return (
    <div className="luthor-editor" data-mode={mode}>
      <div className="luthor-editor-header">
        <ModeTabs
          mode={mode}
          onModeChange={(nextMode) => handleModeChange(nextMode as HeadlessEditorPresetMode)}
          availableModes={HEADLESS_EDITOR_DEFAULT_MODES}
          labels={HEADLESS_MODE_LABELS}
        />
      </div>

      <div className="luthor-preset-headless-editor__toolbar" role="toolbar" aria-label="Headless editor toolbar">
        <button
          type="button"
          className={`luthor-preset-headless-editor__button${typedActiveStates.bold ? " is-active" : ""}`}
          onClick={() => commands.toggleBold?.()}
          disabled={!isVisualMode}
        >
          Bold
        </button>
        <button
          type="button"
          className={`luthor-preset-headless-editor__button${typedActiveStates.italic ? " is-active" : ""}`}
          onClick={() => commands.toggleItalic?.()}
          disabled={!isVisualMode}
        >
          Italic
        </button>
        <button
          type="button"
          className={`luthor-preset-headless-editor__button${typedActiveStates.strikethrough ? " is-active" : ""}`}
          onClick={() => commands.toggleStrikethrough?.()}
          disabled={!isVisualMode}
        >
          Strike
        </button>
        <button
          type="button"
          className={`luthor-preset-headless-editor__button${typedActiveStates.code ? " is-active" : ""}`}
          onClick={() => commands.formatText?.("code")}
          disabled={!isVisualMode}
        >
          Code
        </button>
        <button
          type="button"
          className="luthor-preset-headless-editor__button"
          onClick={clearMarks}
          disabled={!isVisualMode}
        >
          Clear marks
        </button>
        <button
          type="button"
          className="luthor-preset-headless-editor__button"
          onClick={clearNodes}
          disabled={!isVisualMode}
        >
          Clear nodes
        </button>
        <button
          type="button"
          className={`luthor-preset-headless-editor__button${typedActiveStates.isParagraph ? " is-active" : ""}`}
          onClick={() => commands.toggleParagraph?.()}
          disabled={!isVisualMode}
        >
          Paragraph
        </button>
        <button
          type="button"
          className={`luthor-preset-headless-editor__button${typedActiveStates.isH1 ? " is-active" : ""}`}
          onClick={() => commands.toggleHeading?.("h1")}
          disabled={!isVisualMode}
        >
          H1
        </button>
        <button
          type="button"
          className={`luthor-preset-headless-editor__button${typedActiveStates.isH2 ? " is-active" : ""}`}
          onClick={() => commands.toggleHeading?.("h2")}
          disabled={!isVisualMode}
        >
          H2
        </button>
        <button
          type="button"
          className={`luthor-preset-headless-editor__button${typedActiveStates.isH3 ? " is-active" : ""}`}
          onClick={() => commands.toggleHeading?.("h3")}
          disabled={!isVisualMode}
        >
          H3
        </button>
        <button
          type="button"
          className={`luthor-preset-headless-editor__button${typedActiveStates.isH4 ? " is-active" : ""}`}
          onClick={() => commands.toggleHeading?.("h4")}
          disabled={!isVisualMode}
        >
          H4
        </button>
        <button
          type="button"
          className={`luthor-preset-headless-editor__button${typedActiveStates.isH5 ? " is-active" : ""}`}
          onClick={() => commands.toggleHeading?.("h5")}
          disabled={!isVisualMode}
        >
          H5
        </button>
        <button
          type="button"
          className={`luthor-preset-headless-editor__button${typedActiveStates.isH6 ? " is-active" : ""}`}
          onClick={() => commands.toggleHeading?.("h6")}
          disabled={!isVisualMode}
        >
          H6
        </button>
        <button
          type="button"
          className={`luthor-preset-headless-editor__button${typedActiveStates.unorderedList ? " is-active" : ""}`}
          onClick={() => commands.toggleUnorderedList?.()}
          disabled={!isVisualMode}
        >
          Bullet list
        </button>
        <button
          type="button"
          className={`luthor-preset-headless-editor__button${typedActiveStates.orderedList ? " is-active" : ""}`}
          onClick={() => commands.toggleOrderedList?.()}
          disabled={!isVisualMode}
        >
          Ordered list
        </button>
        <button
          type="button"
          className={`luthor-preset-headless-editor__button${typedActiveStates.isInCodeBlock ? " is-active" : ""}`}
          onClick={() => commands.toggleCodeBlock?.()}
          disabled={!isVisualMode}
        >
          Code block
        </button>
        <button
          type="button"
          className={`luthor-preset-headless-editor__button${typedActiveStates.isQuote ? " is-active" : ""}`}
          onClick={() => commands.toggleQuote?.()}
          disabled={!isVisualMode}
        >
          Blockquote
        </button>
        <button
          type="button"
          className="luthor-preset-headless-editor__button"
          onClick={() => commands.insertHorizontalRule?.()}
          disabled={!isVisualMode}
        >
          Horizontal rule
        </button>
        <button
          type="button"
          className="luthor-preset-headless-editor__button"
          onClick={insertHardBreak}
          disabled={!isVisualMode}
        >
          Hard break
        </button>
        <button
          type="button"
          className="luthor-preset-headless-editor__button"
          onClick={() => commands.undo?.()}
          disabled={!isVisualMode || !typedActiveStates.canUndo}
        >
          Undo
        </button>
        <button
          type="button"
          className="luthor-preset-headless-editor__button"
          onClick={() => commands.redo?.()}
          disabled={!isVisualMode || !typedActiveStates.canRedo}
        >
          Redo
        </button>
      </div>

      <div
        className={`luthor-preset-headless-editor__visual-shell${isVisualMode ? "" : " is-hidden"}`}
        aria-hidden={!isVisualMode}
      >
        <RichText
          placeholder={placeholders.visual}
          classNames={{
            container: "luthor-richtext-container luthor-preset-headless-editor__container",
            contentEditable: "luthor-content-editable luthor-preset-headless-editor__content",
            placeholder: "luthor-placeholder luthor-preset-headless-editor__placeholder",
          }}
        />
      </div>

      {!isVisualMode && (
        <div className="luthor-source-panel">
          {sourceError && sourceError.mode === mode && (
            <div className="luthor-source-error">
              <div className="luthor-source-error-icon">!</div>
              <div className="luthor-source-error-message">
                <strong>{SOURCE_MODE_ERROR_TITLE[mode]}</strong>
                <p>{sourceError.error}</p>
                <small>Fix the source input and try again.</small>
              </div>
            </div>
          )}

          {mode === "json" && (
            <SourceView
              value={sourceState.json}
              onChange={(value) => {
                setSourceState((previousState) => ({
                  ...previousState,
                  json: value,
                }));
              }}
              placeholder={placeholders.json}
            />
          )}
          {mode === "markdown" && (
            <SourceView
              value={sourceState.markdown}
              onChange={(value) => {
                setSourceState((previousState) => ({
                  ...previousState,
                  markdown: value,
                }));
              }}
              placeholder={placeholders.markdown}
              className="luthor-source-view--wrapped"
              wrap="soft"
            />
          )}
          {mode === "html" && (
            <SourceView
              value={sourceState.html}
              onChange={(value) => {
                setSourceState((previousState) => ({
                  ...previousState,
                  html: value,
                }));
              }}
              placeholder={placeholders.html}
              className="luthor-source-view--wrapped"
              wrap="soft"
            />
          )}
        </div>
      )}
    </div>
  );
}

export const HeadlessEditorPreset = forwardRef<ExtensiveEditorRef, HeadlessEditorPresetProps>(
  (
    {
      className,
      variantClassName,
      placeholder,
      onReady,
      defaultContent,
      showDefaultContent = true,
      initialMode = "visual",
      defaultEditorView,
      featureFlags,
      ...unusedProps
    },
    ref,
  ) => {
    void unusedProps;

    const requestedInitialMode = defaultEditorView ?? initialMode;
    const resolvedInitialMode = HEADLESS_EDITOR_DEFAULT_MODES.includes(requestedInitialMode)
      ? requestedInitialMode
      : "visual";

    const placeholders = useMemo(() => resolvePlaceholders(placeholder), [placeholder]);

    const resolvedFeatureFlags = useMemo<FeatureFlagOverrides>(
      () => ({
        ...HEADLESS_EDITOR_DEFAULT_FEATURE_FLAGS,
        ...(featureFlags ?? {}),
        draggableBlock: false,
        themeToggle: false,
        table: false,
        image: false,
        iframeEmbed: false,
        youTubeEmbed: false,
        customNode: false,
        slashCommand: false,
        commandPalette: false,
        contextMenu: false,
        floatingToolbar: false,
      }),
      [featureFlags],
    );

    const extensionsKey = useMemo(
      () => JSON.stringify(resolvedFeatureFlags),
      [resolvedFeatureFlags],
    );

    const presetExtensions = useMemo(() => {
      const parsedFlags = JSON.parse(extensionsKey) as FeatureFlagOverrides;
      return createExtensiveExtensions({
        featureFlags: parsedFlags,
      });
    }, [extensionsKey]);

    const [methods, setMethods] = useState<HeadlessEditorMethods | null>(null);
    const didHydrateDefaultContentRef = useRef(false);
    useImperativeHandle(
      ref,
      () =>
        methods ?? {
          injectJSON: () => {},
          getJSON: () => convertJSONToSource("json", EMPTY_DOCUMENT),
        },
      [methods],
    );

    const handleReady = useCallback(
      (nextMethods: HeadlessEditorMethods) => {
        setMethods(nextMethods);

        if (!didHydrateDefaultContentRef.current) {
          if (defaultContent) {
            nextMethods.injectJSON(defaultContent);
          } else if (showDefaultContent) {
            nextMethods.injectJSON(
              convertJSONToSource("json", HEADLESS_DEFAULT_CONTENT_JSON),
            );
          }
          didHydrateDefaultContentRef.current = true;
        }

        onReady?.(nextMethods as ExtensiveEditorRef);
      },
      [defaultContent, onReady, showDefaultContent],
    );

    return (
      <div
        className={[
          "luthor-preset",
          "luthor-preset-headless-editor",
          "luthor-editor-wrapper",
          "luthor-preset-headless-editor__variant",
          variantClassName,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Provider extensions={presetExtensions}>
          <HeadlessEditorContent
            initialMode={resolvedInitialMode}
            placeholders={placeholders}
            onReady={handleReady}
          />
        </Provider>
      </div>
    );
  },
);

HeadlessEditorPreset.displayName = "HeadlessEditorPreset";
