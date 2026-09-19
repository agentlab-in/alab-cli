# Alab CLI

Alab is one self-contained executable for AgentLab tools. The current release integrates [AgentLab Pages](https://github.com/agentlab-in/pages), a static site publisher backed by your own Cloudflare account, and [AgentLab Review](https://github.com/agentlab-in/review), a local click-to-comment review server for static HTML folders.

No separate Node.js, npm, Bun, Python, Go, Wrangler, or helper CLI installation is required to run a downloaded binary.

## Install

Download the archive matching your system from the repository's Releases page, verify it with `SHA256SUMS`, extract `alab`, and put it on your `PATH`.

Supported release targets:

| Operating system | CPU |
| --- | --- |
| macOS | Apple silicon, Intel |
| Linux | x86-64, ARM64 |

Windows is not currently built or tested.

```bash
alab --version
alab pages --help
alab pages setup
alab pages put ./site
alab review --help
alab review start ./site
```

`alab pages setup` guides Cloudflare API token validation, account selection, and project creation or reuse. Pages maintains authoritative state on one machine. A repeated `put` of the same directory retains its ID and URL. Cloudflare's default URL is used unless configuration explicitly supplies another base URL.

`alab review start` serves a local folder on loopback with a click-to-comment overlay, prints the project id and URL, and blocks until interrupted. Comments persist to `<dir>/.alab/review.json` for the agent to read. Review is local only and never deploys.

See [USAGE.md](./USAGE.md) for setup, command behavior, and limitations. See [docs/integration.md](./docs/integration.md) for the internal tool interface and update procedure.

## Build

The repository pins Bun and every tool revision. Bun is a build dependency only.

```bash
bun install --frozen-lockfile
bun run verify:pins
bun run test
bun run build
bun run test:binary
```

`bun run build:all` cross-compiles the four declared release targets into `dist/`.

Every CI run retains its four verified platform binaries as downloadable workflow artifacts. Tagged releases package the same target set into archives with a `SHA256SUMS` manifest.

## Security

Every published page is public. The optional Pages root password only obscures the root listing and does not protect direct page URLs. Never publish credentials or private content.

## License

MIT
