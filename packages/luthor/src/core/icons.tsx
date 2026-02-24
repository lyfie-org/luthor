import {
  forwardRef,
  type ForwardRefExoticComponent,
  type ReactNode,
  type RefAttributes,
  type SVGProps,
} from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
  strokeWidth?: number | string;
};

function createIcon(
  displayName: string,
  content: ReactNode,
): ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>> {
  const Icon = forwardRef<SVGSVGElement, IconProps>(function IconComponent(
    { size = 24, strokeWidth = 2, ...props },
    ref,
  ) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        {content}
      </svg>
    );
  });
  Icon.displayName = displayName;
  return Icon;
}

export const BoldIcon = createIcon("BoldIcon", <path d="M7 5h6a3 3 0 0 1 0 6H7zm0 6h7a3 3 0 1 1 0 6H7z" />);
export const ItalicIcon = createIcon("ItalicIcon", <path d="M10 4h8M6 20h8m-2-16-4 16" />);
export const UnderlineIcon = createIcon("UnderlineIcon", (
  <>
    <path d="M8 4v7a4 4 0 1 0 8 0V4" />
    <path d="M4 20h16" />
  </>
));
export const StrikethroughIcon = createIcon("StrikethroughIcon", (
  <>
    <path d="M17 5H9a3 3 0 0 0 0 6h6a3 3 0 1 1 0 6H7" />
    <path d="M4 12h16" />
  </>
));
export const CodeIcon = createIcon("CodeIcon", (
  <>
    <path d="m8 9-4 3 4 3" />
    <path d="m16 9 4 3-4 3" />
  </>
));
export const CodeBlockIcon = createIcon("CodeBlockIcon", (
  <>
    <path d="M3 6h18v12H3z" />
    <path d="m10 10-2 2 2 2" />
    <path d="m14 10 2 2-2 2" />
  </>
));
export const LinkIcon = createIcon("LinkIcon", (
  <>
    <path d="M10 14a4 4 0 0 1 0-6l1-1a4 4 0 0 1 6 6l-1 1" />
    <path d="M14 10a4 4 0 0 1 0 6l-1 1a4 4 0 0 1-6-6l1-1" />
  </>
));
export const UnlinkIcon = createIcon("UnlinkIcon", (
  <>
    <path d="M10 14a4 4 0 0 1 0-6l1-1" />
    <path d="M14 10a4 4 0 0 1 0 6l-1 1" />
    <path d="m3 3 18 18" />
  </>
));
export const ListIcon = createIcon("ListIcon", (
  <>
    <path d="M9 6h12" />
    <path d="M9 12h12" />
    <path d="M9 18h12" />
    <path d="M4 6h.01" />
    <path d="M4 12h.01" />
    <path d="M4 18h.01" />
  </>
));
export const ListCheckIcon = createIcon("ListCheckIcon", (
  <>
    <path d="M9 6h12" />
    <path d="M9 12h12" />
    <path d="M9 18h12" />
    <path d="m4 6 1 1 2-2" />
    <path d="m4 12 1 1 2-2" />
    <path d="m4 18 1 1 2-2" />
  </>
));
export const ListOrderedIcon = createIcon("ListOrderedIcon", (
  <>
    <path d="M10 6h11" />
    <path d="M10 12h11" />
    <path d="M10 18h11" />
    <path d="M4 6h1v4" />
    <path d="M4 12h2l-2 2h2" />
    <path d="M4 18h2" />
  </>
));
export const UndoIcon = createIcon("UndoIcon", (
  <>
    <path d="M3 8v5h5" />
    <path d="M21 16a8 8 0 0 0-13-6L3 13" />
  </>
));
export const RedoIcon = createIcon("RedoIcon", (
  <>
    <path d="M21 8v5h-5" />
    <path d="M3 16a8 8 0 0 1 13-6l5 3" />
  </>
));
export const ImageIcon = createIcon("ImageIcon", (
  <>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path d="m21 15-5-5-8 8" />
  </>
));
export const AlignLeftIcon = createIcon("AlignLeftIcon", (
  <>
    <path d="M4 6h16" />
    <path d="M4 10h10" />
    <path d="M4 14h16" />
    <path d="M4 18h10" />
  </>
));
export const AlignCenterIcon = createIcon("AlignCenterIcon", (
  <>
    <path d="M4 6h16" />
    <path d="M7 10h10" />
    <path d="M4 14h16" />
    <path d="M7 18h10" />
  </>
));
export const AlignJustifyIcon = createIcon("AlignJustifyIcon", (
  <>
    <path d="M4 6h16" />
    <path d="M4 10h16" />
    <path d="M4 14h16" />
    <path d="M4 18h16" />
  </>
));
export const AlignRightIcon = createIcon("AlignRightIcon", (
  <>
    <path d="M4 6h16" />
    <path d="M10 10h10" />
    <path d="M4 14h16" />
    <path d="M10 18h10" />
  </>
));
export const UploadIcon = createIcon("UploadIcon", (
  <>
    <path d="M12 16V6" />
    <path d="m8 10 4-4 4 4" />
    <path d="M4 18h16" />
  </>
));
export const MinusIcon = createIcon("MinusIcon", <path d="M5 12h14" />);
export const TableIcon = createIcon("TableIcon", (
  <>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 10h18M9 4v16M15 4v16" />
  </>
));
export const FileCodeIcon = createIcon("FileCodeIcon", (
  <>
    <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
    <path d="M14 2v5h5" />
    <path d="m10 13-2 2 2 2" />
    <path d="m14 13 2 2-2 2" />
  </>
));
export const EyeIcon = createIcon("EyeIcon", (
  <>
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
    <circle cx="12" cy="12" r="2.5" />
  </>
));
export const HighlighterIcon = createIcon("HighlighterIcon", (
  <>
    <path d="m9 15-4 4 2 2 4-4" />
    <path d="m14 4 6 6-7 7-6-6z" />
  </>
));
export const PencilIcon = createIcon("PencilIcon", (
  <>
    <path d="m3 21 3.5-.7L19 7.8a2.1 2.1 0 0 0 0-3L17.2 3a2.1 2.1 0 0 0-3 0L1.7 15.5z" />
    <path d="m14 4 6 6" />
  </>
));
export const CommandIcon = createIcon("CommandIcon", (
  <>
    <path d="M8 4a3 3 0 1 0 0 6h8a3 3 0 1 0 0-6 3 3 0 0 0-3 3v10a3 3 0 1 0 6 0v-8a3 3 0 1 0-6 0 3 3 0 0 0 3 3H8a3 3 0 1 0 0 6 3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v8a3 3 0 1 0 6 0" />
  </>
));
export const PaletteIcon = createIcon("PaletteIcon", (
  <>
    <path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 0-4h-1a2 2 0 0 1 0-4h2a5 5 0 0 0 0-10z" />
    <circle cx="7.5" cy="10" r="1" />
    <circle cx="10" cy="7.5" r="1" />
    <circle cx="14" cy="7.5" r="1" />
    <circle cx="16.5" cy="11" r="1" />
  </>
));
export const TypeIcon = createIcon("TypeIcon", (
  <>
    <path d="M4 6h16" />
    <path d="M12 6v12" />
    <path d="M8 18h8" />
  </>
));
export const QuoteIcon = createIcon("QuoteIcon", (
  <>
    <path d="M7 17H4a2 2 0 0 1-2-2v-3a5 5 0 0 1 5-5h1v3H7a2 2 0 0 0-2 2v1h2z" />
    <path d="M17 17h-3a2 2 0 0 1-2-2v-3a5 5 0 0 1 5-5h1v3h-1a2 2 0 0 0-2 2v1h2z" />
  </>
));
export const IndentIcon = createIcon("IndentIcon", (
  <>
    <path d="M3 6h14" />
    <path d="M3 10h10" />
    <path d="M3 14h14" />
    <path d="M3 18h10" />
    <path d="m16 11 4 3-4 3" />
  </>
));
export const OutdentIcon = createIcon("OutdentIcon", (
  <>
    <path d="M3 6h14" />
    <path d="M3 10h10" />
    <path d="M3 14h14" />
    <path d="M3 18h10" />
    <path d="m20 11-4 3 4 3" />
  </>
));
export const SunIcon = createIcon("SunIcon", (
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </>
));
export const MoonIcon = createIcon("MoonIcon", <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8z" />);
export const SearchIcon = createIcon("SearchIcon", (
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </>
));
export const EmojiIcon = createIcon("EmojiIcon", (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 10h.01M15.5 10h.01" />
    <path d="M8 15c1 1 2.2 1.5 4 1.5s3-.5 4-1.5" />
  </>
));
export const SubscriptIcon = createIcon("SubscriptIcon", (
  <>
    <path d="m4 6 6 8" />
    <path d="m10 6-6 8" />
    <path d="M14 18h6" />
    <path d="m16 15 2 3-2 3" />
  </>
));
export const SuperscriptIcon = createIcon("SuperscriptIcon", (
  <>
    <path d="m4 6 6 8" />
    <path d="m10 6-6 8" />
    <path d="M14 9h6" />
    <path d="m16 12 2-3-2-3" />
  </>
));
export const ChevronDownIcon = createIcon("ChevronDownIcon", <path d="m6 9 6 6 6-6" />);
export const CloseIcon = createIcon("CloseIcon", (
  <>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </>
));
