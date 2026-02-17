import { useEffect, useRef, type CSSProperties } from "react";
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  StrikethroughIcon,
  UnderlineIcon,
  UnlinkIcon,
} from "./icons";
import { IconButton } from "./ui";

export function FloatingToolbar(props: any) {
  const {
    isVisible,
    selectionRect,
    commands,
    activeStates,
    editorTheme = "light",
    hide,
  } = props;
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (toolbarRef.current?.contains(target)) return;
      hide?.();
    };

    document.addEventListener("mousedown", handlePointerDown, true);
    document.addEventListener("touchstart", handlePointerDown, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown, true);
      document.removeEventListener("touchstart", handlePointerDown, true);
    };
  }, [isVisible, hide]);

  if (!isVisible || !selectionRect) return null;

  const style: CSSProperties = {
    position: "absolute",
    top: selectionRect.y,
    left: selectionRect.positionFromRight ? "auto" : selectionRect.x,
    right: selectionRect.positionFromRight ? 10 : "auto",
    zIndex: 9999,
    pointerEvents: "auto",
  };

  if (activeStates?.imageSelected) {
    return (
      <div
        className="luthor-floating-toolbar"
        data-theme={editorTheme}
        ref={toolbarRef}
        style={style}
      >
        <IconButton
          onClick={() => commands.setImageAlignment("left")}
          active={activeStates.isImageAlignedLeft}
          title="Align Left"
        >
          <AlignLeftIcon size={14} />
        </IconButton>
        <IconButton
          onClick={() => commands.setImageAlignment("center")}
          active={activeStates.isImageAlignedCenter}
          title="Align Center"
        >
          <AlignCenterIcon size={14} />
        </IconButton>
        <IconButton
          onClick={() => commands.setImageAlignment("right")}
          active={activeStates.isImageAlignedRight}
          title="Align Right"
        >
          <AlignRightIcon size={14} />
        </IconButton>
        <div className="luthor-floating-toolbar-separator" />
        <IconButton
          onClick={() => commands.setImageCaption(prompt("Enter caption:") || "")}
          title="Edit Caption"
        >
          <QuoteIcon size={14} />
        </IconButton>
      </div>
    );
  }

  return (
    <div
      className="luthor-floating-toolbar"
      data-theme={editorTheme}
      ref={toolbarRef}
      style={style}
    >
      <IconButton onClick={() => commands.toggleBold()} active={activeStates.bold} title="Bold">
        <BoldIcon size={14} />
      </IconButton>
      <IconButton onClick={() => commands.toggleItalic()} active={activeStates.italic} title="Italic">
        <ItalicIcon size={14} />
      </IconButton>
      <IconButton onClick={() => commands.toggleUnderline()} active={activeStates.underline} title="Underline">
        <UnderlineIcon size={14} />
      </IconButton>
      <IconButton
        onClick={() => commands.toggleStrikethrough()}
        active={activeStates.strikethrough}
        title="Strikethrough"
      >
        <StrikethroughIcon size={14} />
      </IconButton>
      <div className="luthor-floating-toolbar-separator" />
      <IconButton onClick={() => commands.formatText("code")} active={activeStates.code} title="Inline Code">
        <CodeIcon size={14} />
      </IconButton>
      <IconButton onClick={() => commands.toggleQuote()} active={activeStates.isQuote} title="Quote">
        <QuoteIcon size={14} />
      </IconButton>
      <IconButton
        onClick={() => (activeStates.isLink ? commands.removeLink() : commands.insertLink())}
        active={activeStates.isLink}
        title={activeStates.isLink ? "Remove Link" : "Insert Link"}
      >
        {activeStates.isLink ? <UnlinkIcon size={14} /> : <LinkIcon size={14} />}
      </IconButton>
      <div className="luthor-floating-toolbar-separator" />
      <IconButton
        onClick={() => commands.toggleUnorderedList()}
        active={activeStates.unorderedList}
        title="Bullet List"
      >
        <ListIcon size={14} />
      </IconButton>
      <IconButton
        onClick={() => commands.toggleOrderedList()}
        active={activeStates.orderedList}
        title="Numbered List"
      >
        <ListOrderedIcon size={14} />
      </IconButton>
    </div>
  );
}
