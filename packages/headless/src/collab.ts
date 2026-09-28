/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/**
 * `@lyfie/luthor-headless/collab` — real-time collaboration (Yjs).
 *
 * A separate entry so the main bundle never imports `yjs` / `@lexical/yjs`:
 * install them (optional peers) only when you use this.
 */
export {
  CollaborationExtension,
  isCollaborationUpdate,
  type CollaborationConfig,
} from "./extensions/core/CollaborationExtension";
export { COLLABORATION_UPDATE_TAG } from "./extensions/core/collaborationTag";
export {
  createHeadlessCollabSession,
  type HeadlessCollabOptions,
  type HeadlessCollabSession,
} from "./core/collaboration-headless";
