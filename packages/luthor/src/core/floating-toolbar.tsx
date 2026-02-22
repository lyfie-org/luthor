import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListCheckIcon,
  ListOrderedIcon,
  QuoteIcon,
  StrikethroughIcon,
  UnderlineIcon,
  UnlinkIcon,
} from "./icons";
import { IconButton } from "./ui";
import type { CoreEditorActiveStates, CoreEditorCommands, CoreTheme } from "./types";

type FloatingSelectionRect = {
  y: number;
  x: number;
  positionFromRight?: boolean;
};

export interface FloatingToolbarProps {
  isVisible: boolean;
  selectionRect?: FloatingSelectionRect;
  commands: CoreEditorCommands;
  activeStates: CoreEditorActiveStates;
  editorTheme?: CoreTheme;
  hide?: () => void;
}

export function FloatingToolbar({
  isVisible,
  selectionRect,
  commands,
  activeStates,
  editorTheme = "light",
  hide,
}: FloatingToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [iframeUrlDraft, setIframeUrlDraft] = useState("");
  const [iframeCaptionDraft, setIframeCaptionDraft] = useState("");
  const [imageCaptionDraft, setImageCaptionDraft] = useState("");
  const [youTubeCaptionDraft, setYouTubeCaptionDraft] = useState("");
  const [youTubeUrlDraft, setYouTubeUrlDraft] = useState("");
  const [iframeUrlError, setIframeUrlError] = useState<string | null>(null);
  const [youTubeUrlError, setYouTubeUrlError] = useState<string | null>(null);
  const iframeEmbedSelected = !!activeStates.isIframeEmbedSelected;
  const youTubeEmbedSelected = !!activeStates.isYouTubeEmbedSelected;
  const embedSelected = iframeEmbedSelected || youTubeEmbedSelected;

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

  useEffect(() => {
    if (!isVisible || !iframeEmbedSelected) {
      return;
    }

    let disposed = false;
    if (typeof commands.getIframeEmbedCaption === "function") {
      void commands.getIframeEmbedCaption().then((caption) => {
        if (!disposed) {
          setIframeCaptionDraft(caption ?? "");
        }
      });
    }
    if (typeof commands.getIframeEmbedUrl === "function") {
      void commands.getIframeEmbedUrl().then((url) => {
        if (!disposed) {
          setIframeUrlDraft(url ?? "");
        }
      });
    }
    setIframeUrlError(null);

    return () => {
      disposed = true;
    };
  }, [commands, iframeEmbedSelected, isVisible]);

  useEffect(() => {
    if (!isVisible || !activeStates.imageSelected) {
      return;
    }

    let disposed = false;
    if (typeof commands.getImageCaption === "function") {
      void commands.getImageCaption().then((caption) => {
        if (!disposed) {
          setImageCaptionDraft(caption ?? "");
        }
      });
    }

    return () => {
      disposed = true;
    };
  }, [activeStates.imageSelected, commands, isVisible]);

  useEffect(() => {
    if (!isVisible || !youTubeEmbedSelected) {
      return;
    }

    let disposed = false;
    if (typeof commands.getYouTubeEmbedCaption === "function") {
      void commands.getYouTubeEmbedCaption().then((caption) => {
        if (!disposed) {
          setYouTubeCaptionDraft(caption ?? "");
        }
      });
    }
    if (typeof commands.getYouTubeEmbedUrl === "function") {
      void commands.getYouTubeEmbedUrl().then((url) => {
        if (!disposed) {
          setYouTubeUrlDraft(url ?? "");
        }
      });
    }
    setYouTubeUrlError(null);

    return () => {
      disposed = true;
    };
  }, [commands, isVisible, youTubeEmbedSelected]);

  if (!isVisible || !selectionRect) return null;

  const style: CSSProperties = {
    position: "absolute",
    top: selectionRect.y,
    left: selectionRect.positionFromRight ? "auto" : selectionRect.x,
    right: selectionRect.positionFromRight ? 10 : "auto",
    zIndex: 9999,
    pointerEvents: "auto",
  };

  if (embedSelected) {
    const setAlignment = (alignment: "left" | "center" | "right") => {
      if (iframeEmbedSelected) {
        commands.setIframeEmbedAlignment?.(alignment);
        return;
      }

      if (youTubeEmbedSelected) {
        commands.setYouTubeEmbedAlignment?.(alignment);
      }
    };

    const isLeftAligned = iframeEmbedSelected
      ? activeStates.isIframeEmbedAlignedLeft
      : activeStates.isYouTubeEmbedAlignedLeft;
    const isCenterAligned = iframeEmbedSelected
      ? activeStates.isIframeEmbedAlignedCenter
      : activeStates.isYouTubeEmbedAlignedCenter;
    const isRightAligned = iframeEmbedSelected
      ? activeStates.isIframeEmbedAlignedRight
      : activeStates.isYouTubeEmbedAlignedRight;

    const canEditCaption = iframeEmbedSelected
      ? typeof commands.setIframeEmbedCaption === "function"
      : typeof commands.setYouTubeEmbedCaption === "function";
    const canEditEmbedUrl = iframeEmbedSelected
      ? typeof commands.updateIframeEmbedUrl === "function"
      : typeof commands.updateYouTubeEmbedUrl === "function";
    const captionDraft = iframeEmbedSelected ? iframeCaptionDraft : youTubeCaptionDraft;
    const setCaptionDraft = iframeEmbedSelected ? setIframeCaptionDraft : setYouTubeCaptionDraft;
    const urlDraft = iframeEmbedSelected ? iframeUrlDraft : youTubeUrlDraft;
    const urlError = iframeEmbedSelected ? iframeUrlError : youTubeUrlError;
    const commitEmbedCaption = () => {
      if (!canEditCaption) {
        return;
      }
      if (iframeEmbedSelected) {
        commands.setIframeEmbedCaption?.(iframeCaptionDraft);
        return;
      }
      commands.setYouTubeEmbedCaption?.(youTubeCaptionDraft);
    };
    const setEmbedUrlError = (value: string | null) => {
      if (iframeEmbedSelected) {
        setIframeUrlError(value);
      } else {
        setYouTubeUrlError(value);
      }
    };
    const setEmbedUrlDraft = (value: string) => {
      if (iframeEmbedSelected) {
        setIframeUrlDraft(value);
      } else {
        setYouTubeUrlDraft(value);
      }
    };
    const commitEmbedUrl = () => {
      if (!canEditEmbedUrl) {
        return;
      }
      const updated = iframeEmbedSelected
        ? (commands.updateIframeEmbedUrl?.(iframeUrlDraft) ?? false)
        : (commands.updateYouTubeEmbedUrl?.(youTubeUrlDraft) ?? false);
      if (!updated) {
        setEmbedUrlError(
          iframeEmbedSelected ? "Enter a valid http(s) URL" : "Enter a valid YouTube URL",
        );
        if (iframeEmbedSelected && typeof commands.getIframeEmbedUrl === "function") {
          void commands.getIframeEmbedUrl().then((url) => setIframeUrlDraft(url ?? ""));
        } else if (!iframeEmbedSelected && typeof commands.getYouTubeEmbedUrl === "function") {
          void commands.getYouTubeEmbedUrl().then((url) => setYouTubeUrlDraft(url ?? ""));
        }
        return;
      }
      setEmbedUrlError(null);
    };

    return (
      <div className="luthor-floating-toolbar" data-theme={editorTheme} ref={toolbarRef} style={style}>
        <IconButton onClick={() => setAlignment("left")} active={isLeftAligned} title="Align Left">
          <AlignLeftIcon size={14} />
        </IconButton>
        <IconButton onClick={() => setAlignment("center")} active={isCenterAligned} title="Align Center">
          <AlignCenterIcon size={14} />
        </IconButton>
        <IconButton onClick={() => setAlignment("right")} active={isRightAligned} title="Align Right">
          <AlignRightIcon size={14} />
        </IconButton>
        {canEditCaption || canEditEmbedUrl ? (
          <>
            <div className="luthor-floating-toolbar-separator" />
            <div className="luthor-floating-toolbar-fields">
              {canEditEmbedUrl ? (
                <input
                  type="url"
                  value={urlDraft}
                  className={`luthor-floating-toolbar-input${urlError ? " is-error" : ""}`}
                  placeholder={iframeEmbedSelected ? "https://example.com/embed" : "https://youtube.com/watch?v=..."}
                  aria-label={iframeEmbedSelected ? "Iframe URL" : "YouTube URL"}
                  aria-invalid={urlError ? true : undefined}
                  onChange={(event) => {
                    setEmbedUrlDraft(event.target.value);
                    if (urlError) {
                      setEmbedUrlError(null);
                    }
                  }}
                  onBlur={commitEmbedUrl}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      (event.target as HTMLInputElement).blur();
                    }
                  }}
                />
              ) : null}
              <input
                type="text"
                value={captionDraft}
                className="luthor-floating-toolbar-input"
                placeholder="Add caption"
                aria-label={iframeEmbedSelected ? "Iframe caption" : "YouTube caption"}
                onChange={(event) => setCaptionDraft(event.target.value)}
                onBlur={commitEmbedCaption}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    (event.target as HTMLInputElement).blur();
                  }
                }}
              />
            </div>
          </>
        ) : null}
      </div>
    );
  }

  if (activeStates.imageSelected) {
    const canEditImageCaption = typeof commands.setImageCaption === "function";
    const commitImageCaption = () => {
      if (!canEditImageCaption) {
        return;
      }
      commands.setImageCaption(imageCaptionDraft);
    };

    return (
      <div className="luthor-floating-toolbar" data-theme={editorTheme} ref={toolbarRef} style={style}>
        <IconButton onClick={() => commands.setImageAlignment("left")} active={activeStates.isImageAlignedLeft} title="Align Left">
          <AlignLeftIcon size={14} />
        </IconButton>
        <IconButton onClick={() => commands.setImageAlignment("center")} active={activeStates.isImageAlignedCenter} title="Align Center">
          <AlignCenterIcon size={14} />
        </IconButton>
        <IconButton onClick={() => commands.setImageAlignment("right")} active={activeStates.isImageAlignedRight} title="Align Right">
          <AlignRightIcon size={14} />
        </IconButton>
        {canEditImageCaption ? (
          <>
            <div className="luthor-floating-toolbar-separator" />
            <input
              type="text"
              value={imageCaptionDraft}
              className="luthor-floating-toolbar-input"
              placeholder="Add caption"
              aria-label="Image caption"
              onChange={(event) => setImageCaptionDraft(event.target.value)}
              onBlur={commitImageCaption}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  (event.target as HTMLInputElement).blur();
                }
              }}
            />
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="luthor-floating-toolbar" data-theme={editorTheme} ref={toolbarRef} style={style}>
      <IconButton onClick={() => commands.toggleBold()} active={activeStates.bold} title="Bold">
        <BoldIcon size={14} />
      </IconButton>
      <IconButton onClick={() => commands.toggleItalic()} active={activeStates.italic} title="Italic">
        <ItalicIcon size={14} />
      </IconButton>
      <IconButton onClick={() => commands.toggleUnderline()} active={activeStates.underline} title="Underline">
        <UnderlineIcon size={14} />
      </IconButton>
      <IconButton onClick={() => commands.toggleStrikethrough()} active={activeStates.strikethrough} title="Strikethrough">
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
      <IconButton onClick={() => commands.toggleUnorderedList()} active={activeStates.unorderedList} title="Bullet List">
        <ListIcon size={14} />
      </IconButton>
      <IconButton onClick={() => commands.toggleOrderedList()} active={activeStates.orderedList} title="Numbered List">
        <ListOrderedIcon size={14} />
      </IconButton>
      <IconButton onClick={() => commands.toggleCheckList()} active={activeStates.checkList} title="Checklist">
        <ListCheckIcon size={14} />
      </IconButton>
    </div>
  );
}
