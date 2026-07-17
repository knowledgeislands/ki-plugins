#!/usr/bin/env bun

/**
 * Safely publish a repository's generated project-local links.
 *
 * The public link-skills.ts and link-agents.ts commands delegate here.  Their
 * write path is deliberately one transaction: it validates every repository
 * controlled destination, stages new entries in a private 0700 directory, then
 * publishes the complete link and .gitignore set or rolls it back.  A real file,
 * directory, or hostile symlink at a managed destination is a blocker; it is
 * never overwritten or followed.
 */

import { createHash } from 'node:crypto'
import {
  chmodSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  renameSync,
  rmdirSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gitignoresPath, runtimeAgentsDir, runtimeSkillsDir, targetRuntimes } from './package-scripts.ts'
import { assertResolvableSkills, declaredSkills, SkillResolutionError } from './resolve.ts'

export type ProjectLinkScope = 'skills' | 'agents' | 'all'
export type ProjectSkillPublication = 'copy' | 'development-link'

type Kind = 'file' | 'dir' | 'link' | 'other'
type Entry = { kind: Kind; dev: number; ino: number; uid: number; mode: number; link?: string; bytes?: Buffer }
type LinkKind = 'file' | 'dir' | 'copy'
type PlannedLink = { destination: string; source: string; kind: LinkKind; label: string; skill?: string; before?: Entry }
type PlannedRemove = { destination: string; label: string; before: Entry }
type PlannedFile = { destination: string; content: string; label: string; before?: Entry }
type Published = { destination: string; before?: Entry; after?: Entry; backup?: string; stage: string }
type Directory = { path: string; entry: Entry; created: boolean }
type LinkPlan = {
  root: Entry
  links: PlannedLink[]
  removes: PlannedRemove[]
  gitignore?: PlannedFile
  directories: string[]
  guards: Array<{ path: string; before?: Entry; label: string }>
  skillOrphans: string[]
}

const SELF = realpathFor(fileURLToPath(import.meta.url))
const SCRIPTS = dirname(SELF)
const SKILLS_ROOT = resolve(
  (process.env.NODE_ENV === 'test' ? process.env.KI_PROJECT_LINKS_TEST_SKILLS_ROOT : undefined) ?? join(SCRIPTS, '..', '..', '..')
)
const HARNESS_ROOT = resolve(SCRIPTS, '..', '..', '..', '..')
const AGENTS_ROOT = join(HARNESS_ROOT, 'agents', 'governance')
const BOOTSTRAP = 'ki-bootstrap'
const GENERATED_SKILL_MARKER = '.ki-generated-runtime-skill'
type SkillMarker = { schema: 1; skill: string; source: string; integrity: string }

const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const GREEN = '\x1b[32m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

function realpathFor(path: string): string {
  try {
    return realpathSync(path)
  } catch {
    return path
  }
}

function entry(path: string): Entry | undefined {
  try {
    const stat = lstatSync(path)
    const kind: Kind = stat.isSymbolicLink() ? 'link' : stat.isDirectory() ? 'dir' : stat.isFile() ? 'file' : 'other'
    return {
      kind,
      dev: stat.dev,
      ino: stat.ino,
      uid: stat.uid,
      mode: stat.mode,
      ...(kind === 'link' ? { link: readlinkSync(path) } : {}),
      ...(kind === 'file' ? { bytes: readFileSync(path) } : {})
    }
  } catch {
    return undefined
  }
}

function sameEntry(expected: Entry | undefined, actual: Entry | undefined): boolean {
  if (!expected || !actual) return expected === actual
  return (
    expected.kind === actual.kind &&
    expected.dev === actual.dev &&
    expected.ino === actual.ino &&
    expected.uid === actual.uid &&
    expected.mode === actual.mode &&
    expected.link === actual.link &&
    (expected.bytes === undefined || actual.bytes?.equals(expected.bytes) === true)
  )
}

function mustEntry(path: string, label: string): Entry {
  const found = entry(path)
  if (!found) throw new Error(`${label} disappeared: ${path}`)
  return found
}

