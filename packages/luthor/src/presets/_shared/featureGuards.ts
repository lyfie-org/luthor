/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import type { CoreEditorCommands } from "../../core";
import type {
  FeatureFlagsLike,
  FeatureShortcutSpec,
  ToolbarFeatureMap,
  ToolbarVisibility,
} from "./types";

export function isEditableCommandTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  if (target.closest('[contenteditable="true"]')) {
    return true;
  }

  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select";
}

export function isShortcutMatch<TFeature extends string>(
  event: KeyboardEvent,
  shortcut: FeatureShortcutSpec<TFeature>,
): boolean {
  if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
    return false;
  }

  const hasPrimaryModifier = event.ctrlKey || event.metaKey;
  if (!!shortcut.requiresPrimary !== hasPrimaryModifier) {
    return false;
  }

  if (!!shortcut.shift !== !!event.shiftKey) {
    return false;
  }

  if (!!shortcut.alt !== !!event.altKey) {
    return false;
  }

  return true;
}

export function mergeToolbarVisibilityWithFeatures<TFeature extends string>(
  toolbarVisibility: ToolbarVisibility | undefined,
  featureFlags: FeatureFlagsLike<TFeature>,
  toolbarFeatureMap: ToolbarFeatureMap<TFeature>,
): ToolbarVisibility {
  const merged: ToolbarVisibility = { ...(toolbarVisibility ?? {}) };

  for (const [itemType, featureSelection] of Object.entries(toolbarFeatureMap) as Array<
    [keyof ToolbarVisibility, TFeature | readonly TFeature[]]
  >) {
    const requiredFeatures: readonly TFeature[] = Array.isArray(featureSelection)
      ? featureSelection
      : [featureSelection];
    const supported = requiredFeatures.some((feature) => featureFlags[feature] !== false);
    if (!supported) {
      merged[itemType] = false;
    }
  }

  return merged;
}

