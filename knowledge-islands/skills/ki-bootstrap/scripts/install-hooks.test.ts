#!/usr/bin/env bun
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
/** Adversarial tests for the disposable-source hook-payload installer. */
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPTS = dirname(fileURLToPath(import.meta.url))
const SCRIPT = join(SCRIPTS, 'install-hooks.ts')
const ENTRYPOINT = join(SCRIPTS, 'install-hooks.sh')
const NAMES = ['plan-stamp.sh', 'plan-sync.sh', 'git-lock-check.sh'] as const

let failures = 0

function check(label: string, condition: boolean): void {
  if (condition) console.log(`  \x1b[32mok\x1b[0m   ${label}`)
  else {
    failures += 1
    console.log(`  \x1b[31mFAIL\x1b[0m ${label}`)
  }
}

type Fixture = {
  root: string
  home: string
  source: string
  claude: string
  settings: string
  namespace: string
}

function fixture(): Fixture {
  const root = mkdtempSync(join(tmpdir(), 'ki-install-hooks-'))
  const home = join(root, 'home')
  const source = join(root, 'source')
  mkdirSync(home)
  mkdirSync(source)
  for (const [index, name] of NAMES.entries()) {
    const path = join(source, name)
    writeFileSync(path, `#!/bin/sh\necho hook-${index}\n`)
    chmodSync(path, 0o755)
  }
  const claude = join(home, '.claude')
  return {
    root,
    home,
    source,
    claude,
    settings: join(claude, 'settings.json'),
    namespace: join(claude, 'hooks', 'knowledgeislands', 'ki-agentic-harness')
  }
}

function run(env: Fixture, ...args: string[]): ReturnType<typeof spawnSync> {
  return spawnSync('bun', [SCRIPT, '--source', env.source, '--home', env.home, '--ref', 'test-ref', ...args], {
    encoding: 'utf8'
  })
}

function runWithStagingFailure(env: Fixture): ReturnType<typeof spawnSync> {
  return spawnSync('bun', [SCRIPT, '--source', env.source, '--home', env.home, '--ref', 'test-ref'], {
    encoding: 'utf8',
    env: { ...process.env, KI_HOOKS_TEST_FAIL_STAGE: '1' }
  })
}

function runWithPostPublicationFailure(env: Fixture): ReturnType<typeof spawnSync> {
  return spawnSync('bun', [SCRIPT, '--source', env.source, '--home', env.home, '--ref', 'test-ref'], {
    encoding: 'utf8',
    env: { ...process.env, KI_HOOKS_TEST_FAIL_AFTER_PAYLOAD: '1' }
  })
}

function runWithActivePointerFailure(env: Fixture): ReturnType<typeof spawnSync> {
  return spawnSync('bun', [SCRIPT, '--source', env.source, '--home', env.home, '--ref', 'test-ref'], {
    encoding: 'utf8',
    env: { ...process.env, KI_HOOKS_TEST_FAIL_AFTER_ACTIVE: '1' }
  })
}

function output(result: ReturnType<typeof spawnSync>): string {
  return typeof result.stdout === 'string' ? result.stdout : (result.stdout?.toString() ?? '')
}

function activeId(env: Fixture): string | undefined {
  try {
    const active = JSON.parse(readFileSync(join(env.namespace, 'active.json'), 'utf8')) as { payload_id?: unknown }
    return typeof active.payload_id === 'string' ? active.payload_id : undefined
  } catch {
    return undefined
  }
}

function payload(env: Fixture, id = activeId(env)): string | undefined {
  return id ? join(env.namespace, id) : undefined
}

function current(env: Fixture): string {
  return join(env.namespace, 'current')
}

function manifest(env: Fixture, id = activeId(env)): Record<string, unknown> | undefined {
  try {
    return JSON.parse(readFileSync(join(payload(env, id) as string, 'manifest.json'), 'utf8')) as Record<string, unknown>
  } catch {
    return undefined
  }
}

