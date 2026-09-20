#!/usr/bin/env bun
import { Command } from "commander";
import alabPackage from "../package.json";
import pins from "../pins.json";
import pagesPackage from "../vendor/pages/package.json";
import reviewPackage from "../vendor/review/package.json";
import { createPagesCommand } from "../vendor/pages/src/program.ts";
import { createReviewCommand } from "../vendor/review/src/program.ts";

const HELP = `Alab ${alabPackage.version}

Usage: alab <tool> [command] [options]

Tools:
  pages     Publish static sites with AgentLab Pages
  review    Review static HTML folders with click-to-comment

Commands:
  alab pages --help     Show Pages commands and first-use guidance
  alab review --help    Show Review commands and first-use guidance
  alab --version        Show Alab and integrated tool versions
  alab help             Show this help
`;

export function versionText(): string {
  return `alab ${alabPackage.version}\npages ${pagesPackage.version} (${pins.pages.commit})\nreview ${reviewPackage.version} (${pins.review.commit})`;
}

export function createAlabProgram(): Command {
  const program = new Command();
  program.exitOverride();
  program.name("alab").description("AgentLab tools").version(versionText());
  program.addCommand(createPagesCommand());
  program.addCommand(createReviewCommand());
  return program;
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
  if (args[0] !== "pages" && args[0] !== "review") {
    console.error(`Error: unknown tool '${args[0]}'. Run 'alab --help'.`);
    return 1;
  }

  try {
    await createAlabProgram().parseAsync(argv);
  } catch (error: unknown) {
    const e = error as { code?: string };
    if (e?.code === "commander.helpDisplayed" || e?.code === "commander.version") return process.exitCode ?? 0;
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
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
