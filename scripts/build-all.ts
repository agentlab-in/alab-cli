import { mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dir, "..");
const dist = resolve(root, "dist");
const targets = ["bun-darwin-arm64", "bun-darwin-x64", "bun-linux-x64", "bun-linux-arm64"];

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

for (const target of targets) {
  const name = target.replace(/^bun-/, "");
  const result = spawnSync("bun", ["build", "--compile", "--minify", `--target=${target}`, `--outfile=${resolve(dist, `alab-${name}`)}`, resolve(root, "src/cli.ts")], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
