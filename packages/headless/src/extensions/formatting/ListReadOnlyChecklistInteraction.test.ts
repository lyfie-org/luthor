/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/* @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import { __TEST_ONLY_LIST_INTERNALS } from "./ListExtension";

describe("ListExtension read-only checklist interaction helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("detects checklist checkbox hit area for check list items", () => {
    const list = document.createElement("ul");
    (list as any).__lexicalListType = "check";
    const listItem = document.createElement("li");
    listItem.setAttribute("role", "checkbox");
    list.append(listItem);
    document.body.append(list);

    Object.defineProperty(listItem, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        left: 100,
        right: 300,
        top: 10,
        bottom: 40,
        width: 200,
        height: 30,
      }),
    });

    vi.spyOn(window, "getComputedStyle").mockImplementation(
      ((element: Element, pseudoElt?: string | null) => {
        if (element === listItem && pseudoElt === "::before") {
          return { width: "16px" } as CSSStyleDeclaration;
        }
        return { width: "0px" } as CSSStyleDeclaration;
      }) as typeof window.getComputedStyle,
    );

    const event = {
      target: listItem,
      clientX: 108,
    } as unknown as MouseEvent;

    expect(__TEST_ONLY_LIST_INTERNALS.resolveReadOnlyChecklistToggleListItem(event)).toBe(listItem);
  });

  it("ignores clicks outside checklist marker zone and non-check lists", () => {
    const list = document.createElement("ul");
    (list as any).__lexicalListType = "check";
    const listItem = document.createElement("li");
    list.append(listItem);
    document.body.append(list);

    Object.defineProperty(listItem, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        left: 100,
        right: 300,
        top: 10,
        bottom: 40,
        width: 200,
        height: 30,
      }),
    });

    vi.spyOn(window, "getComputedStyle").mockImplementation(
      ((element: Element, pseudoElt?: string | null) => {
        if (element === listItem && pseudoElt === "::before") {
          return { width: "16px" } as CSSStyleDeclaration;
        }
        return { width: "0px" } as CSSStyleDeclaration;
      }) as typeof window.getComputedStyle,
    );

    const outsideHit = {
      target: listItem,
      clientX: 180,
    } as unknown as MouseEvent;
    expect(__TEST_ONLY_LIST_INTERNALS.resolveReadOnlyChecklistToggleListItem(outsideHit)).toBeNull();

    const nonCheckList = document.createElement("ul");
    const nonCheckItem = document.createElement("li");
    nonCheckList.append(nonCheckItem);
    document.body.append(nonCheckList);
    Object.defineProperty(nonCheckItem, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        left: 100,
        right: 300,
        top: 10,
        bottom: 40,
        width: 200,
        height: 30,
      }),
    });
    const nonCheckEvent = {
      target: nonCheckItem,
      clientX: 108,
    } as unknown as MouseEvent;
    expect(__TEST_ONLY_LIST_INTERNALS.resolveReadOnlyChecklistToggleListItem(nonCheckEvent)).toBeNull();
  });
});
