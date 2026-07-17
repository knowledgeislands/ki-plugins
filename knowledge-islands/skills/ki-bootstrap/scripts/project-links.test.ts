#!/usr/bin/env bun
/** Hostile-path and transaction regressions for the combined project link writer. */
import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const LINKER = join(dirname(fileURLToPath(import.meta.url)), 'project-links.ts')
let failed = false
function check(label: string, condition: boolean): void {
  if (condition) console.log(`  \x1b[32mok\x1b[0m   ${label}`)
  else {
    failed = true
    console.log(`  \x1b[31mFAIL\x1b[0m ${label}`)
  }
}

function fixture(runtimes = ['claude-code']): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'ki-project-links-')))
  writeFileSync(
    join(root, '.ki-config.toml'),
    `[ki-repo]\ntarget_runtimes = [${runtimes.map((runtime) => `"${runtime}"`).join(', ')}]\n\n[ki-kb]\n\n[ki-agents]\n`
  )
  return root
}

function run(root: string, env: Record<string, string> = {}): ReturnType<typeof spawnSync> {
  return spawnSync('bun', [LINKER, root], {
    encoding: 'utf8',
    env: { ...process.env, ...env, ...(env.KI_PROJECT_LINKS_TEST_SKILLS_ROOT ? { NODE_ENV: 'test' } : {}) }
  })
}

function fakeSkillsRoot(): { root: string; skill: string; nested: string } {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'ki-project-links-skills-')))
  const skill = join(root, 'cluster', 'ki-kb')
  const nested = join(skill, 'nested')
  mkdirSync(nested, { recursive: true })
  writeFileSync(join(skill, 'SKILL.md'), '# Fake skill\n')
  writeFileSync(join(nested, 'mode-sensitive.txt'), 'payload\n')
  for (const name of ['ki-repo', 'ki-agents']) {
    const sibling = join(root, 'cluster', name)
    mkdirSync(sibling)
    writeFileSync(join(sibling, 'SKILL.md'), `# ${name}\n`)
  }
  return { root, skill, nested }
}

function snapshot(root: string): string {
  const rows: string[] = []
  function walk(dir: string): void {
    for (const name of readdirSync(dir).sort()) {
      const path = join(dir, name)
      const stat = lstatSync(path)
      const rel = relative(root, path)
      if (stat.isSymbolicLink()) rows.push(`l:${rel}:${readlinkSync(path)}`)
      else if (stat.isDirectory()) {
        rows.push(`d:${rel}:${stat.mode & 0o777}`)
        walk(path)
      } else rows.push(`f:${rel}:${stat.mode & 0o777}:${readFileSync(path).toString('base64')}`)
    }
  }
  walk(root)
  return rows.join('\n')
}

const normal = fixture(['claude-code', 'codex'])
try {
  const result = run(normal)
  check('combined publication → exits successfully', result.status === 0)
  check('combined publication → Claude skill copy exists', lstatSync(join(normal, '.claude', 'skills', 'ki-kb')).isDirectory())
  check('combined publication → Codex skill copy exists', lstatSync(join(normal, '.agents', 'skills', 'ki-kb')).isDirectory())
  check(
    'combined publication → copied skill has no top-level symlink',
    !lstatSync(join(normal, '.claude', 'skills', 'ki-kb')).isSymbolicLink() &&
      existsSync(join(normal, '.claude', 'skills', 'ki-kb', 'SKILL.md'))
  )
  check(
    'combined publication → Claude agent link exists',
    lstatSync(join(normal, '.claude', 'agents', 'ki-kb-curator.md')).isSymbolicLink()
  )
  check(
    'combined publication → Codex agents are explicitly skipped',
    !existsSync(join(normal, '.agents', 'agents')) && result.stdout.includes('skip  [codex]')
  )
  const ignored = readFileSync(join(normal, '.gitignore'), 'utf8')
  check(
    'combined publication → writes one shared gitignore payload',
    ignored.includes('.claude/skills/') && ignored.includes('.agents/skills/') && ignored.includes('.claude/agents/')
  )
} finally {
  rmSync(normal, { recursive: true, force: true })
}

const blocker = fixture()
try {
  const blocked = join(blocker, '.claude', 'skills')
  mkdirSync(blocked, { recursive: true })
  writeFileSync(join(blocked, 'ki-kb'), 'do not replace')
  const before = snapshot(blocker)
  check('real destination blocker → transaction refuses', run(blocker).status !== 0)
  check('real destination blocker → transaction leaves repository byte-for-byte unchanged', snapshot(blocker) === before)
} finally {
  rmSync(blocker, { recursive: true, force: true })
}

