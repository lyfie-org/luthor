import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getJSONMock = vi.fn(
  () =>
    "{\"root\":{\"type\":\"root\",\"version\":1,\"format\":\"\",\"indent\":0,\"direction\":null,\"children\":[{\"type\":\"paragraph\",\"version\":1,\"format\":\"\",\"indent\":0,\"direction\":null,\"children\":[{\"type\":\"text\",\"version\":1,\"text\":\"Hello\",\"detail\":0,\"format\":0,\"mode\":\"normal\",\"style\":\"\"}]}]}}",
);
const injectJSONMock = vi.fn();
const extensivePropsSpy = vi.fn();

vi.mock("../extensive", async () => {
  const react = await import("react");
  const ExtensiveEditor = react.forwardRef(function MockExtensiveEditor(
    props: { children?: ReactNode } & Record<string, unknown>,
    ref: react.ForwardedRef<{ getJSON: () => string; injectJSON: (value: string) => void }>,
  ) {
    extensivePropsSpy(props);
    react.useImperativeHandle(ref, () => ({ getJSON: getJSONMock, injectJSON: injectJSONMock }));
    return <div data-testid="chat-extensive-editor">{props.children}</div>;
  });

  return {
    ExtensiveEditor,
  };
});

import { ChatWindowEditor } from "./ChatWindowEditor";

describe("ChatWindowEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("locks feature set to allowed chat formatting only", () => {
    render(<ChatWindowEditor showDefaultContent={false} />);

    const lastProps = extensivePropsSpy.mock.calls.at(-1)?.[0] as {
      featureFlags?: Record<string, boolean>;
      shortcutConfig?: {
        disabledCommandIds?: string[];
      };
    };

    expect(lastProps.featureFlags).toEqual(
      expect.objectContaining({
        bold: true,
        italic: true,
        strikethrough: true,
        code: false,
        codeFormat: false,
        underline: false,
        list: false,
        link: false,
        table: false,
        image: false,
        iframeEmbed: false,
        youTubeEmbed: false,
        history: false,
        commandPalette: false,
        slashCommand: false,
      }),
    );
    expect(lastProps.shortcutConfig?.disabledCommandIds).toEqual(
      expect.arrayContaining(["history.undo", "history.redo"]),
    );
  });

  it("always disables code shortcuts and commands", () => {
    render(
      <ChatWindowEditor
        showDefaultContent={false}
        formattingOptions={{ bold: true, italic: true, strikethrough: true }}
      />,
    );

    const lastProps = extensivePropsSpy.mock.calls.at(-1)?.[0] as {
      featureFlags?: Record<string, boolean>;
      shortcutConfig?: {
        disabledCommandIds?: string[];
      };
    };

    expect(lastProps.featureFlags).toEqual(
      expect.objectContaining({
        code: false,
        codeFormat: false,
      }),
    );
    expect(lastProps.shortcutConfig).toEqual(
      expect.objectContaining({
        bindings: expect.objectContaining({
          "format.code": false,
          "block.codeblock": false,
        }),
      }),
    );
  });

  it("does not submit on Enter by default", () => {
    const onSend = vi.fn();
    const { container } = render(<ChatWindowEditor onSend={onSend} showDefaultContent={false} />);

    const wrapper = container.querySelector(".luthor-preset-chat-window") as HTMLElement;
    fireEvent.keyDown(wrapper, { key: "Enter" });

    expect(onSend).not.toHaveBeenCalled();
  });

  it("submits markdown payload on Enter when enabled", () => {
    const onSend = vi.fn();
    const { container } = render(
      <ChatWindowEditor onSend={onSend} showDefaultContent={false} submitOnEnter allowEmptySend />,
    );

    const wrapper = container.querySelector(".luthor-preset-chat-window") as HTMLElement;
    fireEvent.keyDown(wrapper, { key: "Enter" });

    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({
        format: "md",
        text: "Hello",
        markdown: "Hello",
      }),
    );
  });

  it("keeps Shift+Enter when allowShiftEnter is true", () => {
    const onSend = vi.fn();
    const { container } = render(
      <ChatWindowEditor onSend={onSend} showDefaultContent={false} allowShiftEnter submitOnEnter allowEmptySend />,
    );

    const wrapper = container.querySelector(".luthor-preset-chat-window") as HTMLElement;
    fireEvent.keyDown(wrapper, { key: "Enter", shiftKey: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  it("fires callback from send button and clears editor by default", () => {
    const onSend = vi.fn();
    render(<ChatWindowEditor onSend={onSend} showDefaultContent={false} />);

    fireEvent.click(screen.getByTestId("chat-send-button"));

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(injectJSONMock).toHaveBeenCalled();
  });

  it("supports right send button placement", () => {
    render(
      <ChatWindowEditor
        onSend={vi.fn()}
        showDefaultContent={false}
        sendButtonPlacement="right"
      />,
    );

    expect(screen.getByTestId("chat-send-button").className).toContain("luthor-chat-window-action-send--right");
  });

  it("renders dynamic bottom toolbar buttons", () => {
    const onAttachment = vi.fn();
    render(
      <ChatWindowEditor
        onSend={vi.fn()}
        showDefaultContent={false}
        toolbarButtons={[
          {
            id: "attachment",
            content: "Attach",
            ariaLabel: "Add attachment",
            onClick: onAttachment,
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByLabelText("Add attachment"));
    expect(onAttachment).toHaveBeenCalledTimes(1);
  });
});
