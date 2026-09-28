/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import type { ReactNode, RefObject } from "react";
import type { Provider } from "@lexical/yjs";
import type { Doc } from "yjs";
import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import { BaseExtension } from "@lyfie/luthor-headless/extensions/base";
import { ExtensionCategory } from "@lyfie/luthor-headless/extensions/types";

import { COLLABORATION_UPDATE_TAG } from "./collaborationTag";

/** True when an update was applied from a remote peer, not the local user. */
export function isCollaborationUpdate(tags: ReadonlySet<string>): boolean {
  return tags.has(COLLABORATION_UPDATE_TAG);
}

export type CollaborationConfig = {
  /** Room / document id. Must be globally unique (e.g. `${ownerId}:${noteId}`). */
  id: string;
  /** Builds the network provider (Hocuspocus, y-websocket, …) for the room. */
  providerFactory: (id: string, yjsDocMap: Map<string, Doc>) => Provider;
  /**
   * Seed an empty shared doc from this client. Keep `false` when a server
   * bootstraps the document — two clients bootstrapping duplicates content.
   */
  shouldBootstrap?: boolean;
  /** Display name shown on this user's remote caret. */
  username?: string;
  /** Caret / selection color seen by peers. */
  cursorColor?: string;
  /** Extra awareness fields (avatar, user id…) broadcast to peers. */
  awarenessData?: object;
  /** Element remote cursors render into (defaults to document.body). */
  cursorsContainerRef?: RefObject<HTMLElement | null>;
};

/**
 * Binds the editor to a shared Yjs document via Lexical's CollaborationPlugin.
 *
 * While present, the editor system starts with `editorState: null` (the
 * binding populates the document) and history must come from the Yjs
 * UndoManager — pair it with `new HistoryExtension({ plugin: false })` so
 * undo only reverts this user's own changes.
 */
export class CollaborationExtension extends BaseExtension<
  "collaboration",
  CollaborationConfig & { showInToolbar?: boolean; position?: "before" | "after" },
  Record<string, never>,
  Record<string, never>,
  ReactNode[]
> {
  constructor(config: CollaborationConfig) {
    super("collaboration", [ExtensionCategory.Toolbar]);
    this.config = { ...config, showInToolbar: false };
  }

  register(): () => void {
    return () => {};
  }

  getPlugins(): ReactNode[] {
    const c = this.config;
    return [
      <CollaborationPlugin
        key={`collaboration-${c.id}`}
        id={c.id}
        providerFactory={c.providerFactory}
        shouldBootstrap={c.shouldBootstrap ?? false}
        username={c.username}
        cursorColor={c.cursorColor}
        awarenessData={c.awarenessData}
        cursorsContainerRef={c.cursorsContainerRef}
      />,
    ];
  }
}
