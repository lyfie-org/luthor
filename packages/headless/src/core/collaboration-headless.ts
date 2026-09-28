/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import {
  $getRoot,
  $parseSerializedNode,
  createEditor,
  type Klass,
  type LexicalEditor,
  type LexicalNode,
  type SerializedLexicalNode,
} from "lexical";
import {
  createBinding,
  syncLexicalUpdateToYjs,
  syncYjsChangesToLexical,
  type Provider,
} from "@lexical/yjs";
import { applyUpdate, Doc, encodeStateAsUpdate, type Transaction, type YEvent } from "yjs";

/**
 * A DOM-free Lexical editor bound to a shared Yjs document — the server half of
 * collaborative editing (persisting, seeding, server-side transforms). Uses the
 * same binding and root shared type as the browser `CollaborationPlugin`, so
 * both ends read and write one document model.
 */
export interface HeadlessCollabSession {
  readonly editor: LexicalEditor;
  readonly doc: Doc;
  /** Whether the shared document has no content yet (a fresh room). */
  isEmpty(): boolean;
  /** Commit any queued remote changes so reads see the latest state. */
  flush(): void;
  /** Serialized editor state after {@link flush}. */
  toJSON(): unknown;
  /**
   * Replace the whole document with a serialized Lexical document as one
   * local change — peers receive it as an ordinary remote update.
   */
  replaceWithJSON(document: unknown): void;
  dispose(): void;
}

export interface HeadlessCollabOptions {
  /** Node classes; must cover every type any client can write. */
  nodes: ReadonlyArray<Klass<LexicalNode>>;
  /** Binding id (only used to key the internal doc map). */
  id?: string;
  onError?: (error: Error) => void;
}

function createNoopProvider(): Provider {
  let localState: unknown = null;
  return {
    awareness: {
      getLocalState: () => localState,
      getStates: () => new Map(),
      off: () => {},
      on: () => {},
      setLocalState: (state: unknown) => {
        localState = state;
      },
      setLocalStateField: () => {},
    },
    connect: () => {},
    disconnect: () => {},
    off: () => {},
    on: () => {},
  } as unknown as Provider;
}

/**
 * Bind a headless editor to `doc`. Local editor updates are written into the
 * doc; peers' doc updates are applied to the editor synchronously.
 *
 * `doc` may already hold content (a persisted room): the binding lives on a
 * private shadow doc that is bound while empty and then fed `doc`'s state, so
 * the Yjs events that hydrate the editor always fire. The two docs relay
 * updates to each other for the life of the session.
 */
export function createHeadlessCollabSession(
  doc: Doc,
  options: HeadlessCollabOptions,
): HeadlessCollabSession {
  const editor = createEditor({
    namespace: "luthor-headless-collab",
    nodes: [...options.nodes],
    onError:
      options.onError ??
      ((error: Error) => {
        throw error;
      }),
  });
  // Commit updates without a DOM root, as @lexical/headless does.
  (editor as unknown as { _headless: boolean })._headless = true;

  const id = options.id ?? "luthor";
  const shadow = new Doc();
  const provider = createNoopProvider();
  const binding = createBinding(editor, provider, id, shadow, new Map([[id, shadow]]));

  const unregisterUpdate = editor.registerUpdateListener(
    ({ dirtyElements, dirtyLeaves, editorState, normalizedNodes, prevEditorState, tags }) => {
      if (tags.has("skip-collab")) {
        return;
      }
      syncLexicalUpdateToYjs(
        binding,
        provider,
        prevEditorState,
        editorState,
        dirtyElements,
        dirtyLeaves,
        normalizedNodes,
        tags,
      );
    },
  );

  const flush = () => {
    editor.update(() => {}, { discrete: true });
  };

  const root = binding.root.getSharedType();
  const observer = (events: Array<YEvent<any>>, transaction: Transaction) => {
    if (transaction.origin !== binding) {
      syncYjsChangesToLexical(binding, provider, events as never, false);
      // Commit each remote batch before the next Yjs transaction lands, so
      // the binding's collab-node map never runs ahead of the editor state.
      flush();
    }
  };
  root.observeDeep(observer);

  // Relay: peers' updates on `doc` reach the binding; this editor's own edits
  // on the shadow reach `doc` (and through it, every connected client).
  const RELAY = Symbol("luthor-collab-relay");
  const toShadow = (update: Uint8Array, origin: unknown) => {
    if (origin !== RELAY) applyUpdate(shadow, update, RELAY);
  };
  const toDoc = (update: Uint8Array, origin: unknown) => {
    if (origin !== RELAY) applyUpdate(doc, update, RELAY);
  };
  doc.on("update", toShadow);
  shadow.on("update", toDoc);
  applyUpdate(shadow, encodeStateAsUpdate(doc), RELAY);
  flush();

  return {
    editor,
    doc,
    isEmpty: () => root.length === 0,
    flush,
    toJSON: () => {
      flush();
      return editor.getEditorState().toJSON();
    },
    replaceWithJSON: (document) => {
      const children =
        (document as { root?: { children?: SerializedLexicalNode[] } } | null)?.root
          ?.children ?? [];
      editor.update(
        () => {
          const lexicalRoot = $getRoot();
          lexicalRoot.clear();
          for (const child of children) {
            lexicalRoot.append($parseSerializedNode(child));
          }
        },
        { discrete: true },
      );
    },
    dispose: () => {
      unregisterUpdate();
      root.unobserveDeep(observer);
      doc.off("update", toShadow);
      shadow.off("update", toDoc);
      shadow.destroy();
    },
  };
}