function assertEntry(path: string, expected: Entry | undefined, label: string): void {
  if (!sameEntry(expected, entry(path))) throw new Error(`${label} changed while project links were being prepared: ${path}`)
}

function regularText(path: string, label: string): { content: string; current?: Entry } {
  const current = entry(path)
  if (!current) return { content: '' }
  if (current.kind !== 'file') throw new Error(`${label} must be a regular file, not a ${current.kind}: ${path}`)
  const bytes = current.bytes
  if (!bytes) throw new Error(`${label} could not be read: ${path}`)
  return { content: bytes.toString('utf8'), current }
}

function assertDirectory(path: string, label: string): Entry {
  const current = mustEntry(path, label)
  if (current.kind !== 'dir') throw new Error(`${label} must be a directory, not a ${current.kind}: ${path}`)
  return current
}

function linkResolvesTo(path: string, source: string): boolean {
  const current = entry(path)
  return current?.kind === 'link' && typeof current.link === 'string' && resolve(dirname(path), current.link) === resolve(source)
}

function skillTreeIntegrity(path: string, label: string): string {
  const root = mustEntry(path, label)
  if (root.kind !== 'dir') throw new Error(`${label} must be a directory: ${path}`)
  const rows: string[] = []
  const walk = (current: string, relativePath: string): void => {
    for (const name of readdirSync(current).sort()) {
      if (current === path && name === GENERATED_SKILL_MARKER) continue
      const child = join(current, name)
      const childRelative = relativePath ? join(relativePath, name) : name
      const found = mustEntry(child, label)
      if (found.kind === 'link') throw new Error(`${label} must not contain symlinks: ${child}`)
      if (found.kind === 'other') throw new Error(`${label} must contain only regular files and directories: ${child}`)
      if (found.kind === 'dir') {
        rows.push(`d ${childRelative} ${found.mode & 0o7777}`)
        walk(child, childRelative)
      } else {
        rows.push(
          `f ${childRelative} ${found.mode & 0o7777} ${createHash('sha256')
            .update(found.bytes ?? Buffer.alloc(0))
            .digest('hex')}`
        )
      }
    }
  }
  walk(path, '')
  return createHash('sha256').update(rows.join('\n')).digest('hex')
}

function sourceIdentity(source: string): string {
  return relative(SKILLS_ROOT, source)
}

function readGeneratedSkillMarker(path: string): SkillMarker | undefined {
  const root = entry(path)
  if (root?.kind !== 'dir') return undefined
  const marker = entry(join(path, GENERATED_SKILL_MARKER))
  if (marker?.kind !== 'file' || !marker.bytes) return undefined
  try {
    const candidate = JSON.parse(marker.bytes.toString('utf8')) as Partial<SkillMarker>
    if (
      candidate.schema !== 1 ||
      typeof candidate.skill !== 'string' ||
      typeof candidate.source !== 'string' ||
      !/^[a-f0-9]{64}$/.test(candidate.integrity ?? '')
    )
      return undefined
    return candidate as SkillMarker
  } catch {
    return undefined
  }
}

function generatedSkillCopy(path: string, skill: string, source: string): boolean {
  const marker = readGeneratedSkillMarker(path)
  if (!marker || marker.skill !== skill || marker.source !== sourceIdentity(source)) return false
  try {
    return marker.integrity === skillTreeIntegrity(path, `generated skill payload ${skill}`)
  } catch {
    return false
  }
}

function copiesSource(destination: string, skill: string, source: string): boolean {
  const marker = readGeneratedSkillMarker(destination)
  if (!marker || marker.skill !== skill || marker.source !== sourceIdentity(source)) return false
  try {
    return (
      marker.integrity === skillTreeIntegrity(destination, 'generated skill payload') &&
      marker.integrity === skillTreeIntegrity(source, 'skill source')
    )
  } catch {
    return false
  }
}

function managedSkillPayload(path: string, skill: string, source: string): boolean {
  return linkResolvesTo(path, source) || generatedSkillCopy(path, skill, source)
}

