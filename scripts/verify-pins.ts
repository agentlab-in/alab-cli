import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import pins from "../pins.json";
import pagesPackage from "../vendor/pages/package.json";
import reviewPackage from "../vendor/review/package.json";

const root = resolve(import.meta.dir, "..");

const tools = [
  { name: "pages", pin: pins.pages, version: pagesPackage.version },
  { name: "review", pin: pins.review, version: reviewPackage.version },
] as const;

for (const tool of tools) {
  const packagePath = resolve(root, `vendor/${tool.name}/package.json`);
  const revision = spawnSync("git", ["-C", resolve(root, `vendor/${tool.name}`), "rev-parse", "HEAD"], { encoding: "utf8" });

  if (revision.status !== 0) throw new Error(revision.stderr.trim() || `Could not read ${tool.name} revision`);
  if (revision.stdout.trim() !== tool.pin.commit) throw new Error(`${tool.name} revision mismatch: ${revision.stdout.trim()}`);
  if (tool.version !== tool.pin.version) throw new Error(`${tool.name} version mismatch: ${tool.version}`);

  const packageHash = createHash("sha256").update(readFileSync(packagePath)).digest("hex");
  if (packageHash !== tool.pin.packageSha256) throw new Error(`${tool.name} package hash mismatch: ${packageHash}`);

  console.log(`${tool.name} ${tool.pin.version} ${tool.pin.commit} sha256:${packageHash}`);
}
