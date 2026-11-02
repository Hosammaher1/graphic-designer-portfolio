#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 3 || ( "$3" != --check && "$3" != --apply ) ]]; then
  printf 'Usage: %s RELEASE_ROOT TARGET_RELEASE --check|--apply\n' "$0" >&2
  exit 2
fi

root="$(realpath "$1")"
target="$(realpath "$2")"
current="$root/current"

case "$target" in
  "$root"/releases/*) ;;
  *) printf 'Target must resolve inside the release directory.\n' >&2; exit 1 ;;
esac

[[ -L "$current" ]] || { printf 'Current release is not a symlink.\n' >&2; exit 1; }
previous="$(realpath "$current")"
case "$previous" in
  "$root"/releases/*) ;;
  *) printf 'Current release resolves outside the release directory.\n' >&2; exit 1 ;;
esac

[[ "$target" != "$previous" ]] || { printf 'Target is already current.\n' >&2; exit 1; }
for file in backend/artisan frontend/server/index.js frontend/dist/client/index.html frontend/dist/server/entry-server.js; do
  [[ -f "$target/$file" ]] || { printf 'Target release is missing a required application artifact.\n' >&2; exit 1; }
done

if [[ "$3" == --check ]]; then
  printf 'Release switch preflight passed; no symlink was changed.\n'
  exit 0
fi

[[ "${PORTFOLIO_ROLLBACK_APPROVED:-}" == 1 ]] || {
  printf 'Explicit rollback approval flag is required.\n' >&2
  exit 1
}

temporary="$root/.current.rollback.$$"
trap 'rm -f -- "$temporary"' EXIT
ln -s -- "$target" "$temporary"
mv -Tf -- "$temporary" "$current"
printf 'Release symlink switched. Restart services and verify health before declaring recovery.\n'
