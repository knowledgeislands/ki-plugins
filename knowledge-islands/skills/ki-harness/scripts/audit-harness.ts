#!/usr/bin/env bun
/**
 * Mechanical audit for a Knowledge Islands agentic harness.
 * Checks the [M]-tagged criteria in references/audit-rubric.md.
 * Judgment ([J]) criteria are assessed by the agent reading the rubric.
 *
 * Usage: bun audit-harness.ts [path-to-harness-root]
 * Defaults to cwd when no path is given.
 */

import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

// ── Types ────────────────────────────────────────────────────────────────────

type Severity = 'FAIL' | 'WARN' | 'POLISH' | 'PASS' | 'SKIP'

interface Finding {
  severity: Severity
  criterion: string
  message: string
}

// ── ANSI helpers ─────────────────────────────────────────────────────────────

const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const BLUE = '\x1b[34m'
const GREEN = '\x1b[32m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

function badge(s: Severity): string {
  switch (s) {
    case 'FAIL':
      return `${RED}FAIL${RESET}`
    case 'WARN':
      return `${YELLOW}WARN${RESET}`
    case 'POLISH':
      return `${BLUE}POLISH${RESET}`
    case 'PASS':
      return `${GREEN}PASS${RESET}`
    case 'SKIP':
      return `${DIM}SKIP${RESET}`
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function check(findings: Finding[], severity: Severity, criterion: string, condition: boolean, message: string): void {
  findings.push({ severity: condition ? 'PASS' : severity, criterion, message })
}

function pass(findings: Finding[], criterion: string, message: string): void {
  findings.push({ severity: 'PASS', criterion, message })
}

function skip(findings: Finding[], criterion: string, message: string): void {
  findings.push({ severity: 'SKIP', criterion, message })
}

function readToml(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf8') : ''
}

function hasTomlTable(toml: string, table: string): boolean {
  const escaped = table.replace(/-/g, '\\-')
  return new RegExp(`^\\[${escaped}\\]`, 'm').test(toml)
}

function readPackageJson(path: string): Record<string, unknown> {
  if (!existsSync(path)) return {}
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
  } catch {
    return {}
  }
}

function hasScript(pkg: Record<string, unknown>, name: string): boolean {
  const scripts = pkg.scripts as Record<string, unknown> | undefined
  return typeof scripts === 'object' && scripts !== null && name in scripts
}

function parseFrontmatterName(content: string): string | null {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/)
  if (!match) return null
  const nameMatch = match[1].match(/^name:\s*(.+)$/m)
  return nameMatch ? nameMatch[1].trim() : null
}

// ── Main audit ────────────────────────────────────────────────────────────────

