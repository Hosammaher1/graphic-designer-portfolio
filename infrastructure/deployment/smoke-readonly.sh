#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 || ( "$1" != --plan && "$1" != --run ) ]]; then
  printf 'Usage: %s --plan|--run https://approved-domain\n' "$0" >&2
  exit 2
fi

base="${2%/}"
if [[ ! "$base" =~ ^https://[[:alnum:].-]+(:[[:digit:]]+)?$ ]]; then
  printf 'An HTTPS host URL without path or credentials is required.\n' >&2
  exit 2
fi

paths=(/ar/ /en/ /api/v1/health /robots.txt /sitemap.xml)
if [[ "$1" == --plan ]]; then
  printf 'Read-only HTTPS smoke paths:\n'
  printf '%s\n' "${paths[@]}"
  exit 0
fi

for path in "${paths[@]}"; do
  curl --fail --silent --show-error --max-time 15 --output /dev/null "$base$path"
  printf 'PASS %s\n' "$path"
done

for locale in ar en; do
  html="$(curl --fail --silent --show-error --max-time 15 "$base/$locale/")"
  [[ "$html" == *"lang=\"$locale\""* ]] || {
    printf 'SSR locale marker missing for /%s/.\n' "$locale" >&2
    exit 1
  }
done
printf 'SSR locale markers and HTTPS certificate validation passed.\n'
