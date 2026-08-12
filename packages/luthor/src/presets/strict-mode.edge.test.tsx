/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/* @vitest-environment jsdom */

import { StrictMode } from "react";
import { render, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MarkDownEditor } from "./md-editor";
import { ExtensiveEditor } from "./extensive";

/**
 * React 19 StrictMode mounts, unmounts, and remounts every component in
 * development. Anything registered on mount without a matching teardown
 * accumulates: root listeners, MutationObservers, timers, and object URLs.
 * Several extensions register all four, so mount/unmount churn is where
 * those leaks surface first.
 *
 * These count real registrations by spying on the globals rather than
 * asserting on internal bookkeeping, so they stay honest if the
 * implementation changes.
 */

type ObserverRecord = { disconnected: boolean };

let observers: ObserverRecord[];
let liveTimers: Set<unknown>;
let addedListeners: Map<string, number>;
let originalMutationObserver: typeof MutationObserver;

beforeEach(() => {
  observers = [];
  liveTimers = new Set();
  addedListeners = new Map();

  originalMutationObserver = globalThis.MutationObserver;
  class TrackedMutationObserver extends originalMutationObserver {
    private readonly record: ObserverRecord;

    constructor(callback: MutationCallback) {
      super(callback);
      this.record = { disconnected: false };
      observers.push(this.record);
    }

    disconnect(): void {
      this.record.disconnected = true;
      super.disconnect();
    }
  }
  globalThis.MutationObserver = TrackedMutationObserver as typeof MutationObserver;

  const realSetInterval = globalThis.setInterval;
  const realClearInterval = globalThis.clearInterval;
  vi.stubGlobal("setInterval", ((...args: Parameters<typeof setInterval>) => {
    const id = realSetInterval(...args);
    liveTimers.add(id);
    return id;
  }) as typeof setInterval);
  vi.stubGlobal("clearInterval", ((id: Parameters<typeof clearInterval>[0]) => {
    liveTimers.delete(id);
    return realClearInterval(id);
  }) as typeof clearInterval);

  // Only `document` and `window` matter: they outlive the component tree,
  // so a listener left on them is a real leak. Listeners on the editor's
  // own elements die with the detached subtree and are not counted.
  const realAdd = EventTarget.prototype.addEventListener;
  const realRemove = EventTarget.prototype.removeEventListener;
  const isLongLived = (target: EventTarget) =>
    target === globalThis.document || target === globalThis.window;

  vi.spyOn(EventTarget.prototype, "addEventListener").mockImplementation(function (
    this: EventTarget,
    type: string,
    ...rest: unknown[]
  ) {
    if (isLongLived(this)) {
      addedListeners.set(type, (addedListeners.get(type) ?? 0) + 1);
    }
    return realAdd.apply(this, [type, ...rest] as never);
  } as typeof EventTarget.prototype.addEventListener);
  vi.spyOn(EventTarget.prototype, "removeEventListener").mockImplementation(function (
    this: EventTarget,
    type: string,
    ...rest: unknown[]
  ) {
    if (isLongLived(this)) {
      addedListeners.set(type, (addedListeners.get(type) ?? 0) - 1);
    }
    return realRemove.apply(this, [type, ...rest] as never);
  } as typeof EventTarget.prototype.removeEventListener);
});

afterEach(() => {
  cleanup();
  globalThis.MutationObserver = originalMutationObserver;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("StrictMode double-mount", () => {
  it("mounts and unmounts a preset under StrictMode without throwing", () => {
    const { unmount } = render(
      <StrictMode>
        <MarkDownEditor showDefaultContent={false} />
      </StrictMode>,
    );
    expect(() => unmount()).not.toThrow();
  });

  it("disconnects every MutationObserver it created after unmount", () => {
    const { unmount } = render(
      <StrictMode>
        <ExtensiveEditor showDefaultContent={false} />
      </StrictMode>,
    );
    unmount();

    const leaked = observers.filter((observer) => !observer.disconnected);
    expect(leaked).toHaveLength(0);
  });

  it("clears every interval it started after unmount", () => {
    const { unmount } = render(
      <StrictMode>
        <ExtensiveEditor showDefaultContent={false} />
      </StrictMode>,
    );
    unmount();

    expect(Array.from(liveTimers)).toHaveLength(0);
  });
});

describe("repeated mount/unmount churn", () => {
  it("does not accumulate observers across ten cycles", () => {
    for (let cycle = 0; cycle < 10; cycle += 1) {
      const { unmount } = render(<ExtensiveEditor showDefaultContent={false} />);
      unmount();
    }

    const leaked = observers.filter((observer) => !observer.disconnected);
    expect(leaked).toHaveLength(0);
  });

  it("removes every document/window listener it adds", () => {
    for (let cycle = 0; cycle < 5; cycle += 1) {
      const { unmount } = render(<ExtensiveEditor showDefaultContent={false} />);
      unmount();
    }

    // A net-positive count on a long-lived target means a listener
    // outlived its component and will fire against a dead editor.
    const stillAdded = Array.from(addedListeners.entries()).filter(
      ([, count]) => count > 0,
    );
    expect(stillAdded).toEqual([]);
  });
});
