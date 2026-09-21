# Alab Pages integration specification

## Outcome

Distribute one `alab` executable per supported operating system and CPU. The executable routes `alab pages ...` to the pinned Pages implementation without requiring or downloading a runtime or helper CLI.

## Decisions

- Bun compile produces native executables and is used only in development and CI.
- Pages v3.0.0 plus its side-effect-free integration entry point is pinned as a Git submodule at commit `6e2be4e2040467d497aa9367e4d24f7b32d572d4`.
- Runtime dependencies are exact versions in `package.json` and `bun.lock`.
- Pages executes in-process. Arguments and process streams remain unchanged. Its rejection reaches one top-level error handler and sets exit code 1.
- `alab --version` reports the router version and every integrated tool version and SHA.
- Releases contain compressed binaries and a `SHA256SUMS` integrity manifest.
- CI runs native binary smoke tests on macOS ARM64, macOS Intel, Linux x86-64, and Linux ARM64.

## Excluded

Review integration, a plugin system, Pages recovery or pull behavior, framework builds, and custom-domain management are not part of this integration.

## Completion checks

1. Verify the Pages submodule SHA and package version.
2. Run router tests.
3. Compile the host executable.
4. Run Pages help, info, put, read, list, update, and remove against isolated temporary state with development tools absent from `PATH`.
5. Build all release targets and produce deterministic artifact names and checksums.
6. Retain each natively tested binary as a downloadable CI artifact.
