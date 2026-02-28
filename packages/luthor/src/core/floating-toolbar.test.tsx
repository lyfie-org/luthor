import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FloatingToolbar } from "./floating-toolbar";
import type { CoreEditorActiveStates, CoreEditorCommands } from "./types";

function createCommands(overrides: Partial<CoreEditorCommands> = {}): CoreEditorCommands {
  return {
    toggleBold: vi.fn(),
    toggleItalic: vi.fn(),
    toggleUnderline: vi.fn(),
    toggleStrikethrough: vi.fn(),
    formatText: vi.fn(),
    insertLink: vi.fn(),
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

const DEFAULT_RECT = {
  x: 20,
  y: 20,
};

describe("FloatingToolbar media editing", () => {
  it("loads and commits image caption draft", async () => {
    const getImageCaption = vi.fn().mockResolvedValue("existing image caption");
    const setImageCaption = vi.fn();
    const commands = createCommands({ getImageCaption, setImageCaption });

    render(
      <FloatingToolbar
        isVisible
        selectionRect={DEFAULT_RECT}
        commands={commands}
        activeStates={{ imageSelected: true } as CoreEditorActiveStates}
      />,
    );

    const input = await screen.findByLabelText("Image caption");
    await waitFor(() => {
      expect(input).toHaveValue("existing image caption");
    });
    fireEvent.change(input, { target: { value: "updated image caption" } });
    fireEvent.blur(input);

    expect(setImageCaption).toHaveBeenCalledWith("updated image caption");
  });

  it("commits image caption via update button", async () => {
    const getImageCaption = vi.fn().mockResolvedValue("existing image caption");
    const setImageCaption = vi.fn();
    const commands = createCommands({ getImageCaption, setImageCaption });

    render(
      <FloatingToolbar
        isVisible
        selectionRect={DEFAULT_RECT}
        commands={commands}
        activeStates={{ imageSelected: true } as CoreEditorActiveStates}
      />,
    );

    const input = await screen.findByLabelText("Image caption");
    fireEvent.change(input, { target: { value: "updated via button" } });
    fireEvent.click(screen.getByRole("button", { name: "Update Caption" }));

    expect(setImageCaption).toHaveBeenCalledWith("updated via button");
  });

  it("loads and commits YouTube caption draft", async () => {
    const getYouTubeEmbedCaption = vi.fn().mockResolvedValue("existing youtube caption");
    const setYouTubeEmbedCaption = vi.fn();
    const commands = createCommands({ getYouTubeEmbedCaption, setYouTubeEmbedCaption });

    render(
      <FloatingToolbar
        isVisible
        selectionRect={DEFAULT_RECT}
        commands={commands}
        activeStates={{ isYouTubeEmbedSelected: true } as CoreEditorActiveStates}
      />,
    );

    const input = await screen.findByLabelText("YouTube caption");
    await waitFor(() => {
      expect(input).toHaveValue("existing youtube caption");
    });
    fireEvent.change(input, { target: { value: "updated youtube caption" } });
    fireEvent.blur(input);

    expect(setYouTubeEmbedCaption).toHaveBeenCalledWith("updated youtube caption");
  });

  it("loads and commits YouTube URL draft", async () => {
    const getYouTubeEmbedCaption = vi.fn().mockResolvedValue("existing youtube caption");
    const getYouTubeEmbedUrl = vi.fn().mockResolvedValue("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=30");
    const updateYouTubeEmbedUrl = vi.fn().mockReturnValue(true);
    const commands = createCommands({
      getYouTubeEmbedCaption,
      getYouTubeEmbedUrl,
      updateYouTubeEmbedUrl,
    });

    render(
      <FloatingToolbar
        isVisible
        selectionRect={DEFAULT_RECT}
        commands={commands}
        activeStates={{ isYouTubeEmbedSelected: true } as CoreEditorActiveStates}
      />,
    );

    const input = await screen.findByLabelText("YouTube URL");
    await waitFor(() => {
      expect(input).toHaveValue("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=30");
    });

    fireEvent.change(input, { target: { value: "https://www.youtube.com/watch?v=aqz-KE-bpKQ" } });
    fireEvent.blur(input);

    expect(updateYouTubeEmbedUrl).toHaveBeenCalledWith("https://www.youtube.com/watch?v=aqz-KE-bpKQ");
  });

  it("restores previous YouTube URL draft on invalid URL update", async () => {
    const existingUrl = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=30";
    const getYouTubeEmbedCaption = vi.fn().mockResolvedValue("existing youtube caption");
    const getYouTubeEmbedUrl = vi.fn().mockResolvedValue(existingUrl);
    const updateYouTubeEmbedUrl = vi.fn().mockReturnValue(false);
    const commands = createCommands({
      getYouTubeEmbedCaption,
      getYouTubeEmbedUrl,
      updateYouTubeEmbedUrl,
    });

    render(
      <FloatingToolbar
        isVisible
        selectionRect={DEFAULT_RECT}
        commands={commands}
        activeStates={{ isYouTubeEmbedSelected: true } as CoreEditorActiveStates}
      />,
    );

    const input = await screen.findByLabelText("YouTube URL");
    fireEvent.change(input, { target: { value: "https://example.com/not-youtube" } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(input).toHaveValue(existingUrl);
      expect(input).toHaveAttribute("aria-invalid", "true");
    });
  });

  it("updates selected link URL using explicit button", async () => {
    const updateLink = vi.fn().mockReturnValue(true);
    const getCurrentLink = vi.fn().mockResolvedValue({
      url: "https://example.com/current",
      rel: null,
      target: null,
    });
    const commands = createCommands({ updateLink, getCurrentLink });

    render(
      <FloatingToolbar
        isVisible
        selectionRect={DEFAULT_RECT}
        commands={commands}
        activeStates={{ isLink: true } as CoreEditorActiveStates}
      />,
    );

    const input = await screen.findByLabelText("Link URL");
    await waitFor(() => {
      expect(input).toHaveValue("https://example.com/current");
    });
    fireEvent.change(input, { target: { value: "https://example.com/updated" } });
    fireEvent.click(screen.getByRole("button", { name: "Update Link" }));

    expect(updateLink).toHaveBeenCalledWith("https://example.com/updated");
  });

  it("hides quote and list actions when selection is inside a list item", () => {
    const commands = createCommands();

    render(
      <FloatingToolbar
        isVisible
        selectionRect={DEFAULT_RECT}
        commands={commands}
        activeStates={{
          unorderedList: true,
        } as CoreEditorActiveStates}
      />,
    );

    expect(screen.queryByRole("button", { name: "Quote" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bullet List" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Numbered List" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Checklist" })).not.toBeInTheDocument();
  });
});
