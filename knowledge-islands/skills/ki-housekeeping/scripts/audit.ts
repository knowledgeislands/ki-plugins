#!/usr/bin/env bun
/**
 * Mechanical checker for ki-housekeeping.
 *
 * Usage: bun skills/environment/ki-housekeeping/scripts/audit.ts [repo-path] [--json] [--report [dir]] [--memory-dir <dir>]
 *
 * Resolves the Claude Code auto-memory directory for a repo
 * (~/.claude/projects/<slug>/memory, slug = repo's absolute path with "/" and "." -> "-")
 * and checks index/frontmatter agreement per skills/environment/ki-housekeeping/references/audit-rubric.md.
 * See skills/foundations/ki-engineering/references/checker-contract.md for the severity ladder,
 * exit-code, and flag contract every checker in this repo follows.
 */

import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { basename, join, resolve } from 'node:path'

enum Sev {
  FAIL = 0,
  WARN = 1,
  POLISH = 2,
  ADVISORY = 3,
  INFO = 4,
  NA = 5,
  PASS = 6
}

const SEV_LABELS: Record<Sev, string> = {
  [Sev.FAIL]: 'FAIL',
  [Sev.WARN]: 'WARN',
  [Sev.POLISH]: 'POLISH',
  [Sev.ADVISORY]: 'ADVISORY',
  [Sev.INFO]: 'INFO',
  [Sev.NA]: 'NA',
  [Sev.PASS]: 'PASS'
}

const VALID_TYPES = new Set(['user', 'feedback', 'project', 'reference'])

interface Finding {
  id: string
  severity: Sev
  file: string
  message: string
  ref?: string
}

// Reference-doc pointer per criterion (the cited-finding standard). The memory-area
// index/frontmatter criteria are specified in memory-format.md; the DIR-1 store-resolution
// rule in the standard; the SUMMARY roll-up in the rubric itself.
const REF_MEMORY_FORMAT = 'references/memory-format.md'
const REF_STANDARD = 'references/housekeeping-standard.md'
const REF_RUBRIC = 'references/audit-rubric.md'
const REF_BY_ID: Record<string, string> = {
  'DIR-1': REF_STANDARD,
  'IDX-1': REF_MEMORY_FORMAT,
  'IDX-2': REF_MEMORY_FORMAT,
  'IDX-3': REF_MEMORY_FORMAT,
  'IDX-4': REF_MEMORY_FORMAT,
  'IDX-5': REF_MEMORY_FORMAT,
  'IDX-6': REF_MEMORY_FORMAT,
  'FM-1': REF_MEMORY_FORMAT,
  'FM-2': REF_MEMORY_FORMAT,
  'FM-3': REF_MEMORY_FORMAT,
  'FM-4': REF_MEMORY_FORMAT,
  'FM-5': REF_MEMORY_FORMAT,
  'LINK-1': REF_MEMORY_FORMAT,
  SUMMARY: REF_RUBRIC
}

function slugifyRepoPath(absPath: string): string {
  return absPath.replace(/[/.]/g, '-')
}

function resolveMemoryDir(repoArg: string | undefined): string {
  const repoAbs = resolve(repoArg ?? process.cwd())
  const slug = slugifyRepoPath(repoAbs)
  return join(homedir(), '.claude', 'projects', slug, 'memory')
}

