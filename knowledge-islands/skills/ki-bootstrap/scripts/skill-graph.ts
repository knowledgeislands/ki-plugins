#!/usr/bin/env bun
// skill-graph.ts — read the `implies:` frontmatter graph across every SKILL.md
// and (a) validate it, (b) render the dependency tree.
//
//   bun skill-graph.ts --check                     validate the graph; exit 1 on error
//   bun skill-graph.ts --check --check-doc <path>  also compare a marked documentation block
//   bun skill-graph.ts --tree                      print the Markdown dependency tree to stdout
//
// Canonical home is skills/keystone/ki-bootstrap/scripts/; also vendored into a governed
// harness-shaped target's .ki-meta/bin/ (ADR-KI-HARNESS-008). It resolves skills/
// from the cwd (repo root). The `implies:` list in each skill's frontmatter is the
// single declared source of the implication graph: linking a skill pulls in the
// skills it implies. Both the bootstrap chain and the user-guide dependency tree
// derive from it, so a broken edge (e.g. an un-updated name after a rename) fails
// the `--check` gate that `bun run test` runs.

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const SKILLS_DIR = 'skills'
const DOC_START = '<!-- BEGIN GENERATED SKILL GRAPH -->'
const DOC_END = '<!-- END GENERATED SKILL GRAPH -->'

// Skills live one or two levels under SKILLS_DIR — either flat (skills/<name>,
// tolerated as a migration leftover) or clustered (skills/<cluster>/<name>).
// Resolves the on-disk path for every skill name, keyed by bare name.
function skillPaths(): Map<string, string> {
  const paths = new Map<string, string>()
  const top = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
  for (const name of top) {
    const p1 = join(SKILLS_DIR, name)
    if (existsSync(join(p1, 'SKILL.md'))) {
      paths.set(name, p1)
      continue
    }
    for (const sub of readdirSync(p1, { withFileTypes: true })) {
      if (!sub.isDirectory()) continue
      const p2 = join(p1, sub.name)
      if (existsSync(join(p2, 'SKILL.md'))) paths.set(sub.name, p2)
    }
  }
  return paths
}

type Graph = Map<string, string[]>

/** Parse the `implies:` flow list from a SKILL.md frontmatter block. */
function parseImplies(skillMd: string): string[] | null {
  const fm = skillMd.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!fm) return null
  const line = fm[1].split(/\r?\n/).find((l) => /^implies:/.test(l))
  if (line === undefined) return null
  const body = line.replace(/^implies:\s*/, '').trim()
  const inner = body.replace(/^\[/, '').replace(/\]$/, '').trim()
  if (inner === '') return []
  return inner
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function loadGraph(): { graph: Graph; unannotated: string[] } {
  const graph: Graph = new Map()
  const unannotated: string[] = []
  const paths = skillPaths()
  const dirs = [...paths.keys()].sort()
  for (const dir of dirs) {
    const md = readFileSync(join(paths.get(dir) as string, 'SKILL.md'), 'utf8')
    const implies = parseImplies(md)
    if (implies === null) {
      unannotated.push(dir)
      continue
    }
    graph.set(dir, implies)
  }
  return { graph, unannotated }
}

/** Detect a cycle; return the offending path if one exists. */
function findCycle(graph: Graph): string[] | null {
  const WHITE = 0
  const GREY = 1
  const BLACK = 2
  const colour = new Map<string, number>()
  for (const k of graph.keys()) colour.set(k, WHITE)
  const stack: string[] = []

  function visit(node: string): string[] | null {
    colour.set(node, GREY)
    stack.push(node)
    for (const next of graph.get(node) ?? []) {
      if (!graph.has(next)) continue // missing edge handled separately
      const c = colour.get(next)
      if (c === GREY) return [...stack.slice(stack.indexOf(next)), next]
      if (c === WHITE) {
        const cyc = visit(next)
        if (cyc) return cyc
      }
    }
    stack.pop()
    colour.set(node, BLACK)
    return null
  }

  for (const node of graph.keys()) {
    if (colour.get(node) === WHITE) {
      const cyc = visit(node)
      if (cyc) return cyc
    }
  }
  return null
}

function checkDocument(path: string, expectedTree: string, errors: string[]): void {
  if (!existsSync(path)) {
    errors.push(`${path}: documentation path does not exist`)
    return
  }
  const document = readFileSync(path, 'utf8')
  const start = document.indexOf(DOC_START)
  const end = document.indexOf(DOC_END)
  if (start === -1 || end === -1 || end < start) {
    errors.push(`${path}: missing or misordered generated skill-graph markers`)
    return
  }
  if (document.lastIndexOf(DOC_START) !== start || document.lastIndexOf(DOC_END) !== end) {
    errors.push(`${path}: generated skill-graph markers must occur exactly once`)
    return
  }
  const actual = document.slice(start, end + DOC_END.length)
  const expected = `${DOC_START}\n\n\`\`\`text\n${expectedTree}\n\`\`\`\n\n${DOC_END}`
  if (actual !== expected) {
    errors.push(`${path}: generated skill-graph block is stale; replace its marked region with the current --tree output`)
  }
}

