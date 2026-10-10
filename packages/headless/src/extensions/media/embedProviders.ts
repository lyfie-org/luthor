/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/*
 * The link a person has → the link a page can be framed from.
 *
 * Nobody should have to know that a map is embedded from `/maps/embed?pb=…`
 * or a song from `/embed/track/…`. People paste what is in their address bar
 * or share sheet; this turns the common ones into their embeddable form, with
 * the shape the service's player wants. Pure and synchronous — no network, no
 * API keys. Links it doesn't recognise return `null` (a host can then check
 * them on its server: short links, oEmbed, whether the site allows framing).
 */

/** An embeddable rendition of a link. */
export interface EmbeddableUrl {
  /** The URL to put in the frame. */
  src: string;
  /** Which service it is (`google-maps`, `spotify`, …). */
  provider: string;
  /** The player's natural size, when the service has one. */
  width?: number;
  height?: number;
  /** A short description for the frame's title. */
  title?: string;
}

function parse(input: string): URL | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

function hostIs(url: URL, ...hosts: string[]): boolean {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  return hosts.some((h) => host === h || host.endsWith(`.${h}`));
}

/** `google.com`, `google.co.uk`, `google.de`… */
function isGoogleHost(url: URL): boolean {
  return /(^|\.)google\.[a-z.]{2,6}$/i.test(url.hostname);
}

const COORD = /^-?\d{1,3}(?:\.\d+)?$/;

function coordinates(lat?: string | null, lng?: string | null): string | null {
  if (!lat || !lng || !COORD.test(lat) || !COORD.test(lng)) return null;
  const a = Number(lat);
  const b = Number(lng);
  return Math.abs(a) <= 90 && Math.abs(b) <= 180 ? `${a},${b}` : null;
}

function decodeSegment(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
}

/** The keyless Google Maps embed: a query (a place, an address, coordinates). */
/** Street level: where a pin dropped without a zoom of its own is shown. */
const DEFAULT_PIN_ZOOM = 15;

function googleMapsEmbed(query: string, near?: string | null, zoom?: string | null): string {
  const params = new URLSearchParams({ q: query });
  if (near) params.set("ll", near);
  if (zoom && /^\d{1,2}(\.\d+)?$/.test(zoom)) params.set("z", String(Math.round(Number(zoom))));
  // A pin with no zoom (a shared pin, an Apple Maps place) opened on the whole
  // world: show the street it is on instead.
  else if (near) params.set("z", String(DEFAULT_PIN_ZOOM));
  params.set("output", "embed");
  return `https://www.google.com/maps?${params.toString()}`;
}

const MAP_SIZE = { width: 640, height: 400 };

function googleMaps(url: URL): EmbeddableUrl | null {
  const path = url.pathname;
  const onMapsHost = /^maps\./i.test(url.hostname) || path === "/maps" || path.startsWith("/maps/");
  if (!onMapsHost || !(isGoogleHost(url) || /^maps\.google\./i.test(url.hostname))) return null;
  const done = (src: string, title = "Map"): EmbeddableUrl => ({ src, provider: "google-maps", title, ...MAP_SIZE });

  // Already an embed.
  if (path.startsWith("/maps/embed") || url.searchParams.get("output") === "embed") {
    return done(url.toString());
  }
  // `@lat,lng,15z` anywhere in the path.
  const at = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,(\d+(?:\.\d+)?)z)?/.exec(path);
  const near = at ? coordinates(at[1], at[2]) : null;
  const zoom = at?.[3] ?? url.searchParams.get("z");
  // A place's own pin, from the `data=…!3dLAT!4dLNG` blob.
  const pin = /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/.exec(decodeSegment(path + url.search));
  const pinned = pin ? coordinates(pin[1], pin[2]) : null;

  const segments = path.split("/").filter(Boolean);
  const kind = segments[1];
  if ((kind === "place" || kind === "search") && segments[2] && !segments[2].startsWith("@")) {
    const name = decodeSegment(segments[2]);
    return done(googleMapsEmbed(name, pinned ?? near, zoom), name);
  }
  if (kind === "dir") {
    const stops = segments.slice(2).filter((s) => !s.startsWith("@") && !s.startsWith("data="));
    if (stops.length >= 2) {
      const params = new URLSearchParams({
        saddr: decodeSegment(stops[0]!),
        daddr: decodeSegment(stops[stops.length - 1]!),
        output: "embed",
      });
      return done(`https://www.google.com/maps?${params.toString()}`, "Directions");
    }
  }
  const q = url.searchParams.get("q") ?? url.searchParams.get("query") ?? url.searchParams.get("destination");
  if (q) return done(googleMapsEmbed(q, near, zoom), q);
  const ll = url.searchParams.get("ll") ?? url.searchParams.get("center");
  const fromLl = ll ? coordinates(...(ll.split(",") as [string, string])) : null;
  if (pinned ?? near ?? fromLl) {
    const point = (pinned ?? near ?? fromLl)!;
    return done(googleMapsEmbed(point, point, zoom));
  }
  return null;
}

