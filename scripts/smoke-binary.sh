#!/usr/bin/env bash
set -euo pipefail

binary="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
scratch="$(mktemp -d)"
trap 'rm -rf "$scratch"' EXIT

mkdir -p "$scratch/site" "$scratch/empty-path"
printf '<h1>first</h1>\n' > "$scratch/site/index.html"

run_clean() {
  env -i PATH="$scratch/empty-path" ALAB_HOME="$scratch/home" ALAB_PAGES_CONTENT="$scratch/content" "$binary" "$@"
}

version="$(run_clean --version)"
[[ "$version" == *'pages 2.0.0 (15355cdde65a8f536c48264b3239a097ecec8492)'* ]]
run_clean pages --help >/dev/null
run_clean pages info >/dev/null

first="$(run_clean pages put "$scratch/site" --skip-deploy --json)"
[[ "$first" =~ \"id\"[[:space:]]*:[[:space:]]*\"([a-z0-9]+)\" ]]
id="${BASH_REMATCH[1]}"
test -n "$id"
read_result="$(run_clean pages read --dir "$scratch/site" --json)"
[[ "$read_result" =~ \"id\"[[:space:]]*:[[:space:]]*\"$id\" ]]
list_result="$(run_clean pages list --json)"
[[ "$list_result" =~ \"id\"[[:space:]]*:[[:space:]]*\"$id\" ]]

printf '<h1>updated</h1>\n' > "$scratch/site/index.html"
second="$(run_clean pages put "$scratch/site" --skip-deploy --json)"
[[ "$second" =~ \"id\"[[:space:]]*:[[:space:]]*\"$id\" ]]
removed="$(run_clean pages remove "$id" --skip-deploy --json)"
[[ "$removed" =~ \"id\"[[:space:]]*:[[:space:]]*\"$id\" ]]

if run_clean unknown >/dev/null 2>&1; then
  echo "unknown tool unexpectedly succeeded" >&2
  exit 1
fi

echo "compiled binary smoke test passed"
