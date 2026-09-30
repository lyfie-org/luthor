/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/* @vitest-environment jsdom */

import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  EmbedResolverProvider,
  type EmbedResolvers,
  type MediaMeta,
} from "../embeds/EmbedResolverContext";
import { MediaFrame, type MediaFrameProps } from "./MediaFrame";

/** A host that serves `/m/<name>`, thumbnails at `/m/<name>/thumb?w=`, and meta from a map. */
function host(meta: Record<string, MediaMeta> = {}, variants = true) {
  const listeners = new Set<() => void>();
  const store = { ...meta };
  const resolvers: EmbedResolvers = {
    resolveMediaUrl: (target, options) => {
      const base = `/m/${encodeURIComponent(target)}`;
      if (!variants || !options?.variant || options.variant === "original") return base;
      return `${base}/${options.variant}?w=${options.width ?? 0}`;
    },
    getMediaMeta: (target) => store[target],
    subscribeMediaMeta: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    renderFileExpansion: ({ target, fragment }) =>
      target.endsWith(".pdf") ? <div data-testid="expansion">viewer {fragment}</div> : null,
  };
  const publish = (target: string, value: MediaMeta) => {
    store[target] = value;
    listeners.forEach((l) => l());
  };
  return { resolvers, publish };
}

function draw(props: MediaFrameProps, resolvers: EmbedResolvers) {
  return render(
    <EmbedResolverProvider resolvers={resolvers}>
      <MediaFrame {...props} />
    </EmbedResolverProvider>,
  );
}

describe("MediaFrame", () => {
  it("without a host, shows a chip naming the file", () => {
    draw({ target: "a.png" }, {});
    expect(screen.getByRole("note").textContent).toBe("a.png");
  });

  it("reserves an image's box from its metadata before it loads", () => {
    const { resolvers } = host({ "a.png": { width: 1600, height: 900, thumb: true } });
    const { container } = draw({ target: "a.png", alt: "Beach" }, resolvers);
    const img = container.querySelector("img")!;
    expect(img.getAttribute("loading")).toBe("lazy");
    expect(img.getAttribute("decoding")).toBe("async");
    expect(img.getAttribute("alt")).toBe("Beach");
    expect(img.style.aspectRatio).toBe("1600 / 900");
    expect((container.querySelector(".luthor-media__frame") as HTMLElement).style.width).toBe("min(1600px, 100%)");
  });

  it("an explicit size wins, and keeps the file's shape unless a box is given", () => {
    const { resolvers } = host({ "a.png": { width: 1600, height: 900 } });
    const { container, rerender } = draw({ target: "a.png", width: 480 }, resolvers);
    expect((container.querySelector(".luthor-media__frame") as HTMLElement).style.width).toBe("min(480px, 100%)");
    expect(container.querySelector("img")!.style.aspectRatio).toBe("1600 / 900");
    rerender(
      <EmbedResolverProvider resolvers={resolvers}>
        <MediaFrame target="a.png" width={400} height={400} />
      </EmbedResolverProvider>,
    );
    expect(container.querySelector("img")!.style.aspectRatio).toBe("400 / 400");
  });

  it("offers right-sized thumbnails via srcset — but never for an animation", () => {
    const { resolvers } = host({
      "a.png": { width: 2000, height: 1000, thumb: true },
      "b.gif": { width: 2000, height: 1000, thumb: true, animated: true },
    });
    const { container } = draw({ target: "a.png" }, resolvers);
    const srcset = container.querySelector("img")!.getAttribute("srcset")!;
    expect(srcset).toContain("/m/a.png/thumb?w=320 320w");
    expect(srcset).toContain("/m/a.png/thumb?w=1280 1280w");
    expect(srcset).toContain("/m/a.png 2000w");

    const gif = draw({ target: "b.gif" }, resolvers);
    expect(gif.container.querySelector("img")!.getAttribute("srcset")).toBeNull();
  });

  it("skips srcset for a host without renditions", () => {
    const { resolvers } = host({ "a.png": { width: 2000, height: 1000, thumb: true } }, false);
    const { container } = draw({ target: "a.png" }, resolvers);
    expect(container.querySelector("img")!.getAttribute("srcset")).toBeNull();
  });

  it("re-renders when metadata arrives", () => {
    const { resolvers, publish } = host();
    const { container } = draw({ target: "late.png" }, resolvers);
    expect(container.querySelector("img")!.style.aspectRatio).toBe("");
    act(() => publish("late.png", { width: 300, height: 200 }));
    expect(container.querySelector("img")!.style.aspectRatio).toBe("300 / 200");
  });

  it("turns a failed load into a card with Retry, and Retry re-requests the file", () => {
    const { resolvers } = host();
    const { container } = draw({ target: "gone.png" }, resolvers);
    fireEvent.error(container.querySelector("img")!);
    expect(screen.getByRole("group", { name: "Couldn't load gone.png" })).toBeTruthy();
    expect(screen.getByText("Open file").getAttribute("href")).toBe("/m/gone.png");

    fireEvent.click(screen.getByText("Retry"));
    expect(container.querySelector("img")!.getAttribute("src")).toBe("/m/gone.png?retry=1");
  });

  it("gives video a poster, metadata-only preload and a 16:9 box by default", () => {
    const { resolvers } = host({ "c.mp4": { poster: true } });
    const { container } = draw({ target: "c.mp4" }, resolvers);
    const video = container.querySelector("video")!;
    expect(video.getAttribute("preload")).toBe("metadata");
    expect(video.getAttribute("poster")).toBe("/m/c.mp4/poster?w=1280");
    expect(video.style.aspectRatio).toBe("16 / 9");
  });

  it("shows audio in a card with its running time", () => {
    const { resolvers } = host({ "s.mp3": { durationMs: 185_000 } });
    const { container } = draw({ target: "s.mp3" }, resolvers);
    expect(container.querySelector("audio")).toBeTruthy();
    expect(container.textContent).toContain("3:05");
  });

  it("shows documents as a card with type and size, plus the host's expansion", () => {
    const { resolvers } = host({ "q3.pdf": { size: 2_400_000 } });
    const { container } = draw({ target: "q3.pdf", fragment: "page=3" }, resolvers);
    expect(container.querySelector(".luthor-media__card-icon")!.textContent).toBe("PDF");
    expect(container.textContent).toContain("PDF · 2.3 MB");
    expect(screen.getByTestId("expansion").textContent).toBe("viewer page=3");
  });

  it("renders inline embeds as an inline frame with no caption", () => {
    const { resolvers } = host();
    const { container } = draw({ target: "i.png", inline: true, caption: "x" }, resolvers);
    expect(container.querySelector("span.luthor-media--inline")).toBeTruthy();
    expect(container.querySelector("figcaption")).toBeNull();
  });

  it("aligns and captions a block", () => {
    const { resolvers } = host();
    const { container } = draw({ target: "a.png", align: "center", caption: "Dusk" }, resolvers);
    expect(container.querySelector("figure")!.getAttribute("data-align")).toBe("center");
    expect(container.querySelector("figcaption")!.textContent).toBe("Dusk");
  });
});
