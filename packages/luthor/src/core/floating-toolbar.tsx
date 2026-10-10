/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListCheckIcon,
  ListOrderedIcon,
  QuoteIcon,
  StrikethroughIcon,
  TrashIcon,
  UnderlineIcon,
  UnlinkIcon,
} from "./icons";
import { IconButton } from "./ui";
import { getOverlayThemeStyleFromElement } from "./overlay-theme";
import { resolveVisibleBounds } from "./overlay-position";
import type { CoreEditorActiveStates, CoreEditorCommands, CoreTheme } from "./types";

type FloatingSelectionRect = {
  y: number;
  x: number;
  /** The selection's (or selected node's) top/bottom, in the bar's own coordinate space. */
  top?: number;
  bottom?: number;
  positionFromRight?: boolean;
};

/** Space kept between the bar and the edge of what can be seen. */
const VISIBLE_MARGIN_PX = 12;
/** Space between the bar and the thing it belongs to. */
const ANCHOR_GAP_PX = 8;

/**
 * Where the bar should sit, given where it was placed and what can be seen.
 * The placement only guesses the bar's height and only knows the window, so a
 * tall bar (a web page's URL and caption fields) under a map at the foot of a
 * scrolling note was cut off by the note's own edge. Measured here instead:
 * keep it where it is if it is fully visible, else try the other side of its
 * anchor, else pin it inside the visible area (over the media) — never hidden.
 */
export function resolveFloatingToolbarTop({
  naturalTop,
  height,
  anchorTop,
  anchorBottom,
  visibleTop,
  visibleBottom,
}: {
  naturalTop: number;
  height: number;
  anchorTop?: number;
  anchorBottom?: number;
  visibleTop: number;
  visibleBottom: number;
}): number {
  const min = visibleTop + VISIBLE_MARGIN_PX;
  const max = visibleBottom - VISIBLE_MARGIN_PX - height;
  const fits = (top: number) => top >= min - 0.5 && top <= max + 0.5;
  const hasAnchor = anchorTop !== undefined && anchorBottom !== undefined;
  // The placement guessed the bar's height, so "above" can still reach down
  // over the very thing it belongs to.
  const covers = (top: number) => hasAnchor && top + height > anchorTop! + 1 && top < anchorBottom! - 1;
  if (fits(naturalTop) && !covers(naturalTop)) return naturalTop;
  if (hasAnchor) {
    const above = anchorTop! - ANCHOR_GAP_PX - height;
    const below = anchorBottom! + ANCHOR_GAP_PX;
    const wasAbove = naturalTop < anchorTop!;
    for (const candidate of wasAbove ? [above, below] : [below, above]) {
      if (fits(candidate)) return candidate;
    }
  }
  // Taller than the room on either side: overlap the media, inside the view.
  return max < min ? min : Math.min(Math.max(naturalTop, min), max);
}

export interface FloatingToolbarProps {
  isVisible: boolean;
  selectionRect?: FloatingSelectionRect;
  commands: CoreEditorCommands;
  activeStates: CoreEditorActiveStates;
  editorTheme?: CoreTheme;
  hide?: () => void;
  isFeatureEnabled?: (feature: string) => boolean;
  /** The editor the toolbar belongs to (clicks inside it never dismiss the bar). */
  editor?: { getRootElement(): HTMLElement | null };
  /** The text selection, when there is one; `null` for a node selection. */
  selection?: object | null;
}

