---
title: "Collaboration"
description: "Real-time multi-user editing over Yjs: the isolated /collab entry, CollaborationExtension, remote-change tagging, and a DOM-free server session."
package: "headless"
docType: "reference"
surface: "extension"
keywords:
  - "collaboration"
  - "yjs"
  - "CollaborationExtension"
  - "Hocuspocus"
  - "y-websocket"
  - "multi-cursor"
  - "createHeadlessCollabSession"
props:
  []
exports:
  - "CollaborationExtension"
  - "isCollaborationUpdate"
  - "COLLABORATION_UPDATE_TAG"
  - "createHeadlessCollabSession"
  - "HistoryExtension"
commands:
  []
extensions:
  - "collaboration"
nodes:
  []
frameworks:
  - "react"
lastVerifiedFrom:
  - "packages/headless/src/collab.ts"
  - "packages/headless/src/extensions/core/CollaborationExtension.tsx"
  - "packages/headless/src/core/collaboration-headless.ts"
navGroup: "luthor_headless"
navOrder: 105
---

# Collaboration

Live multi-cursor editing on a shared Yjs document, via Lexical's binding.

## What this page answers

- How do I make an editor collaborative?
- What changes in history, content loading, and change events?
- How does a server read and write the same document?

## Install

Separate entry: the main bundle never imports Yjs. Add the optional peers only when you use it.

```bash
pnpm add yjs @lexical/yjs @hocuspocus/provider   # or y-websocket
```

```ts
import { CollaborationExtension } from "@lyfie/luthor-headless/collab";
```

## Client

```tsx
import * as Y from "yjs";
import type { Provider } from "@lexical/yjs";
import { LexicalCollaboration } from "@lexical/react/LexicalCollaborationContext";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { CollaborationExtension } from "@lyfie/luthor-headless/collab";

const collaboration = useMemo(
  () =>
    new CollaborationExtension({
      id: `${ownerId}:${noteId}`, // globally unique room
      providerFactory: (id, docs) => {
        const doc = new Y.Doc();
        docs.set(id, doc);
        return new HocuspocusProvider({ url, name: id, document: doc }) as unknown as Provider;
      },
      username: me.name,
      cursorColor: me.color,
      cursorsContainerRef, // optional; defaults to document.body
    }),
  [ownerId, noteId],
);

<LexicalCollaboration>
  <ExtensiveEditor extraExtensions={[collaboration]} />
</LexicalCollaboration>;
```

| Option | Purpose |
| --- | --- |
| `id` | room / document id |
| `providerFactory(id, yjsDocMap)` | network provider (Hocuspocus, y-websocket, …) |
| `shouldBootstrap` | seed an empty doc from this client; keep `false` (default) when a server seeds it |
| `username`, `cursorColor`, `awarenessData` | presence shown to peers |
| `cursorsContainerRef` | element remote carets render into |

Rules:

- **Memoize per room.** A new instance or room needs a remount (new React `key`).
- **Wrap in `<LexicalCollaboration>`** — Lexical's `CollaborationPlugin` requires its context provider.
- **The doc is the content.** `defaultContent` is ignored; don't call `injectJSON`.
- **History is per user.** `ExtensiveEditor` swaps in `new HistoryExtension({ plugin: false })` automatically, so the Yjs UndoManager undoes only your edits. Headless setups do the same by hand.
- **The server persists, not the client.** Omit preset `onChange` on a collaborative editor — it baselines with `getMarkdown()` at mount, before the room has synced. Peer updates carry `COLLABORATION_UPDATE_TAG` (`isCollaborationUpdate(tags)` in an update listener; `source: "remote"` in change payloads).

## Server

`createHeadlessCollabSession(doc, { nodes })` binds a DOM-free Lexical editor to the same `Y.Doc` — same binding and root type as the browser, so both ends share one model. Use it in a Hocuspocus hook to persist, seed, or transform.

```ts
import { createHeadlessCollabSession } from "@lyfie/luthor-headless/collab";

const session = createHeadlessCollabSession(doc, { nodes: EDITOR_NODES });
session.flush();                 // apply queued remote changes
const state = session.toJSON();  // persist
session.replaceWithJSON(next);   // one local change → peers get a normal update
session.dispose();
```

`nodes` must cover every type any client can write. `@lyfie/luthor/presets/papyra-collab` wraps this for the Papyra preset (markdown in/out, node list derived from the browser preset) — see [Papyra Editor](/docs/luthor/presets/papyra-editor/#live-collaboration).
