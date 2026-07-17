#!/bin/sh
# ki-bootstrap zero-install entry point (ADR-KI-HARNESS-006).
#
# The canonical remote one-liner — cd into the repo you want to govern, then:
#
#   curl -fsSL https://raw.githubusercontent.com/knowledgeislands/ki-agentic-harness/main/skills/keystone/ki-bootstrap/scripts/bootstrap.sh | sh
#
# It bootstraps the current directory from the harness's `main`: fetches the
# source tarball (GitHub codeload — generated on demand, no publish step),
# extracts it to a temp dir, and runs the chain engine (bootstrap.ts) from that
# tree. Bun is required to *run* the engine and the vendored checkers — it is the
# mechanical layer's runtime, not the entry point's — so a missing bun fails fast
# with the install instruction rather than being installed silently.
#
# Everything after `sh -s --` ripples straight through to the engine, with two
# defaults injected only when absent: the target (the cwd) and `--ref` (`main`).
# So the zero-arg pipe is `<cwd> --ref main`, while `… | sh -s -- <target>
# --ref <sha> --dry-run` all reach bootstrap.ts intact. `ki-educate` re-syncs this
# way, defaulting `--ref` to `main` (latest) unless a ref is passed; the engine
# resolves whatever ref ran to a concrete SHA and records that in the manifest.
set -eu

REPO="knowledgeislands/ki-agentic-harness"

# Ripple all args through; detect whether a target and a --ref were supplied so we
# can inject defaults for the missing ones. A tarball extract has no .git, so the
# engine cannot derive the ref itself — bootstrap.sh must always hand it one.
ref=""
target_seen=0
prev=""
for a in "$@"; do
  if [ "$prev" = --ref ]; then
    ref="$a"
    prev=""
    continue
  fi
  case "$a" in
    --ref) prev=--ref ;;
    -*) prev="" ;;
    *) target_seen=1 ;;
  esac
done
if [ -z "$ref" ]; then
  ref=main
  set -- "$@" --ref main
fi
[ "$target_seen" = 1 ] || set -- "$(pwd)" "$@"

for dep in curl tar bun; do
  command -v "$dep" >/dev/null 2>&1 || {
    if [ "$dep" = bun ]; then
      echo "error: bun is required to run the Knowledge Islands mechanical layer." >&2
      echo "install it first:  curl -fsSL https://bun.sh/install | bash" >&2
    else
      echo "error: $dep is required" >&2
    fi
    exit 1
  }
done

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

echo "bootstrapping from $REPO@$ref"
curl -fsSL "https://codeload.github.com/$REPO/tar.gz/$ref" | tar -xz -C "$tmp" --strip-components=1
bun "$tmp/skills/keystone/ki-bootstrap/scripts/bootstrap.ts" "$@"
