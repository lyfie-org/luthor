/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import {
  DecoratorNode,
  type DOMConversionMap,
  type DOMExportOutput,
  type ElementNode,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical";
import type { MultilineElementTransformer } from "@lexical/markdown";
import { type ReactNode } from "react";
import { ExtensionCategory } from "@lyfie/luthor-headless/extensions/types";
import { BaseExtension } from "@lyfie/luthor-headless/extensions/base";

/**
 * Serialized shape of a {@link CalloutNode}. The verbatim header tail (the text
 * written after `[!transcript]` on the opening line) and the body content lines
 * are persisted exactly as authored, so the markdown round-trips losslessly.
 */
export type SerializedCalloutNode = Spread<
  {
    /** Verbatim text after the `[!transcript]` marker on the opening line. */
    headerTail: string;
    /** Body content lines, each with its `>` quote prefix already stripped. */
    body: string[];
  },
  SerializedLexicalNode
>;

/** Marker used in the `> [!transcript]` opening line and in display. */
const CALLOUT_KIND = "transcript";

/** Human label shown when the author supplies no custom title. */
const CALLOUT_DEFAULT_LABEL = "Transcript";

/**
 * React view for a transcription callout. The callout is display-only: it renders
 * a labelled, accent-tinted block whose body shows the transcript lines. The
 * markdown — not this rendering — is the source of truth, so the body is shown as
 * plain stacked lines and is never edited in place.
 */
function CalloutComponent({
  title,
  body,
}: {
  title: string;
  body: string[];
}): ReactNode {
  return (
    <aside
      className="luthor-callout luthor-callout--transcript"
      data-luthor-callout={CALLOUT_KIND}
      aria-label={title}
    >
      <span className="luthor-callout__label">{title}</span>
      <div className="luthor-callout__body">
        {body.map((line, index) =>
          line.length > 0 ? (
            <p className="luthor-callout__line" key={index}>
              {line}
            </p>
          ) : (
            <p
              className="luthor-callout__line luthor-callout__line--blank"
              key={index}
              aria-hidden="true"
            />
          ),
        )}
      </div>
    </aside>
  );
}

/**
 * A block-level transcription callout, authored as an Obsidian-style
 * `> [!transcript]` block:
 *
 * ```md
 * > [!transcript] Optional title
 * > First line of the transcript.
 * > Second line.
 * ```
 *
 * The node stores the verbatim header tail and body lines, so the companion
 * {@link CALLOUT_MARKDOWN_TRANSFORMER} gives it a lossless round-trip. It is
 * host-agnostic and needs no resolver: the content lives inline in the body.
 */
export class CalloutNode extends DecoratorNode<ReactNode> {
  /** Verbatim text after `[!transcript]` on the opening line (may be empty). */
  __headerTail: string;
  /** Body content lines, each already stripped of its `>` quote prefix. */
  __body: string[];

  static getType(): string {
    return "callout";
  }

  static clone(node: CalloutNode): CalloutNode {
    return new CalloutNode(node.__headerTail, [...node.__body], node.__key);
  }

  static importJSON(serialized: SerializedCalloutNode): CalloutNode {
    return $createCalloutNode(serialized.headerTail, serialized.body);
  }

  // Callouts are authored through markdown, not pasted HTML; the explicit null
  // import keeps Lexical from warning about the custom exportDOM.
  static importDOM(): DOMConversionMap | null {
    return null;
  }

  constructor(headerTail: string, body: string[], key?: NodeKey) {
    super(key);
    this.__headerTail = headerTail;
    this.__body = body;
  }

  exportJSON(): SerializedCalloutNode {
    return {
      type: "callout",
      version: 1,
      headerTail: this.__headerTail,
      body: this.__body,
    };
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    div.className = "luthor-callout-shell";
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const blockquote = document.createElement("blockquote");
    blockquote.className = "luthor-callout luthor-callout--transcript";
    blockquote.setAttribute("data-luthor-callout", CALLOUT_KIND);
    for (const line of this.__body) {
      const p = document.createElement("p");
      p.textContent = line;
      blockquote.appendChild(p);
    }
    return { element: blockquote };
  }

  isInline(): boolean {
    return false;
  }

  canBeEmpty(): boolean {
    return false;
  }

  getTextContent(): string {
    return this.getMarkdown();
  }

  getTitle(): string {
    const trimmed = this.__headerTail.trim();
    return trimmed.length > 0 ? trimmed : CALLOUT_DEFAULT_LABEL;
  }

  getBody(): string[] {
    return [...this.__body];
  }

  /** The verbatim markdown this node serializes to. */
  getMarkdown(): string {
    const header = `> [!${CALLOUT_KIND}]${this.__headerTail}`;
    const body = this.__body.map((line) => (line.length > 0 ? `> ${line}` : ">"));
    return [header, ...body].join("\n");
  }

  decorate(): ReactNode {
    return <CalloutComponent title={this.getTitle()} body={this.__body} />;
  }
}

/** Create a {@link CalloutNode}. */
export function $createCalloutNode(
  headerTail: string,
  body: string[],
): CalloutNode {
  return new CalloutNode(headerTail, body);
}

/** Type guard for {@link CalloutNode}. */
export function $isCalloutNode(
  node: LexicalNode | null | undefined,
): node is CalloutNode {
  return node instanceof CalloutNode;
}

/**
 * Headless extension that registers {@link CalloutNode} with the editor. The node
 * is rendered by its decorator and parsed/serialized by
 * {@link CALLOUT_MARKDOWN_TRANSFORMER}; registration contributes only the node
 * class.
 */
export class CalloutExtension extends BaseExtension<"callout"> {
  constructor() {
    super("callout", [ExtensionCategory.Floating]);
  }

  register(): () => void {
    return () => {};
  }

  getNodes(): Array<typeof CalloutNode> {
    return [CalloutNode];
  }
}

export const calloutExtension = new CalloutExtension();

const CALLOUT_START_REGEX = /^>\s\[!transcript\]/i;

/**
 * Lossless bidirectional markdown transformer for {@link CalloutNode}.
 *
 * Import: an opening line of `> [!transcript]` (optionally `> [!transcript] Title`)
 * followed by zero or more `>`-prefixed body lines, terminated by a blank line or
 * the end of the document, becomes a transcription callout. Export: a callout
 * serializes back to the same block verbatim.
 *
 * The scan terminates on the first blank line, matching the multiline-block
 * convention the table transformer already relies on. If a body line is not a
 * quote line (a malformed block that is not blank-line separated from the
 * following content), the transformer bails by returning `false`, letting the
 * lines fall back to ordinary per-line parsing rather than swallowing them.
 */
export const CALLOUT_MARKDOWN_TRANSFORMER: MultilineElementTransformer = {
  dependencies: [CalloutNode],
  export: (node: LexicalNode) => {
    if (!$isCalloutNode(node)) {
      return null;
    }
    return node.getMarkdown();
  },
  regExpStart: CALLOUT_START_REGEX,
  regExpEnd: {
    optional: true as const,
    regExp: /^$/,
  },
  replace: (
    rootNode: ElementNode,
    children: LexicalNode[] | null,
    startMatch: string[],
    endMatch: string[] | null,
    linesInBetween: string[] | null,
    isImport: boolean,
  ) => {
    void children;
    void endMatch;
    void isImport;

    if (!linesInBetween) {
      return false;
    }

    // The opening line's slice (everything after `> [!transcript]`) is the first
    // entry; the remaining entries are the verbatim body lines, possibly with a
    // trailing empty string left by the blank-line terminator.
    const headerTail = linesInBetween[0] ?? "";
    const rawBody = linesInBetween.slice(1);
    if (rawBody.length > 0 && rawBody[rawBody.length - 1] === "") {
      rawBody.pop();
    }

    const body: string[] = [];
    for (const line of rawBody) {
      // A non-quote line means the block was not blank-line separated from the
      // following content; bail so the lines parse as ordinary markdown instead.
      if (!line.startsWith(">")) {
        return false;
      }
      body.push(line.replace(/^>\s?/, ""));
    }

    rootNode.append($createCalloutNode(headerTail, body));
    return;
  },
  type: "multiline-element" as const,
};