export function createFeatureGuardedCommands<TFeature extends string>(
  commands: CoreEditorCommands,
  featureFlags: FeatureFlagsLike<TFeature>,
  isInCodeBlock: boolean,
): CoreEditorCommands {
  const guarded = { ...commands } as CoreEditorCommands;
  const disable = (feature: TFeature, apply: () => void) => {
    if (featureFlags[feature] === false) {
      apply();
    }
  };

  disable("bold" as TFeature, () => {
    guarded.toggleBold = () => {};
  });
  disable("italic" as TFeature, () => {
    guarded.toggleItalic = () => {};
  });
  disable("underline" as TFeature, () => {
    guarded.toggleUnderline = () => {};
  });
  disable("strikethrough" as TFeature, () => {
    guarded.toggleStrikethrough = () => {};
  });
  disable("codeFormat" as TFeature, () => {
    guarded.formatText = () => {};
  });
  disable("fontFamily" as TFeature, () => {
    guarded.setFontFamily = () => {};
    guarded.clearFontFamily = () => {};
  });
  disable("fontSize" as TFeature, () => {
    guarded.setFontSize = () => {};
    guarded.clearFontSize = () => {};
  });
  disable("lineHeight" as TFeature, () => {
    guarded.setLineHeight = () => {};
    guarded.clearLineHeight = () => {};
  });
  disable("textColor" as TFeature, () => {
    guarded.setTextColor = () => {};
    guarded.clearTextColor = () => {};
  });
  disable("textHighlight" as TFeature, () => {
    guarded.setTextHighlight = () => {};
    guarded.clearTextHighlight = () => {};
  });
  disable("subscript" as TFeature, () => {
    guarded.toggleSubscript = () => {};
  });
  disable("superscript" as TFeature, () => {
    guarded.toggleSuperscript = () => {};
  });
  disable("link" as TFeature, () => {
    guarded.insertLink = () => {};
    guarded.removeLink = () => {};
    guarded.updateLink = () => false;
    guarded.getCurrentLink = async () => null;
    guarded.getLinkByKey = async () => null;
    guarded.updateLinkByKey = () => false;
    guarded.removeLinkByKey = () => false;
  });
  disable("blockFormat" as TFeature, () => {
    guarded.toggleParagraph = () => {};
    guarded.toggleHeading = () => {};
    guarded.toggleQuote = () => {};
    guarded.setTextAlignment = () => {};
  });
  disable("code" as TFeature, () => {
    guarded.toggleCodeBlock = () => {};
  });
  disable("codeIntelligence" as TFeature, () => {
    guarded.setCodeLanguage = () => {};
    guarded.autoDetectCodeLanguage = async () => null;
    guarded.copySelectedCodeBlock = async () => false;
  });
  disable("list" as TFeature, () => {
    guarded.toggleUnorderedList = () => {};
    guarded.toggleOrderedList = () => {};
    guarded.toggleCheckList = () => {};
    guarded.indentList = () => {};
    guarded.outdentList = () => {};
  });
  disable("horizontalRule" as TFeature, () => {
    guarded.insertHorizontalRule = () => {};
  });
  disable("table" as TFeature, () => {
    guarded.insertTable = () => {};
  });
  disable("image" as TFeature, () => {
    guarded.insertImage = () => {};
    guarded.setImageAlignment = () => {};
    guarded.setImageCaption = () => {};
    guarded.getImageCaption = async () => "";
  });
  disable("emoji" as TFeature, () => {
    guarded.insertEmoji = () => {};
    guarded.executeEmojiSuggestion = () => false;
    guarded.closeEmojiSuggestions = () => {};
    guarded.getEmojiSuggestions = () => [];
    guarded.getEmojiCatalog = () => [];
    guarded.resolveEmojiShortcode = () => null;
    guarded.setEmojiCatalog = () => {};
    guarded.setEmojiCatalogAdapter = () => {};
    guarded.getEmojiCatalogAdapter = () => ({
      search: () => [],
      resolveShortcode: () => null,
      getAll: () => [],
    });
  });
  disable("iframeEmbed" as TFeature, () => {
    guarded.insertIframeEmbed = () => {};
    guarded.setIframeEmbedAlignment = () => {};
    guarded.resizeIframeEmbed = () => {};
    guarded.setIframeEmbedCaption = () => {};
    guarded.getIframeEmbedCaption = async () => "";
    guarded.updateIframeEmbedUrl = () => false;
    guarded.getIframeEmbedUrl = async () => "";
  });
  disable("youTubeEmbed" as TFeature, () => {
    guarded.insertYouTubeEmbed = () => {};
    guarded.setYouTubeEmbedAlignment = () => {};
    guarded.resizeYouTubeEmbed = () => {};
    guarded.setYouTubeEmbedCaption = () => {};
    guarded.getYouTubeEmbedCaption = async () => "";
    guarded.updateYouTubeEmbedUrl = () => false;
    guarded.getYouTubeEmbedUrl = async () => "";
  });
  disable("history" as TFeature, () => {
    guarded.undo = () => {};
    guarded.redo = () => {};
  });
  disable("commandPalette" as TFeature, () => {
    guarded.showCommandPalette = () => {};
    guarded.hideCommandPalette = () => {};
    guarded.registerCommand = () => {};
    guarded.unregisterCommand = () => {};
  });
  disable("slashCommand" as TFeature, () => {
    guarded.registerSlashCommand = () => {};
    guarded.unregisterSlashCommand = () => {};
    guarded.setSlashCommands = () => {};
    guarded.closeSlashMenu = () => {};
    guarded.executeSlashCommand = () => false;
  });

  if (isInCodeBlock) {
    guarded.toggleBold = () => {};
    guarded.toggleItalic = () => {};
    guarded.toggleUnderline = () => {};
    guarded.toggleStrikethrough = () => {};
    guarded.formatText = () => {};
    guarded.setFontFamily = () => {};
    guarded.clearFontFamily = () => {};
    guarded.setFontSize = () => {};
    guarded.clearFontSize = () => {};
    guarded.setLineHeight = () => {};
    guarded.clearLineHeight = () => {};
    guarded.setTextColor = () => {};
    guarded.clearTextColor = () => {};
    guarded.setTextHighlight = () => {};
    guarded.clearTextHighlight = () => {};
    guarded.toggleSubscript = () => {};
    guarded.toggleSuperscript = () => {};
    guarded.insertLink = () => {};
    guarded.removeLink = () => {};
    guarded.updateLink = () => false;
    guarded.toggleParagraph = () => {};
    guarded.toggleHeading = () => {};
    guarded.toggleQuote = () => {};
    guarded.setTextAlignment = () => {};
    guarded.toggleUnorderedList = () => {};
    guarded.toggleOrderedList = () => {};
    guarded.toggleCheckList = () => {};
    guarded.indentList = () => {};
    guarded.outdentList = () => {};
    guarded.insertHorizontalRule = () => {};
    guarded.insertTable = () => {};
    guarded.insertImage = () => {};
    guarded.setImageAlignment = () => {};
    guarded.setImageCaption = () => {};
    guarded.insertIframeEmbed = () => {};
    guarded.setIframeEmbedAlignment = () => {};
    guarded.resizeIframeEmbed = () => {};
    guarded.setIframeEmbedCaption = () => {};
    guarded.updateIframeEmbedUrl = () => false;
    guarded.insertYouTubeEmbed = () => {};
    guarded.setYouTubeEmbedAlignment = () => {};
    guarded.resizeYouTubeEmbed = () => {};
    guarded.setYouTubeEmbedCaption = () => {};
    guarded.updateYouTubeEmbedUrl = () => false;
  }

  return guarded;
}
