import { describe, expect, it } from "vitest";
import { IS_BOLD, IS_SUBSCRIPT } from "lexical";
import {
  extractHTMLMetadataPatch,
  extractMarkdownMetadataPatch,
  isHTMLRepresentable,
  isMarkdownRepresentable,
} from "./source-capability";

describe("source capability", () => {
  it("treats markdown list tag as representable when derivable from listType", () => {
    expect(
      isMarkdownRepresentable("list", "tag", "ul", {
        node: { type: "list", listType: "bullet" },
      }),
    ).toBe(true);
    expect(
      isMarkdownRepresentable("list", "tag", "ol", {
        node: { type: "list", listType: "number" },
      }),
    ).toBe(true);
    expect(
      isMarkdownRepresentable("list", "tag", "ol", {
        node: { type: "list", listType: "bullet" },
      }),
    ).toBe(false);
  });

  it("keeps markdown link target/rel metadata only when non-default", () => {
    expect(isMarkdownRepresentable("link", "target", null)).toBe(true);
    expect(isMarkdownRepresentable("link", "rel", "")).toBe(true);
    expect(isMarkdownRepresentable("link", "target", "_blank")).toBe(false);
  });

  it("detects markdown text format bits beyond native mask", () => {
    expect(isMarkdownRepresentable("text", "format", IS_BOLD)).toBe(true);
    expect(isMarkdownRepresentable("text", "format", IS_BOLD | IS_SUBSCRIPT)).toBe(false);
  });

  it("treats linked-image attrs as html-native", () => {
    expect(isHTMLRepresentable("image", "linkHref", "https://example.com")).toBe(true);
    expect(isHTMLRepresentable("image", "linkTitle", "Docs")).toBe(true);
  });

  it("extracts only non-representable markdown patches", () => {
    const textPatch = extractMarkdownMetadataPatch(
      {
        type: "text",
        version: 1,
        text: "Hello",
        format: IS_BOLD | IS_SUBSCRIPT,
      },
      "text",
    );
    expect(textPatch).toEqual({ __luthorTextFormatExtra: IS_SUBSCRIPT });

    const linkDefaultPatch = extractMarkdownMetadataPatch(
      {
        type: "link",
        version: 1,
        url: "https://example.com",
        title: null,
        target: null,
      },
      "link",
    );
    expect(linkDefaultPatch).toBeNull();

    const linkTargetPatch = extractMarkdownMetadataPatch(
      {
        type: "link",
        version: 1,
        url: "https://example.com",
        title: null,
        target: "_blank",
      },
      "link",
    );
    expect(linkTargetPatch).toEqual({ target: "_blank" });
  });

  it("extracts no html metadata patch for linked images but keeps frontmatter patch", () => {
    const imagePatch = extractHTMLMetadataPatch(
      {
        type: "image",
        version: 1,
        src: "https://example.com/badge.svg",
        alt: "Badge",
        linkHref: "https://example.com/docs",
        linkTitle: "Docs",
      },
      "image",
    );
    expect(imagePatch).toBeNull();

    const rootPatch = extractHTMLMetadataPatch(
      {
        type: "root",
        version: 1,
        frontmatter: "---\ntitle: demo\n---",
      },
      "root",
    );
    expect(rootPatch).toEqual({
      frontmatter: "---\ntitle: demo\n---",
    });
  });
});
