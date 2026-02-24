import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  injectJSONMock,
  getJSONMock,
  markdownToJSONMock,
  jsonToMarkdownMock,
} = vi.hoisted(() => ({
  injectJSONMock: vi.fn(),
  getJSONMock: vi.fn(
    () => "{\"root\":{\"children\":[{\"type\":\"paragraph\",\"children\":[{\"text\":\"hello\"}]}]}}",
  ),
  markdownToJSONMock: vi.fn(() => ({ root: { children: [] } })),
  jsonToMarkdownMock: vi.fn(() => "# Title\n\n- one\n- two"),
}));

vi.mock("@lyfie/luthor-headless", () => ({
  markdownToJSON: markdownToJSONMock,
  jsonToMarkdown: jsonToMarkdownMock,
}));

vi.mock("../extensive", async () => {
  const react = await import("react");
  const ExtensiveEditor = react.forwardRef(function MockExtensiveEditor(
    props: { children?: ReactNode },
    ref: react.ForwardedRef<{ injectJSON: (value: string) => void; getJSON: () => string }>,
  ) {
    react.useImperativeHandle(ref, () => ({
      injectJSON: injectJSONMock,
      getJSON: getJSONMock,
    }));
    return <div data-testid="md-extensive-editor">{props.children}</div>;
  });

  return {
    ExtensiveEditor,
  };
});

import { MDTextEditor } from "./MDTextEditor";

describe("MDTextEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports visual JSON to markdown when opening markdown tab", () => {
    render(<MDTextEditor showDefaultContent={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Markdown" }));

    expect(getJSONMock).toHaveBeenCalled();
    expect(jsonToMarkdownMock).toHaveBeenCalled();
    expect(screen.getByRole("textbox")).toHaveValue("# Title\n\n- one\n- two");
  });

  it("imports markdown into visual mode", async () => {
    render(<MDTextEditor showDefaultContent={false} initialMode="markdown" />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "## Heading" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Visual" }));

    expect(markdownToJSONMock).toHaveBeenCalledWith("## Heading");
    await waitFor(() => {
      expect(injectJSONMock).toHaveBeenCalledWith(JSON.stringify({ root: { children: [] } }));
    });
  });
});
