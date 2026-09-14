# Usage

## Consumer usage

### Prerequisites

Downloaded Alab binaries have no language runtime or helper CLI prerequisite. Publishing requires a Cloudflare account and an API token with `Account`, `Cloudflare Pages`, `Edit` permission.

### Installation

Download the archive for your operating system and CPU from Releases. Verify the archive against `SHA256SUMS`, extract it, and place `alab` in a directory on `PATH`.

### Configuration

Run:

```bash
alab pages setup
```

The command links to Cloudflare's token creation page, accepts token input without echoing it, validates access, selects an account, and creates or reuses the configured Pages project. On macOS, the token is stored in Keychain. Other settings and Linux token storage use files under `~/.alab/` with restricted permissions.

For noninteractive use, provide `CLOUDFLARE_API_TOKEN` and the required setup options. Missing input fails instead of waiting for a prompt.

### Commands

```text
alab pages setup [options]
alab pages put [dir] [--id <id>] [--dry-run] [--skip-deploy] [--json]
alab pages remove [id] [--dry-run] [--skip-deploy] [--json]
alab pages read [id] [--dir <path>] [--json]
alab pages list [--json]
alab pages open [id]
alab pages info
```

`delete` aliases `remove`, and `ls` aliases `list`.

`put` copies a static directory into the local full snapshot and deploys it. Repeating it for the same directory uses `.alab/pages.json` to retain the same ID and URL. `remove` deletes the locally known page and redeploys the remaining snapshot. A deployment failure does not roll back the preceding local change, so retry the same command after fixing access.

`--dry-run` skips Cloudflare deployment but still changes local state. `--skip-deploy` changes only local state. Use isolated `ALAB_HOME` and `ALAB_PAGES_CONTENT` directories for experiments.

### Availability and limitations

Release automation builds macOS binaries for Apple silicon and Intel, plus Linux binaries for x86-64 and ARM64. CI runs the compiled command smoke test natively on all four operating system and CPU combinations.

Pages accepts ready-made static files only. It does not build frameworks, run servers, recover state across machines, download deployed pages, or manage custom domains. The local machine is authoritative. Every page URL is public.

## Enterprise usage

Alab can be integrated into internal agent workflows that need a stable, inspectable command surface for publishing static artifacts through organization-owned Cloudflare infrastructure.

If you want to deploy this internally, integrate it with your existing systems,
adapt it to your environment, or discuss adjacent engineering work, book a call:

https://cal.com/harshitsinghbhandari/30min