function parseFrontmatter(content: string): Record<string, unknown> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null
  const lines = match[1].split('\n')
  const out: Record<string, unknown> = {}
  let currentKey: string | null = null
  for (const line of lines) {
    const topLevel = line.match(/^([a-zA-Z_]+):\s*(.*)$/)
    if (topLevel) {
      currentKey = topLevel[1]
      const value = topLevel[2].trim()
      out[currentKey] = value === '' ? {} : value.replace(/^["']|["']$/g, '')
      continue
    }
    const nested = line.match(/^\s+([a-zA-Z_]+):\s*(.*)$/)
    if (nested && currentKey && typeof out[currentKey] === 'object') {
      ;(out[currentKey] as Record<string, string>)[nested[1]] = nested[2].trim().replace(/^["']|["']$/g, '')
    }
  }
  return out
}

async function main() {
  const args = process.argv.slice(2)
  const jsonMode = args.includes('--json')
  const reportIdx = args.indexOf('--report')
  const reportDir = reportIdx !== -1 ? (args[reportIdx + 1] ?? '.') : null
  const memDirIdx = args.indexOf('--memory-dir')
  const memDirArg = memDirIdx !== -1 ? args[memDirIdx + 1] : undefined
  const repoArg = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--report' && args[i - 1] !== '--memory-dir')

  // --memory-dir points the checker at an explicit store (used by the test harness and
  // for auditing a memory directory directly); otherwise derive it from the repo path.
  const memoryDir = memDirArg ? resolve(memDirArg) : resolveMemoryDir(repoArg)
  const repoName = basename(resolve(repoArg ?? process.cwd()))
  const findings: Finding[] = []
  const add = (id: string, severity: Sev, file: string, message: string) =>
    findings.push({ id, severity, file, message, ref: REF_BY_ID[id] })

  let dirExists = true
  try {
    await stat(memoryDir)
  } catch {
    dirExists = false
  }

  if (!dirExists) {
    add('DIR-1', Sev.NA, memoryDir, 'no memory/ directory for this repo yet — not a failure')
    report(findings, jsonMode, memoryDir)
    if (reportDir) await writeReport(reportDir, findings, memoryDir)
    process.exit(0)
  }

  const entries = await readdir(memoryDir)
  const mdFiles = entries.filter((f) => f.endsWith('.md'))
  const indexFile = 'MEMORY.md'
  const hasIndex = mdFiles.includes(indexFile)

  if (!hasIndex) {
    add('IDX-1', Sev.FAIL, indexFile, `${indexFile} not found in ${memoryDir}`)
  }

  const memoryFiles = mdFiles.filter((f) => f !== indexFile)
  const indexedFiles = new Set<string>()

  if (hasIndex) {
    const indexContent = await readFile(join(memoryDir, indexFile), 'utf8')
    const entryLines = indexContent.split('\n').filter((l) => /^-\s*\[.+\]\(.+\.md\)/.test(l))

    for (const line of entryLines) {
      if (line.length > 150) {
        add('IDX-4', Sev.POLISH, indexFile, `index line exceeds 150 chars: ${line.slice(0, 60)}...`)
      }
      const linkMatch = line.match(/\]\(([^)]+\.md)\)/)
      if (!linkMatch) continue
      const target = linkMatch[1]
      indexedFiles.add(target)
      if (!memoryFiles.includes(target)) {
        add('IDX-2', Sev.FAIL, indexFile, `index entry points to missing file: ${target}`)
      }
    }

    for (const file of memoryFiles) {
      if (!indexedFiles.has(file)) {
        add('IDX-3', Sev.WARN, file, `${file} is not listed in ${indexFile}`)
      }
    }

    const startMarker = indexContent.includes('<!-- headroom:learn:start -->')
    const endMarker = indexContent.includes('<!-- headroom:learn:end -->')
    if (startMarker !== endMarker) {
      add('IDX-5', Sev.WARN, indexFile, 'headroom:learn block has a start marker without a matching end marker (or vice versa)')
    } else if (startMarker && endMarker) {
      const startPos = indexContent.indexOf('<!-- headroom:learn:start -->')
      const endPos = indexContent.indexOf('<!-- headroom:learn:end -->')
      if (endPos < startPos) {
        add('IDX-5', Sev.WARN, indexFile, 'headroom:learn end marker appears before start marker')
      } else {
        add('IDX-5', Sev.PASS, indexFile, 'headroom:learn block markers well-formed')
        // IDX-6 — entries inside the learn block that are rooted in another repo are
        // stale cross-repo captures (headroom learned them in a different island).
        // Heuristic: absolute `knowledgeislands/<repo>` paths whose <repo> ≠ this repo.
        const block = indexContent.slice(startPos, endPos)
        const foreign = new Set<string>()
        let foreignLines = 0
        for (const line of block.split('\n')) {
          const names = [...line.matchAll(/knowledgeislands\/([A-Za-z0-9_-]+)/g)].map((mm) => mm[1]).filter((n) => n !== repoName)
          if (names.length > 0) {
            foreignLines++
            for (const n of names) foreign.add(n)
          }
        }
        if (foreign.size > 0) {
          add(
            'IDX-6',
            Sev.WARN,
            indexFile,
            `headroom:learn block has ${foreignLines} line(s) rooted in other repo(s) (${[...foreign].join(', ')}) — remove the source with headroom memory list/show/delete --db-path; re-learn here if still useful`
          )
        }
      }
    }
  }

  const seenNames = new Map<string, string>()
  let danglingLinks = 0
  const definedNames = new Set<string>()

  const parsed = new Map<string, { fm: Record<string, unknown> | null; content: string }>()
  for (const file of memoryFiles) {
    const content = await readFile(join(memoryDir, file), 'utf8')
    const fm = parseFrontmatter(content)
    parsed.set(file, { fm, content })
    if (fm && typeof fm.name === 'string') definedNames.add(fm.name)
  }

  for (const file of memoryFiles) {
    const entry = parsed.get(file)
    if (!entry) continue
    const { fm, content } = entry
    const expectedName = file.replace(/\.md$/, '')

    if (!fm) {
      add('FM-1', Sev.FAIL, file, 'no frontmatter block found')
      continue
    }

    const name = fm.name
    if (typeof name !== 'string' || name.length === 0) {
      add('FM-2', Sev.FAIL, file, 'missing name field')
    } else if (name !== expectedName) {
      add('FM-2', Sev.FAIL, file, `name '${name}' does not match filename slug '${expectedName}'`)
    } else if (seenNames.has(name)) {
      add('FM-5', Sev.FAIL, file, `duplicate name '${name}' also used by ${seenNames.get(name)}`)
    } else {
      seenNames.set(name, file)
    }

    const description = fm.description
    if (typeof description !== 'string' || description.trim().length === 0) {
      add('FM-3', Sev.FAIL, file, 'missing or empty description field')
    }

    const metadata = fm.metadata
    const type = metadata && typeof metadata === 'object' ? (metadata as Record<string, string>).type : undefined
    if (!type || !VALID_TYPES.has(type)) {
      add('FM-4', Sev.FAIL, file, `metadata.type is '${type ?? '(missing)'}', must be one of ${[...VALID_TYPES].join(', ')}`)
    }

    const links = content.match(/\[\[([a-z0-9-]+)\]\]/g) ?? []
    for (const link of links) {
      const target = link.slice(2, -2)
      if (!definedNames.has(target) && target !== expectedName) danglingLinks++
    }
  }

  if (danglingLinks > 0) {
    add(
      'LINK-1',
      Sev.INFO,
      memoryDir,
      `${danglingLinks} [[wikilink]] reference(s) point to a memory not yet written — treated as intentional forward references, not errors`
    )
  }

  if (findings.length === 0 || findings.every((f) => f.severity === Sev.PASS)) {
    add('SUMMARY', Sev.PASS, memoryDir, `all ${memoryFiles.length} memory file(s) pass mechanical checks`)
  }

  report(findings, jsonMode, memoryDir)
  if (reportDir) await writeReport(reportDir, findings, memoryDir)

  const hasFail = findings.some((f) => f.severity === Sev.FAIL)
  process.exit(hasFail ? 1 : 0)
}

// The pinned checker-contract `--json` wrapper: { concern, target, generatedAt, summary,
// findings }, each finding { level, area, msg }, summary carrying all seven lowercase
// ladder keys present even at zero. Shared by --json (stdout) and --report (file).
function jsonReport(findings: Finding[], target: string) {
  const summary = { fail: 0, warn: 0, polish: 0, advisory: 0, info: 0, na: 0, pass: 0 }
  for (const f of findings) summary[SEV_LABELS[f.severity].toLowerCase() as keyof typeof summary]++
  return {
    concern: 'housekeeping',
    target,
    generatedAt: new Date().toISOString(),
    summary,
    findings: findings.map((f) => ({ level: SEV_LABELS[f.severity], area: f.id, msg: f.message, ref: f.ref, file: f.file }))
  }
}

function report(findings: Finding[], jsonMode: boolean, target: string) {
  if (jsonMode) {
    console.log(JSON.stringify(jsonReport(findings, target), null, 2))
    return
  }
  const tally: Partial<Record<Sev, number>> = {}
  for (const f of findings) {
    tally[f.severity] = (tally[f.severity] ?? 0) + 1
    console.log(`${SEV_LABELS[f.severity].padEnd(8)} ${f.id.padEnd(10)} ${f.file}: ${f.message}${f.ref ? `  (${f.ref})` : ''}`)
  }
  const parts = [Sev.FAIL, Sev.WARN, Sev.POLISH, Sev.PASS]
    .map((s) => `${SEV_LABELS[s]}=${tally[s] ?? 0}`)
    .concat([Sev.ADVISORY, Sev.NA].map((s) => `${SEV_LABELS[s]}=${tally[s] ?? 0}`))
  console.log(parts.join(' '))
  // Remediation footer (checker-contract) — non-clean summary routes to the judgment mode.
  const notClean = (tally[Sev.FAIL] ?? 0) + (tally[Sev.WARN] ?? 0) + (tally[Sev.POLISH] ?? 0) > 0
  if (notClean) {
    console.log('→ to address: run /ki-housekeeping CONFORM   (judgment criteria: references/audit-rubric.md)')
  }
}

async function writeReport(dir: string, findings: Finding[], target: string) {
  const outDir = join(resolve(dir), '.ki-meta', 'audits')
  await mkdir(outDir, { recursive: true })
  await writeFile(join(outDir, 'ki-housekeeping.json'), JSON.stringify(jsonReport(findings, target), null, 2))
}

main().catch((err) => {
  console.error(`ERROR: ${err.message}`)
  process.exit(1)
})
