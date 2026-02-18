import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ChevronDownIcon, CloseIcon } from "./icons";

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
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const triggerEl = selectRef.current?.querySelector(".luthor-select-trigger") as HTMLElement | null;
      if (!triggerEl) return;

      const rect = triggerEl.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
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
      {isOpen && (
        <div className="luthor-select-dropdown" style={dropdownStyle}>
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
        </div>
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
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties | undefined>(undefined);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const triggerEl = triggerRef.current;
      if (!triggerEl) return;

      const rect = triggerEl.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onOpenChange]);

  return (
    <div className="luthor-dropdown" ref={dropdownRef}>
      <div ref={triggerRef} onClick={() => onOpenChange(!isOpen)}>{trigger}</div>
      {isOpen && <div className="luthor-dropdown-content" style={dropdownStyle}>{children}</div>}
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
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
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