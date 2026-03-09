import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDownIcon, CloseIcon } from "./icons";
import { getOverlayThemeStyleFromElement } from "./overlay-theme";
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
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  type?: "button" | "submit" | "reset";
  className?: string;
}) {
  const baseClass = variant === "primary" ? "luthor-button-primary" : "luthor-button-secondary";
  return (
    <button type={type} onClick={onClick} className={`${baseClass}${className ? ` ${className}` : ""}`}>
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
      const container = resolveEditorPortalContainer(triggerEl);
      setPortalContainer(container);

      const width = Math.max(rect.width, measuredRect?.width ?? 0);
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
        width: rect.width,
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
      const next = computeAnchoredOverlayStyle({
        anchorRect: rect,
        overlay: { width: Math.max(rect.width, measuredRect?.width ?? 0), height: measuredRect?.height ?? 220 },
        portalContainer: container,
        gap: 4,
        margin: 8,
      });
      setDropdownStyle({
        ...next,
        width: rect.width,
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
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (dropdownRef.current?.contains(target)) return;
      if (contentRef.current?.contains(target)) return;
      onOpenChange(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onOpenChange]);

  return (
    <div className="luthor-dropdown" ref={dropdownRef}>
      <div ref={triggerRef} onClick={() => onOpenChange(!isOpen)}>{trigger}</div>
      {isOpen && typeof document !== "undefined" && createPortal(
        <div ref={contentRef} className="luthor-dropdown-content" style={dropdownStyle}>{children}</div>,
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

  if (!isOpen) return null;

  return (
    <div className="luthor-dialog-overlay">
      <div className="luthor-dialog" ref={dialogRef}>
        <div className="luthor-dialog-header">
          <h3 className="luthor-dialog-title">{title}</h3>
          <button className="luthor-dialog-close" onClick={onClose} type="button">
            <CloseIcon size={16} />
          </button>
        </div>
        <div className="luthor-dialog-content">{children}</div>
      </div>
    </div>
  );
}
