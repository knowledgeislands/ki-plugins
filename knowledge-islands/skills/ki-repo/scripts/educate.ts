#!/usr/bin/env bun
/**
 * ki-repo EDUCATE — the mechanical half (ADR-KI-HARNESS-SKILLS-001 / -007). A thin
 * delegator: it execs the ki-bootstrap chain engine with this skill as an explicit
 * `--seed`, so running this file bootstraps ki-repo — plus everything it `implies:`
 * — into the target repo, satisfying the self-sufficiency contract
 * (vendored script copies + HELP snapshots + the four `.ki-meta/bin/` wrappers;
 * no `package.json` — that is ki-engineering's). Delegating by subprocess is
 * composition — running a sibling in sequence — not a cross-skill import, so the
 * skill stays valid standalone (ADR-KI-HARNESS-SKILLS-004).
 *
 *   bun scripts/educate.ts <target-repo> [--ref <ref>] [--dry-run]
 *   bun scripts/educate.ts <target-repo> --scaffold-config-only [--dry-run]
 *
 * Remote transport (documented follow-on, per ki-bootstrap's engine): the same run
 * reached from a raw GitHub URL, pinned to a ref.
 */
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SKILL = 'ki-repo'
const argv = process.argv.slice(2)
const scripts = dirname(fileURLToPath(import.meta.url))

if (argv.includes('--scaffold-config-only')) {
  // CONFORM owns the one self-contained, vendorable local-file transaction. EDUCATE
  // delegates its config-only internal leg there so the builtins-only safety
  // primitive is not forked while bootstrap still composes through the owner.
  execFileSync('bun', [resolve(scripts, 'conform.ts'), ...argv], { stdio: 'inherit' })
  process.exit(0)
}

const engine = resolve(scripts, '..', '..', 'ki-bootstrap', 'scripts', 'bootstrap.ts')
execFileSync('bun', [engine, ...argv, '--seed', SKILL], { stdio: 'inherit' })
