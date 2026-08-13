/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/*
 * The host-tunable surface of Papyra's two trigger menus (`@` mentions and
 * `[[` note links).
 *
 * The preset owns *what the triggers do* — detection, insertion, and the
 * markdown they write — but how eagerly they open, what the menu is called, and
 * whether a trigger exists at all are product decisions the host makes. Those
 * live here so a consuming app can retune them from its own release, without
 * waiting for a luthor version.
 *
 * Every field is optional and falls back to the shipped default, so a host that
 * passes nothing keeps today's behaviour exactly.
 */

/** Per-trigger configuration. See {@link PapyraTypeaheadConfig}. */
export interface PapyraTypeaheadTriggerConfig {
  /**
   * How many characters must follow the trigger before the menu opens.
   * Defaults to `0` — a bare `@` (or `[[`) opens it, which is what a person
   * expects when the directory or vault is small enough to browse. Raise it to
   * `1` or more when an unfiltered first page is noise, or when the search is
   * expensive.
   *
   * Only the length floor is configurable: the syntax rules (a username's legal
   * characters, `[[` never opening after `!`) hold at every setting, so the
   * first character the trigger cannot accept still closes the menu.
   */
  minQueryLength?: number;
  /**
   * Pixel offset of the menu from the caret. Defaults to `{ x: 0, y: 8 }`.
   * Useful when the host renders its own chrome around the caret line.
   */
  offset?: { x: number; y: number };
  /** Menu heading. Defaults to `"Mention"` / `"Link note"`. */
  title?: string;
  /**
   * Shown instead of the list when the host's search returns nothing. Defaults
   * to `"No matching users"` / `"No matching notes"`.
   */
  emptyLabel?: string;
  /**
   * Turn the trigger off entirely. The extension is not registered and no menu
   * can render, so `@` (or `[[`) stays ordinary text. For surfaces with no
   * people directory, or a deployment that does not use note links — the
   * alternative today is not mounting the editor at all.
   */
  disabled?: boolean;
}

/**
 * Host configuration for the trigger menus, passed as `PapyraEditor`'s
 * `typeahead` prop and threaded down to the headless extensions and the menu
 * components.
 */
export interface PapyraTypeaheadConfig {
  /** The `@` people trigger. */
  mention?: PapyraTypeaheadTriggerConfig;
  /** The `[[` note-link trigger. */
  noteLink?: PapyraTypeaheadTriggerConfig;
  /**
   * Debounce, in milliseconds, before a query reaches the adapter's search.
   * Shared by both triggers; defaults to `120`. A vault served from an
   * in-memory cache can drop it to `0`; a paginated remote directory may want
   * more.
   */
  searchDebounceMs?: number;
}
