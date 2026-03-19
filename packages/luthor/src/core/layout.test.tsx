import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ModeTabs, SourceView } from "./layout";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ModeTabs", () => {
  it("renders available tabs in canonical order", () => {
    const { container } = render(
      <ModeTabs
        mode="visual"
        onModeChange={vi.fn()}
        availableModes={["html", "visual", "markdown", "json", "visual-only"]}
      />,
    );

    const labels = Array.from(container.querySelectorAll(".luthor-mode-tab")).map(
      (tab) => tab.textContent?.trim(),
    );
    expect(labels).toEqual(["Visual Only", "Visual Editor", "JSON", "Markdown", "HTML"]);
  });

  it("supports custom labels and conversion spinner", () => {
    const { container } = render(
      <ModeTabs
        mode="markdown"
        onModeChange={vi.fn()}
        availableModes={["visual-only", "visual", "markdown", "html"]}
        labels={{ "visual-only": "Preview", markdown: "MD", html: "Markup" }}
        isConverting="html"
      />,
    );

    expect(container.querySelector(".luthor-mode-tab.active")?.textContent).toContain("MD");
    expect(container.textContent).toContain("Preview");
    expect(container.textContent).toContain("Markup");
    expect(container.querySelectorAll(".luthor-tab-converting-spinner")).toHaveLength(1);
  });

  it("maps visual-editor tab clicks back to legacy visual when only legacy mode is available", () => {
    const onModeChange = vi.fn();
    const { getByRole } = render(
      <ModeTabs
        mode="json"
        onModeChange={onModeChange}
        availableModes={["visual", "json"]}
      />,
    );

    getByRole("button", { name: "Visual Editor" }).click();
    expect(onModeChange).toHaveBeenCalledWith("visual");
  });

  it("emits visual-editor when canonical mode is available", () => {
    const onModeChange = vi.fn();
    const { getByRole } = render(
      <ModeTabs
        mode="json"
        onModeChange={onModeChange}
        availableModes={["visual-editor", "json"]}
      />,
    );

    getByRole("button", { name: "Visual Editor" }).click();
    expect(onModeChange).toHaveBeenCalledWith("visual-editor");
  });
});

describe("SourceView", () => {
  it("accounts for textarea chrome while auto-sizing", () => {
    vi.spyOn(HTMLTextAreaElement.prototype, "scrollHeight", "get").mockReturnValue(520);
    vi.spyOn(HTMLTextAreaElement.prototype, "offsetHeight", "get").mockReturnValue(420);
    vi.spyOn(HTMLTextAreaElement.prototype, "clientHeight", "get").mockReturnValue(400);

    const { container } = render(
      <SourceView value="{}" onChange={vi.fn()} placeholder="Paste JSON..." />,
    );

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea.style.height).toBe("541px");
    expect(container.querySelector(".luthor-source-view-line-numbers")).toBeInTheDocument();
  });

  it("keeps a visual-aligned minimum height for source modes", () => {
    vi.spyOn(HTMLTextAreaElement.prototype, "scrollHeight", "get").mockReturnValue(120);
    vi.spyOn(HTMLTextAreaElement.prototype, "offsetHeight", "get").mockReturnValue(400);
    vi.spyOn(HTMLTextAreaElement.prototype, "clientHeight", "get").mockReturnValue(398);

    const { container } = render(
      <SourceView value="{}" onChange={vi.fn()} placeholder="Paste JSON..." />,
    );

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea.style.height).toBe("400px");
  });

  it("renders non-selectable line numbers by default and syncs gutter scroll", () => {
    const { container } = render(
      <SourceView
        value={"line 1\nline 2\nline 3"}
        onChange={vi.fn()}
        placeholder="Paste JSON..."
      />,
    );

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    const gutter = container.querySelector(".luthor-source-view-line-numbers") as HTMLDivElement;

    expect(gutter.textContent).toContain("1");
    expect(gutter.textContent).toContain("2");
    expect(gutter.textContent).toContain("3");
    expect(gutter.className).toContain("luthor-source-view-line-numbers");
    expect(gutter).toHaveAttribute("aria-hidden", "true");

    textarea.scrollTop = 42;
    textarea.dispatchEvent(new Event("scroll"));
    expect(gutter.scrollTop).toBe(42);
  });

  it("keeps wrapped line continuations unnumbered so logical lines stay aligned", () => {
    vi.spyOn(HTMLTextAreaElement.prototype, "clientWidth", "get").mockReturnValue(84);

    const { container } = render(
      <SourceView
        value={"12345678901\nline two"}
        onChange={vi.fn()}
        placeholder="Paste markdown..."
        className="luthor-source-view--wrapped"
        wrap="soft"
      />,
    );

    const gutter = container.querySelector(".luthor-source-view-line-numbers") as HTMLDivElement;
    expect(gutter.textContent).toBe("1\n\n2");
  });

  it("accounts for tab expansion while estimating wrapped continuation rows", () => {
    vi.spyOn(HTMLTextAreaElement.prototype, "clientWidth", "get").mockReturnValue(84);
    const originalGetComputedStyle = window.getComputedStyle;
    vi.spyOn(window, "getComputedStyle").mockImplementation((element: Element) => {
      const style = originalGetComputedStyle.call(window, element);
      return {
        ...style,
        paddingLeft: "0px",
        paddingRight: "0px",
        fontSize: "14px",
        tabSize: "4",
      } as CSSStyleDeclaration;
    });

    const { container } = render(
      <SourceView
        value={"\t1234567\nline two"}
        onChange={vi.fn()}
        placeholder="Paste markdown..."
        className="luthor-source-view--wrapped"
        wrap="soft"
      />,
    );

    const gutter = container.querySelector(".luthor-source-view-line-numbers") as HTMLDivElement;
    expect(gutter.textContent).toBe("1\n\n2");
  });

  it("can disable line numbers", () => {
    const { container } = render(
      <SourceView
        value={"line 1\nline 2"}
        onChange={vi.fn()}
        placeholder="Paste JSON..."
        showLineNumbers={false}
      />,
    );

    expect(container.querySelector(".luthor-source-view-line-numbers")).toBeNull();
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea.className).toContain("luthor-source-view");
    expect(textarea.className).not.toContain("luthor-source-view--with-line-numbers");
  });
});
