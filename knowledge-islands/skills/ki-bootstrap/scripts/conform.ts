#!/usr/bin/env bun
/**
 * ki-bootstrap — CONFORM: bring a repo's project-local wiring into line.
 *
 * The mechanical half of Mode CONFORM — the verb-named counterpart to
 * `audit.ts` (AUDIT) and `educate.ts` (EDUCATE). Composes the two linkers in
 * write mode — `project-links.ts` — which creates/prunes generated copied skill
 * payloads under the declared runtime paths, keeps supported Claude agents on
 * their independent link path, and writes matching `.gitignore` lines in one
 * guarded transaction. It then re-runs the standalone compatibility checks.
 *
 * This script is a pure ORCHESTRATOR: it spawns the linkers and the vendored-set
 * audit rather than emitting per-criterion findings of its own. So its `--json`
 * mode reports one finding per orchestration step it ran (PASS when the spawned
 * step exited clean, FAIL when it exited non-zero) inside the shared CHK-004
 * wrapper — an almost-empty-but-valid wrapper is correct here, so the aggregate
 * renders it structured instead of falling back to native display. `--json`
 * governs *reporting*; `--dry-run` governs *writing* — the two compose. In
 * `--json` mode the spawned children's own prose is suppressed so stdout carries
 * only the single-line wrapper.
 *
 * Vendored-set drift is NEVER fixed here: per the drift contract
 * (ADR-KI-HARNESS-006) CONFORM only advises. `audit.ts` runs read-only
 * at the end, and any drift it reports is repaired by re-running EDUCATE
 * (`./.ki-meta/bin/ki-educate`, or `bun skills/keystone/ki-bootstrap/scripts/educate.ts`).
 *
 * NEVER touches (judgment → manual): the declared coverage itself (the
 * `.ki-config.toml` `[ki-*]` tables — BOOT-4, ki-repo's coverage cascade) and a
 * declared table resolving to no harness skill (BOOT-1 FAIL — an upstream
 * rename/removal to reconcile by hand).
 *
 * Usage: bun conform.ts [target-repo] [--dry-run] [--json]
 *   --dry-run  preview both linkers' changes, touch nothing
 *   --json     emit the CHK-004 orchestration wrapper instead of prose
 *
 * Every repo — the harness included — links its declared coverage (the `.ki-config.toml`
 * `[ki-*]` tables, foundations included; no injected baseline); there is no all-skills
 * mode (ADR-KI-HARNESS-007). Vendoring is likewise always coverage-scoped.
 */

import { spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'

const argv = process.argv.slice(2)
const dryRun = argv.includes('--dry-run')
const json = argv.includes('--json')
const target = resolve(argv.find((a) => !a.startsWith('--')) ?? '.')

// Shared severity ladder — a step becomes a finding on it (enforcement-framework §2).
type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
type Finding = { level: Level; area: string; msg: string; ref?: string; file?: string }
const findings: Finding[] = []
const rec = (level: Level, area: string, msg: string, ref?: string, file?: string) => findings.push({ level, area, msg, ref, file })

const RUBRIC = 'references/audit-rubric.md'

// In --json mode suppress the spawned children's own prose so stdout carries only
// the single-line wrapper; otherwise inherit it for a streaming human run.
function run(script: string, args: string[]): number {
  const r = spawnSync('bun', [join(import.meta.dirname, script), target, ...args], { stdio: json ? 'ignore' : 'inherit' })
  return r.status ?? 1
}

const flags = dryRun ? ['--dry-run'] : []
let failed = 0

// step: run a spawned orchestration leg and record its outcome on the ladder.
function step(script: string, args: string[], area: string, label: string): void {
  const status = run(script, args)
  if (status !== 0) {
    failed++
    rec('FAIL', area, `${label} exited non-zero (status ${status})`, RUBRIC)
  } else {
    rec('PASS', area, label, RUBRIC)
  }
}

// 1. Publish copied skills and linked agent definitions as one guarded transaction.
step('project-links.ts', flags, 'BOOT-1/BOOT-6', `project-links ${dryRun ? '(dry-run preview)' : 'write pass'}`)

// 2. Re-run the checks to confirm (skipped on a preview — nothing changed).
if (!dryRun) {
  step('copy-skills.ts', ['--check'], 'BOOT-1', 'copy-skills --check confirms copied payloads')
  step('link-agents.ts', ['--check'], 'BOOT-6', 'link-agents --check confirms links')
}

// 3. Advisory only — never re-vendors (ADR-KI-HARNESS-006's drift contract). The
// vendored-set audit is always coverage-scoped (`--all` is a linking concept only —
// vendoring follows .ki-config coverage, ADR-KI-HARNESS-007), so it is never forwarded here.
if (run('audit.ts', []) !== 0) {
  rec('INFO', 'BOOT-9', 'vendored-set drift detected — EDUCATE’s to repair (`./.ki-meta/bin/ki-educate`)', RUBRIC, '.ki-meta/skills/')
  if (!json)
    console.log(
      'vendored-set drift is EDUCATE’s to repair — re-run `./.ki-meta/bin/ki-educate` (or `bun skills/keystone/ki-bootstrap/scripts/educate.ts <target>`)'
    )
} else {
  rec('PASS', 'BOOT-9', 'vendored-set audit reports no drift', RUBRIC, '.ki-meta/skills/')
}

// BOOT-10 (ADR-KI-HARNESS-SKILLS-001's AUDIT/CONFORM contract, applied transitively):
// re-stated here since --json suppresses the spawned audit.ts's own ADVISORY — a
// mechanical CONFORM pass never substitutes for re-applying each governed skill's
// [J] judgment.
rec(
  'ADVISORY',
  'BOOT-10',
  "re-apply each governed skill's [J] judgment after this CONFORM pass — a clean mechanical run is not sufficient",
  RUBRIC
)

if (json) {
  const n = (l: Level): number => findings.filter((f) => f.level === l).length
  const summary = {
    fail: n('FAIL'),
    warn: n('WARN'),
    polish: n('POLISH'),
    advisory: n('ADVISORY'),
    info: n('INFO'),
    na: n('NA'),
    pass: n('PASS')
  }
  process.stdout.write(JSON.stringify({ concern: 'bootstrap', target, generatedAt: new Date().toISOString(), summary, findings }))
}

process.exit(failed > 0 ? 1 : 0)