/**
 * Apple Maps has no keyless embed. Its share links carry what is needed —
 * a name, an address, coordinates — so they are shown as the same place on
 * the embeddable Google map. Opaque `/p/…` links return null (a host can
 * resolve them on its server).
 */
function appleMaps(url: URL): EmbeddableUrl | null {
  if (!hostIs(url, "maps.apple.com", "maps.apple")) return null;
  const p = url.searchParams;
  const point =
    coordinates(...((p.get("coordinate") ?? p.get("ll") ?? p.get("sll") ?? "").split(",") as [string, string])) ??
    coordinates(p.get("latitude"), p.get("longitude"));
  const name = p.get("name") ?? p.get("q") ?? p.get("address") ?? p.get("daddr");
  const zoom = p.get("z");
  if (p.get("saddr") && p.get("daddr")) {
    const params = new URLSearchParams({ saddr: p.get("saddr")!, daddr: p.get("daddr")!, output: "embed" });
    return { src: `https://www.google.com/maps?${params.toString()}`, provider: "apple-maps", title: "Directions", ...MAP_SIZE };
  }
  if (!name && !point) return null;
  return {
    src: googleMapsEmbed(name ?? point!, point, zoom),
    provider: "apple-maps",
    title: name ?? "Map",
    ...MAP_SIZE,
  };
}

function openStreetMap(url: URL): EmbeddableUrl | null {
  if (!hostIs(url, "openstreetmap.org")) return null;
  if (url.pathname.startsWith("/export/embed")) return { src: url.toString(), provider: "openstreetmap", ...MAP_SIZE };
  const hash = /map=(\d{1,2})\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/.exec(url.hash);
  const marker = coordinates(url.searchParams.get("mlat"), url.searchParams.get("mlon"));
  const center = hash ? coordinates(hash[2], hash[3]) : marker;
  if (!center) return null;
  const zoom = hash ? Number(hash[1]) : 15;
  const [lat, lng] = center.split(",").map(Number) as [number, number];
  // A box around the centre that shows roughly that zoom level.
  const span = 360 / 2 ** zoom;
  const bbox = [lng - span, lat - span / 2, lng + span, lat + span / 2].map((n) => n.toFixed(5)).join(",");
  const params = new URLSearchParams({ bbox, layer: "mapnik" });
  if (marker) params.set("marker", marker);
  return { src: `https://www.openstreetmap.org/export/embed.html?${params.toString()}`, provider: "openstreetmap", title: "Map", ...MAP_SIZE };
}

