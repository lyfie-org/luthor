/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import {
  ExtensiveEditor,
  type ExtensiveEditorChangePayload,
} from "@lyfie/luthor";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Autosave wired to `onChange` — the integration hosts get wrong most
 * often, demonstrated the way it should actually be built.
 *
 * The three things this example exists to show:
 *
 *  1. Save on `source === "user"` only. Programmatic adopts (a remote
 *     revision arriving through `injectJSON`) would otherwise be written
 *     straight back to the server as if the user had typed them.
 *  2. Compare against `isDirty`, not against a remembered string. The
 *     editor's own serialization of the mounted content is the baseline;
 *     a raw string comparison reports a phantom change on first mount
 *     because markdown normalizes.
 *  3. Debounce, and flush the pending save on unmount — otherwise the
 *     last edit before a navigation is lost.
 *
 * The editor stays uncontrolled throughout: `defaultContent` is read once
 * and the caret is never touched by this component.
 */

const SAVE_DEBOUNCE_MS = 800;

type SaveState = "idle" | "pending" | "saving" | "saved" | "error";

const INITIAL_CONTENT = [
  "# Autosave demo",
  "",
  "Type here. The status below tracks a debounced save.",
  "",
  "- Programmatic changes never trigger a save",
  "- Pending saves flush on unmount",
].join("\n");

/** Stand-in for a real API call. */
function persistDraft(markdown: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate a server rejecting oversized payloads so the error path
      // is visible rather than theoretical.
      if (markdown.length > 20_000) {
        reject(new Error("Draft too large"));
        return;
      }
      resolve();
    }, 400);
  });
}

export function AutosaveExample() {
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveCount, setSaveCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingMarkdownRef = useRef<string | null>(null);

  const runSave = useCallback(async (markdown: string) => {
    pendingMarkdownRef.current = null;
    setSaveState("saving");
    setErrorMessage(null);
    try {
      await persistDraft(markdown);
      setSaveState("saved");
      setSaveCount((count) => count + 1);
      setLastSavedAt(new Date().toLocaleTimeString());
    } catch (error) {
      setSaveState("error");
      setErrorMessage(error instanceof Error ? error.message : "Save failed");
    }
  }, []);

  const handleChange = useCallback(
    (payload: ExtensiveEditorChangePayload) => {
      // (1) Host-initiated changes are not user edits.
      if (payload.source !== "user") {
        return;
      }

      // (2) The editor already knows whether this differs from the
      // baseline; trusting it avoids a spurious save on mount.
      if (!payload.isDirty) {
        return;
      }

      pendingMarkdownRef.current = payload.markdown;
      setSaveState("pending");

      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const markdown = pendingMarkdownRef.current;
        if (markdown !== null) {
          void runSave(markdown);
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [runSave],
  );

  // (3) Flush anything still pending when the component goes away.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const markdown = pendingMarkdownRef.current;
      if (markdown !== null) {
        void persistDraft(markdown);
      }
    };
  }, []);

  return (
    <section className="autosave-example">
      <header className="autosave-example__status" aria-live="polite">
        <strong>Status:</strong> {describeSaveState(saveState)}
        {lastSavedAt ? <span> · last saved {lastSavedAt}</span> : null}
        <span> · {saveCount} save(s)</span>
        {errorMessage ? (
          <span role="alert"> · {errorMessage}</span>
        ) : null}
      </header>

      <ExtensiveEditor
        defaultContent={INITIAL_CONTENT}
        initialMode="markdown"
        onChange={handleChange}
      />
    </section>
  );
}

function describeSaveState(state: SaveState): string {
  switch (state) {
    case "pending":
      return "unsaved changes";
    case "saving":
      return "saving…";
    case "saved":
      return "saved";
    case "error":
      return "save failed";
    default:
      return "no changes yet";
  }
}
