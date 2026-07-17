#!/usr/bin/env bun
/**
 * ki-binding EDUCATE — the mechanical half (ADR-KI-HARNESS-SKILLS-001 / -007). A thin
 * delegator: it execs the ki-bootstrap chain engine with this skill as an explicit
 * `--seed`, so running this file bootstraps ki-binding — plus everything it `implies:`
 * and the baseline — into the target repo, satisfying the self-sufficiency contract
 * (vendored script copies + HELP snapshots + the four `.ki-meta/bin/` wrappers;
 * no `package.json` — that is ki-engineering's). Delegating by subprocess is
 * composition — running a sibling in sequence — not a cross-skill import, so the
 * skill stays valid standalone (ADR-KI-HARNESS-SKILLS-004).
 *
 *   bun scripts/educate.ts <target-repo> [--ref <ref>] [--dry-run]
 *
 * Remote transport (documented follow-on, per ki-bootstrap's engine): the same run
 * reached from a raw GitHub URL, pinned to a ref.
 */
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SKILL = 'ki-binding'
const engine = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'ki-bootstrap', 'scripts', 'bootstrap.ts')
execFileSync('bun', [engine, ...process.argv.slice(2), '--seed', SKILL], { stdio: 'inherit' })
