import {
  boldExtension,
  createEditorSystem,
  historyExtension,
  italicExtension,
  listExtension,
  RichText,
  richTextExtension,
  underlineExtension,
} from "@lyfie/luthor-headless";

const headlessPresetExtensions = [
  richTextExtension,
  historyExtension,
  boldExtension,
  italicExtension,
  underlineExtension,
  listExtension,
] as const;

const { Provider, useEditor } = createEditorSystem<typeof headlessPresetExtensions>();

export type HeadlessEditorPresetProps = {
  className?: string;
  placeholder?: string;
};

function HeadlessControls() {
  const { commands, activeStates } = useEditor();

  return (
    <div className="luthor-headless-controls" role="toolbar" aria-label="Headless editor controls">
      <button type="button" onClick={() => commands.toggleBold?.()} aria-pressed={activeStates.bold === true}>bold</button>
      <button type="button" onClick={() => commands.toggleItalic?.()} aria-pressed={activeStates.italic === true}>italic</button>
      <button type="button" onClick={() => commands.toggleUnderline?.()} aria-pressed={activeStates.underline === true}>underline</button>
      <button type="button" onClick={() => commands.toggleUnorderedList?.()}>bullet list</button>
      <button type="button" onClick={() => commands.undo?.()}>undo</button>
      <button type="button" onClick={() => commands.redo?.()}>redo</button>
    </div>
  );
}

export function HeadlessEditorPreset({ className, placeholder = "Start writing..." }: HeadlessEditorPresetProps) {
  return (
    <div className={["luthor-headless-preset", className].filter(Boolean).join(" ")}>
      <Provider extensions={headlessPresetExtensions}>
        <HeadlessControls />
        <RichText
          placeholder={placeholder}
          classNames={{
            container: "luthor-headless-editor-container",
            contentEditable: "luthor-headless-editor-content",
            placeholder: "luthor-headless-editor-placeholder",
          }}
        />
      </Provider>
    </div>
  );
}
