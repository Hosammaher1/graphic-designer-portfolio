#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 || ! "$2" =~ ^[[:xdigit:]]{64}$ ]]; then
  printf 'Usage: %s ARCHIVE EXPECTED_SHA256\n' "$0" >&2
  exit 2
fi

archive="$1"
expected="${2,,}"
[[ -f "$archive" && -r "$archive" ]] || {
  printf 'Release archive is missing or unreadable.\n' >&2
  exit 1
}

actual="$(sha256sum -- "$archive")"
actual="${actual%% *}"
if [[ "$actual" != "$expected" ]]; then
  printf 'Release archive checksum mismatch.\n' >&2
  exit 1
fi

printf 'Release archive checksum verified.\n'
