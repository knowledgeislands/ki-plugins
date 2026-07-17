#!/usr/bin/env bun
/** Scaffold the non-KB simple project-roadmap profile without clobbering. */
import { closeSync, existsSync, fsyncSync, linkSync, lstatSync, openSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
type Finding = { level: Level; area: string; msg: string; ref?: string; file?: string }
const STANDARD_REF = 'references/project-roadmap-standard.md'
const TOML = (globalThis as unknown as { Bun: { TOML: { parse(text: string): unknown } } }).Bun.TOML
const argv = process.argv.slice(2)
const dryRun = argv.includes('--dry-run')
const json = argv.includes('--json')
const target = resolve(argv.find((arg) => !arg.startsWith('-')) ?? '.')
const roadmap = join(target, 'ROADMAP.md')
const thematic = join(target, 'docs', 'roadmap')
const findings: Finding[] = []

const TEMPLATE = `# Project roadmap

## Blocking

Actively broken, or blocking the \`Next\` horizon: takes priority over everything else and must clear before \`Next\` work proceeds. Empty means nothing is on fire.

## Next

Scoped and ready to start — the immediate queue, picked up before anything in **Soon** or **Future**.

## Soon

Understood and roughly scoped but not yet started — worth doing once the **Next** queue clears, ahead of anything still speculative.

## Waiting for

Worth doing, but presently blocked on an external dependency or decision. Revisit when its named condition changes rather than treating it as dormant local work.

## Future

Speculative or not yet scoped — items marked _(candidate)_ need a scoping pass (or a decision to drop them) before they're actionable.
`

function isKb(): boolean {
  const config = join(target, '.ki-config.toml')
  if (!existsSync(config)) return false
  try {
    const parsed = TOML.parse(readFileSync(config, 'utf8')) as Record<string, unknown>
    const repoTable = parsed['ki-repo']
    return (
      parsed.repo_type === 'kb' ||
      (typeof repoTable === 'object' && repoTable !== null && (repoTable as Record<string, unknown>).repo_type === 'kb')
    )
  } catch {
    return /^\s*repo_type\s*=\s*["']kb["']/m.test(readFileSync(config, 'utf8'))
  }
}

function entry(path: string): ReturnType<typeof lstatSync> | null {
  try {
    return lstatSync(path)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

function atomicCreate(path: string, content: string): void {
  const temp = join(dirname(path), `.${Date.now()}-${process.pid}-${Math.random().toString(16).slice(2)}.tmp`)
  const fd = openSync(temp, 'wx', 0o644)
  try {
    writeFileSync(fd, content)
    fsyncSync(fd)
  } finally {
    closeSync(fd)
  }
  try {
    linkSync(temp, path)
    unlinkSync(temp)
  } catch (error) {
    if (existsSync(temp)) unlinkSync(temp)
    throw error
  }
}

function emit(): never {
  const count = (level: Level): number => findings.filter((finding) => finding.level === level).length
  const summary = {
    fail: count('FAIL'),
    warn: count('WARN'),
    polish: count('POLISH'),
    advisory: count('ADVISORY'),
    info: count('INFO'),
    na: count('NA'),
    pass: count('PASS')
  }
  const payload = { concern: 'project-roadmap', target, generatedAt: new Date().toISOString(), summary, findings }
  if (json) process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`)
  else {
    for (const finding of findings)
      console.log(`${finding.level.padEnd(8)} [${finding.area}]${finding.file ? ` ${finding.file}` : ''} ${finding.msg}`)
    console.log(
      `FAIL=${summary.fail} WARN=${summary.warn} POLISH=${summary.polish} PASS=${summary.pass} ADVISORY=${summary.advisory} NA=${summary.na}`
    )
  }
  process.exit(summary.fail ? 1 : 0)
}

if (!existsSync(target) || !lstatSync(target).isDirectory()) {
  findings.push({ level: 'FAIL', area: 'PROFILE-1', msg: 'target repository directory does not exist', ref: STANDARD_REF })
  emit()
}
if (isKb()) {
  findings.push({
    level: 'NA',
    area: 'SCOPE-1',
    msg: 'KB repository: use ki-kb-streams; no project-roadmap artifact created',
    ref: STANDARD_REF
  })
  emit()
}
if (entry(thematic)) {
  findings.push({
    level: 'PASS',
    area: 'PROFILE-1',
    msg: 'thematic profile already exists; EDUCATE does not collapse or overwrite it',
    ref: STANDARD_REF
  })
  emit()
}
const existingRoadmap = entry(roadmap)
if (existingRoadmap) {
  if (existingRoadmap.isSymbolicLink()) {
    findings.push({ level: 'FAIL', area: 'SAFE-1', msg: 'refusing symlink ROADMAP.md', ref: STANDARD_REF, file: 'ROADMAP.md' })
  } else if (!existingRoadmap.isFile()) {
    findings.push({ level: 'FAIL', area: 'SAFE-1', msg: 'ROADMAP.md must be a regular file', ref: STANDARD_REF, file: 'ROADMAP.md' })
  } else
    findings.push({
      level: 'PASS',
      area: 'PROFILE-1',
      msg: 'ROADMAP.md already exists; left byte-identical',
      ref: STANDARD_REF,
      file: 'ROADMAP.md'
    })
  emit()
}
if (dryRun)
  findings.push({
    level: 'POLISH',
    area: 'PROFILE-1',
    msg: 'would scaffold simple profile (dry-run; not written)',
    ref: STANDARD_REF,
    file: 'ROADMAP.md'
  })
else {
  atomicCreate(roadmap, TEMPLATE)
  findings.push({ level: 'POLISH', area: 'PROFILE-1', msg: 'scaffolded simple profile atomically', ref: STANDARD_REF, file: 'ROADMAP.md' })
}
emit()
