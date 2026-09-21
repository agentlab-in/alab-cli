import { describe, expect, test } from "bun:test";
import { versionText } from "../src/cli.ts";
import pins from "../pins.json";

function run(args: string[]) {
  return Bun.spawnSync([process.execPath, "src/cli.ts", ...args], {
    cwd: import.meta.dir + "/..",
    env: {},
    stdout: "pipe",
    stderr: "pipe",
  });
}

describe("Alab router", () => {
  test("reports combined and pinned tool versions", () => {
    expect(versionText()).toBe(`alab 1.0.0\npages 3.0.0 (${pins.pages.commit})\nreview 0.1.0 (${pins.review.commit})`);
  });

  test("routes Pages help with exact successful streams", () => {
    const result = run(["pages", "--help"]);
    const stdout = result.stdout.toString();

    expect(result.exitCode).toBe(0);
    expect(result.stderr.toString()).toBe("");
    expect(stdout.match(/^Usage:/gm)).toHaveLength(1);
    expect(stdout).toContain("Usage: alab pages [options] [command]");
    expect(stdout).toContain("put [options] [dir]");
  });

  test("routes Review help with exact successful streams", () => {
    const result = run(["review", "--help"]);
    const stdout = result.stdout.toString();

    expect(result.exitCode).toBe(0);
    expect(result.stderr.toString()).toBe("");
    expect(stdout.match(/^Usage:/gm)).toHaveLength(1);
    expect(stdout).toContain("Usage: alab review [options] [command]");
    expect(stdout).toContain("start [options] [dir]");
  });

  test("returns an exact error status without polluting stdout", () => {
    const result = run(["unknown"]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout.toString()).toBe("");
    expect(result.stderr.toString()).toBe("Error: unknown tool 'unknown'. Run 'alab --help'.\n");
  });

  test("rejects top-level Pages commands outside the pages tool", () => {
    const result = run(["put"]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout.toString()).toBe("");
    expect(result.stderr.toString()).toBe("Error: unknown tool 'put'. Run 'alab --help'.\n");
  });

  test("rejects top-level Review commands outside the review tool", () => {
    const result = run(["start"]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout.toString()).toBe("");
    expect(result.stderr.toString()).toBe("Error: unknown tool 'start'. Run 'alab --help'.\n");
  });
});
