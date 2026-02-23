import { describe, expect, it } from "vitest";
import { EmojiExtension } from "./EmojiExtension";

const FALLBACK_MIN_ITEMS = 10;

function createEditorStub() {
  return {
    update: () => {},
  };
}

describe("EmojiExtension optional dependency behavior", () => {
  it("keeps fallback catalog when external emoji dataset is unavailable", async () => {
    delete (globalThis as Record<string, unknown>).__EMOJI_MART_DATA__;
    delete (globalThis as Record<string, unknown>).EmojiMart;

    const extension = new EmojiExtension({ autoDetectExternalCatalog: true });
    await (extension as unknown as { tryEnableExternalCatalog: () => Promise<void> }).tryEnableExternalCatalog();

    const catalog = extension
      .getCommands(createEditorStub() as never)
      .getEmojiCatalog();
    expect(catalog.length).toBeGreaterThanOrEqual(FALLBACK_MIN_ITEMS);
  });

  it("switches to detected global emoji dataset when available", async () => {
    (globalThis as Record<string, unknown>).__EMOJI_MART_DATA__ = {
      emojis: {
        smile: {
          name: "Smile",
          shortcodes: ["smile"],
          skins: [{ native: "😄" }],
          keywords: ["happy"],
        },
      },
    };

    const extension = new EmojiExtension({ autoDetectExternalCatalog: true });
    await (extension as unknown as { tryEnableExternalCatalog: () => Promise<void> }).tryEnableExternalCatalog();

    const catalog = extension
      .getCommands(createEditorStub() as never)
      .getEmojiCatalog();
    expect(catalog.some((entry) => entry.shortcodes.includes("smile"))).toBe(true);

    delete (globalThis as Record<string, unknown>).__EMOJI_MART_DATA__;
  });
});

