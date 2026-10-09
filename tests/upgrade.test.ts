import { createHash } from "node:crypto";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { describe, expect, test } from "bun:test";
import { releaseTarget, upgrade, verifyArchive } from "../src/upgrade.ts";

describe("Alab upgrade", () => {
  test("selects exactly the four published platforms", () => {
    expect(releaseTarget("darwin", "arm64")).toBe("darwin-arm64");
    expect(releaseTarget("darwin", "x64")).toBe("darwin-x64");
    expect(releaseTarget("linux", "arm64")).toBe("linux-arm64");
    expect(releaseTarget("linux", "x64")).toBe("linux-x64");
    expect(() => releaseTarget("win32", "x64")).toThrow("macOS and Linux only");
    expect(() => releaseTarget("linux", "riscv64")).toThrow("arm64 and x64 only");
  });

  test("rejects a mismatched archive checksum", () => {
    const archive = new TextEncoder().encode("archive");
    const filename = "alab-linux-x64.tar.gz";
    const valid = createHash("sha256").update(archive).digest("hex");
    expect(() => verifyArchive(archive, `${valid}  ${filename}\n`, filename)).not.toThrow();
    expect(() => verifyArchive(archive, `${valid}  dist/${filename}\n`, filename)).not.toThrow();
    expect(() => verifyArchive(archive, `${"0".repeat(64)}  ${filename}\n`, filename)).toThrow("SHA-256 mismatch");
    expect(() => verifyArchive(archive, `${valid}  another.tar.gz\n`, filename)).toThrow("no unique entry");
  });

  test("--check reports the release without downloading or changing the binary", async () => {
    const calls: string[] = [];
    const output: string[] = [];
    const request = async (input: string | URL | Request): Promise<Response> => {
      calls.push(String(input));
      return Response.json({
        tag_name: "v1.1.0",
        assets: [
          { name: "alab-darwin-arm64.tar.gz", browser_download_url: "https://example.test/archive" },
          { name: "SHA256SUMS", browser_download_url: "https://example.test/sums" },
        ],
      });
    };
    await upgrade({ check: true }, {
      platform: "darwin",
      arch: "arm64",
      executablePath: "/does/not/exist",
      currentVersion: "alab 1.0.0\npages 3.0.0 (pages-pin)\nreview 0.1.0 (review-pin)",
      fetch: request as typeof fetch,
      print: (text) => output.push(text),
    });
    expect(calls).toEqual(["https://api.github.com/repos/agentlab-in/alab-cli/releases/latest"]);
    expect(output).toEqual(["Current:\nalab 1.0.0\npages 3.0.0 (pages-pin)\nreview 0.1.0 (review-pin)\nAvailable: v1.1.0 (alab-darwin-arm64.tar.gz)"]);
  });

  test("verifies and swaps a candidate beside the current executable", async () => {
    const directory = await mkdtemp(join(tmpdir(), "alab-upgrade-test-"));
    const executable = join(directory, "alab");
    const before = "#!/bin/sh\necho 'alab 1.0.0'\necho 'pages old'\necho 'review old'\n";
    const after = "#!/bin/sh\necho 'alab 1.1.0'\necho 'pages new'\necho 'review new'\n";
    const header = Buffer.alloc(512);
    header.write("alab", 0);
    header.write(`${Buffer.byteLength(after).toString(8).padStart(11, "0")}\0`, 124);
    header[156] = 48;
    const tar = Buffer.concat([header, Buffer.from(after), Buffer.alloc((512 - Buffer.byteLength(after) % 512) % 512), Buffer.alloc(1024)]);
    const archive = gzipSync(tar);
    const archiveName = "alab-linux-x64.tar.gz";
    const checksum = createHash("sha256").update(archive).digest("hex");
    const output: string[] = [];
    try {
      await writeFile(executable, before);
      await chmod(executable, 0o755);
      const request = async (input: string | URL | Request): Promise<Response> => {
        const url = String(input);
        if (url.endsWith("/latest")) return Response.json({ tag_name: "v1.1.0", assets: [
          { name: archiveName, browser_download_url: "https://example.test/archive" },
          { name: "SHA256SUMS", browser_download_url: "https://example.test/sums" },
        ] });
        if (url.endsWith("/archive")) return new Response(archive);
        if (url.endsWith("/sums")) return new Response(`${checksum}  ${archiveName}\n`);
        throw new Error(`Unexpected request: ${url}`);
      };
      await upgrade({ force: true }, {
        platform: "linux", arch: "x64", executablePath: executable,
        currentVersion: "alab 1.0.0\npages old\nreview old",
        fetch: request as typeof fetch, print: (text) => output.push(text),
      });
      expect(await readFile(executable, "utf8")).toBe(after);
      expect(output).toEqual(["Before:\nalab 1.0.0\npages old\nreview old\nAfter:\nalab 1.1.0\npages new\nreview new"]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
