/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDownIcon, CloseIcon } from "./icons";
import { getOverlayThemeStyleFromElement } from "./overlay-theme";
import type { InputRequest } from "./types";
import { computeAnchoredOverlayStyle, resolveEditorPortalContainer } from "./overlay-position";

export function IconButton({
  children,
  onClick,
  title,
  active,
  disabled,
  className,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
  active?: boolean;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
}) {
  return (
    <button
      type={type}
      className={`luthor-toolbar-button${active ? " active" : ""}${className ? ` ${className}` : ""}`}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  className,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  type?: "button" | "submit" | "reset";
  className?: string;
  disabled?: boolean;
}) {
  const baseClass = variant === "primary" ? "luthor-button-primary" : "luthor-button-secondary";
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseClass}${className ? ` ${className}` : ""}`}>
      {children}
    </button>
  );
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties | undefined>(undefined);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const selectRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const updatePosition = () => {
      const triggerEl = selectRef.current?.querySelector(".luthor-select-trigger") as HTMLElement | null;
      if (!triggerEl) return;

      const rect = triggerEl.getBoundingClientRect();
      const measuredRect = dropdownRef.current?.getBoundingClientRect();
      const measuredWidth = Math.max(
        measuredRect?.width ?? 0,
        dropdownRef.current?.scrollWidth ?? 0,
      );
      const container = resolveEditorPortalContainer(triggerEl);
      setPortalContainer(container);

      const width = Math.max(rect.width, measuredWidth);
      const height = measuredRect?.height ?? 220;
      const placement = computeAnchoredOverlayStyle({
        anchorRect: rect,
        overlay: { width, height },
        portalContainer: container,
        gap: 4,
        margin: 8,
        preferredX: "start",
        preferredY: "bottom",
        flipX: true,
        flipY: true,
      });

      setDropdownStyle({
        ...placement,
        width,
        ...getOverlayThemeStyleFromElement(triggerEl),
      });
    };

    updatePosition();

    const handleReposition = () => updatePosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
      setPortalContainer(null);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const triggerEl = selectRef.current?.querySelector(".luthor-select-trigger") as HTMLElement | null;
    if (!triggerEl) return;
    const rect = triggerEl.getBoundingClientRect();
    const container = resolveEditorPortalContainer(triggerEl);
    setPortalContainer(container);
    const initial = computeAnchoredOverlayStyle({
      anchorRect: rect,
      overlay: { width: rect.width, height: 220 },
      portalContainer: container,
      gap: 4,
      margin: 8,
    });
    setDropdownStyle({
      ...initial,
      width: rect.width,
      ...getOverlayThemeStyleFromElement(triggerEl),
    });

    const frame = window.requestAnimationFrame(() => {
      const measuredRect = dropdownRef.current?.getBoundingClientRect();
      const measuredWidth = Math.max(
        measuredRect?.width ?? 0,
        dropdownRef.current?.scrollWidth ?? 0,
      );
      const width = Math.max(rect.width, measuredWidth);
      const next = computeAnchoredOverlayStyle({
        anchorRect: rect,
        overlay: { width, height: measuredRect?.height ?? 220 },
        portalContainer: container,
        gap: 4,
        margin: 8,
      });
      setDropdownStyle({
        ...next,
        width,
        ...getOverlayThemeStyleFromElement(triggerEl),
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (selectRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="luthor-select" ref={selectRef}>
      <button className={`luthor-select-trigger ${isOpen ? "open" : ""}`} onClick={() => setIsOpen(!isOpen)} type="button">
        <span>{selectedOption?.label || placeholder}</span>
        <ChevronDownIcon size={14} />
      </button>
      {isOpen && typeof document !== "undefined" && createPortal(
        <div ref={dropdownRef} className="luthor-select-dropdown" style={dropdownStyle}>
          {options.map((option) => (
            <button
              key={option.value}
              className={`luthor-select-option ${value === option.value ? "selected" : ""}`}
              onClick={() => {
                onValueChange(option.value);
                setIsOpen(false);
              }}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>,
        portalContainer ?? document.body,
      )}
    </div>
  );
}

/**
 * Lets a dropdown opened from inside another dropdown's menu (a sub-menu, or a
 * toolbar group holding a control that has its own menu) tell its ancestors
 * about its portalled content, so a click there does not count as "outside"
 * and close the parent — which would unmount the child with it.
 */
type DropdownNest = { register: (el: HTMLElement) => () => void };
const DropdownNestContext = createContext<DropdownNest | null>(null);

export function Dropdown({
  trigger,
  children,
  isOpen,
  onOpenChange,
}: {
  trigger: ReactNode;
  children: ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties | undefined>(undefined);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const parentNest = useContext(DropdownNestContext);
  const nested = useRef(new Set<HTMLElement>());
  const nest = useMemo<DropdownNest>(
    () => ({
      register: (el) => {
        nested.current.add(el);
        const unregisterParent = parentNest?.register(el);
        return () => {
          nested.current.delete(el);
          unregisterParent?.();
        };
      },
    }),
    [parentNest],
  );
  // Register this menu's own content with every ancestor while it is mounted.
  const unregisterContent = useRef<(() => void) | null>(null);
  const setContentRef = useCallback(
    (el: HTMLDivElement | null) => {
      contentRef.current = el;
      unregisterContent.current?.();
      unregisterContent.current = el && parentNest ? parentNest.register(el) : null;
    },
    [parentNest],
  );

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const triggerEl = triggerRef.current;
      if (!triggerEl) return;

      const rect = triggerEl.getBoundingClientRect();
      const measuredRect = contentRef.current?.getBoundingClientRect();
      const container = resolveEditorPortalContainer(triggerEl);
      setPortalContainer(container);

      const placement = computeAnchoredOverlayStyle({
        anchorRect: rect,
        overlay: {
          width: measuredRect?.width ?? 220,
          height: measuredRect?.height ?? 200,
        },
        portalContainer: container,
        gap: 4,
        margin: 8,
        preferredX: "start",
        preferredY: "bottom",
        flipX: true,
        flipY: true,
      });

      setDropdownStyle({
        ...placement,
        ...getOverlayThemeStyleFromElement(triggerEl),
      });
    };

    const handleReposition = () => updatePosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
      setPortalContainer(null);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const triggerEl = triggerRef.current;
    if (!triggerEl) return;

    const rect = triggerEl.getBoundingClientRect();
    const container = resolveEditorPortalContainer(triggerEl);
    setPortalContainer(container);
    const initial = computeAnchoredOverlayStyle({
      anchorRect: rect,
      overlay: { width: 220, height: 200 },
      portalContainer: container,
      gap: 4,
      margin: 8,
    });
    setDropdownStyle({
      ...initial,
      ...getOverlayThemeStyleFromElement(triggerEl),
    });

    const frame = window.requestAnimationFrame(() => {
      const measuredRect = contentRef.current?.getBoundingClientRect();
      const next = computeAnchoredOverlayStyle({
        anchorRect: rect,
        overlay: {
          width: measuredRect?.width ?? 220,
          height: measuredRect?.height ?? 200,
        },
        portalContainer: container,
        gap: 4,
        margin: 8,
      });
      setDropdownStyle({
        ...next,
        ...getOverlayThemeStyleFromElement(triggerEl),
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (dropdownRef.current?.contains(target)) return;
      if (contentRef.current?.contains(target)) return;
      for (const el of nested.current) {
        if (el.contains(target)) return;
      }
      onOpenChange(false);
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      // Claim the key so a host listening further up (a modal that closes on
      // Escape) leaves itself open: this Escape was for the menu.
      event.preventDefault();
      onOpenChange(false);
    }
    // Capture phase: a host that stops mousedown from bubbling (a modal that
    // keeps clicks inside it from reaching its backdrop, say) would otherwise
    // hide every outside click from us and leave the menu stuck open.
    document.addEventListener("mousedown", handleClickOutside, true);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onOpenChange]);

  return (
    <div className="luthor-dropdown" ref={dropdownRef}>
      <div ref={triggerRef} onClick={() => onOpenChange(!isOpen)}>{trigger}</div>
      {isOpen && typeof document !== "undefined" && createPortal(
        <DropdownNestContext.Provider value={nest}>
          <div ref={setContentRef} className="luthor-dropdown-content" style={dropdownStyle}>{children}</div>
        </DropdownNestContext.Provider>,
        portalContainer ?? document.body,
      )}
    </div>
  );
}

export function Dialog({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // The dialog is portalled to <body> so it is a true top-level modal: inside
  // the editor it sat in the wrapper's own stacking context (the wrapper is
  // isolated), under the host's page chrome and anything the host layers over
  // the editor. It carries the editor's theme with it, read off a marker that
  // stays in place.
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [themeStyle, setThemeStyle] = useState<CSSProperties | undefined>(undefined);
  useLayoutEffect(() => {
    if (isOpen && anchorRef.current) {
      setThemeStyle(getOverlayThemeStyleFromElement(anchorRef.current));
    } else if (!isOpen) {
      setThemeStyle(undefined);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const anchor = <span ref={anchorRef} className="luthor-dialog-anchor" hidden />;
  // Mount the portal only once the theme is read: a first paint without it had
  // no background, and the theme transition then faded the panel in from
  // transparent.
  if (!isOpen || !themeStyle || typeof document === "undefined") return anchor;

  const overlay = (
    <div className="luthor-dialog-overlay luthor-dialog-overlay--portal" style={themeStyle}>
      <div className="luthor-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="luthor-dialog-header">
          <h3 className="luthor-dialog-title" id={titleId}>{title}</h3>
          <button className="luthor-dialog-close" onClick={onClose} type="button" aria-label="Close">
            <CloseIcon size={16} />
          </button>
        </div>
        <div className="luthor-dialog-content">{children}</div>
      </div>
    </div>
  );

  return (
    <>
      {anchor}
      {createPortal(overlay, document.body)}
    </>
  );
}

/**
 * The editor's themed stand-in for `window.prompt`: asks for the fields in
 * `request` and hands back their trimmed values by name. Open while `request`
 * is non-null; required fields must be filled before it submits.
 */
export function InputDialog({
  request,
  onSubmit,
  onCancel,
}: {
  request: InputRequest | null;
  onSubmit: (values: Record<string, string>) => void;
  onCancel: () => void;
}) {
  const initial = (next: InputRequest | null) =>
    Object.fromEntries((next?.fields ?? []).filter((f) => f.value !== undefined).map((f) => [f.name, f.value ?? ""]));
  const [values, setValues] = useState<Record<string, string>>(() => initial(request));
  // A new request starts from its own starting values (empty unless given).
  useEffect(() => setValues(initial(request)), [request]);
  const idPrefix = useId();

  const trimmed = (name: string) => (values[name] ?? "").trim();
  const incomplete = !request || request.fields.some((field) => field.required && !trimmed(field.name));

  return (
    <Dialog isOpen={request !== null} onClose={onCancel} title={request?.title ?? ""}>
      <form
        className="luthor-table-dialog"
        onSubmit={(event) => {
          event.preventDefault();
          if (!request || incomplete) return;
          onSubmit(Object.fromEntries(request.fields.map((field) => [field.name, trimmed(field.name)])));
        }}
      >
        {request?.fields.map((field, index) => (
          <div className="luthor-form-group" key={field.name}>
            <label htmlFor={`${idPrefix}-${field.name}`}>{field.label}</label>
            <input
              id={`${idPrefix}-${field.name}`}
              className="luthor-input"
              type={field.type ?? "text"}
              placeholder={field.placeholder}
              value={values[field.name] ?? ""}
              onChange={(event) => {
                const next = event.target.value;
                setValues((current) => ({ ...current, [field.name]: next }));
              }}
              autoFocus={index === 0}
              required={field.required}
            />
          </div>
        ))}
        <div className="luthor-dialog-actions">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={incomplete}>
            {request?.submitLabel ?? "Insert"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
