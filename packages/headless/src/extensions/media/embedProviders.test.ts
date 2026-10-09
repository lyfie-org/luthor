/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { describe, expect, it } from "vitest";
import { toEmbeddableUrl } from "./embedProviders";

const src = (input: string) => toEmbeddableUrl(input)?.src ?? null;

describe("toEmbeddableUrl — maps", () => {
  it("keeps a Google Maps embed link as it is", () => {
    const link = "https://www.google.com/maps/embed?pb=!1m18!1m12";
    expect(src(link)).toBe(link);
  });

  it("frames a Google Maps place link as that place, pinned", () => {
    const out = src(
      "https://www.google.com/maps/place/Nikkawahama+Beach/@35.84,140.80,15z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d35.8432!4d140.8061",
    );
    const url = new URL(out!);
    expect(url.origin + url.pathname).toBe("https://www.google.com/maps");
    expect(url.searchParams.get("q")).toBe("Nikkawahama Beach");
    expect(url.searchParams.get("ll")).toBe("35.8432,140.8061");
    expect(url.searchParams.get("z")).toBe("15");
    expect(url.searchParams.get("output")).toBe("embed");
  });

  it("frames a search, a bare position, a ?q= link and directions", () => {
    expect(new URL(src("https://www.google.com/maps/search/coffee+near+me/@51.5,-0.12,14z")!).searchParams.get("q")).toBe("coffee near me");
    expect(new URL(src("https://www.google.com/maps/@48.8584,2.2945,17z")!).searchParams.get("q")).toBe("48.8584,2.2945");
    expect(new URL(src("https://maps.google.com/?q=Eiffel+Tower")!).searchParams.get("q")).toBe("Eiffel Tower");
    const dir = new URL(src("https://www.google.com/maps/dir/Paris/Lyon/")!);
    expect(dir.searchParams.get("saddr")).toBe("Paris");
    expect(dir.searchParams.get("daddr")).toBe("Lyon");
  });

  it("works on country Google domains", () => {
    expect(src("https://www.google.co.uk/maps/place/Big+Ben/@51.5,-0.12,17z")).toContain("output=embed");
  });

  it("shows an Apple Maps link as the same place on an embeddable map", () => {
    const out = new URL(src("https://maps.apple.com/?q=Golden+Gate+Bridge&ll=37.8199,-122.4783&z=14")!);
    expect(out.searchParams.get("q")).toBe("Golden Gate Bridge");
    expect(out.searchParams.get("ll")).toBe("37.8199,-122.4783");
    expect(toEmbeddableUrl("https://maps.apple.com/place?coordinate=35.6,139.7&name=Tokyo")?.provider).toBe("apple-maps");
    expect(src("https://maps.apple.com/?address=1+Infinite+Loop,+Cupertino")).toContain("output=embed");
  });

  it("returns null for an opaque Apple Maps short link (the host resolves it)", () => {
    expect(toEmbeddableUrl("https://maps.apple.com/p/abc123")).toBeNull();
  });

  it("frames an OpenStreetMap link with its marker", () => {
    const out = src("https://www.openstreetmap.org/?mlat=51.5&mlon=-0.12#map=15/51.5/-0.12")!;
    expect(out).toContain("openstreetmap.org/export/embed.html");
    expect(out).toContain("marker=51.5%2C-0.12");
  });

  it("ignores Google pages that aren't maps", () => {
    expect(toEmbeddableUrl("https://www.google.com/search?q=maps")).toBeNull();
  });
});

describe("toEmbeddableUrl — media and documents", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m5s", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=65"],
    ["https://youtu.be/dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
    ["https://vimeo.com/76979871", "https://player.vimeo.com/video/76979871"],
    ["https://open.spotify.com/intl-de/track/4uLU6hMCjMI75M1A2tKUQC", "https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC"],
    ["https://www.loom.com/share/abc123def", "https://www.loom.com/embed/abc123def"],
    ["https://codepen.io/someone/pen/xyzAB", "https://codepen.io/someone/embed/xyzAB?default-tab=result"],
    ["https://docs.google.com/document/d/1AbC/edit?usp=sharing", "https://docs.google.com/document/d/1AbC/preview"],
    ["https://docs.google.com/presentation/d/1AbC/edit", "https://docs.google.com/presentation/d/1AbC/embed"],
    ["https://drive.google.com/file/d/1XyZ/view?usp=sharing", "https://drive.google.com/file/d/1XyZ/preview"],
    ["https://www.dailymotion.com/video/x8abc12", "https://www.dailymotion.com/embed/video/x8abc12"],
    ["https://www.tiktok.com/@someone/video/7234567890123456789", "https://www.tiktok.com/embed/v2/7234567890123456789"],
    ["https://www.instagram.com/p/Cabc123/", "https://www.instagram.com/p/Cabc123/embed"],
    ["https://x.com/someone/status/1234567890", "https://platform.twitter.com/embed/Tweet.html?id=1234567890"],
  ])("%s", (input, expected) => {
    expect(src(input)).toBe(expected);
  });

  it("gives a song its player's compact height", () => {
    expect(toEmbeddableUrl("https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC")?.height).toBe(152);
    expect(toEmbeddableUrl("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M")?.height).toBe(352);
  });

  it("wraps SoundCloud and Figma links in their players", () => {
    expect(src("https://soundcloud.com/artist/track-name")).toBe(
      `https://w.soundcloud.com/player/?url=${encodeURIComponent("https://soundcloud.com/artist/track-name")}`,
    );
    expect(src("https://www.figma.com/design/AbC/My-file")).toContain("figma.com/embed?embed_host=share&url=");
  });

  it("accepts a link without its scheme", () => {
    expect(src("youtu.be/dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  });

  it("returns null for ordinary pages and anything that isn't http(s)", () => {
    expect(toEmbeddableUrl("https://example.com/article")).toBeNull();
    expect(toEmbeddableUrl("javascript:alert(1)")).toBeNull();
    expect(toEmbeddableUrl("")).toBeNull();
    expect(toEmbeddableUrl("https://www.youtube.com/@channel")).toBeNull();
  });
});
