import { createHash, randomUUID } from "node:crypto";
import { chmod, readFile, realpath, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { gunzipSync } from "node:zlib";

const RELEASES = "https://api.github.com/repos/agentlab-in/alab-cli/releases";

type Asset = { name: string; browser_download_url: string };
type Release = { tag_name: string; assets: Asset[] };

export type UpgradeOptions = { version?: string; check?: boolean; force?: boolean };
export type UpgradeDependencies = {
  fetch?: typeof fetch;
  platform?: string;
  arch?: string;
  executablePath?: string;
  currentVersion: string;
  print?: (text: string) => void;
};

export function releaseTarget(platform: string, arch: string): string {
  if (platform !== "darwin" && platform !== "linux") {
    throw new Error(`Unsupported operating system '${platform}'. Alab releases support macOS and Linux only.`);
  }
  if (arch !== "arm64" && arch !== "x64") {
    throw new Error(`Unsupported CPU architecture '${arch}' on ${platform}. Alab releases support arm64 and x64 only.`);
  }
  return `${platform}-${arch}`;
}

export function verifyArchive(archive: Uint8Array, sums: string, filename: string): void {
  const entries = sums.split(/\r?\n/).filter((line) => line.trim());
  const matches = entries.map((line) => /^([a-fA-F0-9]{64})\s+\*?(.+)$/.exec(line))
    .filter((entry) => entry?.[2] === filename || entry?.[2] === `dist/${filename}`);
  if (matches.length !== 1) throw new Error(`SHA256SUMS has no unique entry for ${filename}.`);
  const actual = createHash("sha256").update(archive).digest("hex");
  if (actual !== matches[0]![1]!.toLowerCase()) throw new Error(`SHA-256 mismatch for ${filename}. The installed binary was not changed.`);
}

function extractBinary(archive: Uint8Array): Uint8Array {
  const tar = gunzipSync(archive);
  let binary: Uint8Array | undefined;
  for (let offset = 0; offset + 512 <= tar.length;) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const name = Buffer.from(header.subarray(0, 100)).toString("utf8").replace(/\0.*$/, "");
    const sizeText = Buffer.from(header.subarray(124, 136)).toString("ascii").replace(/\0.*$/, "").trim();
    const size = Number.parseInt(sizeText, 8);
    if (!Number.isSafeInteger(size) || size < 0) throw new Error("Release archive has an invalid tar entry.");
    const end = offset + 512 + size;
    if (end > tar.length) throw new Error("Release archive is truncated.");
    if (name === "alab" || name === "./alab") {
      if (binary || (header[156] !== 0 && header[156] !== 48)) throw new Error("Release archive has an invalid alab entry.");
      binary = tar.subarray(offset + 512, end);
    }
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  if (!binary?.length) throw new Error("Release archive does not contain an alab binary.");
  return binary;
}

async function download(url: string, request: typeof fetch): Promise<Uint8Array> {
  const response = await request(url, { headers: { "User-Agent": "alab-upgrade", Accept: "application/octet-stream" } });
  if (!response.ok) throw new Error(`Download failed (${response.status}) for ${url}.`);
  return new Uint8Array(await response.arrayBuffer());
}

function releaseAsset(release: Release, name: string): Asset {
  const asset = release.assets.find((item) => item.name === name);
  if (!asset?.browser_download_url) throw new Error(`Release ${release.tag_name} does not contain ${name}.`);
  return asset;
}

export async function upgrade(options: UpgradeOptions, dependencies: UpgradeDependencies): Promise<void> {
  const target = releaseTarget(dependencies.platform ?? process.platform, dependencies.arch ?? process.arch);
  const request = dependencies.fetch ?? fetch;
  const print = dependencies.print ?? console.log;
  const version = options.version?.startsWith("v") ? options.version : options.version ? `v${options.version}` : undefined;
  if (version && !/^v\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error(`Invalid release version '${options.version}'. Use a version such as v1.0.0.`);
  }
  const url = version ? `${RELEASES}/tags/${encodeURIComponent(version)}` : `${RELEASES}/latest`;
  const response = await request(url, { headers: { "User-Agent": "alab-upgrade", Accept: "application/vnd.github+json" } });
  if (!response.ok) throw new Error(`Could not fetch Alab release (${response.status}).`);
  const release = await response.json() as Release;
  if (!release.tag_name || !Array.isArray(release.assets)) throw new Error("GitHub returned invalid release metadata.");
  const archiveName = `alab-${target}.tar.gz`;
  const archiveAsset = releaseAsset(release, archiveName);
  releaseAsset(release, "SHA256SUMS");

  if (options.check) {
    print(`Current:\n${dependencies.currentVersion}\nAvailable: ${release.tag_name} (${archiveName})`);
    return;
  }

  const currentTag = `v${dependencies.currentVersion.match(/^alab (\S+)/)?.[1] ?? ""}`;
  if (release.tag_name === currentTag && !options.force) {
    print(`Already up to date.\n${dependencies.currentVersion}`);
    return;
  }

  const executable = await realpath(dependencies.executablePath ?? process.execPath);
  if (!dependencies.executablePath && /^(?:bun|node)(?:-[0-9.]+)?$/.test(basename(executable))) {
    throw new Error("Run upgrade from a compiled Alab executable, not a Bun or Node source launcher.");
  }
  const currentBytes = await readFile(executable);
  const magic = currentBytes.subarray(0, 4).toString("hex");
  const nativeBinary = magic === "7f454c46" || ["feedface", "cefaedfe", "feedfacf", "cffaedfe", "cafebabe", "bebafeca"].includes(magic);
  if (!nativeBinary && !options.force) throw new Error(`Refusing to overwrite ${executable}: it is not a native executable. Use --force only if this is your Alab install.`);
  const old = spawnSync(executable, ["--version"], { encoding: "utf8" });
  if ((old.status !== 0 || !old.stdout.startsWith("alab ")) && !options.force) {
    throw new Error(`Refusing to overwrite ${executable}: it does not run as Alab. Use --force only if this is your Alab install.`);
  }

  const archive = await download(archiveAsset.browser_download_url, request);
  const sums = Buffer.from(await download(releaseAsset(release, "SHA256SUMS").browser_download_url, request)).toString("utf8");
  verifyArchive(archive, sums, archiveName);
  const binary = extractBinary(archive);
  const temporary = join(dirname(executable), `.${basename(executable)}.upgrade-${process.pid}-${randomUUID()}`);
  try {
    await writeFile(temporary, binary, { mode: 0o755, flag: "wx" });
    await chmod(temporary, 0o755);
    const next = spawnSync(temporary, ["--version"], { encoding: "utf8" });
    if (next.status !== 0 || !next.stdout.startsWith(`alab ${release.tag_name.replace(/^v/, "")}\n`)) {
      throw new Error(`Downloaded binary does not report ${release.tag_name}. The installed binary was not changed.`);
    }
    await rename(temporary, executable);
    print(`Before:\n${old.status === 0 && old.stdout.startsWith("alab ") ? old.stdout.trimEnd() : dependencies.currentVersion}\nAfter:\n${next.stdout.trimEnd()}`);
  } finally {
    await rm(temporary, { force: true });
  }
}
