import { TextFormatExtension } from "@lyfie/luthor-headless/extensions/base";
import type { LexicalEditor } from "lexical";

/**
 * CodeFormatExtension - Provides inline code text formatting functionality
 *
 * This extension extends TextFormatExtension to provide inline code formatting
 * for selected text in the Lexical editor. It integrates with the toolbar system
 * and provides commands and state queries for inline code operations.
 *
 * @example
 * ```tsx
 * import { codeFormatExtension } from '@lyfie/luthor-headless/extensions/formatting/CodeFormatExtension';
 *
 * const extensions = [codeFormatExtension];
 * const editor = createEditorSystem(extensions);
 * ```
 */
export class CodeFormatExtension extends TextFormatExtension<"code"> {
  constructor() {
    super("code");
  }

  register(editor: LexicalEditor): () => void {
    const unregisterBase = super.register(editor);
    const root = editor.getRootElement();

    if (!root) {
      return unregisterBase;
    }

    const findFirstTextNode = (node: Node): Text | null => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node as Text;
      }
      for (let index = 0; index < node.childNodes.length; index += 1) {
        const child = node.childNodes[index];
        if (!child) continue;
        const match = findFirstTextNode(child);
        if (match) return match;
      }
      return null;
    };

    const findLastTextNode = (node: Node): Text | null => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node as Text;
      }
      for (let index = node.childNodes.length - 1; index >= 0; index -= 1) {
        const child = node.childNodes[index];
        if (!child) continue;
        const match = findLastTextNode(child);
        if (match) return match;
      }
      return null;
    };

    const handleClick = (event: MouseEvent) => {
      if (event.button !== 0) {
        return;
      }

      const activeSelection = window.getSelection();
      if (
        activeSelection &&
        activeSelection.rangeCount > 0 &&
        !activeSelection.getRangeAt(0).collapsed
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      const targetElement = target instanceof HTMLElement ? target : target.parentElement;
      if (!targetElement) {
        return;
      }

      let codeElement = targetElement.closest(".luthor-text-code, code");
      if (!(codeElement instanceof HTMLElement)) {
        const probe = document.elementFromPoint(event.clientX + 4, event.clientY);
        codeElement = probe?.closest(".luthor-text-code, code") ?? null;
      }

      if (!(codeElement instanceof HTMLElement) || !root.contains(codeElement)) {
        return;
      }

      const rect = codeElement.getBoundingClientRect();
      const edgeTolerance = Math.max(4, Math.min(8, rect.width / 2));
      let caretNode: Text | null = null;
      let caretOffset = 0;

      if (event.clientX <= rect.left + edgeTolerance) {
        caretNode = findFirstTextNode(codeElement);
        caretOffset = 0;
      } else if (event.clientX >= rect.right - edgeTolerance) {
        caretNode = findLastTextNode(codeElement);
        caretOffset = caretNode?.data.length ?? 0;
      }

      if (!caretNode) {
        return;
      }

      event.preventDefault();
      editor.focus(() => {
        const selection = window.getSelection();
        if (!selection) {
          return;
        }

        const range = document.createRange();
        range.setStart(caretNode, caretOffset);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      });
    };

    root.addEventListener("click", handleClick, true);

    return () => {
      root.removeEventListener("click", handleClick, true);
      unregisterBase();
    };
  }
}

export const codeFormatExtension = new CodeFormatExtension();

