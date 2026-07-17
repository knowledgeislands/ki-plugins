#!/usr/bin/env bun
/**
 * ki-dotfiles-chezmoi EDUCATE — the mechanical half (ADR-KI-HARNESS-SKILLS-001 / -007). A
 * thin delegator: it execs the ki-bootstrap chain engine with this skill as an explicit
 * `--seed`, so running this file bootstraps ki-dotfiles-chezmoi — plus everything it
 * `implies:` and the baseline — into the target repo, satisfying the self-sufficiency
 * contract (vendored script copies + HELP snapshots + the four `.ki-meta/bin/`
 * wrappers). Delegating by subprocess is composition — running a sibling in sequence —
 * not a cross-skill import, so the skill stays valid standalone.
 *
 *   bun scripts/educate.ts <target-repo> [--ref <ref>] [--dry-run]
 */
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SKILL = 'ki-dotfiles-chezmoi'
const engine = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'ki-bootstrap', 'scripts', 'bootstrap.ts')
execFileSync('bun', [engine, ...process.argv.slice(2), '--seed', SKILL], { stdio: 'inherit' })
