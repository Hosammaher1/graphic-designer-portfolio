#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
backend_dir="$repo_root/backend"

usage() {
  printf 'Usage: %s --check|--build\n' "$0" >&2
  exit 2
}

if [[ ! -f "$backend_dir/composer.json" || ! -f "$backend_dir/composer.lock" || ! -f "$backend_dir/artisan" ]]; then
  printf 'Backend manifest, lock file, or Artisan entrypoint is missing.\n' >&2
  exit 1
fi

if ! command -v php >/dev/null 2>&1 || ! command -v composer >/dev/null 2>&1; then
  printf 'PHP and Composer must be available on PATH.\n' >&2
  exit 1
fi

cd "$backend_dir"

case "${1:-}" in
  --check)
    composer validate --no-check-publish --no-interaction
    php -l artisan
    printf 'Backend build prerequisites passed. No dependencies were installed.\n'
    ;;
  --build)
    umask 027
    composer validate --no-check-publish --no-interaction
    composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader
    printf 'Backend dependencies installed from composer.lock. Inject runtime secrets before service start.\n'
    ;;
  *) usage ;;
esac