function youTube(url: URL): EmbeddableUrl | null {
  let id: string | null = null;
  if (hostIs(url, "youtu.be")) id = url.pathname.split("/")[1] ?? null;
  else if (hostIs(url, "youtube.com", "youtube-nocookie.com")) {
    const [first, second] = url.pathname.split("/").filter(Boolean);
    if (first === "watch") id = url.searchParams.get("v");
    else if (first && ["embed", "shorts", "live", "v"].includes(first)) id = second ?? null;
  }
  if (!id || !/^[\w-]{6,20}$/.test(id)) return null;
  const start = url.searchParams.get("t") ?? url.searchParams.get("start");
  const seconds = start ? parseTime(start) : 0;
  const shorts = url.pathname.startsWith("/shorts/");
  return {
    src: `https://www.youtube-nocookie.com/embed/${id}${seconds > 0 ? `?start=${seconds}` : ""}`,
    provider: "youtube",
    title: "YouTube video",
    ...(shorts ? { width: 360, height: 640 } : { width: 640, height: 360 }),
  };
}

function parseTime(value: string): number {
  if (/^\d+$/.test(value)) return Number(value);
  const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value);
  return match ? Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0) : 0;
}

function spotify(url: URL): EmbeddableUrl | null {
  if (!hostIs(url, "open.spotify.com")) return null;
  const parts = url.pathname.split("/").filter(Boolean).filter((p) => !p.startsWith("intl-"));
  if (parts[0] === "embed") return { src: url.toString(), provider: "spotify", width: 640, height: 352 };
  const [type, id] = parts;
  if (!type || !id || !["track", "album", "playlist", "episode", "show", "artist"].includes(type)) return null;
  const compact = type === "track" || type === "episode";
  return { src: `https://open.spotify.com/embed/${type}/${id}`, provider: "spotify", title: "Spotify", width: 640, height: compact ? 152 : 352 };
}

/**
 * The common services, by host. Each takes a parsed link and returns its
 * embeddable form, or null when the link is something of theirs that can't be
 * embedded (a profile page, a search).
 */
