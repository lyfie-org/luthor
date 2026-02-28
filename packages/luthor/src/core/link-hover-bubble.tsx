import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { resolveLinkNodeKeyFromAnchor, type LexicalEditor } from "@lyfie/luthor-headless";
import { UnlinkIcon } from "./icons";
import { getOverlayThemeStyleFromElement } from "./overlay-theme";
import type { CoreEditorCommands, CoreTheme } from "./types";

type HoveredLinkState = {
  nodeKey: string;
  url: string;
  anchorEl: HTMLAnchorElement;
};

type LinkBubblePosition = {
  top: number;
  left: number;
};

export interface LinkHoverBubbleProps {
  editor: LexicalEditor | null;
  commands: CoreEditorCommands;
  editorTheme?: CoreTheme;
  disabled?: boolean;
}

const HIDE_DELAY_MS = 120;
const DEFAULT_MAX_LINK_LENGTH = 58;

function truncateUrl(url: string, maxLength = DEFAULT_MAX_LINK_LENGTH): string {
  if (url.length <= maxLength) {
    return url;
  }
  return `${url.slice(0, maxLength - 3)}...`;
}

function hasExpandedSelection(): boolean {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return false;
  }
  return !selection.getRangeAt(0).collapsed;
}

function getLinkFromTarget(target: EventTarget | null, root: HTMLElement): HTMLAnchorElement | null {
  if (!(target instanceof Element)) {
    return null;
  }

  const link = target.closest("a");
  if (!(link instanceof HTMLAnchorElement)) {
    return null;
  }

  if (!root.contains(link)) {
    return null;
  }

  return link;
}

