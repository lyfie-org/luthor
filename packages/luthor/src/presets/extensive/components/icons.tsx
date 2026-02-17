import React from "react";

type IconProps = {
  size?: number;
  className?: string;
};

function IconBase({ size = 16, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function BoldIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 5h6a3 3 0 0 1 0 6H7z" />
      <path d="M7 11h7a3 3 0 0 1 0 6H7z" />
    </IconBase>
  );
}

export function ItalicIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M11 5h6" />
      <path d="M7 19h6" />
      <path d="M14 5l-4 14" />
    </IconBase>
  );
}

export function UnderlineIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 4v6a6 6 0 0 0 12 0V4" />
      <path d="M4 20h16" />
    </IconBase>
  );
}

export function StrikethroughIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 12h16" />
      <path d="M7 5h7a3 3 0 0 1 0 6H7" />
      <path d="M7 19h10" />
    </IconBase>
  );
}

export function CodeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8 7l-4 5 4 5" />
      <path d="M16 7l4 5-4 5" />
    </IconBase>
  );
}

export function CodeBlockIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16" />
      <path d="M4 18h16" />
      <path d="M9 9l-3 3 3 3" />
      <path d="M15 9l3 3-3 3" />
    </IconBase>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M10 13a5 5 0 0 1 0-7l2-2a5 5 0 1 1 7 7l-2 2" />
      <path d="M14 11a5 5 0 0 1 0 7l-2 2a5 5 0 1 1-7-7l2-2" />
    </IconBase>
  );
}

export function UnlinkIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8 8l8 8" />
      <path d="M10 13a5 5 0 0 1 0-7l2-2a5 5 0 0 1 7 7l-1 1" />
      <path d="M14 11a5 5 0 0 1 0 7l-2 2a5 5 0 0 1-7-7l1-1" />
    </IconBase>
  );
}

export function ListIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8 6h12" />
      <path d="M8 12h12" />
      <path d="M8 18h12" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="18" r="1" />
    </IconBase>
  );
}

export function ListOrderedIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 6h11" />
      <path d="M9 12h11" />
      <path d="M9 18h11" />
      <path d="M4 6h1" />
      <path d="M4 12h1" />
      <path d="M4 18h1" />
    </IconBase>
  );
}

export function UndoIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9H3" />
    </IconBase>
  );
}

export function RedoIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9h9" />
    </IconBase>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8" cy="10" r="2" />
      <path d="M21 16l-5-5-4 4-2-2-5 5" />
    </IconBase>
  );
}

export function AlignLeftIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16" />
      <path d="M4 12h10" />
      <path d="M4 18h12" />
    </IconBase>
  );
}

export function AlignCenterIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M6 18h12" />
    </IconBase>
  );
}

export function AlignRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16" />
      <path d="M10 12h10" />
      <path d="M8 18h12" />
    </IconBase>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 16V6" />
      <path d="M8 10l4-4 4 4" />
      <path d="M4 18h16" />
    </IconBase>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 12h14" />
    </IconBase>
  );
}

export function TableIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M9 4v16" />
      <path d="M15 4v16" />
    </IconBase>
  );
}

export function FileCodeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
      <path d="M14 2v5h5" />
      <path d="M9 13l-2 2 2 2" />
      <path d="M15 13l2 2-2 2" />
    </IconBase>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6" />
      <circle cx="12" cy="12" r="3" />
    </IconBase>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 17l4 4" />
      <path d="M14 3l7 7" />
      <path d="M7 21l10-10" />
    </IconBase>
  );
}

export function CommandIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 7h10v10H7z" />
      <path d="M7 7v-2a2 2 0 1 1 4 0v2" />
      <path d="M13 7v-2a2 2 0 1 1 4 0v2" />
      <path d="M7 17v2a2 2 0 1 0 4 0v-2" />
      <path d="M13 17v2a2 2 0 1 0 4 0v-2" />
    </IconBase>
  );
}

export function TypeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16" />
      <path d="M12 6v12" />
    </IconBase>
  );
}

export function QuoteIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 8h4v8H6z" />
      <path d="M14 8h4v8h-4z" />
    </IconBase>
  );
}

export function IndentIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16" />
      <path d="M4 12h10" />
      <path d="M4 18h16" />
      <path d="M14 9l4 3-4 3" />
    </IconBase>
  );
}

export function OutdentIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16" />
      <path d="M4 12h10" />
      <path d="M4 18h16" />
      <path d="M18 9l-4 3 4 3" />
    </IconBase>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3" />
      <path d="M12 19v3" />
      <path d="M4.9 4.9l2.1 2.1" />
      <path d="M17 17l2.1 2.1" />
      <path d="M2 12h3" />
      <path d="M19 12h3" />
      <path d="M4.9 19.1L7 17" />
      <path d="M17 7l2.1-2.1" />
    </IconBase>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M21 12.8A8 8 0 1 1 11.2 3a6 6 0 0 0 9.8 9.8z" />
    </IconBase>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" />
    </IconBase>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 9l6 6 6-6" />
    </IconBase>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6l-12 12" />
    </IconBase>
  );
}
