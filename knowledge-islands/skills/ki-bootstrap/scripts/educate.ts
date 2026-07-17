#!/usr/bin/env bun
/**
 * ki-bootstrap EDUCATE — thin delegator, kept for shape uniformity with every other
 * skill's `scripts/educate.ts` (ADR-KI-HARNESS-006). ki-bootstrap *is* the chain
 * engine (`scripts/bootstrap.ts`), so this simply execs it in place with itself as
 * an explicit `--seed` — every skill exposes the same `scripts/educate.ts <target>`
 * entry, even the one whose mechanical half also serves as the engine the other
 * delegators call. (The engine excludes the chain-starter from the vendored set —
 * `resolve.ts`'s `resolveSet` deletes `BOOTSTRAP` before returning.)
 *
 *   bun scripts/educate.ts <target-repo> [--ref <ref>] [--dry-run]
 */
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SKILL = 'ki-bootstrap'
const engine = resolve(dirname(fileURLToPath(import.meta.url)), 'bootstrap.ts')
execFileSync('bun', [engine, ...process.argv.slice(2), '--seed', SKILL], { stdio: 'inherit' })
