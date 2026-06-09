import { describe, expect, it } from "vitest";

import { wordsQuerySchema } from "../wordSchemas";

describe("wordsQuerySchema", () => {
  it("defaults to the fast list shape without progress or totals", () => {
    const parsed = wordsQuerySchema.parse({});

    expect(parsed.includeProgress).toBe(false);
    expect(parsed.includeTotal).toBe(false);
  });

  it("accepts opt-in progress and total flags", () => {
    const parsed = wordsQuerySchema.parse({
      includeProgress: "true",
      includeTotal: "true",
    });

    expect(parsed.includeProgress).toBe(true);
    expect(parsed.includeTotal).toBe(true);
  });
});
