#!/usr/bin/env bun
import alabPackage from "../package.json";
import pins from "../pins.json";
import pagesPackage from "../vendor/pages/package.json";
import { runCli as runPagesCli } from "../vendor/pages/src/program.ts";

const HELP = `Alab ${alabPackage.version}

Usage: alab <tool> [command] [options]

Tools:
  pages     Publish static sites with AgentLab Pages

Commands:
  alab pages --help     Show Pages commands and first-use guidance
  alab --version        Show Alab and integrated tool versions
  alab help             Show this help
`;

export function versionText(): string {
  return `alab ${alabPackage.version}\npages ${pagesPackage.version} (${pins.pages.commit})`;
}

export async function main(argv = process.argv): Promise<number> {
  const args = argv.slice(2);
  if (args.length === 0 || args[0] === "help" || args[0] === "--help" || args[0] === "-h") {
    process.stdout.write(HELP);
    return 0;
  }
  if (args[0] === "--version" || args[0] === "-V") {
    console.log(versionText());
    return 0;
  }
  if (args[0] !== "pages") {
    console.error(`Error: unknown tool '${args[0]}'. Run 'alab --help'.`);
    return 1;
  }

  await runPagesCli(argv);
  return process.exitCode ?? 0;
}

if (import.meta.main) {
  main().then((code) => {
    process.exitCode = code;
  }).catch((error: unknown) => {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
