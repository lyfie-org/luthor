/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/**
 * Tag the Yjs binding puts on updates that arrived from a peer (or the
 * server). The binding tags this client's own Yjs undo/redo `historic`
 * instead, so undo still counts as a local edit. Mirrors Lexical's
 * `COLLABORATION_TAG` without importing the collaboration stack.
 */
export const COLLABORATION_UPDATE_TAG = "collaboration";