const PROVIDERS: Array<(url: URL) => EmbeddableUrl | null> = [
  googleMaps,
  appleMaps,
  openStreetMap,
  youTube,
  spotify,
  (url) => {
    if (!hostIs(url, "vimeo.com")) return null;
    if (hostIs(url, "player.vimeo.com")) return { src: url.toString(), provider: "vimeo", width: 640, height: 360 };
    const id = url.pathname.split("/").filter(Boolean).find((s) => /^\d+$/.test(s));
    return id ? { src: `https://player.vimeo.com/video/${id}`, provider: "vimeo", title: "Vimeo video", width: 640, height: 360 } : null;
  },
  (url) =>
    hostIs(url, "soundcloud.com") && !hostIs(url, "w.soundcloud.com") && url.pathname.split("/").filter(Boolean).length >= 2
      ? { src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url.toString())}`, provider: "soundcloud", title: "SoundCloud", width: 640, height: 166 }
      : null,
  (url) => {
    const m = hostIs(url, "loom.com") ? /^\/(?:share|embed)\/([\w-]+)/.exec(url.pathname) : null;
    return m ? { src: `https://www.loom.com/embed/${m[1]}`, provider: "loom", title: "Loom video", width: 640, height: 360 } : null;
  },
  (url) =>
    hostIs(url, "figma.com") && /^\/(file|design|proto|board|slides)\//.test(url.pathname)
      ? { src: `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url.toString())}`, provider: "figma", title: "Figma", width: 800, height: 450 }
      : null,
  (url) => {
    const m = hostIs(url, "codepen.io") ? /^\/([\w-]+)\/(?:pen|embed)\/([\w-]+)/.exec(url.pathname) : null;
    return m ? { src: `https://codepen.io/${m[1]}/embed/${m[2]}?default-tab=result`, provider: "codepen", title: "CodePen", width: 800, height: 450 } : null;
  },
  (url) => {
    const m = hostIs(url, "codesandbox.io") ? /^\/(?:s|p\/sandbox|embed)\/([\w-]+)/.exec(url.pathname) : null;
    return m ? { src: `https://codesandbox.io/embed/${m[1]}`, provider: "codesandbox", title: "CodeSandbox", width: 800, height: 500 } : null;
  },
  (url) => {
    if (!hostIs(url, "docs.google.com")) return null;
    const m = /^\/(document|spreadsheets|presentation|forms)\/d\/(e\/)?([\w-]+)/.exec(url.pathname);
    if (!m) return null;
    const [, type, published, id] = m;
    const base = `https://docs.google.com/${type}/d/${published ?? ""}${id}`;
    const src =
      type === "forms" ? `${base}/viewform?embedded=true`
        : type === "presentation" ? `${base}/embed`
          : published ? `${base}/pubhtml?widget=true&headers=false` : `${base}/preview`;
    return { src, provider: "google-docs", title: "Google document", width: 800, height: 600 };
  },
  (url) => {
    const m = hostIs(url, "drive.google.com") ? /^\/file\/d\/([\w-]+)/.exec(url.pathname) : null;
    return m ? { src: `https://drive.google.com/file/d/${m[1]}/preview`, provider: "google-drive", title: "Google Drive file", width: 800, height: 600 } : null;
  },
  (url) => {
    const m = hostIs(url, "dailymotion.com") ? /^\/(?:embed\/)?video\/([\w]+)/.exec(url.pathname) : hostIs(url, "dai.ly") ? /^\/([\w]+)/.exec(url.pathname) : null;
    return m ? { src: `https://www.dailymotion.com/embed/video/${m[1]}`, provider: "dailymotion", title: "Dailymotion video", width: 640, height: 360 } : null;
  },
  (url) => {
    if (!hostIs(url, "twitch.tv") || typeof window === "undefined") return null;
    const parent = window.location.hostname;
    const parts = url.pathname.split("/").filter(Boolean);
    const params = new URLSearchParams({ parent });
    if (parts[0] === "videos" && parts[1]) params.set("video", parts[1]);
    else if (parts.length === 1 && parts[0]) params.set("channel", parts[0]);
    else return null;
    return { src: `https://player.twitch.tv/?${params.toString()}`, provider: "twitch", title: "Twitch", width: 640, height: 360 };
  },
  (url) => {
    const m = hostIs(url, "tiktok.com") ? /\/video\/(\d+)/.exec(url.pathname) : null;
    return m ? { src: `https://www.tiktok.com/embed/v2/${m[1]}`, provider: "tiktok", title: "TikTok video", width: 340, height: 720 } : null;
  },
  (url) => {
    const m = hostIs(url, "instagram.com") ? /^\/(p|reel|tv)\/([\w-]+)/.exec(url.pathname) : null;
    return m ? { src: `https://www.instagram.com/${m[1]}/${m[2]}/embed`, provider: "instagram", title: "Instagram post", width: 400, height: 560 } : null;
  },
  (url) => {
    const m = hostIs(url, "twitter.com", "x.com") ? /^\/[\w]+\/status(?:es)?\/(\d+)/.exec(url.pathname) : null;
    return m ? { src: `https://platform.twitter.com/embed/Tweet.html?id=${m[1]}`, provider: "x", title: "Post on X", width: 550, height: 520 } : null;
  },
  (url) => {
    const m = hostIs(url, "miro.com") ? /^\/app\/(?:board|live-embed)\/([\w=-]+)/.exec(url.pathname) : null;
    return m ? { src: `https://miro.com/app/live-embed/${m[1]}/`, provider: "miro", title: "Miro board", width: 800, height: 500 } : null;
  },
  (url) => {
    const m = hostIs(url, "canva.com") ? /^\/design\/([\w-]+)\/([\w-]+)/.exec(url.pathname) : null;
    return m ? { src: `https://www.canva.com/design/${m[1]}/${m[2]}/view?embed`, provider: "canva", title: "Canva design", width: 800, height: 450 } : null;
  },
];

/**
 * The embeddable form of a link from a service people commonly embed — a map
 * (Google, Apple, OpenStreetMap), a video or song, a design, a document — or
 * `null` when the link isn't one of those.
 */
export function toEmbeddableUrl(input: string): EmbeddableUrl | null {
  const url = parse(input);
  if (!url) return null;
  for (const provider of PROVIDERS) {
    const found = provider(url);
    if (found) return found;
  }
  return null;
}

