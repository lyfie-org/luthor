/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/*
 * The dropdown for the `[[` note-link trigger. The headless
 * `WikilinkTypeaheadExtension` owns the trigger detection and the insertion;
 * this component renders the notes the host's search returned and reports the
 * pick back, which the extension turns into a `[[Note]]` wikilink node.
 */

import { TypeaheadMenu } from "./typeahead-menu";

/** One note offered by the `[[` typeahead. */
export interface WikilinkSuggestionItem {
  /** The note's stable id, used as the row key. */
  id: string;
  /** The note title written into the body as `[[title]]`. */
  title: string;
  /** Optional per-note tint, shown as a leading dot. */
  color?: string;
}

/** Default menu heading, used when the host passes no `title`. */
export const WIKILINK_MENU_TITLE = "Link note";

/** Default empty state, used when the host passes no `emptyLabel`. */
export const WIKILINK_MENU_EMPTY_LABEL = "No matching notes";

export function WikilinkSuggestionMenu({
  isOpen,
  query,
  position,
  portalContainer,
  suggestions,
  title = WIKILINK_MENU_TITLE,
  emptyLabel = WIKILINK_MENU_EMPTY_LABEL,
  onClose,
  onExecute,
}: {
  isOpen: boolean;
  query: string;
  position: { x: number; y: number } | null;
  portalContainer?: HTMLElement | null;
  suggestions: readonly WikilinkSuggestionItem[];
  /** Menu heading. Defaults to {@link WIKILINK_MENU_TITLE}. */
  title?: string;
  /** Shown when the host's search returns no note. */
  emptyLabel?: string;
  onClose: () => void;
  onExecute: (title: string) => void;
}) {
  return (
    <TypeaheadMenu
      isOpen={isOpen}
      position={position}
      portalContainer={portalContainer}
      items={suggestions}
      menuClassName="luthor-wikilink-typeahead"
      title={title}
      queryLabel={`[[${query}`}
      emptyLabel={emptyLabel}
      getItemKey={(item, index) => `${item.id}-${index}`}
      renderItem={(item) => (
        <>
          <span
            className="luthor-typeahead-menu-item-dot"
            style={item.color ? { background: item.color } : undefined}
            aria-hidden="true"
          />
          <span className="luthor-typeahead-menu-item-content">
            <span className="luthor-typeahead-menu-item-title">{item.title}</span>
          </span>
        </>
      )}
      onClose={onClose}
      onSelect={(item) => onExecute(item.title)}
    />
  );
}
