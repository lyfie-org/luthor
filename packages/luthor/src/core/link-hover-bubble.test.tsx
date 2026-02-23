import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LinkHoverBubble } from "./link-hover-bubble";
import type { CoreEditorCommands } from "./types";

vi.mock("@lyfie/luthor-headless", () => ({
  resolveLinkNodeKeyFromAnchor: (_editor: unknown, anchor: HTMLAnchorElement) =>
    anchor.getAttribute("data-lexical-node-key"),
}));

function createCommands(overrides: Partial<CoreEditorCommands> = {}): CoreEditorCommands {
  return {
    toggleBold: vi.fn(),
    toggleItalic: vi.fn(),
    toggleUnderline: vi.fn(),
    toggleStrikethrough: vi.fn(),
    formatText: vi.fn(),
    insertLink: vi.fn(),
    updateLink: vi.fn(),
    removeLink: vi.fn(),
    toggleParagraph: vi.fn(),
    toggleHeading: vi.fn(),
    toggleQuote: vi.fn(),
    setTextAlignment: vi.fn(),
    toggleCodeBlock: vi.fn(),
    toggleUnorderedList: vi.fn(),
    toggleOrderedList: vi.fn(),
    toggleCheckList: vi.fn(),
    indentList: vi.fn(),
    outdentList: vi.fn(),
    insertHorizontalRule: vi.fn(),
    insertTable: vi.fn(),
    insertImage: vi.fn(),
    setImageAlignment: vi.fn(),
    setImageCaption: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    showCommandPalette: vi.fn(),
    hideCommandPalette: vi.fn(),
    registerCommand: vi.fn(),
    unregisterCommand: vi.fn(),
    ...overrides,
  } as unknown as CoreEditorCommands;
}

function mountRootWithLink(): { root: HTMLDivElement; anchor: HTMLAnchorElement } {
  const root = document.createElement("div");
  root.className = "luthor-content-editable";
  document.body.appendChild(root);

  const anchor = document.createElement("a");
  anchor.textContent = "Example";
  anchor.href = "https://example.com/current";
  anchor.setAttribute("data-lexical-node-key", "link-1");
  root.appendChild(anchor);

  return { root, anchor };
}

describe("LinkHoverBubble", () => {
  afterEach(() => {
    document.querySelectorAll(".luthor-content-editable").forEach((node) => node.remove());
  });

  it("shows hovered link URL and supports unlink", async () => {
    const { root, anchor } = mountRootWithLink();
    const removeLinkByKey = vi.fn().mockReturnValue(true);
    const getLinkByKey = vi.fn().mockResolvedValue({
      url: "https://example.com/current",
      rel: null,
      target: null,
    });
    const commands = createCommands({ removeLinkByKey, getLinkByKey });
    const editor = {
      getRootElement: () => root,
    } as any;

    render(<LinkHoverBubble editor={editor} commands={commands} />);

    fireEvent.mouseOver(anchor);

    await screen.findByText("https://example.com/current");
    fireEvent.click(screen.getByRole("button", { name: "Unlink" }));
    expect(removeLinkByKey).toHaveBeenCalledWith("link-1");
  });

  it("edits hovered link URL and updates by node key", async () => {
    const { root, anchor } = mountRootWithLink();
    const updateLinkByKey = vi.fn().mockReturnValue(true);
    const getLinkByKey = vi
      .fn()
      .mockResolvedValueOnce({
        url: "https://example.com/current",
        rel: null,
        target: null,
      })
      .mockResolvedValueOnce({
        url: "https://example.com/updated",
        rel: null,
        target: null,
      });
    const commands = createCommands({ updateLinkByKey, getLinkByKey });
    const editor = {
      getRootElement: () => root,
    } as any;

    render(<LinkHoverBubble editor={editor} commands={commands} />);

    fireEvent.mouseOver(anchor);
    await screen.findByText("https://example.com/current");
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    const input = await screen.findByLabelText("Edit link URL");
    fireEvent.change(input, { target: { value: "https://example.com/updated" } });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    expect(updateLinkByKey).toHaveBeenCalledWith("link-1", "https://example.com/updated");
    await waitFor(() => {
      expect(screen.getByText("https://example.com/updated")).toBeInTheDocument();
    });
  });

  it("shows validation error when update fails", async () => {
    const { root, anchor } = mountRootWithLink();
    const updateLinkByKey = vi.fn().mockReturnValue(false);
    const getLinkByKey = vi.fn().mockResolvedValue({
      url: "https://example.com/current",
      rel: null,
      target: null,
    });
    const commands = createCommands({ updateLinkByKey, getLinkByKey });
    const editor = {
      getRootElement: () => root,
    } as any;

    render(<LinkHoverBubble editor={editor} commands={commands} />);

    fireEvent.mouseOver(anchor);
    await screen.findByText("https://example.com/current");
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    const input = await screen.findByLabelText("Edit link URL");
    fireEvent.change(input, { target: { value: "not a url" } });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    expect(updateLinkByKey).toHaveBeenCalledWith("link-1", "not a url");
    await waitFor(() => {
      expect(input).toHaveAttribute("aria-invalid", "true");
    });
  });
});
