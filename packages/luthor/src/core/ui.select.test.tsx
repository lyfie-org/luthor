/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Select } from "./ui";

function createRect({
  left,
  top,
  width,
  height,
}: {
  left: number;
  top: number;
  width: number;
  height: number;
}): DOMRect {
  return {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
  } as DOMRect;
}

describe("Select overlay positioning", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps dropdown within editor bounds while fitting its content", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function mockRect(this: HTMLElement) {
      if (this.classList.contains("luthor-editor-wrapper")) {
        return createRect({ left: 100, top: 100, width: 220, height: 260 });
      }
      if (this.classList.contains("luthor-select-trigger")) {
        return createRect({ left: 120, top: 120, width: 120, height: 36 });
      }
      if (this.classList.contains("luthor-select-dropdown")) {
        return createRect({ left: 0, top: 0, width: 120, height: 160 });
      }
      return createRect({ left: 0, top: 0, width: 0, height: 0 });
    });

    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(function mockScrollWidth(this: HTMLElement) {
      if (this.classList.contains("luthor-select-dropdown")) {
        return 260;
      }
      return 0;
    });

    const { container } = render(
      <div className="luthor-editor-wrapper">
        <Select
          value="one"
          onValueChange={() => {}}
          options={[
            { value: "one", label: "One" },
            { value: "two", label: "JetBrains Mono" },
          ]}
        />
      </div>,
    );

    const trigger = container.querySelector(".luthor-select-trigger");
    expect(trigger).not.toBeNull();
    fireEvent.click(trigger as HTMLElement);

    await waitFor(() => {
      const dropdown = document.querySelector(".luthor-select-dropdown") as HTMLElement | null;
      expect(dropdown).not.toBeNull();
      // Sized by its content (CSS max-content), never narrower than the
      // trigger, never wider than the editor allows — so a long option is
      // never cut off by a short trigger.
      expect(dropdown?.style.width).toBe("");
      expect(dropdown?.style.minWidth).toBe("120px");
      expect(dropdown?.style.maxWidth).toBe("204px");
      expect(dropdown?.style.left).toBe("8px");
      expect(dropdown?.style.top).toBe("60px");
    });
  });

  it("closes on Escape without letting the key reach the host", () => {
    const hostKey = vi.fn();
    window.addEventListener("keydown", hostKey);
    const { container } = render(
      <Select value="one" onValueChange={() => {}} options={[{ value: "one", label: "One" }, { value: "two", label: "Two" }]} />,
    );
    const trigger = container.querySelector(".luthor-select-trigger") as HTMLElement;
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.querySelector(".luthor-select-dropdown")).not.toBeNull();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    expect(document.querySelector(".luthor-select-dropdown")).toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(hostKey).not.toHaveBeenCalled();
    window.removeEventListener("keydown", hostKey);
  });
});
