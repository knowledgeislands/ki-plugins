#!/bin/sh
# Explicit durable Claude hook-payload installer. It never bootstraps a repository
# or modifies Claude settings.
set -eu

REPO="knowledgeislands/ki-agentic-harness"
ref="main"
if [ "${1-}" != "" ] && [ "${1#-}" = "$1" ]; then
  ref="$1"
  shift
  set -- --ref "$ref" "$@"
fi
previous=""
for argument in "$@"; do
  if [ "$previous" = --ref ]; then
    ref="$argument"
    previous=""
    continue
  fi
  [ "$argument" = --ref ] && previous=--ref || previous=""
done
case " $* " in
  *" --ref "*) ;;
  *) set -- "$@" --ref "$ref" ;;
esac

for dependency in curl tar bun; do
  command -v "$dependency" >/dev/null 2>&1 || { echo "error: $dependency is required" >&2; exit 1; }
done

temporary="$(mktemp -d)"
trap 'rm -rf "$temporary"' EXIT
archive="$temporary/source.tar.gz"
source="$temporary/source"
mkdir "$source"
echo "installing durable Claude hook payload from $REPO@$ref"
curl -fsSL "https://codeload.github.com/$REPO/tar.gz/$ref" -o "$archive"
tar -xzf "$archive" -C "$source" --strip-components=1
bun "$source/skills/keystone/ki-bootstrap/scripts/install-hooks.ts" --source "$source/hooks" "$@"