export function LinkHoverBubble({
  editor,
  commands,
  editorTheme = "light",
  disabled = false,
}: LinkHoverBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const portalContainerRef = useRef<HTMLElement | null>(null);
  const repositionRafRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const [hoveredLink, setHoveredLink] = useState<HoveredLinkState | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftUrl, setDraftUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [position, setPosition] = useState<LinkBubblePosition | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const hideBubble = useCallback(() => {
    clearHideTimeout();
    setHoveredLink(null);
    setIsEditing(false);
    setDraftUrl("");
    setUrlError(null);
    setPosition(null);
  }, [clearHideTimeout]);

  const scheduleHide = useCallback(() => {
    clearHideTimeout();
    hideTimeoutRef.current = window.setTimeout(() => {
      hideBubble();
    }, HIDE_DELAY_MS);
  }, [clearHideTimeout, hideBubble]);

  const updatePosition = useCallback((anchorEl: HTMLAnchorElement, container: HTMLElement | null) => {
    const rect = anchorEl.getBoundingClientRect();
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const nextTop = rect.bottom - containerRect.top + 8;
      const rawLeft = rect.left - containerRect.left;
      const maxLeft = Math.max(10, containerRect.width - 340);
      const nextLeft = Math.max(10, Math.min(rawLeft, maxLeft));
      setPosition({ top: nextTop, left: nextLeft });
      return;
    }

    const nextTop = rect.bottom + 8;
    const nextLeft = Math.max(10, Math.min(rect.left, window.innerWidth - 340));
    setPosition({ top: nextTop, left: nextLeft });
  }, []);

  const syncLinkByKey = useCallback((nodeKey: string, fallbackUrl: string) => {
    if (typeof commands.getLinkByKey !== "function") {
      setHoveredLink((current) => {
        if (!current || current.nodeKey !== nodeKey) {
          return current;
        }
        return { ...current, url: fallbackUrl };
      });
      return;
    }

    void commands.getLinkByKey(nodeKey).then((link) => {
      if (!link) {
        hideBubble();
        return;
      }

      setHoveredLink((current) => {
        if (!current || current.nodeKey !== nodeKey) {
          return current;
        }
        return { ...current, url: link.url };
      });
    });
  }, [commands, hideBubble]);

  useEffect(() => {
    if (!editor || disabled || typeof window === "undefined") {
      hideBubble();
      setPortalContainer(null);
      portalContainerRef.current = null;
      return;
    }

    const root = editor.getRootElement();
    if (!root) {
      hideBubble();
      setPortalContainer(null);
      portalContainerRef.current = null;
      return;
    }
    const nextPortalContainer =
      (root.closest(".luthor-editor-wrapper") as HTMLElement | null) ?? null;
    setPortalContainer(nextPortalContainer);
    portalContainerRef.current = nextPortalContainer;

    const handlePointerOver = (event: MouseEvent) => {
      const link = getLinkFromTarget(event.target, root);
      if (!link) {
        return;
      }

      if (hasExpandedSelection()) {
        hideBubble();
        return;
      }

      clearHideTimeout();

      const nodeKey = resolveLinkNodeKeyFromAnchor(editor, link);
      if (!nodeKey) {
        return;
      }

      const fallbackUrl = link.getAttribute("href") ?? link.href;
      setHoveredLink({ nodeKey, url: fallbackUrl, anchorEl: link });
      updatePosition(link, portalContainerRef.current);
      setUrlError(null);
      if (!isEditing) {
        setDraftUrl(fallbackUrl);
      }
      syncLinkByKey(nodeKey, fallbackUrl);
    };

    const handlePointerOut = (event: MouseEvent) => {
      if (!hoveredLink) {
        return;
      }

      const relatedTarget = event.relatedTarget as Node | null;
      if (relatedTarget && bubbleRef.current?.contains(relatedTarget)) {
        return;
      }

      const nextLink = getLinkFromTarget(relatedTarget, root);
      if (nextLink) {
        return;
      }

      scheduleHide();
    };

    const handleSelectionChange = () => {
      if (hasExpandedSelection()) {
        hideBubble();
      }
    };

    const handleReposition = () => {
      setHoveredLink((current) => {
        if (!current) {
          return current;
        }

        const latestAnchor =
          current.anchorEl.isConnected && root.contains(current.anchorEl)
            ? current.anchorEl
            : root.querySelector<HTMLAnchorElement>(`a[data-lexical-node-key="${current.nodeKey}"]`);
        if (!latestAnchor) {
          hideBubble();
          return null;
        }

        updatePosition(latestAnchor, portalContainerRef.current);
        return {
          ...current,
          anchorEl: latestAnchor,
          url: latestAnchor.getAttribute("href") ?? latestAnchor.href,
        };
      });
    };

    const scheduleReposition = () => {
      if (repositionRafRef.current !== null) {
        return;
      }
      repositionRafRef.current = window.requestAnimationFrame(() => {
        repositionRafRef.current = null;
        handleReposition();
      });
    };

    root.addEventListener("mouseover", handlePointerOver);
    root.addEventListener("mouseout", handlePointerOut);
    document.addEventListener("selectionchange", handleSelectionChange);
    window.addEventListener("scroll", scheduleReposition, true);
    window.addEventListener("resize", scheduleReposition);

    return () => {
      root.removeEventListener("mouseover", handlePointerOver);
      root.removeEventListener("mouseout", handlePointerOut);
      document.removeEventListener("selectionchange", handleSelectionChange);
      window.removeEventListener("scroll", scheduleReposition, true);
      window.removeEventListener("resize", scheduleReposition);
      if (repositionRafRef.current !== null) {
        cancelAnimationFrame(repositionRafRef.current);
        repositionRafRef.current = null;
      }
      clearHideTimeout();
    };
  }, [
    commands,
    disabled,
    editor,
    hoveredLink,
    isEditing,
    hideBubble,
    scheduleHide,
    syncLinkByKey,
    updatePosition,
    clearHideTimeout,
  ]);

  const bubbleStyle = useMemo<CSSProperties | undefined>(() => {
    if (!hoveredLink || !position) {
      return undefined;
    }

    return {
      ...getOverlayThemeStyleFromElement(hoveredLink.anchorEl),
      position: portalContainer ? "absolute" : "fixed",
      top: position.top,
      left: position.left,
      zIndex: 10040,
    };
  }, [hoveredLink, position, portalContainer]);

  if (!hoveredLink || !position || typeof document === "undefined") {
    return null;
  }

  const handleUnlink = () => {
    const removed = commands.removeLinkByKey?.(hoveredLink.nodeKey) ?? false;
    if (!removed) {
      return;
    }
    hideBubble();
  };

  const handleSave = () => {
    const nextUrl = draftUrl.trim();
    const updated =
      commands.updateLinkByKey?.(hoveredLink.nodeKey, nextUrl) ??
      false;
    if (!updated) {
      setUrlError("Enter a valid URL");
      syncLinkByKey(hoveredLink.nodeKey, hoveredLink.url);
      return;
    }

    // Optimistically update bubble text so the URL reflects the saved value
    // even if Lexical reconciliation settles on the next microtask/frame.
    setHoveredLink((current) => {
      if (!current || current.nodeKey !== hoveredLink.nodeKey) {
        return current;
      }
      return { ...current, url: nextUrl };
    });
    setUrlError(null);
    setIsEditing(false);
    queueMicrotask(() => {
      syncLinkByKey(hoveredLink.nodeKey, nextUrl);
    });
  };

  return createPortal(
    <div
      ref={bubbleRef}
      className="luthor-floating-toolbar luthor-link-hover-bubble"
      data-theme={editorTheme}
      style={bubbleStyle}
      onMouseEnter={clearHideTimeout}
      onMouseLeave={scheduleHide}
    >
      {!isEditing ? (
        <>
          <span className="luthor-link-hover-bubble-url" title={hoveredLink.url}>
            {truncateUrl(hoveredLink.url)}
          </span>
          <button
            type="button"
            className="luthor-toolbar-button luthor-link-hover-bubble-button"
            onClick={() => {
              setDraftUrl(hoveredLink.url);
              setIsEditing(true);
              setUrlError(null);
            }}
          >
            Edit
          </button>
          <button
            type="button"
            className="luthor-toolbar-button luthor-link-hover-bubble-button luthor-link-hover-bubble-button-danger"
            onClick={handleUnlink}
            aria-label="Unlink"
          >
            <UnlinkIcon size={13} />
          </button>
        </>
      ) : (
        <>
          <input
            type="url"
            value={draftUrl}
            className={`luthor-link-hover-bubble-input${urlError ? " is-error" : ""}`}
            placeholder="https://example.com"
            aria-label="Edit link URL"
            aria-invalid={urlError ? true : undefined}
            onChange={(event) => {
              setDraftUrl(event.target.value);
              if (urlError) {
                setUrlError(null);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSave();
                return;
              }
              if (event.key === "Escape") {
                event.preventDefault();
                setIsEditing(false);
                setDraftUrl(hoveredLink.url);
                setUrlError(null);
              }
            }}
          />
          <button
            type="button"
            className="luthor-toolbar-button luthor-link-hover-bubble-button luthor-link-hover-bubble-button-primary"
            onClick={handleSave}
          >
            Update
          </button>
          <button
            type="button"
            className="luthor-toolbar-button luthor-link-hover-bubble-button"
            onClick={() => {
              setIsEditing(false);
              setDraftUrl(hoveredLink.url);
              setUrlError(null);
            }}
          >
            Cancel
          </button>
        </>
      )}
    </div>,
    portalContainer ?? document.body,
  );
}