let skills: Map<string, string> | undefined
function skillIndex(): Map<string, string> {
  if (skills) return skills
  const index = new Map<string, string>()
  for (const cluster of readdirSync(SKILLS_ROOT, { withFileTypes: true })) {
    if (!cluster.isDirectory()) continue
    const clusterPath = join(SKILLS_ROOT, cluster.name)
    if (entry(join(clusterPath, 'SKILL.md'))?.kind === 'file') {
      index.set(cluster.name, clusterPath)
      continue
    }
    for (const skill of readdirSync(clusterPath, { withFileTypes: true })) {
      if (!skill.isDirectory()) continue
      const skillPath = join(clusterPath, skill.name)
      if (entry(join(skillPath, 'SKILL.md'))?.kind === 'file') index.set(skill.name, skillPath)
    }
  }
  skills = index
  return index
}

function discoverAgents(): string[] {
  const root = entry(AGENTS_ROOT)
  if (root?.kind !== 'dir') return []
  return readdirSync(AGENTS_ROOT)
    .filter((name) => name.endsWith('.md') && entry(join(AGENTS_ROOT, name))?.kind === 'file')
    .sort()
}

function hasAgentsTable(config: string): boolean {
  return /^\[ki-agents\][ \t]*$/m.test(config)
}

function managedAgentLink(name: string, link: Entry, desired: Set<string>, path: string): boolean {
  return link.kind === 'link' && (!existsSync(path) || !desired.has(name))
}

function checkExistingDirectory(target: string, subdir: string): void {
  let current = target
  for (const part of subdir.split('/')) {
    current = join(current, part)
    const found = entry(current)
    if (found && found.kind !== 'dir') throw new Error(`managed parent must be a directory, not a ${found.kind}: ${current}`)
  }
}

function appendGitignore(existing: string, paths: string[]): string {
  const missing = paths.filter((path) => !gitignoresPath(existing, path))
  if (!missing.length) return existing
  const lead = existing === '' ? '' : existing.endsWith('\n') ? '\n' : '\n\n'
  return `${existing}${lead}# Generated project-local runtime payloads (ki-bootstrap) — never committed\n${missing.map((path) => `${path}/`).join('\n')}\n`
}

