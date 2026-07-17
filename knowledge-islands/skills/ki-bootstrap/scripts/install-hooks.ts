#!/usr/bin/env bun
/**
 * Durable Claude Code hook-payload installer.
 *
 * This is deliberately separate from bootstrap.ts: its source may be a disposable
 * GitHub tarball, while the installed hooks must survive after that tree is gone.
 */
import { createHash } from 'node:crypto'
import {
  chmodSync,
  closeSync,
  constants,
  fchmodSync,
  fstatSync,
  linkSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmdirSync,
  rmSync,
  unlinkSync,
  writeFileSync
} from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SELF = fileURLToPath(import.meta.url)
const HARNESS_ROOT = resolve(dirname(SELF), '..', '..', '..', '..')
const NAMES = ['plan-stamp.sh', 'plan-sync.sh', 'git-lock-check.sh'] as const
const REPOSITORY = 'knowledgeislands/ki-agentic-harness'
const SCHEMA = 2

type JsonObject = Record<string, unknown>
type StatNumber = number | bigint
type Snapshot = { dev: StatNumber; ino: StatNumber; mode: StatNumber; size: StatNumber; mtimeMs: StatNumber }
type Created = { path: string; identity: Snapshot }
type Stat = NonNullable<ReturnType<typeof lstatSync>>

function fail(message: string): never {
  throw new Error(message)
}

