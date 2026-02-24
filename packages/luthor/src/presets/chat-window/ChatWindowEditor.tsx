import { useCallback, useRef, type KeyboardEvent } from "react";
import { ExtensiveEditor, type ExtensiveEditorProps, type ExtensiveEditorRef } from "../extensive";

export type ChatWindowEditorSendPayload = {
  jsonb: string;
};

export type ChatWindowEditorProps = Omit<ExtensiveEditorProps, "featureFlags" | "isToolbarEnabled"> & {
  onSend?: (payload: ChatWindowEditorSendPayload) => void;
  submitOnEnter?: boolean;
  allowShiftEnter?: boolean;
  showVoiceButton?: boolean;
  showImageButton?: boolean;
  showSendButton?: boolean;
};

export function ChatWindowEditor({
  className,
  variantClassName,
  onSend,
  submitOnEnter = true,
  allowShiftEnter = true,
  showVoiceButton = false,
  showImageButton = true,
  showSendButton = true,
  ...props
}: ChatWindowEditorProps) {
  const editorRef = useRef<ExtensiveEditorRef | null>(null);

  const dispatchSend = useCallback(() => {
    if (!onSend) {
      return;
    }

    onSend({ jsonb: editorRef.current?.getJSONB() ?? "" });
  }, [onSend]);

  const handleKeyDownCapture = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!submitOnEnter || event.key !== "Enter" || event.nativeEvent.isComposing) {
        return;
      }

      if (event.shiftKey && allowShiftEnter) {
        return;
      }

      event.preventDefault();
      dispatchSend();
    },
    [allowShiftEnter, dispatchSend, submitOnEnter],
  );

  return (
    <div
      className={["luthor-preset-chat-window", className].filter(Boolean).join(" ")}
      onKeyDownCapture={handleKeyDownCapture}
    >
      <ExtensiveEditor
        ref={editorRef}
        {...props}
        variantClassName={["luthor-preset-chat-window__variant", variantClassName]
          .filter(Boolean)
          .join(" ")}
        isToolbarEnabled={false}
        availableModes={["visual"]}
        initialMode="visual"
        featureFlags={{
          bold: false,
          italic: false,
          underline: false,
          strikethrough: false,
          fontFamily: false,
          fontSize: false,
          lineHeight: false,
          textColor: false,
          textHighlight: false,
          subscript: false,
          superscript: false,
          link: true,
          horizontalRule: false,
          table: false,
          list: true,
          image: false,
          blockFormat: false,
          code: false,
          codeIntelligence: false,
          codeFormat: false,
          iframeEmbed: false,
          youTubeEmbed: false,
          floatingToolbar: false,
          contextMenu: false,
          commandPalette: false,
          slashCommand: false,
          emoji: true,
          draggableBlock: false,
          customNode: false,
          themeToggle: false,
        }}
      />
      <div className="luthor-chat-window-actions" data-testid="chat-actions">
        {showVoiceButton && (
          <button type="button" className="luthor-chat-window-action" data-testid="chat-voice-button" aria-label="Voice input">
            Voice
          </button>
        )}
        {showImageButton && (
          <button type="button" className="luthor-chat-window-action" data-testid="chat-image-button" aria-label="Add image">
            Image
          </button>
        )}
        {showSendButton && (
          <button type="button" className="luthor-chat-window-action luthor-chat-window-action-send" data-testid="chat-send-button" onClick={dispatchSend} aria-label="Send message">
            Send
          </button>
        )}
      </div>
    </div>
  );
}