function buildPlan(target: string, scope: ProjectLinkScope, skillPublication: ProjectSkillPublication): LinkPlan {
  const root = assertDirectory(target, 'target repository')
  if (root.kind !== 'dir') throw new Error('unreachable')
  const configPath = join(target, '.ki-config.toml')
  const { content: config, current: configEntry } = regularText(configPath, '.ki-config.toml')
  const plan: LinkPlan = {
    root,
    links: [],
    removes: [],
    directories: [],
    guards: [{ path: configPath, before: configEntry, label: '.ki-config.toml' }],
    skillOrphans: []
  }
  const runtimes = targetRuntimes(config)

  if (scope === 'skills' || scope === 'all') {
    const index = skillIndex()
    const declared = declaredSkills(config).filter((name) => name !== BOOTSTRAP)
    try {
      assertResolvableSkills(declared)
    } catch (error) {
      if (!(error instanceof SkillResolutionError)) throw error
      plan.skillOrphans = error.unresolved
      return plan
    }
    const wanted = [...new Set(declared)].sort()
    for (const runtime of runtimes) {
      const subdir = runtimeSkillsDir(runtime)
      const dir = join(target, subdir)
      plan.directories.push(subdir)
      checkExistingDirectory(target, subdir)
      const desired = new Set(wanted)
      for (const name of wanted) {
        const source = index.get(name)
        if (!source || entry(source)?.kind !== 'dir') throw new Error(`skill source is unavailable: ${name}`)
        skillTreeIntegrity(source, `skill source ${name}`)
        const destination = join(dir, name)
        const found = entry(destination)
        if (skillPublication === 'copy') {
          if (copiesSource(destination, name, source)) continue
          if (found && !managedSkillPayload(destination, name, source)) {
            throw new Error(`refusing to replace unfamiliar project skill payload at ${destination}`)
          }
          plan.links.push({ destination, source, kind: 'copy', label: `${subdir}/${name}`, skill: name, before: found })
        } else {
          if (linkResolvesTo(destination, source)) continue
          if (found && !managedSkillPayload(destination, name, source)) {
            throw new Error(`refusing to replace unfamiliar project skill payload at ${destination}`)
          }
          plan.links.push({ destination, source, kind: 'dir', label: `${subdir}/${name}`, before: found })
        }
        plan.guards.push({ path: destination, before: found, label: `${subdir}/${name}` })
      }
      if (entry(dir)?.kind === 'dir') {
        for (const name of readdirSync(dir)) {
          const destination = join(dir, name)
          const found = entry(destination)
          if (!found || desired.has(name)) continue
          const source = index.get(name)
          const managed = source && managedSkillPayload(destination, name, source)
          if (name.startsWith('ki-') && !managed) throw new Error(`refusing to remove unfamiliar project skill payload at ${destination}`)
          if (managed && !plan.links.some((item) => item.destination === destination)) {
            plan.removes.push({ destination, label: `${subdir}/${name}`, before: found })
            plan.guards.push({ path: destination, before: found, label: `${subdir}/${name}` })
          }
        }
      }
    }
  }

  if (scope === 'agents' || scope === 'all') {
    const wanted = hasAgentsTable(config) ? discoverAgents() : []
    const desired = new Set(wanted)
    for (const runtime of runtimes) {
      let subdir: string
      try {
        subdir = runtimeAgentsDir(runtime)
      } catch (error) {
        console.log(`  ${YELLOW}skip  [${runtime}]${RESET} ${DIM}(${(error as Error).message})${RESET}`)
        continue
      }
      if (wanted.length) plan.directories.push(subdir)
      const dir = join(target, subdir)
      checkExistingDirectory(target, subdir)
      for (const name of wanted) {
        const source = join(AGENTS_ROOT, name)
        if (entry(source)?.kind !== 'file') throw new Error(`agent source is unavailable: ${name}`)
        const destination = join(dir, name)
        const found = entry(destination)
        if (linkResolvesTo(destination, source)) continue
        if (found && found.kind !== 'link') throw new Error(`refusing to replace real blocker at ${destination}`)
        plan.links.push({ destination, source, kind: 'file', label: `${subdir}/${name}`, before: found })
        plan.guards.push({ path: destination, before: found, label: `${subdir}/${name}` })
      }
      if (entry(dir)?.kind === 'dir') {
        for (const name of readdirSync(dir)) {
          const destination = join(dir, name)
          const found = entry(destination)
          if (
            found &&
            managedAgentLink(name, found, desired, destination) &&
            !plan.links.some((item) => item.destination === destination)
          ) {
            plan.removes.push({ destination, label: `${subdir}/${name}`, before: found })
            plan.guards.push({ path: destination, before: found, label: `${subdir}/${name}` })
          }
        }
      }
    }
  }

  const ignored = new Set<string>()
  if (scope === 'skills' || scope === 'all') {
    for (const runtime of runtimes) ignored.add(runtimeSkillsDir(runtime))
  }
  if (scope === 'agents' || scope === 'all') {
    if (hasAgentsTable(config) && discoverAgents().length) {
      for (const runtime of runtimes) {
        try {
          ignored.add(runtimeAgentsDir(runtime))
        } catch {
          // The explicit runtime skip above is the user-facing report.
        }
      }
    }
  }
  const gitignorePath = join(target, '.gitignore')
  const { content: gitignore, current: gitignoreEntry } = regularText(gitignorePath, '.gitignore')
  const nextGitignore = appendGitignore(gitignore, [...ignored].sort())
  if (nextGitignore !== gitignore) {
    plan.gitignore = { destination: gitignorePath, content: nextGitignore, label: '.gitignore', before: gitignoreEntry }
    plan.guards.push({ path: gitignorePath, before: gitignoreEntry, label: '.gitignore' })
  }
  return plan
}

