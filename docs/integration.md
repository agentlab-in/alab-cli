# Tool integration interface

## Current interface

The router imports `runCli(argv)` from the exact Pages `src/program.ts` revision and calls it in the same process when the first argument is `pages`. Pages receives the original `process.argv` array.

This preserves every remaining argument and option, standard input for hidden interactive prompts, standard output including JSON, standard error and subprocess progress, the working directory and environment, and success or failure through the process exit status.

No extraction is used. Bun embeds the router, Pages source, and JavaScript dependencies in the executable. Pages v2.0.0 deploys through the Cloudflare HTTP API and does not invoke Wrangler.

## Pin and integrity policy

`vendor/pages` is a Git submodule pinned by the parent commit. `pins.json` repeats its version, repository, commit SHA, and expected `package.json` SHA-256. `scripts/verify-pins.ts` rejects any mismatch before build or release.

JavaScript packages use exact versions and a committed Bun lockfile. The release workflow uses a pinned Bun version and emits `SHA256SUMS` for downloadable archives.

## Updating Pages

1. Fetch tags inside `vendor/pages`.
2. Check out the intended immutable release commit.
3. Update the Pages version, commit, and package hash in `pins.json`.
4. Review the Pages CLI entry point and dependencies for interface or runtime changes.
5. Run every command in `AGENTS.md`, including the compiled binary smoke test.
6. Update public docs and the Alab version when behavior changes.
7. Commit the submodule pointer, pins, lockfile changes, code, and docs together.

Never pin a moving branch or fetch tool code at runtime.