/**
 * The page behind an embed: what a reader should land on when they choose to
 * open it — the video's watch page, the place on the map, the song — rather
 * than the bare player the frame shows. The reverse of {@link toEmbeddableUrl}
 * for the services it knows; any other URL is returned as it is.
 */
export function toPageUrl(input: string): string {
  const url = parse(input);
  if (!url) return input;
  const path = url.pathname;
  const parts = path.split("/").filter(Boolean);
  const p = url.searchParams;

  if ((isGoogleHost(url) || /^maps\.google\./i.test(url.hostname)) && p.get("output") === "embed") {
    p.delete("output");
    return url.toString();
  }
  if (hostIs(url, "openstreetmap.org") && path.startsWith("/export/embed")) {
    const marker = p.get("marker");
    const point = marker ? coordinates(...(marker.split(",") as [string, string])) : null;
    if (point) {
      const [lat, lng] = point.split(",");
      return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;
    }
    return "https://www.openstreetmap.org/";
  }
  if (hostIs(url, "youtube.com", "youtube-nocookie.com") && parts[0] === "embed" && parts[1]) {
    const start = p.get("start");
    return `https://www.youtube.com/watch?v=${parts[1]}${start ? `&t=${start}s` : ""}`;
  }
  if (hostIs(url, "open.spotify.com") && parts[0] === "embed") return `https://open.spotify.com/${parts.slice(1).join("/")}`;
  if (hostIs(url, "player.vimeo.com") && parts[0] === "video" && parts[1]) return `https://vimeo.com/${parts[1]}`;
  if (hostIs(url, "w.soundcloud.com") && p.get("url")) return p.get("url")!;
  if (hostIs(url, "loom.com") && parts[0] === "embed" && parts[1]) return `https://www.loom.com/share/${parts[1]}`;
  if (hostIs(url, "figma.com") && parts[0] === "embed" && p.get("url")) return p.get("url")!;
  if (hostIs(url, "codepen.io") && parts[1] === "embed" && parts[2]) return `https://codepen.io/${parts[0]}/pen/${parts[2]}`;
  if (hostIs(url, "codesandbox.io") && parts[0] === "embed" && parts[1]) return `https://codesandbox.io/s/${parts[1]}`;
  if (hostIs(url, "docs.google.com")) {
    const m = /^(\/(?:document|spreadsheets|presentation|forms)\/d\/(?:e\/)?[\w-]+)\/(?:preview|embed|pubhtml|viewform)$/.exec(path);
    if (m) return `https://docs.google.com${m[1]}${path.endsWith("/viewform") ? "/viewform" : ""}`;
  }
  if (hostIs(url, "drive.google.com") && parts[0] === "file" && parts[3] === "preview") return `https://drive.google.com/file/d/${parts[2]}/view`;
  if (hostIs(url, "dailymotion.com") && parts[0] === "embed" && parts[2]) return `https://www.dailymotion.com/video/${parts[2]}`;
  if (hostIs(url, "player.twitch.tv")) {
    if (p.get("video")) return `https://www.twitch.tv/videos/${p.get("video")}`;
    if (p.get("channel")) return `https://www.twitch.tv/${p.get("channel")}`;
  }
  if (hostIs(url, "instagram.com") && parts[2] === "embed") return `https://www.instagram.com/${parts[0]}/${parts[1]}/`;
  if (hostIs(url, "platform.twitter.com") && p.get("id")) return `https://x.com/i/status/${p.get("id")}`;
  if (hostIs(url, "miro.com") && parts[1] === "live-embed" && parts[2]) return `https://miro.com/app/board/${parts[2]}/`;
  if (hostIs(url, "canva.com") && p.has("embed")) {
    p.delete("embed");
    return url.toString();
  }
  return url.toString();
}

/** `maps.google.com` → `google.com`: the short site name shown on an embed's open link. */
export function displayHost(input: string): string {
  const url = parse(input);
  return url ? url.hostname.replace(/^www\./i, "") : input;
}
