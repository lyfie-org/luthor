/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { createContext, useContext, type ReactNode } from "react";

/** One field of a {@link PromptRequest}. */
export interface PromptField {
  name: string;
  label: string;
  placeholder?: string;
  type?: "text" | "url";
  required?: boolean;
  /** Starting value (editing an existing caption, alt text, …). */
  value?: string;
}

/** Values a decorator asks the person for. */
export interface PromptRequest {
  title: string;
  submitLabel?: string;
  fields: readonly PromptField[];
}

/** Ask for values; resolves the trimmed values by field name, or `null` on cancel. */
export type RequestPrompt = (request: PromptRequest) => Promise<Record<string, string> | null>;

/*
 * Decorators (a media frame's caption and alt-text buttons) can't host their
 * own text inputs: keystrokes inside a decorator reach the editor's root
 * listeners first, so Backspace would delete the node being captioned. They ask
 * the editor shell's themed dialog instead, through this context. A shell
 * without one gets `window.prompt`.
 */
const EditorPromptContext = createContext<RequestPrompt | null>(null);

export function EditorPromptProvider({
  requestPrompt,
  children,
}: {
  requestPrompt: RequestPrompt;
  children: ReactNode;
}): ReactNode {
  return <EditorPromptContext.Provider value={requestPrompt}>{children}</EditorPromptContext.Provider>;
}

/** The shell's prompt, or a `window.prompt` fallback (one field at a time). */
export function useEditorPrompt(): RequestPrompt {
  const provided = useContext(EditorPromptContext);
  return provided ?? promptFallback;
}

async function promptFallback(request: PromptRequest): Promise<Record<string, string> | null> {
  if (typeof window === "undefined" || typeof window.prompt !== "function") return null;
  const values: Record<string, string> = {};
  for (const field of request.fields) {
    const answer = window.prompt(field.label, field.value ?? "");
    if (answer === null) return null;
    const trimmed = answer.trim();
    if (field.required && !trimmed) return null;
    values[field.name] = trimmed;
  }
  return values;
}
