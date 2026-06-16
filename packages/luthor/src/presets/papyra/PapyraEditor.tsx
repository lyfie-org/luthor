/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { forwardRef } from "react";
import type {
  ExtensiveEditorProps,
  ExtensiveEditorRef,
  FeatureFlagOverrides,
} from "../extensive";
import { ExtensiveEditor } from "../extensive";
import { joinClassNames } from "../_shared";

/**
 * Modes Papyra ever exposes: the visual canvas and a raw markdown source view.
 * JSON/HTML are intentionally absent — markdown is the source of truth.
 */
export const PAPYRA_AVAILABLE_MODES = ["visual", "markdown"] as const;

/**
 * Feature flags Papyra hard-locks at the skeleton stage. The floating toolbar is
 * the only chrome that shows while writing. The full opinionated policy (the
 * Restrictions table) lands in Sprint E0.2 via `PapyraFeaturePolicy`.
 */
export const PAPYRA_LOCKED_FEATURE_FLAGS: FeatureFlagOverrides = {
  floatingToolbar: true,
};

const PAPYRA_DEFAULT_PLACEHOLDER = "Start writing…";

/**
 * Imperative handle a Papyra host captures via `onReady`. Today it mirrors
 * {@link ExtensiveEditorRef}; Sprint E0.2 widens it with `setMarkdown`/`focus`.
 */
export type PapyraEditorRef = ExtensiveEditorRef;

/**
 * Props for {@link PapyraEditor}. This is {@link ExtensiveEditorProps} with the
 * locked contract removed — callers cannot reach the props Papyra owns:
 * `availableModes`, the view-tabs toggles, the pinned/enabled toolbar switches,
 * `markdownSourceOfTruth`, and `featureFlags` (re-opened through the feature
 * policy in Sprint E0.2).
 */
export type PapyraEditorProps = Omit<
  ExtensiveEditorProps,
  | "availableModes"
  | "isEditorViewTabsVisible"
  | "isEditorViewsTabVisible"
  | "isToolbarEnabled"
  | "isToolbarPinned"
  | "markdownSourceOfTruth"
  | "featureFlags"
>;

/**
 * `<PapyraEditor>` — the markdown-native note canvas Papyra ships.
 *
 * A thin wrapper over {@link ExtensiveEditor} that hard-locks Papyra's contract:
 * a visual + markdown-source surface, no view tabs, no pinned/persistent
 * toolbar (floating-on-selection only), and markdown as the source of truth.
 *
 * **Uncontrolled by design.** The editor reads `defaultContent` once on mount
 * and never again — there is no `value`/`onChange` round-trip. Adopting a remote
 * revision is a host-driven remount (change the React `key`), never a live-DOM
 * patch. Read the body imperatively through the ref captured in `onReady`. This
 * is what keeps the caret sacred during Papyra's local-first sync.
 */
export const PapyraEditor = forwardRef<PapyraEditorRef, PapyraEditorProps>(
  ({ className, variantClassName, placeholder, ...props }, ref) => {
    return (
      <ExtensiveEditor
        ref={ref}
        {...props}
        className={joinClassNames("luthor-preset-papyra", className)}
        variantClassName={joinClassNames(
          "luthor-preset-papyra__variant",
          variantClassName,
        )}
        placeholder={placeholder ?? PAPYRA_DEFAULT_PLACEHOLDER}
        availableModes={PAPYRA_AVAILABLE_MODES}
        isEditorViewTabsVisible={false}
        isToolbarEnabled={false}
        isToolbarPinned={false}
        markdownSourceOfTruth
        featureFlags={PAPYRA_LOCKED_FEATURE_FLAGS}
      />
    );
  },
);

PapyraEditor.displayName = "PapyraEditor";
