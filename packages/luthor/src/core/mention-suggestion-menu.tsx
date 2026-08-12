/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/*
 * The dropdown for the `@` mention trigger. The headless
 * `MentionTypeaheadExtension` decides *when* it opens and where the caret is;
 * this component only renders the people the host's search returned and reports
 * the pick back. Selecting writes plain `@username ` into the body — mentions
 * are text, never a node.
 */

import { TypeaheadMenu } from "./typeahead-menu";

/** One person offered by the `@` typeahead. */
export interface MentionSuggestionItem {
  /** The handle written into the body as `@username`. */
  username: string;
  /** The person's display name, shown next to the handle. */
  name?: string;
}

export function MentionSuggestionMenu({
  isOpen,
  query,
  position,
  portalContainer,
  suggestions,
  onClose,
  onExecute,
}: {
  isOpen: boolean;
  query: string;
  position: { x: number; y: number } | null;
  portalContainer?: HTMLElement | null;
  suggestions: readonly MentionSuggestionItem[];
  onClose: () => void;
  onExecute: (username: string) => void;
}) {
  return (
    <TypeaheadMenu
      isOpen={isOpen}
      position={position}
      portalContainer={portalContainer}
      items={suggestions}
      menuClassName="luthor-mention-typeahead"
      title="Mention"
      queryLabel={`@${query}`}
      emptyLabel="No matching users"
      getItemKey={(item) => item.username}
      renderItem={(item) => (
        <span className="luthor-typeahead-menu-item-content">
          <span className="luthor-typeahead-menu-item-title">@{item.username}</span>
          {item.name && (
            <span className="luthor-typeahead-menu-item-meta">{item.name}</span>
          )}
        </span>
      )}
      onClose={onClose}
      onSelect={(item) => onExecute(item.username)}
    />
  );
}
