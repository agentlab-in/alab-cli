# Alab CLI

This repository owns command routing, exact tool pins, combined executable builds, and release automation for the `alab` CLI.

## Boundaries

- Tool repositories own their implementations. Do not fork tool behavior here.
- Integrations must use an exact version and commit SHA.
- A released artifact must not download a runtime or helper executable when used.
- Preserve child command arguments, standard input, standard output, standard error, and exit status.
- Add only platforms exercised by CI with a real compiled executable.
- Do not publish releases or tags without explicit authorization.

## Workflow

Use Bun 1.3.10 for dependency installation, tests, and compilation. After changing a pin or router, run:

```bash
bun install --frozen-lockfile
bun run verify:pins
bun run test
bun run build
bun run test:binary
```

Run Git commands from this repository. Preserve unrelated work. Never commit credentials, generated `dist/` files, or local Alab state.
