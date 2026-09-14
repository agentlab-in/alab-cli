#!/usr/bin/env bash
set -euo pipefail
trap 'echo "smoke assertion failed at line $LINENO: status=$status stdout=$stdout stderr=$stderr" >&2' ERR

binary="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
status=0
stdout=""
stderr=""
scratch="$(mktemp -d)"
trap 'rm -rf "$scratch"' EXIT

mkdir -p "$scratch/site" "$scratch/empty-path"
printf '<h1>first</h1>\n' > "$scratch/site/index.html"

run_clean() {
  env -i PATH="$scratch/empty-path" ALAB_HOME="$scratch/home" ALAB_PAGES_CONTENT="$scratch/content" "$binary" "$@"
}

capture() {
  set +e
  run_clean "$@" >"$scratch/stdout" 2>"$scratch/stderr"
  status=$?
  set -e
  stdout="$(<"$scratch/stdout")"
  stderr="$(<"$scratch/stderr")"
}

assert_success() {
  [[ "$status" -eq 0 ]]
  [[ -z "$stderr" ]]
}

assert_json() {
  [[ "$stdout" == \{*\} || "$stdout" == \[*\] ]]
}

capture --version
assert_success
[[ "$stdout" == $'alab 0.1.0\npages 2.0.0 (c6a71e826bfecb9f7c65c88c1f1d28ba23f72bd8)' ]]

capture pages --help
assert_success
[[ "$stdout" == *'Usage: alab pages [options] [command]'* ]]
[[ "$stdout" == *'setup [options]'* ]]
[[ "$stdout" == *'put [options] [dir]'* ]]

capture pages info
assert_success
[[ "$stdout" == *'CF token      missing'* ]]

capture pages put "$scratch/site" --id Alpha9 --skip-deploy --json
assert_success
assert_json
[[ "$stdout" =~ \"id\"[[:space:]]*:[[:space:]]*\"alpha9\" ]]
[[ "${stdout#*\"id\"}" != *'"id"'* ]]

capture pages read --dir "$scratch/site" --json
assert_success
assert_json
[[ "$stdout" =~ \"id\"[[:space:]]*:[[:space:]]*\"alpha9\" ]]

capture pages list --json
assert_success
assert_json
[[ "$stdout" =~ \"id\"[[:space:]]*:[[:space:]]*\"alpha9\" ]]

printf '<h1>updated</h1>\n' > "$scratch/site/index.html"
capture pages put "$scratch/site" --skip-deploy --json
assert_success
assert_json
[[ "$stdout" =~ \"id\"[[:space:]]*:[[:space:]]*\"alpha9\" ]]

capture pages remove alpha9 --skip-deploy --json
assert_success
assert_json
[[ "$stdout" =~ \"id\"[[:space:]]*:[[:space:]]*\"alpha9\" ]]

capture pages read missing --json
[[ "$status" -eq 1 ]]
[[ -z "$stdout" ]]
[[ "$stderr" == 'Error: Page missing is not in the local store' ]]

capture unknown
[[ "$status" -eq 1 ]]
[[ -z "$stdout" ]]
[[ "$stderr" == "Error: unknown tool 'unknown'. Run 'alab --help'." ]]

echo "compiled binary smoke test passed"
