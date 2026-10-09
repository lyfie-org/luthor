/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/*
 * Uploads in flight, as local (never synced) state.
 *
 * The document holds only an UploadPlaceholderNode — id, name, size, kind —
 * because the document is shared: collaborators must see "Uploading …" and
 * nothing else, and a `blob:` URL means nothing outside this tab. Everything
 * that exists only here lives in this registry, keyed by upload id: progress,
 * the preview URL, the abort handle, the error, and how to retry.
 */

export type UploadStatus = "queued" | "uploading" | "error";

export interface UploadTask {
  id: string;
  file: File;
  status: UploadStatus;
  /** 0–1, when the host reports progress. */
  progress: number | null;
  /** A local preview of a picture (object URL), revoked when the task ends. */
  previewUrl: string | null;
  error: string | null;
  /** Abort the request (or drop it from the queue). */
  cancel: () => void;
  /** Try again after an error. */
  retry: () => void;
}

const tasks = new Map<string, UploadTask>();
const listeners = new Set<() => void>();
let version = 0;

function notify(): void {
  version++;
  listeners.forEach((listener) => listener());
}

export const uploadRegistry = {
  get(id: string): UploadTask | undefined {
    return tasks.get(id);
  },
  /** Changes whenever any task does (for useSyncExternalStore snapshots). */
  version(): number {
    return version;
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  set(task: UploadTask): void {
    tasks.set(task.id, task);
    notify();
  },
  update(id: string, patch: Partial<UploadTask>): void {
    const current = tasks.get(id);
    if (!current) return;
    tasks.set(id, { ...current, ...patch });
    notify();
  },
  delete(id: string): void {
    const current = tasks.get(id);
    if (!current) return;
    if (current.previewUrl) URL.revokeObjectURL(current.previewUrl);
    tasks.delete(id);
    notify();
  },
};

/*
 * The local preview of a picture that just finished uploading, by the name it
 * was stored under. The embed that replaces the placeholder shows it while the
 * stored copy downloads, so the picture never blinks out between "uploaded" and
 * "loaded". Each lasts a couple of minutes, then its object URL is released.
 */
const PREVIEW_TTL_MS = 2 * 60 * 1000;
const recentPreviews = new Map<string, string>();

export const uploadPreviews = {
  /** Keep `url` (an object URL this module now owns) as `target`'s preview. */
  remember(target: string, url: string): void {
    const previous = recentPreviews.get(target);
    if (previous && previous !== url) URL.revokeObjectURL(previous);
    recentPreviews.set(target, url);
    setTimeout(() => {
      if (recentPreviews.get(target) !== url) return;
      recentPreviews.delete(target);
      URL.revokeObjectURL(url);
    }, PREVIEW_TTL_MS);
  },
  get(target: string): string | undefined {
    return recentPreviews.get(target);
  },
};

export function createUploadId(): string {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "")
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `up-${random.slice(0, 20)}`;
}

/**
 * Runs at most `limit` jobs at a time, in the order they were queued. A phone's
 * worth of photos dropped at once must not open fifty requests together.
 */
export class UploadQueue {
  private running = 0;
  private readonly waiting: Array<() => void> = [];

  constructor(private readonly limit = 3) {}

  run<T>(job: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const start = () => {
        this.running++;
        job().then(resolve, reject).finally(() => {
          this.running--;
          this.waiting.shift()?.();
        });
      };
      if (this.running < this.limit) start();
      else this.waiting.push(start);
    });
  }
}
