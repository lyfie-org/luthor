import { ComponentType, CSSProperties } from "react";
import { BaseExtensionConfig } from "@lyfie/luthor/extensions/types";

/**
 * Supported alignment options for media items
 */
export type Alignment = "left" | "right" | "center" | "none";

/**
 * Payload interface for image insertion and updates
 */
export interface ImagePayload {
  /** Source URL for the image */
  src?: string;
  /** Accessible alt text */
  alt: string;
  /** Optional caption */
  caption?: string;
  /** Alignment */
  alignment?: Alignment;
  /** CSS class name for styling */
  className?: string;
  /** Inline style overrides */
  style?: CSSProperties;
  /** File object for uploads */
  file?: File;
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
}

/**
 * Props for the Image component
 */
export interface ImageComponentProps extends ImagePayload {
  /** Lexical node key */
  nodeKey?: string;
  /** Whether the image is resizable */
  resizable?: boolean;
  /** Whether the image is uploading */
  uploading?: boolean;
}

/**
 * Serialized ImageNode representation for persistence
 */
export interface SerializedImageNode {
  /** Node type ID */
  type: "image";
  /** Version for migrations */
  version: number;
  /** Source URL for the image */
  src: string;
  /** Accessible alt text */
  alt: string;
  /** Optional caption */
  caption?: string;
  /** Alignment */
  alignment: Alignment;
  /** CSS class name */
  className?: string;
  /** Inline styles as a string record */
  style?: Record<string, string>;
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
}

/**
 * ImageExtension configuration options
 */
export interface ImageExtensionConfig extends BaseExtensionConfig {
  /** Upload handler that returns the image URL */
  uploadHandler?: (file: File) => Promise<string>;
  /** Default alignment for new images */
  defaultAlignment?: Alignment;
  /** Class names for alignments and elements */
  classNames?: Partial<Record<Alignment | "wrapper" | "caption", string>>;
  /** Styles for alignments and elements */
  styles?: Partial<Record<Alignment | "wrapper" | "caption", CSSProperties>>;
  /** Custom renderer component for images */
  customRenderer?: ComponentType<ImageComponentProps>;
  /** Enable image resizing (default: true) */
  resizable?: boolean;
  /** Paste behavior configuration */
  pasteListener?: {
    /** Insert a new image on paste when none is selected */
    insert: boolean;
    /** Replace selected image src on paste */
    replace: boolean;
  };
  /** Enable debug logging */
  debug?: boolean;
  /** Force upload even for remote URLs (default: false) */
  forceUpload?: boolean;
}

/**
 * Commands exposed by the ImageExtension
 */
export type ImageCommands = {
  /** Insert an image into the editor */
  insertImage: (payload: ImagePayload) => void;
  /** Set alignment for the selected image */
  setImageAlignment: (alignment: Alignment) => void;
  /** Set caption for the selected image */
  setImageCaption: (caption: string) => void;
  /** Set the CSS class name on the selected image */
  setImageClassName: (className: string) => void;
  /** Set inline styles on the selected image */
  setImageStyle: (style: CSSProperties) => void;
};

/**
 * State queries exposed by the ImageExtension
 */
export type ImageStateQueries = {
  /** Check whether an image is selected */
  imageSelected: () => Promise<boolean>;
  /** Check whether the selected image is left-aligned */
  isImageAlignedLeft: () => Promise<boolean>;
  /** Check whether the selected image is center-aligned */
  isImageAlignedCenter: () => Promise<boolean>;
  /** Check whether the selected image is right-aligned */
  isImageAlignedRight: () => Promise<boolean>;
  /** Check whether the selected image has no special alignment */
  isImageAlignedNone: () => Promise<boolean>;
};