export function FloatingToolbar({
  isVisible,
  selectionRect,
  commands,
  activeStates,
  editorTheme = "light",
  hide,
  isFeatureEnabled = () => true,
  editor,
  selection,
}: FloatingToolbarProps) {
  const edgeInsetPx = 20;

  const toolbarRef = useRef<HTMLDivElement>(null);
  // Horizontal correction measured from the rendered bar, so a wide bar near a
  // viewport edge is pulled back in (no guessed widths).
  const [shiftX, setShiftX] = useState(0);
  const shiftRef = useRef(0);
  // …and vertically, against what can actually be seen (see resolveFloatingToolbarTop).
  const [shiftY, setShiftY] = useState(0);
  const shiftYRef = useRef(0);
  // Bumped on scroll/resize so the bar is re-measured where it now is.
  const [viewportTick, setViewportTick] = useState(0);
  const [iframeUrlDraft, setIframeUrlDraft] = useState("");
  const [iframeCaptionDraft, setIframeCaptionDraft] = useState("");
  const [imageCaptionDraft, setImageCaptionDraft] = useState("");
  const [youTubeCaptionDraft, setYouTubeCaptionDraft] = useState("");
  const [youTubeUrlDraft, setYouTubeUrlDraft] = useState("");
  const [cardCaptionDraft, setCardCaptionDraft] = useState("");
  const [linkUrlDraft, setLinkUrlDraft] = useState("");
  const [iframeUrlError, setIframeUrlError] = useState<string | null>(null);
  const [youTubeUrlError, setYouTubeUrlError] = useState<string | null>(null);
  const [linkUrlError, setLinkUrlError] = useState<string | null>(null);
  const iframeEmbedSelected = !!activeStates.isIframeEmbedSelected;
  const youTubeEmbedSelected = !!activeStates.isYouTubeEmbedSelected;
  const iframeEmbedEnabled = isFeatureEnabled("iframeEmbed");
  const youTubeEmbedEnabled = isFeatureEnabled("youTubeEmbed");
  const imageEnabled = isFeatureEnabled("image");
  const savedCardSelected = !!activeStates.isSavedCardSelected;
  const embedSelected =
    (iframeEmbedEnabled && iframeEmbedSelected) ||
    (youTubeEmbedEnabled && youTubeEmbedSelected);

  useEffect(() => {
    if (!isVisible) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (toolbarRef.current?.contains(target)) return;
      // Inside the editor, the selection it produces decides what shows —
      // dismissing here and re-showing a moment later made the bar blink.
      if (editor?.getRootElement()?.contains(target)) return;
      hide?.();
    };

    document.addEventListener("mousedown", handlePointerDown, true);
    document.addEventListener("touchstart", handlePointerDown, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown, true);
      document.removeEventListener("touchstart", handlePointerDown, true);
    };
  }, [isVisible, hide, editor]);

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
    if (!isVisible || !savedCardSelected || typeof commands.getSavedCardCaption !== "function") {
      return;
    }
    let disposed = false;
    void commands.getSavedCardCaption().then((caption) => {
      if (!disposed) {
        setCardCaptionDraft(caption ?? "");
      }
    });
    return () => {
      disposed = true;
    };
  }, [commands, isVisible, savedCardSelected]);

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

  useEffect(() => {
    if (!isVisible || !activeStates.isLink) {
      return;
    }

    let disposed = false;
    if (typeof commands.getCurrentLink === "function") {
      void commands.getCurrentLink().then((link) => {
        if (!disposed && link) {
          setLinkUrlDraft(link.url ?? "");
        }
      });
    }
    setLinkUrlError(null);

    return () => {
      disposed = true;
    };
  }, [activeStates.isLink, commands, isVisible]);

  useLayoutEffect(() => {
    const element = toolbarRef.current;
    if (!element || typeof window === "undefined") return;
    // Measure where the bar sits without our own correction applied, so the
    // correction can never feed back into itself.
    const applied = element.style.transform;
    element.style.transform = "";
    const rect = element.getBoundingClientRect();
    element.style.transform = applied;
    const visible = resolveVisibleBounds(element.parentElement) ?? {
      left: 0,
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
    };
    const naturalLeft = rect.left;
    const naturalRight = rect.right;
    const margin = VISIBLE_MARGIN_PX;
    let next = 0;
    if (naturalRight > visible.right - margin) next = visible.right - margin - naturalRight;
    if (naturalLeft + next < visible.left + margin) next = visible.left + margin - naturalLeft;
    if (Math.abs(next - shiftRef.current) >= 1) {
      shiftRef.current = next;
      setShiftX(next);
    }

    // The bar's `top` is selectionRect.y in its containing block, so the
    // block's own viewport offset turns the anchor's coordinates into viewport ones.
    const origin = rect.top - (selectionRect?.y ?? rect.top);
    const top = resolveFloatingToolbarTop({
      naturalTop: rect.top,
      height: rect.height,
      anchorTop: typeof selectionRect?.top === "number" ? origin + selectionRect.top : undefined,
      anchorBottom: typeof selectionRect?.bottom === "number" ? origin + selectionRect.bottom : undefined,
      visibleTop: visible.top,
      visibleBottom: visible.bottom,
    });
    const nextY = Math.round(top - rect.top);
    if (Math.abs(nextY - shiftYRef.current) >= 1) {
      shiftYRef.current = nextY;
      setShiftY(nextY);
    }
  }, [isVisible, selectionRect, activeStates, viewportTick]);

  useEffect(() => {
    if (!isVisible || typeof window === "undefined") return;
    let frame = 0;
    const onChange = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setViewportTick((n) => n + 1);
      });
    };
    window.addEventListener("scroll", onChange, true);
    window.addEventListener("resize", onChange);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onChange, true);
      window.removeEventListener("resize", onChange);
    };
  }, [isVisible]);

  if (!isVisible || !selectionRect) return null;

  const style: CSSProperties = {
    // Theme from the editor itself, not from wherever the DOM selection is
    // (a node selection has none, which used to restyle the bar mid-use).
    ...getOverlayThemeStyleFromElement(editor?.getRootElement() ?? null),
    position: "absolute",
    top: selectionRect.y,
    left: selectionRect.positionFromRight ? "auto" : selectionRect.x,
    right: selectionRect.positionFromRight ? edgeInsetPx : "auto",
    transform: shiftX || shiftY ? `translate(${shiftX}px, ${shiftY}px)` : undefined,
    maxWidth: `calc(100% - ${edgeInsetPx * 2}px)`,
    boxSizing: "border-box",
    zIndex: "var(--luthor-z-menu, 460)",
    pointerEvents: "auto",
  };

  if ((iframeEmbedSelected && !iframeEmbedEnabled) || (youTubeEmbedSelected && !youTubeEmbedEnabled)) {
    return null;
  }

  // Every embed (picture, video, web page) can be moved a block up or down and
  // removed from its own bar, not only by keyboard or drag.
  const blockTools = (
    move: ((direction: "up" | "down") => void) | undefined,
    remove: (() => void) | undefined,
  ) =>
    move || remove ? (
      <>
        <div className="luthor-floating-toolbar-separator" />
        {move ? (
          <>
            <IconButton onClick={() => move("up")} title="Move Up">
              <ArrowUpIcon size={14} />
            </IconButton>
            <IconButton onClick={() => move("down")} title="Move Down">
              <ArrowDownIcon size={14} />
            </IconButton>
          </>
        ) : null}
        {remove ? (
          <IconButton onClick={remove} title="Remove">
            <TrashIcon size={14} />
          </IconButton>
        ) : null}
      </>
    ) : null;

  // A link card (a page shown by its title, summary and picture): aligned,
  // moved, captioned and removed like any other embed.
  if (savedCardSelected && !embedSelected) {
    const canEditCaption = typeof commands.setSavedCardCaption === "function";
    const commitCardCaption = () => {
      if (canEditCaption) commands.setSavedCardCaption?.(cardCaptionDraft);
    };
    const align = commands.setSavedCardAlignment;
    return (
      <div className="luthor-floating-toolbar" data-theme={editorTheme} ref={toolbarRef} style={style}>
        {align ? (
          <>
            <IconButton onClick={() => align("left")} active={activeStates.isSavedCardAlignedLeft} title="Align Left">
              <AlignLeftIcon size={14} />
            </IconButton>
            <IconButton onClick={() => align("center")} active={activeStates.isSavedCardAlignedCenter} title="Align Center">
              <AlignCenterIcon size={14} />
            </IconButton>
            <IconButton onClick={() => align("right")} active={activeStates.isSavedCardAlignedRight} title="Align Right">
              <AlignRightIcon size={14} />
            </IconButton>
          </>
        ) : null}
        {blockTools(commands.moveSavedCard, commands.removeSavedCard)}
        {canEditCaption ? (
          <>
            <div className="luthor-floating-toolbar-separator" />
            <div className="luthor-floating-toolbar-field-row">
              <input
                type="text"
                value={cardCaptionDraft}
                className="luthor-floating-toolbar-input"
                placeholder="Add caption"
                aria-label="Card caption"
                onChange={(event) => setCardCaptionDraft(event.target.value)}
                onBlur={commitCardCaption}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitCardCaption();
                  }
                }}
              />
              <button
                type="button"
                className="luthor-toolbar-button luthor-floating-toolbar-action"
                onClick={commitCardCaption}
              >
                Update Caption
              </button>
            </div>
          </>
        ) : null}
      </div>
    );
  }

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
    const hasEmbedFields = canEditCaption || canEditEmbedUrl;

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
        {iframeEmbedSelected
          ? blockTools(commands.moveIframeEmbed, commands.removeIframeEmbed)
          : blockTools(commands.moveYouTubeEmbed, commands.removeYouTubeEmbed)}
        {hasEmbedFields ? (
          <>
            <div className="luthor-floating-toolbar-separator" />
            <div className="luthor-floating-toolbar-fields">
              {canEditEmbedUrl ? (
                <div className="luthor-floating-toolbar-field-row">
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
                        commitEmbedUrl();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="luthor-toolbar-button luthor-floating-toolbar-action luthor-floating-toolbar-action-primary"
                    onClick={commitEmbedUrl}
                  >
                    Update URL
                  </button>
                </div>
              ) : null}
              {canEditCaption ? (
                <div className="luthor-floating-toolbar-field-row">
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
                        commitEmbedCaption();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="luthor-toolbar-button luthor-floating-toolbar-action"
                    onClick={commitEmbedCaption}
                  >
                    Update Caption
                  </button>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    );
  }

  if (imageEnabled && activeStates.imageSelected) {
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
        {blockTools(commands.moveImage, commands.removeImage)}
        {canEditImageCaption ? (
          <>
            <div className="luthor-floating-toolbar-separator" />
            <div className="luthor-floating-toolbar-field-row">
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
                    commitImageCaption();
                  }
                }}
              />
              <button
                type="button"
                className="luthor-toolbar-button luthor-floating-toolbar-action"
                onClick={commitImageCaption}
              >
                Update Caption
              </button>
            </div>
          </>
        ) : null}
      </div>
    );
  }

  // The formatting bar is for text. A selected node that none of the branches
  // above owns (an attachment, a card) keeps its own controls.
  if (selection === null) {
    return null;
  }

  const canShowBold = isFeatureEnabled("bold");
  const canShowItalic = isFeatureEnabled("italic");
  const canShowUnderline = isFeatureEnabled("underline");
  const canShowStrikethrough = isFeatureEnabled("strikethrough");
  const canShowInlineCode = isFeatureEnabled("codeFormat");
  const isSelectionInList = !!(activeStates.unorderedList || activeStates.orderedList || activeStates.checkList);
  const canShowQuote = isFeatureEnabled("blockFormat") && !isSelectionInList;
  const canShowLink = isFeatureEnabled("link");
  const canShowList = isFeatureEnabled("list") && !isSelectionInList;
  const showFormattingGroup = canShowBold || canShowItalic || canShowUnderline || canShowStrikethrough;
  const showBlockGroup = canShowInlineCode || canShowQuote || canShowLink;
  const showListGroup = canShowList;

  const canEditSelectedLink =
    !!activeStates.isLink &&
    typeof commands.updateLink === "function" &&
    typeof commands.removeLink === "function";
  const commitLinkUrl = () => {
    if (!canEditSelectedLink) {
      return;
    }
    const updated = commands.updateLink?.(linkUrlDraft) ?? false;
    if (!updated) {
      setLinkUrlError("Enter a valid URL");
      if (typeof commands.getCurrentLink === "function") {
        void commands.getCurrentLink().then((link) => {
          setLinkUrlDraft(link?.url ?? "");
        });
      }
      return;
    }
    setLinkUrlError(null);
  };

  if (!showFormattingGroup && !showBlockGroup && !showListGroup) {
    return null;
  }

  return (
    <div className="luthor-floating-toolbar" data-theme={editorTheme} ref={toolbarRef} style={style}>
      {showFormattingGroup ? (
        <>
          {canShowBold ? (
            <IconButton onClick={() => commands.toggleBold()} active={activeStates.bold} title="Bold">
              <BoldIcon size={14} />
            </IconButton>
          ) : null}
          {canShowItalic ? (
            <IconButton onClick={() => commands.toggleItalic()} active={activeStates.italic} title="Italic">
              <ItalicIcon size={14} />
            </IconButton>
          ) : null}
          {canShowUnderline ? (
            <IconButton onClick={() => commands.toggleUnderline()} active={activeStates.underline} title="Underline">
              <UnderlineIcon size={14} />
            </IconButton>
          ) : null}
          {canShowStrikethrough ? (
            <IconButton onClick={() => commands.toggleStrikethrough()} active={activeStates.strikethrough} title="Strikethrough">
              <StrikethroughIcon size={14} />
            </IconButton>
          ) : null}
        </>
      ) : null}
      {showFormattingGroup && showBlockGroup ? <div className="luthor-floating-toolbar-separator" /> : null}
      {showBlockGroup ? (
        <>
          {canShowInlineCode ? (
            <IconButton onClick={() => commands.formatText("code")} active={activeStates.code} title="Inline Code">
              <CodeIcon size={14} />
            </IconButton>
          ) : null}
          {canShowQuote ? (
            <IconButton onClick={() => commands.toggleQuote()} active={activeStates.isQuote} title="Quote">
              <QuoteIcon size={14} />
            </IconButton>
          ) : null}
          {canShowLink ? (
            <>
              <IconButton
                onClick={() => (activeStates.isLink ? commands.removeLink() : commands.insertLink())}
                active={activeStates.isLink}
                title={activeStates.isLink ? "Remove Link" : "Insert Link"}
              >
                {activeStates.isLink ? <UnlinkIcon size={14} /> : <LinkIcon size={14} />}
              </IconButton>
              {canEditSelectedLink ? (
                <div className="luthor-floating-toolbar-field-row">
                  <input
                    type="url"
                    value={linkUrlDraft}
                    className={`luthor-floating-toolbar-input${linkUrlError ? " is-error" : ""}`}
                    placeholder="https://example.com"
                    aria-label="Link URL"
                    aria-invalid={linkUrlError ? true : undefined}
                    onChange={(event) => {
                      setLinkUrlDraft(event.target.value);
                      if (linkUrlError) {
                        setLinkUrlError(null);
                      }
                    }}
                    onBlur={commitLinkUrl}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        commitLinkUrl();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="luthor-toolbar-button luthor-floating-toolbar-action luthor-floating-toolbar-action-primary"
                    onClick={commitLinkUrl}
                  >
                    Update Link
                  </button>
                  <button
                    type="button"
                    className="luthor-toolbar-button luthor-floating-toolbar-action luthor-floating-toolbar-action-danger"
                    onClick={() => commands.removeLink()}
                    aria-label="Unlink"
                  >
                    <UnlinkIcon size={13} />
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
      {(showFormattingGroup || showBlockGroup) && showListGroup ? <div className="luthor-floating-toolbar-separator" /> : null}
      {showListGroup ? (
        <>
          <IconButton onClick={() => commands.toggleUnorderedList()} active={activeStates.unorderedList} title="Bullet List">
            <ListIcon size={14} />
          </IconButton>
          <IconButton onClick={() => commands.toggleOrderedList()} active={activeStates.orderedList} title="Numbered List">
            <ListOrderedIcon size={14} />
          </IconButton>
          <IconButton onClick={() => commands.toggleCheckList()} active={activeStates.checkList} title="Checklist">
            <ListCheckIcon size={14} />
          </IconButton>
        </>
      ) : null}
    </div>
  );
}