const parentSymlink = fixture()
const outside = realpathSync(mkdtempSync(join(tmpdir(), 'ki-project-links-outside-')))
try {
  writeFileSync(join(outside, 'sentinel'), 'outside\n')
  symlinkSync(outside, join(parentSymlink, '.claude'))
  const before = snapshot(outside)
  check('symlinked managed parent → transaction refuses', run(parentSymlink).status !== 0)
  check('symlinked managed parent → outside remains unchanged', snapshot(outside) === before)
} finally {
  rmSync(parentSymlink, { recursive: true, force: true })
  rmSync(outside, { recursive: true, force: true })
}

const rootOutside = fixture()
const rootAlias = `${rootOutside}-alias`
try {
  symlinkSync(rootOutside, rootAlias)
  const before = snapshot(rootOutside)
  check('symlinked target root → transaction refuses', run(rootAlias).status !== 0)
  check('symlinked target root → real repository remains unchanged', snapshot(rootOutside) === before)
} finally {
  rmSync(rootAlias, { force: true })
  rmSync(rootOutside, { recursive: true, force: true })
}

const configSymlink = fixture()
const configOutside = realpathSync(mkdtempSync(join(tmpdir(), 'ki-project-links-config-outside-')))
try {
  const source = join(configOutside, 'config')
  writeFileSync(source, '[ki-kb]\n')
  rmSync(join(configSymlink, '.ki-config.toml'))
  symlinkSync(source, join(configSymlink, '.ki-config.toml'))
  const before = snapshot(configOutside)
  check('symlinked configuration → transaction refuses', run(configSymlink).status !== 0)
  check('symlinked configuration → outside remains unchanged', snapshot(configOutside) === before)
} finally {
  rmSync(configSymlink, { recursive: true, force: true })
  rmSync(configOutside, { recursive: true, force: true })
}

const gitignoreSymlink = fixture()
const gitignoreOutside = realpathSync(mkdtempSync(join(tmpdir(), 'ki-project-links-ignore-outside-')))
try {
  writeFileSync(join(gitignoreOutside, 'ignore'), 'outside\n')
  symlinkSync(join(gitignoreOutside, 'ignore'), join(gitignoreSymlink, '.gitignore'))
  const before = snapshot(gitignoreOutside)
  check('symlinked .gitignore → transaction refuses', run(gitignoreSymlink).status !== 0)
  check('symlinked .gitignore → outside remains unchanged', snapshot(gitignoreOutside) === before)
} finally {
  rmSync(gitignoreSymlink, { recursive: true, force: true })
  rmSync(gitignoreOutside, { recursive: true, force: true })
}

const rollback = fixture()
try {
  const before = snapshot(rollback)
  check('partial publication failure → transaction reports failure', run(rollback, { KI_PROJECT_LINKS_TEST_FAIL_AFTER: '1' }).status !== 0)
  check('partial publication failure → copies, agent, gitignore and created directories roll back', snapshot(rollback) === before)
} finally {
  rmSync(rollback, { recursive: true, force: true })
}

const quarantineRollback = fixture()
try {
  const skills = join(quarantineRollback, '.claude', 'skills')
  mkdirSync(skills, { recursive: true })
  symlinkSync('../wrong-target', join(skills, 'ki-kb'))
  const before = snapshot(quarantineRollback)
  check(
    'failure after quarantine → transaction reports failure',
    run(quarantineRollback, { KI_PROJECT_LINKS_TEST_FAIL_AFTER_QUARANTINE: '1' }).status !== 0
  )
  check('failure after quarantine → displaced destination is restored exactly', snapshot(quarantineRollback) === before)
} finally {
  rmSync(quarantineRollback, { recursive: true, force: true })
}

const changedAfterPlan = fixture()
try {
  const gitignore = join(changedAfterPlan, '.gitignore')
  const result = run(changedAfterPlan, { KI_PROJECT_LINKS_TEST_MUTATE_AFTER_PLAN: gitignore })
  check('destination changed after validation → transaction refuses', result.status !== 0)
  check(
    'destination changed after validation → third-party bytes are preserved',
    readFileSync(gitignore, 'utf8') === 'third-party change\n'
  )
  check(
    'destination changed after validation → no generated copy is published',
    !existsSync(join(changedAfterPlan, '.claude', 'skills', 'ki-kb'))
  )
} finally {
  rmSync(changedAfterPlan, { recursive: true, force: true })
}