function auditHarness(root: string): Finding[] {
  const findings: Finding[] = []

  // ── LAY — Directory layout and file presence ───────────────────────────────

  const FOUR_PARTS = ['skills', 'agents', 'mcp', 'evals'] as const

  for (const part of FOUR_PARTS) {
    const dir = join(root, part)
    check(findings, 'FAIL', `LAY-1 (${part}/)`, existsSync(dir), `${part}/ directory must exist`)

    if (existsSync(dir)) {
      const readme = join(dir, 'README.md')
      check(findings, 'WARN', `LAY-2 (${part}/README.md)`, existsSync(readme), `${part}/README.md must exist`)
    }
  }

  check(findings, 'FAIL', 'LAY-3', existsSync(join(root, 'CLAUDE.md')), 'CLAUDE.md must exist at harness root')
  check(findings, 'WARN', 'LAY-4', existsSync(join(root, 'ROADMAP.md')), 'ROADMAP.md must exist at harness root')
  check(findings, 'FAIL', 'LAY-5', existsSync(join(root, '.ki-config.toml')), '.ki-config.toml must exist at harness root')

  // ── PKG — package.json script families ────────────────────────────────────

  const pkgPath = join(root, 'package.json')
  const pkg = readPackageJson(pkgPath)

  if (!existsSync(pkgPath)) {
    findings.push({ severity: 'FAIL', criterion: 'PKG-1', message: 'package.json missing — cannot check scripts' })
    findings.push({ severity: 'FAIL', criterion: 'PKG-2', message: 'package.json missing — cannot check scripts' })
    findings.push({ severity: 'WARN', criterion: 'PKG-3', message: 'package.json missing — cannot check scripts' })
  } else {
    check(
      findings,
      'FAIL',
      'PKG-1',
      hasScript(pkg, 'ki:skills:link:project'),
      "package.json must have a 'ki:skills:link:project' script (the ki-bootstrap delivery mechanism)"
    )
    check(findings, 'FAIL', 'PKG-2', hasScript(pkg, 'ki:skills:lint'), "package.json must have a 'ki:skills:lint' script")

    for (const script of ['ki:lint:check', 'ki:lint:types', 'ki:lint:md', 'ki:lint:md:check']) {
      check(findings, 'WARN', `PKG-3 (${script})`, hasScript(pkg, script), `package.json should have a '${script}' script`)
    }

    // PKG-4 — the harness skill-management + codegen/eval surface. These drive the
    // skills/ and evals/ parts and the typed-client codegen; the harness owns them.
    for (const script of [
      'ki:skills:link:global',
      'ki:skills:status',
      'ki:skills:unlink',
      'ki:skills:refresh-status',
      'ki:codegen',
      'ki:eval'
    ]) {
      check(
        findings,
        'WARN',
        `PKG-4 (${script})`,
        hasScript(pkg, script),
        `package.json should have a '${script}' script (harness skill-management / codegen / eval surface)`
      )
    }
  }

  // ── CONFIG — .ki-config.toml declarations ─────────────────────────────────

  const tomlPath = join(root, '.ki-config.toml')
  const toml = readToml(tomlPath)

  if (!existsSync(tomlPath)) {
    skip(findings, 'CONFIG-1', '.ki-config.toml missing — skipping table checks (LAY-5 already FAILs)')
    skip(findings, 'CONFIG-2', '.ki-config.toml missing')
  } else {
    check(findings, 'FAIL', 'CONFIG-1', hasTomlTable(toml, 'ki-harness'), '.ki-config.toml must have [ki-harness] table')
    check(findings, 'WARN', 'CONFIG-2', hasTomlTable(toml, 'ki-repo'), '.ki-config.toml should have [ki-repo] table')
  }

  // ── SKILLS — skills/ directory name vs SKILL.md name: matching ────────────

  const skillsDir = join(root, 'skills')
  if (existsSync(skillsDir)) {
    const { readdirSync, statSync } = require('node:fs') as typeof import('node:fs')
    const entries = readdirSync(skillsDir)
    const names = new Map<string, string[]>()

    for (const entry of entries) {
      const entryPath = join(skillsDir, entry)
      if (!statSync(entryPath).isDirectory()) continue

      const skillMdPath = join(entryPath, 'SKILL.md')
      if (!existsSync(skillMdPath)) continue

      const content = readFileSync(skillMdPath, 'utf8')
      const declaredName = parseFrontmatterName(content)

      if (declaredName === null) {
        findings.push({
          severity: 'WARN',
          criterion: 'SKILLS-1',
          message: `skills/${entry}/SKILL.md has no parseable name: frontmatter`
        })
        continue
      }

      if (declaredName !== entry) {
        findings.push({
          severity: 'FAIL',
          criterion: 'SKILLS-1',
          message: `skills/${entry}: directory name '${entry}' does not match name: '${declaredName}' in SKILL.md`
        })
      } else {
        pass(findings, 'SKILLS-1', `skills/${entry}: name matches directory`)
      }

      const existing = names.get(declaredName) ?? []
      existing.push(entry)
      names.set(declaredName, existing)
    }

    // SKILLS-2: duplicate name: values
    for (const [name, dirs] of names) {
      if (dirs.length > 1) {
        findings.push({
          severity: 'FAIL',
          criterion: 'SKILLS-2',
          message: `Duplicate name: '${name}' in ${dirs.map((d) => `skills/${d}`).join(', ')}`
        })
      }
    }
  } else {
    skip(findings, 'SKILLS-1', 'skills/ does not exist — skipping name checks')
    skip(findings, 'SKILLS-2', 'skills/ does not exist — skipping duplicate name check')
  }

  return findings
}

// ── Report ─────────────────────────────────────────────────────────────────────

function report(findings: Finding[]): void {
  const order: Severity[] = ['FAIL', 'WARN', 'POLISH', 'PASS', 'SKIP']
  const sorted = [...findings].sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity))

  const fails = findings.filter((f) => f.severity === 'FAIL').length
  const warns = findings.filter((f) => f.severity === 'WARN').length

  for (const f of sorted) {
    if (f.severity === 'PASS') continue // quiet on pass
    console.log(`  ${badge(f.severity)}  [${f.criterion}]  ${f.message}`)
  }

  const passCount = findings.filter((f) => f.severity === 'PASS').length
  console.log('')
  console.log(
    `  ${DIM}${passCount} passed${RESET}   ${fails > 0 ? `${RED}${fails} failed${RESET}` : `${GREEN}0 failed${RESET}`}   ${warns > 0 ? `${YELLOW}${warns} warned${RESET}` : `${DIM}0 warned${RESET}`}`
  )
}

// ── Entry ──────────────────────────────────────────────────────────────────────

const root = resolve(process.argv[2] ?? '.')
console.log(`\n  ${DIM}Auditing harness at:${RESET} ${root}\n`)

const findings = auditHarness(root)
report(findings)

const hasFail = findings.some((f) => f.severity === 'FAIL')
process.exit(hasFail ? 1 : 0)