function graphErrors(graph: Graph, unannotated: string[]): string[] {
  const errors: string[] = []
  for (const skill of unannotated) {
    errors.push(`${skill}: SKILL.md has no \`implies:\` frontmatter key (every skill must declare one, even if empty)`)
  }
  for (const [skill, implies] of graph) {
    for (const target of implies) {
      if (!graph.has(target)) {
        errors.push(`${skill}: implies "${target}", which is not a skill directory under ${SKILLS_DIR}/`)
      }
      if (target === skill) {
        errors.push(`${skill}: implies itself`)
      }
    }
  }
  const cycle = findCycle(graph)
  if (cycle) errors.push(`implication cycle: ${cycle.join(' → ')}`)
  return errors
}

function reportErrors(errors: string[]): number {
  console.error('FAIL  skill-graph — graph/document check failed:')
  for (const error of errors) console.error(`  · ${error}`)
  return 1
}

function check(documentPath?: string): number {
  const { graph, unannotated } = loadGraph()
  const errors = graphErrors(graph, unannotated)
  if (documentPath && errors.length === 0) checkDocument(documentPath, renderTree(graph), errors)

  if (errors.length > 0) return reportErrors(errors)
  console.log(`PASS  skill-graph — ${graph.size} skills, implication graph valid${documentPath ? ', rendered document current' : ''}`)
  return 0
}

// Presentation-only ordering of roots for the rendered tree.
const CLUSTER_ORDER = [
  'ki-bootstrap',
  'ki-harness',
  'ki-kb',
  'ki-website',
  'ki-mcp',
  'ki-plugins',
  'ki-handoffs',
  'ki-project-roadmap',
  'ki-feature-definitions',
  'ki-binding',
  'ki-housekeeping',
  'ki-tokenomics'
]

function renderTree(graph: Graph): string {
  const implied = new Set<string>()
  for (const targets of graph.values()) for (const t of targets) implied.add(t)
  const roots = [...graph.keys()]
    .filter((s) => !implied.has(s))
    .sort((a, b) => {
      const ia = CLUSTER_ORDER.indexOf(a)
      const ib = CLUSTER_ORDER.indexOf(b)
      if (ia !== -1 && ib !== -1) return ia - ib
      if (ia !== -1) return -1
      if (ib !== -1) return 1
      return a.localeCompare(b)
    })

  const lines: string[] = []
  function walk(node: string, prefix: string, isLast: boolean, isRoot: boolean): void {
    if (isRoot) {
      lines.push(node)
    } else {
      lines.push(`${prefix}${isLast ? '└─ ' : '├─ '}${node}`)
    }
    const children = graph.get(node) ?? []
    const childPrefix = isRoot ? '' : prefix + (isLast ? '   ' : '│  ')
    children.forEach((c, i) => {
      walk(c, childPrefix, i === children.length - 1, false)
    })
  }
  for (const root of roots) {
    walk(root, '', true, true)
    lines.push('')
  }
  return lines.join('\n').trimEnd()
}

const argv = process.argv.slice(2)
const documentFlag = argv.indexOf('--check-doc')
const documentPath = documentFlag === -1 ? undefined : argv[documentFlag + 1]
const usage = (): never => {
  console.error('usage: skill-graph.ts [--check [--check-doc <path>] | --tree]')
  process.exit(2)
}
let documentFlags = 0
for (let index = 0; index < argv.length; index += 1) {
  const argument = argv[index]
  if (argument === '--check' || argument === '--tree') continue
  if (argument === '--check-doc') {
    documentFlags += 1
    const path = argv[index + 1]
    if (!path || path.startsWith('--')) usage()
    index += 1
    continue
  }
  usage()
}
const checkFlags = argv.filter((argument) => argument === '--check').length
const treeFlags = argv.filter((argument) => argument === '--tree').length
if (checkFlags > 1 || treeFlags > 1 || documentFlags > 1 || (treeFlags > 0 && (checkFlags > 0 || documentFlags > 0))) usage()

if (treeFlags === 1) {
  const { graph, unannotated } = loadGraph()
  const errors = graphErrors(graph, unannotated)
  if (errors.length > 0) process.exit(reportErrors(errors))
  console.log(renderTree(graph))
  process.exit(0)
} else {
  // default is --check
  process.exit(check(documentPath))
}