function lstat(path: string): Stat | undefined {
  try {
    return lstatSync(path)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
}

function snapshot(path: string): Snapshot | undefined {
  const entry = lstat(path)
  if (!entry) return undefined
  if (entry.isSymbolicLink()) fail(`${path} must not be a symlink`)
  return { dev: entry.dev, ino: entry.ino, mode: entry.mode, size: entry.size, mtimeMs: entry.mtimeMs }
}

function sameSnapshot(path: string, expected: Snapshot | undefined): boolean {
  try {
    const actual = snapshot(path)
    if (!actual || !expected) return actual === expected
    return Boolean(
      actual.dev === expected.dev &&
        actual.ino === expected.ino &&
        actual.mode === expected.mode &&
        actual.size === expected.size &&
        actual.mtimeMs === expected.mtimeMs
    )
  } catch {
    return false
  }
}

function sameIdentity(path: string, expected: Snapshot | undefined): boolean {
  try {
    const actual = snapshot(path)
    return Boolean(actual && expected && actual.dev === expected.dev && actual.ino === expected.ino && actual.mode === expected.mode)
  } catch {
    return false
  }
}

function identityFromStat(entry: ReturnType<typeof fstatSync>): Snapshot {
  return { dev: entry.dev, ino: entry.ino, mode: entry.mode, size: entry.size, mtimeMs: entry.mtimeMs }
}

function permissions(entry: Stat): number {
  return typeof entry.mode === 'bigint' ? Number(entry.mode & 0o777n) : entry.mode & 0o777
}

function removeCreatedFile(created: Created): void {
  if (sameIdentity(created.path, created.identity)) rmSync(created.path, { force: true })
}

function removeCreatedDirectory(created: Created): void {
  if (!sameIdentity(created.path, created.identity)) return
  try {
    rmdirSync(created.path)
  } catch {
    // A concurrent replacement or unexpected child is deliberately retained.
  }
}

function writeCreatedFile(path: string, content: string | Buffer, mode: number): Created {
  const descriptor = openSync(path, 'wx', mode)
  const created = { path, identity: identityFromStat(fstatSync(descriptor)) }
  try {
    writeFileSync(descriptor, content)
    fchmodSync(descriptor, mode)
    return created
  } catch (error) {
    closeSync(descriptor)
    removeCreatedFile(created)
    throw error
  } finally {
    try {
      closeSync(descriptor)
    } catch {
      // The catch branch already closed after a failed publication.
    }
  }
}

function requireDirectory(path: string): void {
  const entry = lstat(path)
  if (entry && (!entry.isDirectory() || entry.isSymbolicLink())) fail(`${path} must be a real directory`)
}

function requireFile(path: string, expectedMode?: number): Buffer {
  let descriptor: number
  try {
    descriptor = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  } catch {
    fail(`${path} must be a regular non-symlink file`)
  }
  try {
    const before = fstatSync(descriptor)
    if (!before.isFile()) fail(`${path} must be a regular non-symlink file`)
    if (expectedMode !== undefined && permissions(before) !== expectedMode) fail(`${path} must have mode ${expectedMode.toString(8)}`)
    const bytes = readFileSync(descriptor)
    const after = fstatSync(descriptor)
    const first = identityFromStat(before)
    const last = identityFromStat(after)
    if (
      first.dev !== last.dev ||
      first.ino !== last.ino ||
      first.mode !== last.mode ||
      first.size !== last.size ||
      first.mtimeMs !== last.mtimeMs
    )
      fail(`${path} changed while it was being read`)
    return bytes
  } finally {
    closeSync(descriptor)
  }
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function payloadId(files: Map<string, Buffer>, schema = SCHEMA): string {
  const hash = createHash('sha256')
  // Schema 1 predates stable command copies. Preserve its exact legacy address
  // only for migration; every new payload is bound to its contract schema.
  if (schema !== 1) hash.update(`schema:${schema}\0`)
  for (const name of NAMES) {
    const bytes = files.get(name)
    if (!bytes) fail(`missing hook source: ${name}`)
    hash.update(name)
    hash.update('\0')
    hash.update(String(bytes.length))
    hash.update('\0')
    hash.update(bytes)
    hash.update('\0')
  }
  return hash.digest('hex')
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function commandsFor(namespace: string): JsonObject {
  return Object.fromEntries(NAMES.map((name) => [name, join(namespace, 'current', name)]))
}

function commandsMatch(value: unknown, namespace: string): boolean {
  if (!isObject(value)) return false
  const expected = commandsFor(namespace)
  return Object.keys(value).sort().join(',') === NAMES.slice().sort().join(',') && NAMES.every((name) => value[name] === expected[name])
}

function manifestFor(id: string, ref: string, files: Map<string, Buffer>, namespace: string): JsonObject {
  return {
    schema: SCHEMA,
    repository: REPOSITORY,
    requested_ref: ref,
    payload_id: id,
    commands: commandsFor(namespace),
    hooks: NAMES.map((name) => ({ name, sha256: sha256(files.get(name) as Buffer), mode: '0755' }))
  }
}

function storedPayload(path: string, id: string, schema = SCHEMA): Map<string, Buffer> | undefined {
  try {
    const dir = lstat(path)
    const before = snapshot(path)
    if (!dir || !before || dir.isSymbolicLink() || !dir.isDirectory() || permissions(dir) !== 0o700) return undefined
    const expectedEntries = [...NAMES, 'manifest.json'].sort().join(',')
    if (readdirSync(path).sort().join(',') !== expectedEntries) return undefined
    const manifestPath = join(path, 'manifest.json')
    const manifest = JSON.parse(requireFile(manifestPath, 0o600).toString('utf8')) as JsonObject
    if (
      !isObject(manifest) ||
      Object.keys(manifest).sort().join(',') !==
        (schema === 1 ? 'hooks,payload_id,repository,requested_ref,schema' : 'commands,hooks,payload_id,repository,requested_ref,schema') ||
      manifest.schema !== schema ||
      manifest.repository !== REPOSITORY ||
      manifest.payload_id !== id ||
      typeof manifest.requested_ref !== 'string' ||
      manifest.requested_ref.length === 0 ||
      !Array.isArray(manifest.hooks) ||
      manifest.hooks.length !== NAMES.length
    )
      return undefined
    if (schema !== 1 && !commandsMatch(manifest.commands, dirname(path))) return undefined
    const rows = new Map<string, JsonObject>()
    for (const row of manifest.hooks) {
      if (!isObject(row) || Object.keys(row).sort().join(',') !== 'mode,name,sha256' || typeof row.name !== 'string' || rows.has(row.name))
        return undefined
      rows.set(row.name, row)
    }
    const stored = new Map<string, Buffer>()
    for (const name of NAMES) {
      const row = rows.get(name)
      if (!isObject(row) || row.mode !== '0755') return undefined
      const bytes = requireFile(join(path, name), 0o755)
      if (row.sha256 !== sha256(bytes)) return undefined
      stored.set(name, bytes)
    }
    return sameSnapshot(path, before) && payloadId(stored, schema) === id ? stored : undefined
  } catch {
    return undefined
  }
}

function validPayload(path: string, id: string, files: Map<string, Buffer>): boolean {
  const stored = storedPayload(path, id)
  return Boolean(stored && NAMES.every((name) => stored.get(name)?.equals(files.get(name) as Buffer)))
}

type CurrentSnapshot = { path: string; directory: Snapshot; files: Map<string, Snapshot> }

function commandSnapshot(path: string, files: Map<string, Buffer>): CurrentSnapshot | undefined {
  try {
    const directory = lstat(path)
    const before = snapshot(path)
    if (!directory || !before || directory.isSymbolicLink() || !directory.isDirectory() || permissions(directory) !== 0o700)
      return undefined
    if (readdirSync(path).sort().join(',') !== NAMES.slice().sort().join(',')) return undefined
    const entries = new Map<string, Snapshot>()
    for (const name of NAMES) {
      const bytes = requireFile(join(path, name), 0o755)
      if (!bytes.equals(files.get(name) as Buffer)) return undefined
      const identity = snapshot(join(path, name))
      if (!identity) return undefined
      entries.set(name, identity)
    }
    return sameSnapshot(path, before) ? { path, directory: before, files: entries } : undefined
  } catch {
    return undefined
  }
}

function currentSnapshot(namespace: string, files: Map<string, Buffer>): CurrentSnapshot | undefined {
  return commandSnapshot(join(namespace, 'current'), files)
}

function removeCurrent(snapshot: CurrentSnapshot): void {
  if (!sameIdentity(snapshot.path, snapshot.directory)) return
  try {
    if (readdirSync(snapshot.path).sort().join(',') !== NAMES.slice().sort().join(',')) return
    for (const name of NAMES) {
      const path = join(snapshot.path, name)
      if (!sameSnapshot(path, snapshot.files.get(name))) return
    }
    for (const name of NAMES) unlinkSync(join(snapshot.path, name))
    removeCreatedDirectory({ path: snapshot.path, identity: snapshot.directory })
  } catch {
    // Retain a conflicting prior directory rather than deleting it.
  }
}

function activePayloadIdForSchema(namespace: string, schema: number): string | undefined {
  try {
    const namespaceBefore = snapshot(namespace)
    const namespaceEntry = lstat(namespace)
    if (!namespaceBefore || !namespaceEntry?.isDirectory() || permissions(namespaceEntry) !== 0o700) return undefined
    const path = join(namespace, 'active.json')
    const active = JSON.parse(requireFile(path, 0o600).toString('utf8')) as JsonObject
    if (
      !isObject(active) ||
      Object.keys(active).sort().join(',') !== 'payload_id,repository,schema' ||
      active.schema !== schema ||
      active.repository !== REPOSITORY ||
      typeof active.payload_id !== 'string' ||
      !/^[a-f0-9]{64}$/.test(active.payload_id) ||
      !storedPayload(join(namespace, active.payload_id), active.payload_id, schema) ||
      !sameSnapshot(namespace, namespaceBefore)
    )
      return undefined
    return active.payload_id
  } catch {
    return undefined
  }
}

function activeManifest(id: string): JsonObject {
  return { schema: SCHEMA, repository: REPOSITORY, payload_id: id }
}

function activePayloadId(namespace: string): string | undefined {
  return activePayloadIdForSchema(namespace, SCHEMA)
}

function publishedPayload(namespace: string): { id: string; files: Map<string, Buffer> } | undefined {
  const current = activePayloadId(namespace)
  if (current) return { id: current, files: storedPayload(join(namespace, current), current) as Map<string, Buffer> }
  const legacy = activePayloadIdForSchema(namespace, 1)
  if (legacy) return { id: legacy, files: storedPayload(join(namespace, legacy), legacy, 1) as Map<string, Buffer> }
  return undefined
}

function publishActive(namespace: string, id: string): void {
  const path = join(namespace, 'active.json')
  const existing = lstat(path)
  const current = publishedPayload(namespace)?.id
  if (existing && !current) fail(`${path} exists but is not a valid installer-owned active pointer`)
  if (current === id) return

  const before = existing ? snapshot(path) : undefined
  const previous = before ? requireFile(path, 0o600) : undefined
  const temporary = join(namespace, `.active-${process.pid}-${Math.random().toString(16).slice(2)}`)
  let created: Created | undefined
  let published: Snapshot | undefined
  try {
    created = writeCreatedFile(temporary, `${JSON.stringify(activeManifest(id), null, 2)}\n`, 0o600)
    if (!sameIdentity(temporary, created.identity) || !sameSnapshot(path, before)) fail(`${path} changed before active payload publication`)
    if (!before) {
      linkSync(temporary, path)
      unlinkSync(temporary)
      created = undefined
    } else {
      // POSIX has no no-clobber replacement primitive for an existing regular file.
      // The snapshot check plus post-publication validation bounds the same-UID race.
      renameSync(temporary, path)
      created = undefined
    }
    published = snapshot(path)
    if (!published) fail(`${path} disappeared after active payload publication`)
    if (process.env.KI_HOOKS_TEST_FAIL_AFTER_ACTIVE === '1') fail('injected active-pointer validation failure')
    if (activePayloadId(namespace) !== id) fail(`${path} failed post-publication validation`)
  } catch (error) {
    if (published && sameIdentity(path, published)) {
      if (previous) {
        const rollback = join(namespace, `.active-rollback-${process.pid}-${Math.random().toString(16).slice(2)}`)
        let restored: Created | undefined
        try {
          restored = writeCreatedFile(rollback, previous, 0o600)
          if (!sameIdentity(path, published) || !sameIdentity(rollback, restored.identity))
            fail(`${path} changed before active payload rollback`)
          renameSync(rollback, path)
          restored = undefined
        } finally {
          if (restored) removeCreatedFile(restored)
        }
      } else {
        unlinkSync(path)
      }
    }
    throw error
  } finally {
    if (created) removeCreatedFile(created)
  }
}

function publishCurrent(namespace: string, files: Map<string, Buffer>): void {
  const path = join(namespace, 'current')
  if (currentSnapshot(namespace, files)) return

  const existing = lstat(path)
  let previous: CurrentSnapshot | undefined
  if (existing) {
    const active = publishedPayload(namespace)
    if (!active) fail(`${path} exists without a valid installer-owned active payload`)
    previous = currentSnapshot(namespace, active.files)
    if (!previous) fail(`${path} exists but is not a valid installer-owned stable command directory`)
  }

  const stagePath = mkdtempSync(join(namespace, '.current-'))
  chmodSync(stagePath, 0o700)
  const stageIdentity = snapshot(stagePath)
  if (!stageIdentity) fail(`${stagePath} disappeared during creation`)
  const stage: Created = { path: stagePath, identity: stageIdentity }
  const stageFiles: Created[] = []
  let published: CurrentSnapshot | undefined
  let backup: CurrentSnapshot | undefined
  try {
    for (const name of NAMES) stageFiles.push(writeCreatedFile(join(stage.path, name), files.get(name) as Buffer, 0o755))
    if (!commandSnapshot(stage.path, files)) fail(`${stage.path} failed stable-command staging validation`)
    if (previous) {
      const backupPath = join(namespace, `.previous-current-${process.pid}-${Math.random().toString(16).slice(2)}`)
      if (lstat(backupPath) || !sameSnapshot(path, previous.directory)) fail(`${path} changed before stable-command publication`)
      renameSync(path, backupPath)
      backup = { ...previous, path: backupPath }
      if (!sameIdentity(backup.path, backup.directory)) fail(`${path} changed during stable-command publication`)
    }
    if (lstat(path)) fail(`${path} appeared during stable-command publication`)
    renameSync(stage.path, path)
    const entries = new Map(stageFiles.map((created) => [basename(created.path), created.identity]))
    published = { path, directory: stage.identity, files: entries }
    if (!currentSnapshot(namespace, files)) fail(`${path} failed post-publication validation`)
    // The old directory is verified installer-owned and removed only if it has
    // not changed since it was displaced. A concurrent replacement is retained.
    if (backup) removeCurrent(backup)
  } catch (error) {
    if (published) removeCurrent(published)
    if (backup && !lstat(path) && sameIdentity(backup.path, backup.directory)) {
      try {
        renameSync(backup.path, path)
      } catch {
        // A conflicting path is durable evidence; never overwrite it.
      }
    }
    throw error
  } finally {
    if (!published) {
      for (const created of stageFiles.toReversed()) removeCreatedFile(created)
      removeCreatedDirectory(stage)
    }
  }
}

function withInstallationLock<T>(namespace: string, action: () => T): T {
  const lock = join(namespace, '.installer.lock')
  if (lstat(lock)) fail(`${lock} already exists; another installation may be running`)
  mkdirSync(lock, { mode: 0o700 })
  const identity = snapshot(lock)
  if (!identity) fail(`${lock} disappeared during creation`)
  try {
    return action()
  } finally {
    removeCreatedDirectory({ path: lock, identity })
  }
}

function mkdirOwned(path: string): void {
  const entry = lstat(path)
  if (entry) {
    if (entry.isSymbolicLink() || !entry.isDirectory()) fail(`${path} blocks hook installation`)
    return
  }
  mkdirSync(path, { mode: 0o700 })
}

function requirePrivateDirectory(path: string): void {
  const entry = lstat(path)
  if (!entry || entry.isSymbolicLink() || !entry.isDirectory() || permissions(entry) !== 0o700)
    fail(`${path} must be an installer-owned mode 700 directory`)
}

function writePayload(namespace: string, target: string, id: string, ref: string, files: Map<string, Buffer>): void {
  if (validPayload(target, id, files)) return
  if (lstat(target)) fail(`${target} exists but is not a valid owned payload`)
  const lock = `${target}.lock`
  if (lstat(lock)) fail(`${lock} already exists; another installation may be running`)
  mkdirSync(lock, { mode: 0o700 })
  const lockIdentity = snapshot(lock)
  if (!lockIdentity) fail(`${lock} disappeared during creation`)
  let stage: Created | undefined
  const stagedFiles: Created[] = []
  let published: Created | undefined
  let publishedFiles: Created[] = []
  try {
    const stagePath = mkdtempSync(join(namespace, '.install-'))
    const stageIdentity = snapshot(stagePath)
    if (!stageIdentity) fail(`${stagePath} disappeared during creation`)
    stage = { path: stagePath, identity: stageIdentity }
    for (const name of NAMES) {
      stagedFiles.push(writeCreatedFile(join(stage.path, name), files.get(name) as Buffer, 0o755))
    }
    stagedFiles.push(
      writeCreatedFile(join(stage.path, 'manifest.json'), `${JSON.stringify(manifestFor(id, ref, files, namespace), null, 2)}\n`, 0o600)
    )
    if (process.env.KI_HOOKS_TEST_FAIL_STAGE === '1') fail('injected staging failure')
    if (lstat(target)) fail(`${target} appeared during publication`)
    if (!sameIdentity(lock, lockIdentity) || !sameIdentity(stage.path, stage.identity))
      fail('publication staging changed during installation')
    renameSync(stage.path, target)
    published = { path: target, identity: stage.identity }
    publishedFiles = stagedFiles.map((created) => ({ path: join(target, basename(created.path)), identity: created.identity }))
    stage = undefined
    if (process.env.KI_HOOKS_TEST_FAIL_AFTER_PAYLOAD === '1') fail('injected post-publication validation failure')
    if (!validPayload(target, id, files)) fail(`${target} failed post-publication validation`)
  } catch (error) {
    for (const created of publishedFiles.toReversed()) removeCreatedFile(created)
    if (published) removeCreatedDirectory(published)
    throw error
  } finally {
    if (stage) {
      for (const created of stagedFiles.toReversed()) removeCreatedFile(created)
      removeCreatedDirectory(stage)
    }
    removeCreatedDirectory({ path: lock, identity: lockIdentity })
  }
}

function usage(): never {
  console.error('usage: bun install-hooks.ts [--source <hooks-dir>] [--home <dir>] [--ref <ref>] [--dry-run|--check]')
  process.exit(2)
}

function main(): number {
  let source = join(HARNESS_ROOT, 'hooks')
  let home = homedir()
  let ref = 'main'
  let dryRun = false
  let check = false
  const args = process.argv.slice(2)
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--dry-run') dryRun = true
    else if (arg === '--check') check = true
    else if (arg === '--source' || arg === '--home' || arg === '--ref') {
      const value = args[++index]
      if (!value) usage()
      if (arg === '--source') source = resolve(value)
      else if (arg === '--home') home = resolve(value)
      else ref = value
    } else usage()
  }
  if (dryRun && check) usage()

  requireDirectory(source)
  requireDirectory(home)
  const files = new Map(NAMES.map((name) => [name, requireFile(join(source, name))]))
  const id = payloadId(files)
  const claude = join(home, '.claude')
  const hooks = join(claude, 'hooks')
  const namespace = join(hooks, 'knowledgeislands', 'ki-agentic-harness')
  const target = join(namespace, id)
  for (const path of [claude, hooks, join(hooks, 'knowledgeislands'), namespace, target]) requireDirectory(path)

  if (check) {
    const ok = validPayload(target, id, files) && currentSnapshot(namespace, files) && activePayloadId(namespace) === id
    console.log(ok ? `PASS hook payload ${id} is active` : `FAIL hook payload ${id} is absent, inactive, or drifted`)
    return ok ? 0 : 1
  }
  if (dryRun) {
    console.log(`would install hook payload ${id} from ${source} under ${namespace}`)
    return 0
  }
  mkdirOwned(claude)
  mkdirOwned(hooks)
  mkdirOwned(join(hooks, 'knowledgeislands'))
  mkdirOwned(namespace)
  requirePrivateDirectory(namespace)
  withInstallationLock(namespace, () => {
    const active = join(namespace, 'active.json')
    if (lstat(active) && !publishedPayload(namespace)) fail(`${active} exists but is not a valid installer-owned active pointer`)
    writePayload(namespace, target, id, ref, files)
    publishCurrent(namespace, files)
    publishActive(namespace, id)
  })
  console.log(`installed durable Claude hook payload: ${id}`)
  return 0
}

try {
  process.exit(main())
} catch (error) {
  console.error(`error: ${(error as Error).message}`)
  process.exit(1)
}