function createDirectories(target: string, subdirs: string[], root: Entry): Directory[] {
  const directories: Directory[] = []
  for (const subdir of [...new Set(subdirs)].sort()) {
    let path = target
    for (const part of subdir.split('/')) {
      assertEntry(target, root, 'target repository')
      path = join(path, part)
      const current = entry(path)
      if (current) {
        if (current.kind !== 'dir') throw new Error(`managed parent must be a directory, not a ${current.kind}: ${path}`)
        if (!directories.some((item) => item.path === path)) directories.push({ path, entry: current, created: false })
        continue
      }
      mkdirSync(path)
      const made = assertDirectory(path, 'new managed directory')
      if (!directories.some((item) => item.path === path)) directories.push({ path, entry: made, created: true })
    }
  }
  return directories
}

function assertDirectories(directories: Directory[]): void {
  for (const directory of directories) assertEntry(directory.path, directory.entry, 'managed parent directory')
}

function cleanupDirectories(directories: Directory[]): void {
  for (const directory of [...directories].reverse()) {
    if (!directory.created || !sameEntry(directory.entry, entry(directory.path))) continue
    try {
      if (readdirSync(directory.path).length === 0) rmdirSync(directory.path)
    } catch {
      // A concurrent writer owns a non-empty or changed directory; leave it intact.
    }
  }
}

function stagePlan(transaction: string, plan: LinkPlan): Array<{ destination: string; stage: string; before?: Entry; label: string }> {
  const staging = join(transaction, 'staging')
  mkdirSync(staging, { mode: 0o700 })
  const staged: Array<{ destination: string; stage: string; before?: Entry; label: string }> = []
  let sequence = 0
  for (const item of plan.links) {
    const stage = join(staging, `${String(sequence++).padStart(4, '0')}-link`)
    if (item.kind === 'copy') {
      const skill = item.skill
      if (!skill) throw new Error(`copied skill payload is missing its identity: ${item.label}`)
      const integrity = skillTreeIntegrity(item.source, `skill source ${skill}`)
      cpSync(item.source, stage, { recursive: true, dereference: false, preserveTimestamps: true })
      if (skillTreeIntegrity(stage, `staged skill payload ${item.label}`) !== integrity) {
        throw new Error(`staged skill payload differs from its validated source: ${item.label}`)
      }
      const marker: SkillMarker = { schema: 1, skill, source: sourceIdentity(item.source), integrity }
      writeFileSync(join(stage, GENERATED_SKILL_MARKER), `${JSON.stringify(marker, null, 2)}\n`, { mode: 0o600 })
    } else {
      symlinkSync(relative(dirname(item.destination), item.source), stage, item.kind)
    }
    staged.push({ destination: item.destination, stage, before: item.before, label: item.label })
  }
  for (const item of plan.removes) staged.push({ destination: item.destination, stage: '', before: item.before, label: item.label })
  if (plan.gitignore) {
    const stage = join(staging, `${String(sequence++).padStart(4, '0')}-gitignore`)
    writeFileSync(stage, plan.gitignore.content, { mode: 0o600 })
    staged.push({ destination: plan.gitignore.destination, stage, before: plan.gitignore.before, label: plan.gitignore.label })
  }
  return staged
}