function digest(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function writeLegacyPayload(env: Fixture): string {
  const files = new Map(NAMES.map((name) => [name, readFileSync(join(env.source, name))]))
  const hash = createHash('sha256')
  for (const name of NAMES) {
    const bytes = files.get(name) as Buffer
    hash.update(name)
    hash.update('\0')
    hash.update(String(bytes.length))
    hash.update('\0')
    hash.update(bytes)
    hash.update('\0')
  }
  const id = hash.digest('hex')
  const installed = join(env.namespace, id)
  mkdirSync(installed, { recursive: true, mode: 0o700 })
  chmodSync(env.namespace, 0o700)
  chmodSync(installed, 0o700)
  for (const name of NAMES) {
    writeFileSync(join(installed, name), files.get(name) as Buffer, { mode: 0o755 })
    chmodSync(join(installed, name), 0o755)
  }
  writeFileSync(
    join(installed, 'manifest.json'),
    `${JSON.stringify({
      schema: 1,
      repository: 'knowledgeislands/ki-agentic-harness',
      requested_ref: 'legacy-fixture',
      payload_id: id,
      hooks: NAMES.map((name) => ({ name, sha256: digest(files.get(name) as Buffer), mode: '0755' }))
    })}\n`,
    { mode: 0o600 }
  )
  chmodSync(join(installed, 'manifest.json'), 0o600)
  writeFileSync(
    join(env.namespace, 'active.json'),
    `${JSON.stringify({ schema: 1, repository: 'knowledgeislands/ki-agentic-harness', payload_id: id })}\n`,
    { mode: 0o600 }
  )
  chmodSync(join(env.namespace, 'active.json'), 0o600)
  return id
}

function payloadIds(env: Fixture): string[] {
  return existsSync(env.namespace) ? readdirSync(env.namespace).filter((name) => /^[a-f0-9]{64}$/.test(name)) : []
}

function isRegular(path: string, mode: number): boolean {
  const entry = lstatSync(path)
  return entry.isFile() && !entry.isSymbolicLink() && (entry.mode & 0o777) === mode
}

function clean(env: Fixture): void {
  rmSync(env.root, { recursive: true, force: true })
}

// The installer creates copied, executable payload files and does not inspect or
// mutate user-managed Claude settings (even when those settings are malformed).
{
  const env = fixture()
  try {
    mkdirSync(env.claude)
    writeFileSync(env.settings, '{ this is deliberately malformed JSON }\n')
    const settingsBefore = readFileSync(env.settings)
    const result = run(env)
    const id = activeId(env)
    const installed = payload(env, id)
    check('fresh payload install succeeds', result.status === 0 && Boolean(id) && Boolean(installed))
    check('fresh install passes its payload check', run(env, '--check').status === 0)
    check(
      'payload, stable commands, and active pointer are regular owned files',
      Boolean(installed) &&
        NAMES.every((name) => isRegular(join(installed as string, name), 0o755)) &&
        NAMES.every((name) => isRegular(join(current(env), name), 0o755)) &&
        isRegular(join(installed as string, 'manifest.json'), 0o600) &&
        isRegular(join(env.namespace, 'active.json'), 0o600)
    )
    check('payload directory contains only declared payload files', Boolean(installed) && readdirSync(installed as string).length === 4)
    check(
      'manifest declares stable user-readable command paths and their payload checksums',
      (() => {
        const installedManifest = manifest(env)
        const commands = installedManifest?.commands as Record<string, unknown> | undefined
        const hooks = installedManifest?.hooks as Array<Record<string, unknown>> | undefined
        return (
          installedManifest?.schema === 2 &&
          NAMES.every((name) => commands?.[name] === join(current(env), name)) &&
          NAMES.every((name) => {
            const row = hooks?.find((hook) => hook.name === name)
            return row?.sha256 === digest(readFileSync(join(current(env), name)))
          })
        )
      })()
    )
    check('installer leaves Claude settings byte-identical', readFileSync(env.settings).equals(settingsBefore))
    check(
      'payload survives source removal',
      (() => {
        rmSync(env.source, { recursive: true, force: true })
        return NAMES.every((name) => isRegular(join(installed as string, name), 0o755) && isRegular(join(current(env), name), 0o755))
      })()
    )
  } finally {
    clean(env)
  }
}
{
  const env = fixture()
  try {
    const legacy = writeLegacyPayload(env)
    check('schema-1 payload upgrades to the stable-command contract', run(env).status === 0 && activeId(env) !== legacy)
    check(
      'schema-1 upgrade retains immutable legacy payload and publishes regular stable commands',
      NAMES.every((name) => isRegular(join(env.namespace, legacy, name), 0o755) && isRegular(join(current(env), name), 0o755))
    )
  } finally {
    clean(env)
  }
}
{
  const env = fixture()
  try {
    check('install for active-pointer rollback succeeds', run(env).status === 0)
    const first = activeId(env)
    writeFileSync(join(env.source, 'plan-sync.sh'), '#!/bin/sh\necho active-pointer-upgrade\n')
    chmodSync(join(env.source, 'plan-sync.sh'), 0o755)
    check(
      'an active-pointer validation failure restores the prior active payload',
      runWithActivePointerFailure(env).status !== 0 && activeId(env) === first
    )
  } finally {
    clean(env)
  }
}
{
  const env = fixture()
  try {
    check(
      'a post-publication validation failure removes the installer-owned payload and private artifacts',
      runWithPostPublicationFailure(env).status !== 0 && payloadIds(env).length === 0 && readdirSync(env.namespace).length === 0
    )
  } finally {
    clean(env)
  }
}
{
  const env = fixture()
  try {
    check(
      'a staging failure removes the unpublished payload and private artifacts',
      runWithStagingFailure(env).status !== 0 && payloadIds(env).length === 0 && readdirSync(env.namespace).length === 0
    )
  } finally {
    clean(env)
  }
}

// It is idempotent for the same source and activates a new immutable payload for
// changed content, while retaining the prior content-addressed payload.
{
  const env = fixture()
  try {
    check('initial install succeeds', run(env).status === 0)
    const first = activeId(env) as string
    const firstPointer = readFileSync(join(env.namespace, 'active.json'))
    check(
      'reinstalling unchanged sources is byte-stable',
      run(env).status === 0 && activeId(env) === first && readFileSync(join(env.namespace, 'active.json')).equals(firstPointer)
    )
    writeFileSync(join(env.source, 'plan-sync.sh'), '#!/bin/sh\necho upgraded\n')
    chmodSync(join(env.source, 'plan-sync.sh'), 0o755)
    const upgraded = run(env)
    const second = activeId(env)
    check('changed source activates a distinct payload', upgraded.status === 0 && typeof second === 'string' && second !== first)
    check(
      'previous immutable payload remains intact',
      NAMES.every((name) => isRegular(join(env.namespace, first, name), 0o755))
    )
    check(
      'stable command paths switch to the new active payload without symlinks',
      typeof second === 'string' &&
        NAMES.every((name) => {
          const stable = join(current(env), name)
          return isRegular(stable, 0o755) && readFileSync(stable).equals(readFileSync(join(env.namespace, second, name)))
        })
    )
  } finally {
    clean(env)
  }
}
{
  const env = fixture()
  try {
    check('install for stable-command symlink check succeeds', run(env).status === 0)
    rmSync(current(env), { recursive: true, force: true })
    symlinkSync('/unsafe', current(env))
    check('symlinked stable command directory is rejected without replacement', run(env, '--check').status !== 0 && run(env).status !== 0)
  } finally {
    clean(env)
  }
}
{
  const env = fixture()
  try {
    check('install for permission drift check succeeds', run(env).status === 0)
    const installed = payload(env) as string
    chmodSync(installed, 0o777)
    check('weakened payload directory fails validation without replacement', run(env, '--check').status !== 0 && run(env).status !== 0)
  } finally {
    clean(env)
  }
}
{
  const env = fixture()
  try {
    check('install for namespace permission drift check succeeds', run(env).status === 0)
    chmodSync(env.namespace, 0o777)
    check('weakened namespace fails validation without replacement', run(env, '--check').status !== 0 && run(env).status !== 0)
  } finally {
    clean(env)
  }
}

// Dry-run validates source inputs but makes no home-directory changes.
{
  const env = fixture()
  try {
    check('dry run writes nothing', run(env, '--dry-run').status === 0 && !existsSync(env.claude))
  } finally {
    clean(env)
  }
}

// Unsafe sources and destinations fail closed before an installer-owned payload
// is written.
{
  const env = fixture()
  try {
    rmSync(join(env.source, 'plan-stamp.sh'))
    symlinkSync('/missing', join(env.source, 'plan-stamp.sh'))
    check('symlink source is rejected before writes', run(env).status !== 0 && !existsSync(env.claude))
  } finally {
    clean(env)
  }
}
{
  const env = fixture()
  try {
    const preview = run(env, '--dry-run')
    const id = output(preview).match(/[a-f0-9]{64}/)?.[0]
    mkdirSync(env.namespace, { recursive: true })
    writeFileSync(join(env.namespace, `${id}.lock`), 'another install owns this lock\n')
    check(
      'a publication lock leaves no partial payload',
      preview.status === 0 && typeof id === 'string' && run(env).status !== 0 && !existsSync(join(env.namespace, id))
    )
  } finally {
    clean(env)
  }
}
{
  const env = fixture()
  try {
    check('install for corruption check succeeds', run(env).status === 0)
    const installed = payload(env) as string
    writeFileSync(join(installed, 'manifest.json'), '{}\n')
    check(
      'corrupt owned payload fails closed without replacement',
      run(env).status !== 0 && readFileSync(join(installed, 'manifest.json'), 'utf8') === '{}\n'
    )
  } finally {
    clean(env)
  }
}
{
  const env = fixture()
  try {
    writeFileSync(env.claude, 'not a directory')
    check('hostile .claude file is rejected unchanged', run(env).status !== 0 && readFileSync(env.claude, 'utf8') === 'not a directory')
  } finally {
    clean(env)
  }
}
{
  const env = fixture()
  try {
    const outside = join(env.root, 'outside')
    mkdirSync(outside)
    symlinkSync(outside, env.claude)
    check('hostile .claude symlink is rejected', run(env).status !== 0 && lstatSync(env.claude).isSymbolicLink())
  } finally {
    clean(env)
  }
}
{
  const env = fixture()
  try {
    const outside = join(env.root, 'outside-hooks')
    mkdirSync(env.claude)
    mkdirSync(outside)
    symlinkSync(outside, join(env.claude, 'hooks'))
    check('hostile hooks symlink is rejected', run(env).status !== 0 && lstatSync(join(env.claude, 'hooks')).isSymbolicLink())
  } finally {
    clean(env)
  }
}
{
  const env = fixture()
  try {
    const outside = join(env.root, 'outside-namespace')
    mkdirSync(join(env.claude, 'hooks', 'knowledgeislands'), { recursive: true })
    mkdirSync(outside)
    symlinkSync(outside, env.namespace)
    check('hostile payload namespace symlink is rejected', run(env).status !== 0 && lstatSync(env.namespace).isSymbolicLink())
  } finally {
    clean(env)
  }
}
{
  const env = fixture()
  try {
    mkdirSync(env.namespace, { recursive: true })
    writeFileSync(join(env.namespace, 'active.json'), 'not installer JSON\n')
    check(
      'invalid active pointer is not overwritten or accompanied by a payload',
      run(env).status !== 0 &&
        readFileSync(join(env.namespace, 'active.json'), 'utf8') === 'not installer JSON\n' &&
        payloadIds(env).length === 0
    )
  } finally {
    clean(env)
  }
}
{
  const env = fixture()
  try {
    mkdirSync(env.namespace, { recursive: true })
    symlinkSync('/unrelated', join(env.namespace, 'active.json'))
    check('active-pointer symlink is rejected before payload publication', run(env).status !== 0 && payloadIds(env).length === 0)
  } finally {
    clean(env)
  }
}
{
  const env = fixture()
  try {
    mkdirSync(env.namespace, { recursive: true })
    mkdirSync(join(env.namespace, '.installer.lock'))
    check('existing installer-wide lock blocks publication', run(env).status !== 0 && payloadIds(env).length === 0)
  } finally {
    clean(env)
  }
}
// The installer never mutates legacy hook links outside its private namespace;
// user-environment management adopts the durable payload separately.
{
  const env = fixture()
  try {
    const hooks = join(env.claude, 'hooks')
    mkdirSync(hooks, { recursive: true })
    symlinkSync('/recognised-looking-but-user-managed', join(hooks, 'plan-stamp.sh'))
    symlinkSync('/unrelated', join(hooks, 'plan-sync.sh'))
    const result = run(env)
    check('legacy-looking links are left untouched', result.status === 0 && lstatSync(join(hooks, 'plan-stamp.sh')).isSymbolicLink())
    check('unknown legacy links are left untouched', lstatSync(join(hooks, 'plan-sync.sh')).isSymbolicLink())
  } finally {
    clean(env)
  }
}

// The remote entry point fetches a disposable source and does not smuggle in a
// bootstrap or settings-binding responsibility.
{
  const entrypoint = readFileSync(ENTRYPOINT, 'utf8')
  check('remote entry point fetches the selected GitHub ref', entrypoint.includes('codeload.github.com/$REPO/tar.gz/$ref'))
  check(
    'remote entry point invokes only the payload installer',
    entrypoint.includes('install-hooks.ts') && !entrypoint.includes('bootstrap.ts')
  )
  check('remote entry point never mentions Claude settings', !entrypoint.includes('settings.json'))
}

if (failures > 0) process.exit(1)
console.log('\ninstall-hooks tests passed')
