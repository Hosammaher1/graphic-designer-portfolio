#!/usr/bin/env bash
set -euo pipefail

usage() {
  printf 'Usage: %s ENV_FILE DEPLOY_PRIVATE_KEY\n' "$0" >&2
  exit 2
}

[[ $# -eq 2 ]] || usage
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"

check_file() {
  local label="$1" supplied="$2" allowed_a="$3" allowed_b="$4"
  local resolved mode

  [[ -f "$supplied" ]] || { printf '%s file is missing.\n' "$label" >&2; return 1; }
  resolved="$(realpath "$supplied")"
  case "$resolved" in
    "$repo_root"/*) printf '%s file resolves inside the repository.\n' "$label" >&2; return 1 ;;
  esac

  mode="$(stat -c %a "$resolved")"
  if [[ "$mode" != "$allowed_a" && "$mode" != "$allowed_b" ]]; then
    printf '%s file has unsafe permissions; expected %s or %s.\n' "$label" "$allowed_a" "$allowed_b" >&2
    return 1
  fi
  printf '%s file location and permissions passed.\n' "$label"
}

check_file 'Environment' "$1" 600 640
check_file 'Deploy key' "$2" 600 400
