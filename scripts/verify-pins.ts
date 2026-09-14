import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import pins from "../pins.json";
import pagesPackage from "../vendor/pages/package.json";

const root = resolve(import.meta.dir, "..");
const packagePath = resolve(root, "vendor/pages/package.json");
const revision = spawnSync("git", ["-C", resolve(root, "vendor/pages"), "rev-parse", "HEAD"], { encoding: "utf8" });

if (revision.status !== 0) throw new Error(revision.stderr.trim() || "Could not read Pages revision");
if (revision.stdout.trim() !== pins.pages.commit) throw new Error(`Pages revision mismatch: ${revision.stdout.trim()}`);
if (pagesPackage.version !== pins.pages.version) throw new Error(`Pages version mismatch: ${pagesPackage.version}`);

const packageHash = createHash("sha256").update(readFileSync(packagePath)).digest("hex");
if (packageHash !== pins.pages.packageSha256) throw new Error(`Pages package hash mismatch: ${packageHash}`);

console.log(`pages ${pins.pages.version} ${pins.pages.commit} sha256:${packageHash}`);
