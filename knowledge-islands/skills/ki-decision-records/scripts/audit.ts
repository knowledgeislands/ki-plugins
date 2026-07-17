#!/usr/bin/env bun
/**
 * audit.ts [decisions-dir]
 *
 * Audits Decision Records in the given directory against the ki-decision-records standard.
 * Auto-detects KB vs code repo mode from .ki-config.toml. Exits non-zero on any FAIL-severity finding.
 *
 * decisions-dir: if omitted, auto-detects docs/decisions (code repo) or Admin/Governance/Decisions (KB).
 * The index file is README.md in a code repo, Decisions.md in a KB; index ID cells may be linked or bare.
 */

import { readdir, readFile, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

enum Sev {
  FAIL = 0,
  WARN = 1,
  POLISH = 2,
  ADVISORY = 3,
  INFO = 4,
  NA = 5,
  PASS = 6
}

const SEV_LABELS: Record<number, string> = {
  0: 'FAIL',
  1: 'WARN',
  2: 'POLISH',
  3: 'ADVISORY',
  4: 'INFO',
  5: 'NA',
  6: 'PASS'
}

// Every criterion in this checker traces to the one reference doc, so `ref` is a
// constant pointer; `file` carries the DR path a finding concerns (file-scoped).
// Both surface in the CHK-004 `--json` wrapper and the human render.
const REF = 'references/audit-rubric.md'

interface Finding {
  check: string
  severity: Sev
  file: string
  message: string
  ref?: string
}

const PREFIX_TO_TYPE: Record<string, string> = {
  SDR: 'strategy',
  PDR: 'product',
  ADR: 'architecture',
  DDR: 'data',
  XDR: 'security',
  ODR: 'operations',
  GDR: 'governance',
  RDR: 'research',
  KDR: 'knowledge'
}

const VALID_DECISION_TYPES = new Set(Object.values(PREFIX_TO_TYPE))

const DR_FILENAME_RE = /^(SDR|PDR|ADR|DDR|XDR|ODR|GDR|RDR|KDR)-([A-Z][A-Z0-9]*(?:-[A-Z][A-Z0-9]*)*)(-(\d{3,}))(-[a-z0-9-]+)?\.md$/

async function findKiConfig(startDir: string): Promise<string | null> {
  let dir = resolve(startDir)
  for (let i = 0; i < 10; i++) {
    const candidate = join(dir, '.ki-config.toml')
    try {
      await stat(candidate)
      return candidate
    } catch {
      const parent = dirname(dir)
      if (parent === dir) return null
      dir = parent
    }
  }
  return null
}

async function detectKbMode(decisionsDir: string): Promise<boolean> {
  const configPath = await findKiConfig(decisionsDir)
  if (!configPath) return false
  const content = await readFile(configPath, 'utf8')
  // Check for explicit repo_type = "kb" anywhere in the file
  if (/^\s*repo_type\s*=\s*["']kb["']/m.test(content)) return true
  // Presence of [ki-kb] table also implies KB mode
  if (/^\[ki-kb\]/m.test(content)) return true
  return false
}

const CODE_DIR = 'docs/decisions'
const KB_DIR = 'Admin/Governance/Decisions'

async function resolveDecisionsDir(arg: string | undefined): Promise<string> {
  const root = arg ?? '.'
  // The uniform invocation passes the REPO ROOT (`.`): resolve docs/decisions (code) or
  // Admin/Governance/Decisions (KB) under it.
  for (const candidate of [join(root, CODE_DIR), join(root, KB_DIR)]) {
    try {
      await stat(resolve(candidate))
      return candidate
    } catch {
      // not this one — try the next default
    }
  }
  // Legacy: an arg that is itself a decisions dir is used directly.
  if (arg) {
    try {
      await stat(resolve(arg))
      return arg
    } catch {
      // fall through
    }
  }
  return join(root, KB_DIR) // fall back; the not-found error below reports it
}

async function main() {
  const jsonMode = process.argv.includes('--json')
  const dirArg = process.argv.slice(2).find((a) => !a.startsWith('--'))
  const decisionsDir = await resolveDecisionsDir(dirArg)
  const resolvedDir = resolve(decisionsDir)

  try {
    await stat(resolvedDir)
  } catch {
    console.error(`FAIL: decisions directory not found: ${resolvedDir}`)
    process.exit(1)
  }

  const kbMode = await detectKbMode(resolvedDir)
  const entries = await readdir(resolvedDir)
  const drFiles = entries.filter((f) => DR_FILENAME_RE.test(f)).sort()
  const indexFile = kbMode ? 'Decisions.md' : 'README.md'
  const findings: Finding[] = []

  const add = (check: string, severity: Sev, file: string, message: string, ref: string = REF) =>
    findings.push({ check, severity, file, message, ref })

  // INDEX-1
  const hasIndex = entries.includes(indexFile)
  if (!hasIndex) {
    add('INDEX-1', Sev.FAIL, indexFile, `${indexFile} not found in ${decisionsDir}`)
  }

  const indexContent = hasIndex ? await readFile(join(resolvedDir, indexFile), 'utf8') : ''

  // Parse the index. It is an ordered list in reveal order — each item links a DR by its
  // ID (`N. [ID](file.md) — title`). IDs are collected in list order so within-prefix
  // ordering (INDEX-8) can be checked against the reveal sequence. Works for both the KB
  // (`Decisions.md`) and code (`README.md`) index conventions.
  const indexedIds = new Set<string>()
  const ID_IN_ITEM = /^\s*(?:\d+\.|[-*])\s+.*?([A-Z]+DR-[A-Z][A-Z0-9-]+-\d{3,})/

  for (const line of indexContent.split('\n')) {
    const idMatch = line.match(ID_IN_ITEM)
    if (!idMatch) continue
    indexedIds.add(idMatch[1])
  }

  const seenSerials = new Map<string, string>() // "SCOPE-NNN" → filename
  const serialsByGroup = new Map<string, number[]>() // "PREFIX-SCOPE" → serial integers (for FILENAME-3 contiguity)

  for (const file of drFiles) {
    const filePath = join(resolvedDir, file)
    const content = await readFile(filePath, 'utf8')
    const match = DR_FILENAME_RE.exec(file)
    if (!match) continue
    const prefix = match[1]
    const scopeKey = match[2]
    const serial = match[4]
    const drId = `${prefix}-${scopeKey}-${serial}`
    const expectedType = PREFIX_TO_TYPE[prefix]

    // FILENAME-2: DR ID uniqueness within (prefix, scope) — per-prefix serial sequences are valid
    const serialKey = `${prefix}-${scopeKey}-${serial}`
    if (seenSerials.has(serialKey)) {
      add('FILENAME-2', Sev.WARN, file, `DR ID ${serialKey} already used by ${seenSerials.get(serialKey)}`)
    } else {
      seenSerials.set(serialKey, file)
    }

    // FILENAME-3: accumulate serials per (prefix, scope) series for the post-loop contiguity check
    const groupKey = `${prefix}-${scopeKey}`
    const group = serialsByGroup.get(groupKey)
    if (group) group.push(Number(serial))
    else serialsByGroup.set(groupKey, [Number(serial)])

    // FM-0: frontmatter required for KB repos
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
    if (kbMode && !fmMatch) {
      add('FM-0', Sev.FAIL, file, 'YAML frontmatter block missing (required for KB repos)')
      // Can't check further FM items without frontmatter
    } else if (fmMatch) {
      const fm = fmMatch[1]

      if (kbMode) {
        // FM-3: type field
        const typeMatch = fm.match(/^type:\s*(.+)$/m)
        if (!typeMatch) {
          add('FM-3', Sev.FAIL, file, '`type` field missing')
        } else if (typeMatch[1].trim() !== 'admin/governance/decision') {
          add('FM-3', Sev.FAIL, file, `type must be 'admin/governance/decision', got '${typeMatch[1].trim()}'`)
        }

        // FM-4: decision_type present
        const dtMatch = fm.match(/^decision_type:\s*(.+)$/m)
        if (!dtMatch) {
          add('FM-4', Sev.FAIL, file, '`decision_type` field missing')
        } else {
          const dtValue = dtMatch[1].trim()

          // FM-5: valid value
          if (!VALID_DECISION_TYPES.has(dtValue)) {
            add(
              'FM-5',
              Sev.FAIL,
              file,
              `invalid decision_type '${dtValue}' — must be one of: ${[...VALID_DECISION_TYPES].sort().join(', ')}`
            )
          } else {
            // PREFIX-TYPE-1: prefix must match decision_type
            if (dtValue !== expectedType) {
              add(
                'PREFIX-TYPE-1',
                Sev.FAIL,
                file,
                `prefix ${prefix}- implies decision_type '${expectedType}' but frontmatter declares '${dtValue}'`
              )
            }
          }
        }
      } else if (!kbMode) {
        // Code repo with frontmatter: still check prefix-type consistency if decision_type is present
        const dtMatch = fm.match(/^decision_type:\s*(.+)$/m)
        if (dtMatch) {
          const dtValue = dtMatch[1].trim()
          if (VALID_DECISION_TYPES.has(dtValue) && dtValue !== expectedType) {
            add(
              'PREFIX-TYPE-1',
              Sev.WARN,
              file,
              `prefix ${prefix}- implies decision_type '${expectedType}' but frontmatter declares '${dtValue}'`
            )
          }
        }
      }
    }

    // Body checks (strip frontmatter first)
    const body = content.replace(/^---\n[\s\S]*?\n---\n/, '')

    // BODY-1: heading with DR ID prefix
    const headingMatch = body.match(/^#\s+([A-Z]+DR-[A-Z][A-Z0-9-]+-\d{3,}):\s+(.+)$/m)
    if (!headingMatch) {
      add('BODY-1', Sev.FAIL, file, `heading must match '# ${drId}: <Title>'`)
    } else if (headingMatch[1] !== drId) {
      add('BODY-1', Sev.WARN, file, `heading ID '${headingMatch[1]}' does not match filename ID '${drId}'`)
    }

    // BODY-3: **Date:** line is optional; if present it must be YYYY-MM-DD
    const dateMatch = body.match(/^\*\*Date:\*\*\s+(.+)$/m)
    const dateValue = dateMatch?.[1]?.trim()
    if (dateValue && !/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      add('BODY-3', Sev.WARN, file, `\`**Date:**\` present but not in YYYY-MM-DD format: '${dateValue}'`)
    }

    // BODY-4: required sections
    for (const section of ['## Context', '## Decision', '## Consequences']) {
      if (!body.includes(section)) {
        add('BODY-4', Sev.FAIL, file, `missing required section '${section}'`)
      }
    }

    // INDEX-2: must have an entry in the index list
    if (hasIndex && !indexedIds.has(drId)) {
      add('INDEX-2', Sev.FAIL, file, `no entry in ${indexFile} for ${drId}`)
    }
  }

  // FILENAME-3: within each (prefix, scope) series the serials start at 001 and
  // are contiguous — no gaps, whatever the cause (deletion or a reclassification
  // that vacated a serial). A gap is a drafting issue fixed by renumbering the
  // series to close it, not left open. (XXX pending files never match
  // DR_FILENAME_RE, so they are naturally exempt.)
  for (const [groupKey, serials] of serialsByGroup) {
    const sorted = [...new Set(serials)].sort((a, b) => a - b)
    const expected = sorted.map((_, i) => i + 1)
    const missing = expected.filter((n) => !sorted.includes(n))
    if (missing.length > 0) {
      add(
        'FILENAME-3',
        Sev.WARN,
        indexFile,
        `${groupKey} serials are not contiguous from 001: have [${sorted
          .map((n) => String(n).padStart(3, '0'))
          .join(', ')}], missing [${missing.map((n) => String(n).padStart(3, '0')).join(', ')}] — renumber the series to close the gap`
      )
    }
  }

  // INDEX-3: no orphan entries in the index list
  if (hasIndex) {
    for (const indexedId of indexedIds) {
      if (!drFiles.some((f) => f.startsWith(indexedId))) {
        add('INDEX-3', Sev.FAIL, indexFile, `index entry for '${indexedId}' has no matching DR file`)
      }
    }
  }

  // INDEX-8: within each prefix, serials must ascend in reveal (row) order — a
  // PREFIX-NNN row never precedes a lower-numbered PREFIX-MMM. A violation is a
  // drafting issue (fix by renumbering, not by reordering out of sequence).
  if (hasIndex) {
    const maxSerialByPrefix = new Map<string, number>()
    for (const indexedId of indexedIds) {
      const serialMatch = indexedId.match(/^(.*)-(\d{3,})$/)
      if (!serialMatch) continue
      const prefixKey = serialMatch[1] ?? ''
      const serialNum = Number(serialMatch[2])
      const prevMax = maxSerialByPrefix.get(prefixKey)
      if (prevMax !== undefined && serialNum < prevMax) {
        add(
          'INDEX-8',
          Sev.WARN,
          indexFile,
          `${indexedId} precedes a lower-numbered ${prefixKey}-${String(prevMax).padStart(3, '0')} in the reading order; within a prefix serials must ascend (drafting issue — renumber, don't reorder)`
        )
      }
      maxSerialByPrefix.set(prefixKey, Math.max(prevMax ?? 0, serialNum))
    }
  }

  // --json: emit the pinned checker-contract wrapper (never a bare array); the footer is
  // suppressed under --json. Exit code still reflects any FAIL.
  if (jsonMode) {
    const summary = { fail: 0, warn: 0, polish: 0, advisory: 0, info: 0, na: 0, pass: 0 }
    for (const f of findings) summary[(SEV_LABELS[f.severity] ?? '').toLowerCase() as keyof typeof summary]++
    console.log(
      JSON.stringify({
        concern: 'decision-records',
        target: decisionsDir,
        generatedAt: new Date().toISOString(),
        summary,
        findings: findings.map((f) => ({ level: SEV_LABELS[f.severity], area: f.check, msg: f.message, ref: f.ref, file: f.file }))
      })
    )
    process.exit(findings.some((f) => f.severity === Sev.FAIL) ? 1 : 0)
  }

  // Report grouped by severity
  let hasFail = false
  for (let sev = Sev.FAIL; sev <= Sev.PASS; sev++) {
    const group = findings.filter((f) => f.severity === sev)
    for (const f of group) {
      const label = SEV_LABELS[f.severity] ?? String(f.severity)
      console.log(`${label.padEnd(8)} [${f.check}]${f.file ? ` ${f.file}` : ''} ${f.message}${f.ref ? ` (${f.ref})` : ''}`)
      if (sev === Sev.FAIL) hasFail = true
    }
  }

  if (findings.length === 0) {
    const modeLabel = kbMode ? 'KB mode' : 'code mode'
    console.log(`PASS     DR audit — ${drFiles.length} file${drFiles.length === 1 ? '' : 's'}, ${modeLabel}, ${decisionsDir}`)
  }

  if (findings.some((f) => ['FAIL', 'WARN', 'POLISH'].includes(SEV_LABELS[f.severity] ?? '')))
    console.log('→ to address: run /ki-decision-records CONFORM   (judgment criteria: references/audit-rubric.md)')
  process.exit(hasFail ? 1 : 0)
}

main().catch((err) => {
  console.error(`ERROR: ${String(err)}`)
  process.exit(1)
})