const prune = fixture()
const pruneOutside = realpathSync(mkdtempSync(join(tmpdir(), 'ki-project-links-prune-outside-')))
try {
  const skills = join(prune, '.claude', 'skills')
  mkdirSync(skills, { recursive: true })
  symlinkSync('../missing', join(skills, 'legacy-dangling'))
  writeFileSync(join(pruneOutside, 'sentinel'), 'outside\n')
  symlinkSync(join(pruneOutside, 'sentinel'), join(skills, 'ki-removed'))
  const before = snapshot(pruneOutside)
  check('unfamiliar legacy link → transaction refuses migration', run(prune).status !== 0)
  check(
    'unfamiliar legacy link → transaction preserves the local entries',
    lstatSync(join(skills, 'legacy-dangling')).isSymbolicLink() && lstatSync(join(skills, 'ki-removed')).isSymbolicLink()
  )
  check('unfamiliar legacy link → outside target remains unchanged', snapshot(pruneOutside) === before)
} finally {
  rmSync(prune, { recursive: true, force: true })
  rmSync(pruneOutside, { recursive: true, force: true })
}

const codexOnly = fixture(['codex'])
try {
  const result = run(codexOnly)
  check('Codex-only → skill transaction succeeds', result.status === 0 && existsSync(join(codexOnly, '.agents', 'skills', 'ki-kb')))
  check(
    'Codex-only → agent generation is skipped without guessing a path',
    !existsSync(join(codexOnly, '.claude', 'agents')) && result.stdout.includes('skip  [codex]')
  )
} finally {
  rmSync(codexOnly, { recursive: true, force: true })
}

const sourceSymlink = fixture()
const sourceSymlinkRoot = fakeSkillsRoot()
try {
  const outside = join(sourceSymlinkRoot.root, 'outside')
  writeFileSync(outside, 'must not follow\n')
  symlinkSync(outside, join(sourceSymlinkRoot.skill, 'nested', 'escaped'))
  const before = snapshot(sourceSymlink)
  check(
    'symlinked source-tree entry → transaction refuses before publication',
    run(sourceSymlink, { KI_PROJECT_LINKS_TEST_SKILLS_ROOT: sourceSymlinkRoot.root }).status !== 0
  )
  check('symlinked source-tree entry → repository remains unchanged', snapshot(sourceSymlink) === before)
} finally {
  rmSync(sourceSymlink, { recursive: true, force: true })
  rmSync(sourceSymlinkRoot.root, { recursive: true, force: true })
}

const sourceModes = fixture()
const sourceModesRoot = fakeSkillsRoot()
try {
  const sourceFile = join(sourceModesRoot.nested, 'mode-sensitive.txt')
  chmodSync(sourceFile, 0o751)
  const result = run(sourceModes, { KI_PROJECT_LINKS_TEST_SKILLS_ROOT: sourceModesRoot.root })
  const copied = join(sourceModes, '.claude', 'skills', 'ki-kb', 'nested', 'mode-sensitive.txt')
  if (result.status !== 0) console.log(`${result.stdout ?? ''}${result.stderr ?? ''}`)
  check('regular source tree → transaction copies the payload', result.status === 0 && existsSync(copied))
  check(
    'copied regular file → preserves source mode',
    existsSync(copied) && (lstatSync(copied).mode & 0o7777) === (lstatSync(sourceFile).mode & 0o7777)
  )
  chmodSync(copied, 0o600)
  const before = snapshot(sourceModes)
  check(
    'mode-drifted copied payload → refuses replacement',
    run(sourceModes, { KI_PROJECT_LINKS_TEST_SKILLS_ROOT: sourceModesRoot.root }).status !== 0
  )
  check('mode-drifted copied payload → preserves the local payload', snapshot(sourceModes) === before)
} finally {
  rmSync(sourceModes, { recursive: true, force: true })
  rmSync(sourceModesRoot.root, { recursive: true, force: true })
}

const forgedMarker = fixture()
try {
  check('fresh generated payload → initial publication succeeds', run(forgedMarker).status === 0)
  const copiedSkill = join(forgedMarker, '.claude', 'skills', 'ki-kb')
  writeFileSync(join(copiedSkill, 'SKILL.md'), '# locally altered payload\n')
  const before = snapshot(forgedMarker)
  check('marker with mismatched payload → transaction refuses replacement', run(forgedMarker).status !== 0)
  check('marker with mismatched payload → preserves the local payload', snapshot(forgedMarker) === before)
} finally {
  rmSync(forgedMarker, { recursive: true, force: true })
}

if (failed) {
  console.log('\n\x1b[31mproject-links.test.ts: failures\x1b[0m')
  process.exit(1)
}
console.log('\n\x1b[32mproject-links.test.ts: all checks passed\x1b[0m')