function publish(target: string, root: Entry, transaction: string, plan: LinkPlan, directories: Directory[]): void {
  const quarantine = join(transaction, 'quarantine')
  mkdirSync(quarantine, { mode: 0o700 })
  assertEntry(target, root, 'target repository')
  for (const guard of plan.guards) assertEntry(guard.path, guard.before, guard.label)
  const testMutation = process.env.KI_PROJECT_LINKS_TEST_MUTATE_AFTER_PLAN
  if (testMutation) writeFileSync(testMutation, 'third-party change\n')
  const staged = stagePlan(transaction, plan)
  const published: Published[] = []
  try {
    for (const [index, item] of staged.entries()) {
      assertEntry(target, root, 'target repository')
      assertDirectories(directories)
      assertEntry(item.destination, item.before, `managed destination ${item.label}`)
      const backup = item.before ? join(quarantine, `${String(index).padStart(4, '0')}-prior`) : undefined
      const after = item.stage ? mustEntry(item.stage, `staged destination ${item.label}`) : undefined
      if (backup) renameSync(item.destination, backup)
      // Record the moved destination before publishing its replacement. If the
      // second rename fails, rollback still knows where the old entry lives.
      published.push({ destination: item.destination, before: item.before, after, backup, stage: item.stage })
      if (process.env.KI_PROJECT_LINKS_TEST_FAIL_AFTER_QUARANTINE === String(index + 1)) {
        throw new Error('test-injected failure after destination quarantine')
      }
      if (item.stage) renameSync(item.stage, item.destination)
      if (after) assertEntry(item.destination, after, `published destination ${item.label}`)
      if (process.env.KI_PROJECT_LINKS_TEST_FAIL_AFTER === String(index + 1)) throw new Error('test-injected publication failure')
    }
  } catch (error) {
    const conflicts: string[] = []
    for (const item of [...published].reverse()) {
      try {
        if (item.stage) {
          const current = entry(item.destination)
          if (current) {
            assertEntry(item.destination, item.after, `published destination during rollback ${item.destination}`)
            rmSync(item.destination, { recursive: item.after?.kind === 'dir', force: false })
          }
        } else if (entry(item.destination)) {
          throw new Error('pruned destination was recreated')
        }
        if (item.backup) renameSync(item.backup, item.destination)
      } catch {
        conflicts.push(item.destination)
      }
    }
    if (conflicts.length)
      throw new Error(`${(error as Error).message}; rollback preserved private transaction after conflicts: ${conflicts.join(', ')}`)
    throw error
  }
}

function execute(target: string, plan: LinkPlan): void {
  assertEntry(target, plan.root, 'target repository')
  const root = plan.root
  const transaction = mkdtempSync(join(target, '.ki-project-links-'))
  chmodSync(transaction, 0o700)
  const privateDir = assertDirectory(transaction, 'private project-link transaction')
  if ((privateDir.mode & 0o777) !== 0o700) throw new Error(`private project-link transaction must be mode 0700: ${transaction}`)
  if (typeof process.getuid === 'function' && privateDir.uid !== process.getuid()) {
    throw new Error(`private project-link transaction must be owned by the current user: ${transaction}`)
  }
  let directories: Directory[] = []
  try {
    assertEntry(target, root, 'target repository')
    directories = createDirectories(target, plan.directories, root)
    publish(target, root, transaction, plan, directories)
  } catch (error) {
    cleanupDirectories(directories)
    throw error
  } finally {
    if (sameEntry(root, entry(target)) && sameEntry(privateDir, entry(transaction))) rmSync(transaction, { recursive: true, force: true })
  }
}

