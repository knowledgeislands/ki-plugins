#!/usr/bin/env bun
/**
 * audit-features.ts [features-dir]
 *
 * Audits Feature Definitions in the given directory against the ki-feature-definitions
 * standard. Exits non-zero on any FAIL-severity finding.
 *
 * features-dir: defaults to docs/features. The index is index.md; it carries one or more
 * areas tables (columns include Prefix and File). Each area file holds requirements as
 * `### <PREFIX>-NNN — <title>` headings, each with an RFC-2119 statement and a
 * `_Verify:_` line. A `## Gaps …` section holds the unnumbered backlog and is exempt from
 * ID/requirement checks. Self-contained (node builtins only) so it vendors standalone.
 */

import { readdir, readFile, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'

enum Sev {
  FAIL = 0,
  WARN = 1,
  POLISH = 2,
  ADVISORY = 3,
  INFO = 4,
  SKIP = 5,
  PASS = 6
}

const SEV_LABELS: Record<number, string> = {
  0: 'FAIL',
  1: 'WARN',
  2: 'POLISH',
  3: 'ADVISORY',
  4: 'INFO',
  5: 'SKIP',
  6: 'PASS'
}

interface Finding {
  check: string
  severity: Sev
  file: string
  message: string
}

const DEFAULT_DIR = 'docs/features'
const INDEX_FILE = 'index.md'

// RFC-2119 requirement keywords (BCP 14). Matched case-sensitively as whole words so
// prose "must" (lowercase) does not count — a normative statement uses the uppercase form.
const RFC2119 = /\b(MUST NOT|MUST|SHALL NOT|SHALL|SHOULD NOT|SHOULD|MAY|REQUIRED|RECOMMENDED|NOT RECOMMENDED|OPTIONAL)\b/

// A requirement heading: `### <PREFIX>-NNN — <title>`. PREFIX is one or more uppercase
// alpha-leading segments joined by hyphens (e.g. SITE-SEO); NNN is zero-padded (≥ 3
// digits); the separator before the title is an em dash (—).
const REQ_HEADING_RE = /^###\s+([A-Z][A-Z0-9]*(?:-[A-Z][A-Z0-9]*)*)-(\d{3,})\s+—\s+(.+?)\s*$/
// Any level-3 heading (to catch malformed requirement IDs outside the Gaps section).
const H3_RE = /^###\s+(.+?)\s*$/

function splitRow(line: string): string[] | null {
  if (!/^\s*\|/.test(line)) return null
  return line
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim())
}

// Parse every areas table in the index: prefix → file. Re-detects header rows so multiple
// sub-tables (one per Area grouping) are all read.
function parseAreasTables(indexContent: string): Map<string, string> {
  const prefixToFile = new Map<string, string>()
  let prefixCol = -1
  let fileCol = -1
  for (const line of indexContent.split('\n')) {
    const cells = splitRow(line)
    if (!cells) {
      // A blank/non-table line ends the current table; reset column tracking.
      if (line.trim() === '') {
        prefixCol = -1
        fileCol = -1
      }
      continue
    }
    const p = cells.findIndex((c) => /^prefix$/i.test(c.replace(/`/g, '')))
    const f = cells.findIndex((c) => /^file$/i.test(c.replace(/`/g, '')))
    if (p >= 0 && f >= 0) {
      prefixCol = p
      fileCol = f
      continue
    }
    if (prefixCol < 0 || fileCol < 0) continue
    if (/^[-: ]+$/.test(cells.join(''))) continue // separator row
    const prefixCell = cells[prefixCol]?.replace(/`/g, '').trim() ?? ''
    const fileCell = (cells[fileCol] ?? '')
      .replace(/[`[\]]/g, '')
      .replace(/\(.*?\)/, '')
      .trim()
    if (!prefixCell || !fileCell) continue
    // A cell may list several prefixes (e.g. `BLOOM`·`TRUST`); register each.
    for (const prefix of prefixCell
      .split(/[·,/]|\s+/)
      .map((s) => s.trim())
      .filter(Boolean)) {
      prefixToFile.set(prefix, fileCell)
    }
  }
  return prefixToFile
}

