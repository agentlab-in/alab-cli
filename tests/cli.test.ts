import { describe, expect, test } from "bun:test";
import { versionText } from "../src/cli.ts";
import pins from "../pins.json";

describe("Alab router", () => {
  test("reports combined and pinned Pages versions", () => {
    expect(versionText()).toBe(`alab 0.1.0\npages 2.0.0 (${pins.pages.commit})`);
  });
});
