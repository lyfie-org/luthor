import { describe, expect, it } from "vitest";
import { __TEST_ONLY_CODE_EXTENSION_INTERNALS } from "./CodeExtension";

describe("CodeExtension preload mode resolution", () => {
  it("defaults grammar preload mode to lazy", () => {
    const { resolveGrammarPreloadMode } = __TEST_ONLY_CODE_EXTENSION_INTERNALS;
    expect(resolveGrammarPreloadMode(undefined)).toBe("lazy");
  });

  it("keeps explicit preload mode selections", () => {
    const { resolveGrammarPreloadMode } = __TEST_ONLY_CODE_EXTENSION_INTERNALS;
    expect(resolveGrammarPreloadMode("lazy")).toBe("lazy");
    expect(resolveGrammarPreloadMode("idle")).toBe("idle");
    expect(resolveGrammarPreloadMode("eager")).toBe("eager");
  });
});