function printCheck(target: string, scope: ProjectLinkScope): number {
  const config = regularText(join(target, '.ki-config.toml'), '.ki-config.toml').content
  const runtimes = targetRuntimes(config)
  let failures = 0
  if (scope === 'skills' || scope === 'all') {
    const declared = declaredSkills(config).filter((name) => name !== BOOTSTRAP)
    let orphans: string[] = []
    try {
      assertResolvableSkills(declared)
    } catch (error) {
      if (!(error instanceof SkillResolutionError)) throw error
      orphans = error.unresolved
    }
    const wanted = new Set(declared)
    for (const runtime of runtimes) {
      const subdir = runtimeSkillsDir(runtime)
      console.log(`  ${DIM}[${runtime}]${RESET}`)
      const dir = join(target, subdir)
      const present = entry(dir)?.kind === 'dir' ? readdirSync(dir).filter((name) => name.startsWith('ki-')) : []
      const missing = [...wanted].filter((name) => {
        const source = skillIndex().get(name)
        return !source || !copiesSource(join(dir, name), name, source)
      })
      const extra = present.filter((name) => !wanted.has(name))
      const links = present.filter((name) => entry(join(dir, name))?.kind === 'link')
      for (const orphan of orphans)
        console.log(`  ${RED}FAIL${RESET}  [BOOT-1] .ki-config.toml declares [${orphan}] but no such skill exists in the harness`)
      if (orphans.length) failures++
      if (missing.length || extra.length || links.length)
        console.log(`  ${YELLOW}WARN${RESET}  [BOOT-1] ${subdir} needs copied-payload reconciliation`)
      const ignored = gitignoresPath(regularText(join(target, '.gitignore'), '.gitignore').content, subdir)
      if (!ignored) console.log(`  ${YELLOW}WARN${RESET}  [BOOT-3] ${subdir}/ is not gitignored`)
      else console.log(`  ${DIM}PASS${RESET}  [BOOT-3] ${subdir}/ is gitignored`)
    }
  }
  if (scope === 'agents' || scope === 'all') {
    const wanted = new Set(hasAgentsTable(config) ? discoverAgents() : [])
    for (const runtime of runtimes) {
      let subdir: string
      try {
        subdir = runtimeAgentsDir(runtime)
      } catch (error) {
        console.log(`  ${YELLOW}skip  [${runtime}]${RESET} ${DIM}(${(error as Error).message})${RESET}`)
        continue
      }
      console.log(`  ${DIM}[${runtime}]${RESET}`)
      const dir = join(target, subdir)
      const present = entry(dir)?.kind === 'dir' ? readdirSync(dir).filter((name) => entry(join(dir, name))?.kind === 'link') : []
      const missing = [...wanted].filter((name) => !present.includes(name))
      const extra = present.filter((name) => !wanted.has(name))
      const broken = present.filter((name) => !existsSync(join(dir, name)))
      if (missing.length || extra.length || broken.length) console.log(`  ${YELLOW}WARN${RESET}  [BOOT-6] ${subdir} needs reconciliation`)
      const ignored = gitignoresPath(regularText(join(target, '.gitignore'), '.gitignore').content, subdir)
      if (!ignored) console.log(`  ${YELLOW}WARN${RESET}  [BOOT-8] ${subdir}/ is not gitignored`)
      else console.log(`  ${DIM}PASS${RESET}  [BOOT-8] ${subdir}/ is gitignored`)
    }
  }
  return failures ? 1 : 0
}

export function runProjectLinks(
  scope: ProjectLinkScope,
  skillPublication: ProjectSkillPublication = 'copy',
  argv = process.argv.slice(2)
): number {
  const dryRun = argv.includes('--dry-run')
  const checkOnly = argv.includes('--check')
  const target = resolve(argv.find((arg) => !arg.startsWith('-')) ?? '.')
  try {
    if (checkOnly) return printCheck(target, scope)
    const plan = buildPlan(target, scope, skillPublication)
    if (plan.skillOrphans.length) {
      for (const orphan of plan.skillOrphans)
        console.error(
          `${RED}FAIL${RESET}  [BOOT-1] .ki-config.toml declares [${orphan}] but no such skill exists in the harness — reconcile the table by hand before linking`
        )
      return 1
    }
    if (dryRun) {
      for (const item of plan.links) {
        const action = item.kind === 'copy' ? 'copy' : 'link'
        const detail = item.kind === 'copy' ? item.source : relative(dirname(item.destination), item.source)
        console.log(`${GREEN}${action}${RESET}  ${item.label} -> ${DIM}${detail}${RESET}`)
      }
      for (const item of plan.removes) console.log(`${YELLOW}prune${RESET} ${item.label}`)
      if (plan.gitignore) console.log(`${GREEN}ignore${RESET} .gitignore ${DIM}(generated runtime payloads)${RESET}`)
      console.log(`\n  ${YELLOW}(dry run — nothing changed)${RESET}`)
      return 0
    }
    execute(target, plan)
    for (const item of plan.links) console.log(`${GREEN}${item.kind === 'copy' ? 'copy' : 'link'}${RESET}  ${item.label}`)
    for (const item of plan.removes) console.log(`${YELLOW}prune${RESET} ${item.label}`)
    if (plan.gitignore) console.log(`${GREEN}ignore${RESET} .gitignore ${DIM}(generated runtime payloads)${RESET}`)
    return 0
  } catch (error) {
    console.error(`${RED}FAIL${RESET}  project-link transaction: ${(error as Error).message}`)
    return 1
  }
}

if (import.meta.main) process.exit(runProjectLinks('all'))
