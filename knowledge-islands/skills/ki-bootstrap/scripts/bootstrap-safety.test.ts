#!/usr/bin/env bun
/** Focused hostile-path regressions for the staged bootstrap transaction. */
import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  existsSync,
  linkSync,
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

const SCRIPTS = dirname(fileURLToPath(import.meta.url))
const BOOTSTRAP = join(SCRIPTS, 'bootstrap.ts')
const CONFIG = '[ki-authoring]\n'
const REF = '0000000000000000000000000000000000000000'

let failed = false
function check(label: string, condition: boolean): void {
  if (condition) console.log(`  \x1b[32mok\x1b[0m   ${label}`)
  else {
    failed = true
    console.log(`  \x1b[31mFAIL\x1b[0m ${label}`)
  }
}

function fixture(): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'ki-bootstrap-safety-')))
  writeFileSync(join(root, '.ki-config.toml'), CONFIG)
  return root
}

function run(root: string, env: Record<string, string> = {}): ReturnType<typeof spawnSync> {
  return spawnSync('bun', [BOOTSTRAP, root, '--ref', REF], {
    encoding: 'utf8',
    env: { ...process.env, ...env }
  })
}

function snapshot(root: string): string {
  const rows: string[] = []
  function walk(dir: string): void {
    for (const name of readdirSync(dir).sort()) {
      const path = join(dir, name)
      const rel = relative(root, path)
      const stat = lstatSync(path)
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

function transactionArtifacts(root: string): string[] {
  const meta = join(root, '.ki-meta')
  if (!existsSync(meta) || !lstatSync(meta).isDirectory()) return []
  return readdirSync(meta).filter((name) => name === '.bootstrap.lock' || name.startsWith('.bootstrap-staging-'))
}

const helpOnly = fixture()
try {
  const before = snapshot(helpOnly)
  const result = spawnSync('bun', [BOOTSTRAP, helpOnly, '--help'], { encoding: 'utf8' })
  check('--help → exits successfully and renders usage', result.status === 0 && result.stdout.includes('usage: bootstrap.ts'))
  check('--help → target remains byte-for-byte unchanged', snapshot(helpOnly) === before)
} finally {
  rmSync(helpOnly, { recursive: true, force: true })
}

for (const [label, rel] of [
  ['partial candidate', 'bin/aggregate.ts'],
  ['HELP snapshot', 'skills/ki-authoring/help.md']
] as const) {
  const root = fixture()
  try {
    const before = snapshot(root)
    const result = run(root, { NODE_ENV: 'test', KI_BOOTSTRAP_TEST_FAIL_BUILD_AFTER_REL: rel })
    check(`${label} write/journal failure → bootstrap reports failure`, result.status !== 0)
    check(`${label} write/journal failure → invocation-created state is removed`, snapshot(root) === before)
    check(`${label} write/journal failure → no transaction artifacts remain`, transactionArtifacts(root).length === 0)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

const missingHelpRuntime = fixture()
try {
  const before = snapshot(missingHelpRuntime)
  const result = run(missingHelpRuntime, { NODE_ENV: 'test', KI_BOOTSTRAP_TEST_HELP_PATH: '/definitely/missing' })
  check('missing HELP renderer runtime → bootstrap reports failure', result.status !== 0)
  check('missing HELP renderer runtime → target is rolled back exactly', snapshot(missingHelpRuntime) === before)
  check('missing HELP renderer runtime → no transaction artifacts remain', transactionArtifacts(missingHelpRuntime).length === 0)
} finally {
  rmSync(missingHelpRuntime, { recursive: true, force: true })
}

const stagedMutation = fixture()
try {
  const result = run(stagedMutation, { NODE_ENV: 'test', KI_BOOTSTRAP_TEST_MUTATE_STAGED_REL: 'bin/aggregate.ts' })
  check('staged mutation after journaling → bootstrap refuses', result.status !== 0)
  check('staged mutation after journaling → no destination generation is published', !existsSync(join(stagedMutation, '.ki-meta', 'bin')))
  check(
    'staged mutation after journaling → conflicting private state and lock are preserved',
    transactionArtifacts(stagedMutation).length === 2
  )
} finally {
  rmSync(stagedMutation, { recursive: true, force: true })
}

const rootReplacement = fixture()
const rootBackup = `${rootReplacement}-bound-root`
try {
  const result = run(rootReplacement, { NODE_ENV: 'test', KI_BOOTSTRAP_TEST_REPLACE_BOUND_ROOT_WITH: rootBackup })
  check('bound root inode replacement → bootstrap refuses', result.status !== 0)
  check(
    'bound root inode replacement → original repository is preserved',
    readFileSync(join(rootBackup, '.ki-config.toml'), 'utf8') === CONFIG
  )
  check('bound root inode replacement → replacement root receives no .ki-meta writes', !existsSync(join(rootReplacement, '.ki-meta')))
} finally {
  rmSync(rootReplacement, { recursive: true, force: true })
  rmSync(rootBackup, { recursive: true, force: true })
}

const scaffoldReplacement = fixture()
const scaffoldBackup = `${scaffoldReplacement}-scaffold-root`
try {
  const result = spawnSync('bun', [BOOTSTRAP, scaffoldReplacement, '--seed', 'ki-repo', '--ref', REF], {
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      KI_BOOTSTRAP_TEST_REPLACE_ROOT_AFTER_SCAFFOLD_WITH: scaffoldBackup
    }
  })
  check('root replacement during config scaffold → bootstrap refuses', result.status !== 0)
  check(
    'root replacement during config scaffold → scaffolded repository stays with bound inode',
    existsSync(join(scaffoldBackup, '.ki-config.toml'))
  )
  check(
    'root replacement during config scaffold → replacement root receives no .ki-meta writes',
    !existsSync(join(scaffoldReplacement, '.ki-meta'))
  )
} finally {
  rmSync(scaffoldReplacement, { recursive: true, force: true })
  rmSync(scaffoldBackup, { recursive: true, force: true })
}

for (const [name, env] of [
  ['creation', { KI_BOOTSTRAP_TEST_RACE_META_CREATE: '1' }],
  ['cleanup', { KI_BOOTSTRAP_TEST_RACE_META_CLEANUP: '1' }]
] as const) {
  const root = fixture()
  try {
    const result = run(root, { NODE_ENV: 'test', ...env })
    check(`raced .ki-meta ${name} → bootstrap refuses`, result.status !== 0)
    check(`raced .ki-meta ${name} → third-party directory is preserved`, lstatSync(join(root, '.ki-meta')).isDirectory())
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

const stagingCollision = fixture()
try {
  mkdirSync(join(stagingCollision, '.ki-meta', '.bootstrap-staging-fixed'), { recursive: true })
  writeFileSync(join(stagingCollision, '.ki-meta', '.bootstrap-staging-fixed', 'sentinel'), 'preserve\n')
  const before = snapshot(stagingCollision)
  const result = run(stagingCollision, { NODE_ENV: 'test', KI_BOOTSTRAP_TEST_STAGING_SUFFIX: 'fixed' })
  check('pre-existing selected staging path → bootstrap refuses', result.status !== 0)
  check('pre-existing selected staging path → target remains unchanged', snapshot(stagingCollision) === before)
} finally {
  rmSync(stagingCollision, { recursive: true, force: true })
}

const publicMeta = fixture()
try {
  mkdirSync(join(publicMeta, '.ki-meta'), { mode: 0o777 })
  chmodSync(join(publicMeta, '.ki-meta'), 0o777)
  const before = snapshot(publicMeta)
  const result = run(publicMeta)
  check('group/other-writable .ki-meta → bootstrap refuses', result.status !== 0)
  check('group/other-writable .ki-meta → target remains unchanged', snapshot(publicMeta) === before)
} finally {
  rmSync(publicMeta, { recursive: true, force: true })
}

const greenfield = fixture()
try {
  check('greenfield absent .ki-meta → complete generation succeeds', run(greenfield).status === 0)
  check('greenfield success → staging and lock are removed', transactionArtifacts(greenfield).length === 0)
  mkdirSync(join(greenfield, '.ki-meta', 'audits'))
  writeFileSync(join(greenfield, '.ki-meta', 'audits', 'report.json'), '{"preserve":true}\n')
  const audits = snapshot(join(greenfield, '.ki-meta', 'audits'))
  mkdirSync(join(greenfield, '.ki-meta', 'skills', 'obsolete'))
  writeFileSync(join(greenfield, '.ki-meta', 'skills', 'obsolete', 'audit.ts'), 'obsolete\n')
  check('successful re-bootstrap → succeeds', run(greenfield).status === 0)
  check('successful re-bootstrap → obsolete vendor is pruned', !existsSync(join(greenfield, '.ki-meta', 'skills', 'obsolete')))
  check('successful re-bootstrap → audits are byte-for-byte preserved', snapshot(join(greenfield, '.ki-meta', 'audits')) === audits)
} finally {
  rmSync(greenfield, { recursive: true, force: true })
}

for (const leaf of ['skills', 'bin', 'manifest.json'] as const) {
  const root = fixture()
  const outside = realpathSync(mkdtempSync(join(tmpdir(), 'ki-bootstrap-outside-')))
  try {
    mkdirSync(join(root, '.ki-meta'))
    writeFileSync(join(outside, 'sentinel'), 'outside\n')
    symlinkSync(leaf === 'manifest.json' ? join(outside, 'missing') : outside, join(root, '.ki-meta', leaf))
    const before = snapshot(outside)
    const result = run(root)
    check(`symlinked ${leaf} → bootstrap refuses`, result.status !== 0)
    check(`symlinked ${leaf} → outside remains unchanged`, snapshot(outside) === before)
    check(`symlinked ${leaf} → no transaction artifacts remain`, transactionArtifacts(root).length === 0)
  } finally {
    rmSync(root, { recursive: true, force: true })
    rmSync(outside, { recursive: true, force: true })
  }
}

const metaSymlink = fixture()
const metaOutside = realpathSync(mkdtempSync(join(tmpdir(), 'ki-bootstrap-meta-outside-')))
try {
  writeFileSync(join(metaOutside, 'sentinel'), 'outside\n')
  symlinkSync(metaOutside, join(metaSymlink, '.ki-meta'))
  const before = snapshot(metaOutside)
  check('symlinked .ki-meta → bootstrap refuses', run(metaSymlink).status !== 0)
  check('symlinked .ki-meta → outside remains unchanged', snapshot(metaOutside) === before)
} finally {
  rmSync(metaSymlink, { recursive: true, force: true })
  rmSync(metaOutside, { recursive: true, force: true })
}

const locked = fixture()
try {
  mkdirSync(join(locked, '.ki-meta'))
  writeFileSync(join(locked, '.ki-meta', '.bootstrap.lock'), 'other invocation\n')
  const before = snapshot(locked)
  check('pre-existing lock → bootstrap refuses', run(locked).status !== 0)
  check('pre-existing lock → target remains unchanged', snapshot(locked) === before)
} finally {
  rmSync(locked, { recursive: true, force: true })
}

const prePublication = fixture()
try {
  check('pre-publication fixture → initial bootstrap succeeds', run(prePublication).status === 0)
  const aggregate = join(prePublication, '.ki-meta', 'bin', 'aggregate.ts')
  const before = lstatSync(aggregate)
  const bytes = readFileSync(aggregate)
  const result = run(prePublication, { NODE_ENV: 'test', KI_BOOTSTRAP_TEST_PREPUBLISH_REPLACE_REL: 'bin/aggregate.ts' })
  check(
    'same-byte/new-inode pre-publication replacement → bootstrap refuses',
    result.status !== 0 && lstatSync(aggregate).ino !== before.ino
  )
  check('same-byte/new-inode pre-publication replacement → bytes remain', readFileSync(aggregate).equals(bytes))
  check('pre-publication refusal → no artifacts remain', transactionArtifacts(prePublication).length === 0)
} finally {
  rmSync(prePublication, { recursive: true, force: true })
}

const postCheckSwap = fixture()
try {
  check('post-check fixture → initial bootstrap succeeds', run(postCheckSwap).status === 0)
  writeFileSync(join(postCheckSwap, '.ki-meta', 'bin', 'aggregate.ts'), 'stale aggregate\n')
  const result = run(postCheckSwap, { NODE_ENV: 'test', KI_BOOTSTRAP_TEST_POST_QUARANTINE_RECREATE_REL: 'bin/aggregate.ts' })
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
  check('post-quarantine destination recreation → bootstrap refuses', result.status !== 0)
  check(
    'post-quarantine destination recreation → concurrent file is not overwritten',
    readFileSync(join(postCheckSwap, '.ki-meta', 'bin', 'aggregate.ts'), 'utf8') === 'third-party post-check replacement\n'
  )
  check(
    'post-quarantine destination recreation → old bytes remain quarantined',
    snapshot(join(postCheckSwap, '.ki-meta')).includes(Buffer.from('stale aggregate\n').toString('base64'))
  )
  check('post-quarantine destination recreation → exact conflict is reported', output.includes('.ki-meta/bin/aggregate.ts'))
} finally {
  rmSync(postCheckSwap, { recursive: true, force: true })
}

const quarantineSnapshotFailure = fixture()
try {
  check('post-rename snapshot fixture → initial bootstrap succeeds', run(quarantineSnapshotFailure).status === 0)
  const aggregate = join(quarantineSnapshotFailure, '.ki-meta', 'bin', 'aggregate.ts')
  writeFileSync(aggregate, 'stale aggregate\n')
  const result = run(quarantineSnapshotFailure, {
    NODE_ENV: 'test',
    KI_BOOTSTRAP_TEST_FAIL_QUARANTINE_SNAPSHOT_REL: 'bin/aggregate.ts'
  })
  check('post-rename snapshot failure → bootstrap reports conflict', result.status !== 0)
  check(
    'post-rename snapshot failure → moved hostile bytes are restored and preserved',
    readFileSync(aggregate, 'utf8') === 'stale aggregate\n'
  )
  check(
    'post-rename snapshot failure → quarantine journal and lock are retained',
    transactionArtifacts(quarantineSnapshotFailure).length === 2
  )
} finally {
  rmSync(quarantineSnapshotFailure, { recursive: true, force: true })
}

for (const [label, envName] of [
  ['between validation and manifest', 'KI_BOOTSTRAP_TEST_LATE_BETWEEN_VALIDATION_AND_MANIFEST_REL'],
  ['after manifest publication', 'KI_BOOTSTRAP_TEST_LATE_POST_MANIFEST_REL']
] as const) {
  const root = fixture()
  try {
    check(`${label} fixture → initial bootstrap succeeds`, run(root).status === 0)
    const aggregate = join(root, '.ki-meta', 'bin', 'aggregate.ts')
    const generated = readFileSync(aggregate)
    writeFileSync(aggregate, 'stale aggregate\n')
    writeFileSync(join(root, '.ki-meta', 'manifest.json'), '{"stale":true}\n')
    const result = run(root, { NODE_ENV: 'test', [envName]: 'bin/aggregate.ts' })
    check(`same-byte/new-inode mutation ${label} → bootstrap refuses`, result.status !== 0)
    check(`same-byte/new-inode mutation ${label} → changed file is not clobbered`, readFileSync(aggregate).equals(generated))
    check(`same-byte/new-inode mutation ${label} → quarantine and lock are preserved`, transactionArtifacts(root).length === 2)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

const rollbackMode = fixture()
try {
  check('N=2 rollback fixture → initial bootstrap succeeds', run(rollbackMode).status === 0)
  const obsolete = join(rollbackMode, '.ki-meta', 'skills', 'obsolete')
  mkdirSync(obsolete, { mode: 0o711 })
  chmodSync(obsolete, 0o711)
  writeFileSync(join(obsolete, 'audit.ts'), 'obsolete\n')
  writeFileSync(join(rollbackMode, '.ki-meta', 'bin', 'aggregate.ts'), 'stale aggregate\n')
  writeFileSync(join(rollbackMode, '.ki-meta', 'manifest.json'), '{"stale":true}\n')
  const before = snapshot(rollbackMode)
  const result = run(rollbackMode, { NODE_ENV: 'test', KI_BOOTSTRAP_TEST_FAIL_AFTER: '2' })
  check('N=2 publication failure → bootstrap reports failure', result.status !== 0)
  check('N=2 publication failure → bytes/types/modes are restored', snapshot(rollbackMode) === before)
  check('N=2 rollback → directory retains exact 0711 mode', (lstatSync(obsolete).mode & 0o777) === 0o711)
  check('N=2 complete rollback → no artifacts remain', transactionArtifacts(rollbackMode).length === 0)
} finally {
  rmSync(rollbackMode, { recursive: true, force: true })
}

const hardLinkRollback = fixture()
try {
  check('hard-link rollback fixture → initial bootstrap succeeds', run(hardLinkRollback).status === 0)
  const aggregate = join(hardLinkRollback, '.ki-meta', 'bin', 'aggregate.ts')
  const alias = join(hardLinkRollback, 'aggregate-alias.ts')
  writeFileSync(aggregate, 'stale aggregate\n')
  linkSync(aggregate, alias)
  writeFileSync(join(hardLinkRollback, '.ki-meta', 'manifest.json'), '{"stale":true}\n')
  const result = run(hardLinkRollback, {
    NODE_ENV: 'test',
    KI_BOOTSTRAP_TEST_FAIL_AFTER: '2',
    KI_BOOTSTRAP_TEST_MUTATE_ALIAS_AFTER_QUARANTINE_REL: 'bin/aggregate.ts',
    KI_BOOTSTRAP_TEST_MUTATE_ALIAS_PATH: alias
  })
  check('external hard-link mutation plus N=2 failure → bootstrap reports failure', result.status !== 0)
  check(
    'external hard-link mutation → rollback restores journaled destination bytes',
    readFileSync(aggregate, 'utf8') === 'stale aggregate\n'
  )
  check(
    'external hard-link mutation → hostile alias mutation is not hidden',
    readFileSync(alias, 'utf8') === 'external hard-link mutation\n'
  )
  check('external hard-link mutation → complete rollback removes artifacts', transactionArtifacts(hardLinkRollback).length === 0)
} finally {
  rmSync(hardLinkRollback, { recursive: true, force: true })
}

const lockReplacement = fixture()
try {
  check('lock replacement fixture → initial bootstrap succeeds', run(lockReplacement).status === 0)
  const result = run(lockReplacement, { NODE_ENV: 'test', KI_BOOTSTRAP_TEST_REPLACE_LOCK_AFTER_CHECK: '1' })
  check('lock replacement after identity check → bootstrap reports conflict', result.status !== 0)
  check(
    'lock replacement after identity check → replacement lock is preserved',
    readFileSync(join(lockReplacement, '.ki-meta', '.bootstrap.lock'), 'utf8') === 'third-party lock replacement\n'
  )
  check('lock replacement after identity check → private quarantine is retained', transactionArtifacts(lockReplacement).length === 2)
} finally {
  rmSync(lockReplacement, { recursive: true, force: true })
}

const rollbackConflict = fixture()
try {
  check('rollback-conflict fixture → initial bootstrap succeeds', run(rollbackConflict).status === 0)
  writeFileSync(join(rollbackConflict, '.ki-meta', 'bin', 'aggregate.ts'), 'stale aggregate\n')
  const result = run(rollbackConflict, {
    NODE_ENV: 'test',
    KI_BOOTSTRAP_TEST_FAIL_AFTER: '1',
    KI_BOOTSTRAP_TEST_ROLLBACK_CONFLICT_REL: 'bin/aggregate.ts'
  })
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
  check('third-party rollback mutation → exact conflict is reported', result.status !== 0 && output.includes('.ki-meta/bin/aggregate.ts'))
  check(
    'third-party rollback mutation → changed destination is preserved',
    readFileSync(join(rollbackConflict, '.ki-meta', 'bin', 'aggregate.ts'), 'utf8') === 'third-party rollback conflict\n'
  )
  check('incomplete rollback → quarantine and lock are retained', transactionArtifacts(rollbackConflict).length === 2)
} finally {
  rmSync(rollbackConflict, { recursive: true, force: true })
}

if (failed) process.exit(1)
console.log('\n\x1b[32mbootstrap-safety.test.ts: all checks passed\x1b[0m')
