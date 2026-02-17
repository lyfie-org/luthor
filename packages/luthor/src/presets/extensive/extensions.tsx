import React from "react";
import {
  ALL_MARKDOWN_TRANSFORMERS,
  MarkdownExtension,
  TableExtension,
  HTMLEmbedExtension,
  ImageExtension,
  FloatingToolbarExtension,
  ContextMenuExtension,
  CommandPaletteExtension,
  DraggableBlockExtension,
  LinkExtension,
  boldExtension,
  italicExtension,
  underlineExtension,
  strikethroughExtension,
  horizontalRuleExtension,
  listExtension,
  historyExtension,
  blockFormatExtension,
  htmlExtension,
  codeExtension,
  codeFormatExtension,
} from "@lyfie/luthor-headless";
import { FloatingToolbar } from "./components/FloatingToolbar";

const markdownExt = new MarkdownExtension();
(markdownExt as any).config = {
  ...(markdownExt as any).config,
  customTransformers: ALL_MARKDOWN_TRANSFORMERS,
};

export const extensiveImageExtension = new ImageExtension();
(extensiveImageExtension as any).config = {
  ...(extensiveImageExtension as any).config,
  uploadHandler: async (file: File) => URL.createObjectURL(file),
  defaultAlignment: "center",
  resizable: true,
  pasteListener: { insert: true, replace: true },
  debug: false,
};

const tableExt = new TableExtension();
(tableExt as any).config = {
  ...(tableExt as any).config,
  enableContextMenu: true,
  markdownExtension: markdownExt,
};

const htmlEmbedExt = new HTMLEmbedExtension();
(htmlEmbedExt as any).config = {
  ...(htmlEmbedExt as any).config,
  markdownExtension: markdownExt,
};

type FloatingToolbarContext = {
  commands: any;
  activeStates: any;
};

const floatingToolbarContext: FloatingToolbarContext = {
  commands: {},
  activeStates: {},
};

export function setFloatingToolbarContext(commands: any, activeStates: any) {
  floatingToolbarContext.commands = commands;
  floatingToolbarContext.activeStates = activeStates;
}

const floatingToolbarExt = new FloatingToolbarExtension();
(floatingToolbarExt as any).config = {
  ...(floatingToolbarExt as any).config,
  render: (props: any) => <FloatingToolbar {...props} />,
  getCommands: () => floatingToolbarContext.commands,
  getActiveStates: () => floatingToolbarContext.activeStates,
};

const contextMenuExt = new ContextMenuExtension();
(contextMenuExt as any).config = {
  ...(contextMenuExt as any).config,
  preventDefault: true,
};

const commandPaletteExt = new CommandPaletteExtension();

const draggableBlockExt = new DraggableBlockExtension();
(draggableBlockExt as any).config = {
  ...(draggableBlockExt as any).config,
  showMoveButtons: true,
  showUpButton: true,
  showDownButton: true,
  buttonStackPosition: "left",
};

const linkExt = new LinkExtension();
(linkExt as any).config = {
  ...(linkExt as any).config,
  linkSelectedTextOnPaste: true,
  autoLinkText: true,
  autoLinkUrls: true,
};

export const extensiveExtensions = [
  boldExtension,
  italicExtension,
  underlineExtension,
  strikethroughExtension,
  linkExt,
  horizontalRuleExtension,
  tableExt,
  listExtension,
  historyExtension,
  extensiveImageExtension,
  blockFormatExtension,
  htmlExtension,
  markdownExt,
  codeExtension,
  codeFormatExtension,
  htmlEmbedExt,
  floatingToolbarExt,
  contextMenuExt,
  commandPaletteExt,
  draggableBlockExt,
] as const;

export type ExtensiveExtensions = typeof extensiveExtensions;