async function main() {
  const featuresDir = process.argv[2] ?? DEFAULT_DIR
  const resolvedDir = resolve(featuresDir)

  try {
    await stat(resolvedDir)
  } catch {
    console.error(`FAIL: features directory not found: ${resolvedDir}`)
    process.exit(1)
  }

  const findings: Finding[] = []
  const add = (check: string, severity: Sev, file: string, message: string) => findings.push({ check, severity, file, message })

  const entries = await readdir(resolvedDir)
  const areaFiles = entries.filter((f) => f.endsWith('.md') && f !== INDEX_FILE).sort()

  // INDEX-1: index.md present.
  const hasIndex = entries.includes(INDEX_FILE)
  if (!hasIndex) add('INDEX-1', Sev.FAIL, INDEX_FILE, `${INDEX_FILE} not found in ${featuresDir}`)
  const indexContent = hasIndex ? await readFile(join(resolvedDir, INDEX_FILE), 'utf8') : ''

  const prefixToFile = parseAreasTables(indexContent)
  const registeredFiles = new Set(prefixToFile.values())

  // INDEX-2: the areas table must be present and non-empty.
  if (hasIndex && prefixToFile.size === 0) {
    add('INDEX-2', Sev.FAIL, INDEX_FILE, 'no areas table found (expected columns including Prefix and File)')
  }

  // AREA-1: every file named in an areas table exists.
  for (const [prefix, file] of prefixToFile) {
    if (!entries.includes(file)) add('AREA-1', Sev.WARN, INDEX_FILE, `areas table lists ${file} (prefix ${prefix}) but the file is missing`)
  }
  // AREA-2: every area .md file is registered under at least one prefix.
  for (const file of areaFiles) {
    if (!registeredFiles.has(file)) add('AREA-2', Sev.WARN, file, `area file not registered in ${INDEX_FILE} areas table`)
  }

  // Per-file requirement checks.
  const seenIds = new Map<string, string>() // "PREFIX-NNN" → "file:title"
  for (const file of areaFiles) {
    const content = await readFile(join(resolvedDir, file), 'utf8')
    const lines = content.split('\n')

    // `## Gaps …` turns exemption on until the next `## ` heading.
    let inGaps = false
    const reqs: Array<{ idx: number; id: string; prefix: string; deprecated: boolean }> = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const h2 = line.match(/^##\s+(.+?)\s*$/)
      if (h2) {
        inGaps = /^gaps\b/i.test(h2[1].trim())
        continue
      }
      if (inGaps) continue
      const h3 = line.match(H3_RE)
      if (!h3) continue
      const req = line.match(REQ_HEADING_RE)
      if (!req) {
        add('ID-1', Sev.FAIL, file, `level-3 heading is not a valid requirement ID (### <PREFIX>-NNN — title): "${h3[1]}"`)
        continue
      }
      const [, prefix, serial, title] = req
      const id = `${prefix}-${serial}`
      const deprecated = /deprecated/i.test(title) || /^~~/.test(title.trim())
      // ID-2: the prefix must be registered to THIS file (handles multi-prefix files).
      const owner = prefixToFile.get(prefix)
      if (!owner) {
        add('ID-2', Sev.FAIL, file, `${id} uses prefix ${prefix}, which no areas-table row registers`)
      } else if (owner !== file) {
        add('ID-2', Sev.FAIL, file, `${id} uses prefix ${prefix}, registered to ${owner} not ${file}`)
      }
      // ID-3: append-only — serials unique per prefix across the whole set.
      if (seenIds.has(id)) add('ID-3', Sev.WARN, file, `${id} already defined by ${seenIds.get(id)} (IDs are append-only, never reused)`)
      else seenIds.set(id, `${file}`)
      reqs.push({ idx: i, id, prefix, deprecated })
    }

    // Body checks: the block from each requirement heading to the next heading. A
    // deprecated requirement keeps its ID but is exempt from statement/verify checks.
    for (let r = 0; r < reqs.length; r++) {
      if (reqs[r].deprecated) continue
      const start = reqs[r].idx + 1
      const end = r + 1 < reqs.length ? reqs[r + 1].idx : lines.length
      const block = lines.slice(start, end).join('\n')
      if (!RFC2119.test(block))
        add('REQ-1', Sev.FAIL, file, `${reqs[r].id} has no RFC-2119 keyword (MUST / SHOULD / MAY …) in its statement`)
      if (!/_Verify:_/.test(block)) add('VERIFY-1', Sev.WARN, file, `${reqs[r].id} has no \`_Verify:_\` line`)
    }
  }

  // Report grouped by severity.
  let hasFail = false
  for (let sev = Sev.FAIL; sev <= Sev.PASS; sev++) {
    for (const f of findings.filter((x) => x.severity === sev)) {
      console.log(`${(SEV_LABELS[f.severity] ?? String(f.severity)).padEnd(8)} [${f.check}] ${f.file}: ${f.message}`)
      if (sev === Sev.FAIL) hasFail = true
    }
  }
  if (findings.length === 0) {
    console.log(
      `PASS     feature audit — ${areaFiles.length} area file${areaFiles.length === 1 ? '' : 's'}, ${seenIds.size} requirement${seenIds.size === 1 ? '' : 's'}, ${featuresDir}`
    )
  }

  process.exit(hasFail ? 1 : 0)
}

main().catch((err) => {
  console.error(`ERROR: ${String(err)}`)
  process.exit(1)
})
