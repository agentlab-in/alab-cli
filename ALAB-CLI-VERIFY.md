# ALAB-CLI-VERIFY

Pipeline verification for `agentlab-in/alab-cli` at main `e56ffee`
(merge of PR #5, review integration). Verification only. Nothing here
authorizes a merge, an npm publish, or a release. This file is uncommitted
by intent.

Date: 2026-09-21. Runner: macOS arm64, Bun 1.3.10.

## 1. CI: PASS

Workflow `.github/workflows/ci.yml` (plus an untouched `release.yml`):

- One `verify` job, matrix of 4 platforms:
  ubuntu-latest (bun-linux-x64), ubuntu-24.04-arm (bun-linux-arm64),
  macos-14 (bun-darwin-arm64), macos-15-intel (bun-darwin-x64).
- Steps per platform: checkout with submodules, setup-bun 1.3.10,
  `bun install --frozen-lockfile`, `bun run verify:pins`, `bun run test`,
  compile `dist/alab`, `bun run test:binary`, upload artifact.
- Latest main run: https://github.com/agentlab-in/alab-cli/actions/runs/35503469718
  (push of PR #5 merge, success on all 4 platforms, 28s).

## 2. Local pipeline: PASS

From a clean clone at `e56ffee` with submodules initialized:

| Step | Result |
| --- | --- |
| `bun install --frozen-lockfile` | PASS, no changes (6 installs across 7 packages) |
| `bun run verify:pins` | PASS, pages 3.0.0 and review 0.1.0 lines printed |
| `bun run test` | PASS, 6 pass / 0 fail, 20 expect calls |
| `bun run build` | PASS, 47 modules bundled, `dist/alab` compiled |
| `bun run test:binary` | PASS, compiled binary smoke test passed |

## 3. Binary surface: PASS

Built `./dist/alab` on this machine:

- `alab --help` lists Tools `pages` and `review`, plus
  `alab pages --help` and `alab review --help` commands.
- `alab pages --help` shows `Usage: alab pages [options] [command]`
  with setup, put, remove, read, list, open, info.
- `alab review --help` shows `Usage: alab review [options] [command]`
  with start, list, remove, cleanup.
- `alab put` (top level) fails exact:
  `Error: unknown tool 'put'. Run 'alab --help'.` exit 1.
  No top-level tool commands leak out of their mounts.

## 4. Pins vs GitHub main: NO DRIFT

| Tool | Pin in pins.json | GitHub main | Relation |
| --- | --- | --- | --- |
| pages | 887e73f (3.0.0) | 20203fdf | Pin is an ancestor of main; main moved ahead at the PR #3 merge. On-history, no action. |
| review | 94650db (0.1.0) | 02318e6 | Pin is main plus 1 commit: the `createReviewCommand` export on branch `mountable-review-command`. Exactly the designed pin. No action. |

## 5. Live `alab review` smoke: PASS

With isolated `ALAB_HOME`, served a scratch fixture on port 4410:

- Server printed project id `7qtmc5e7` and URL, blocked in background.
- `GET /` contained the overlay marker; disk HTML untouched.
- `POST /__alab/comments` returned `c1`; `alab review list`
  read it back from `.alab/review.json`.
- Server killed (`pkill -f "dist/alab review start"`), loopback
  refused connections afterwards, scratch dir removed.

## Result: PASS on all 5 steps.
