#!/usr/bin/env bun

/**
 * Purpose: Generate the KI Cowork marketplace projection from this harness.
 * Run: bun scripts/build-plugin.ts --help
 * Boundary: Replaces only generated paths in a separate output repository after target
 * and symlink validation; it never writes the source harness or unrelated scaffold.
 *
 * This is intentionally a public command rather than a rubric action: its target is a
 * separate repository, outside the rubric host's repository/user-home transaction.
 */

import { createHash, randomUUID } from 'node:crypto'
import type { Stats } from 'node:fs'
import {
  cpSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SELF = fileURLToPath(import.meta.url)
const HARNESS_ROOT = resolve(dirname(SELF), '..', '..', '..', '..')
const SKILLS_DIR = join(HARNESS_ROOT, 'skills')
const AGENTS_DIR = join(HARNESS_ROOT, 'subagents', 'governance')
const DEFAULT_OUTPUT = join(homedir(), 'kis', 'knowledgeislands', 'ki-repo-plugins')
const OWNER = 'Knowledge Islands'
const NAME = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
const TOKEN = /^[a-zA-Z0-9-]+$/

const HELP = `Usage: bun scripts/build-plugin.ts [out-dir] [options]

Generate the KI Cowork plugin marketplace projection in a separate repository.

Options:
  --marketplace <name>  Marketplace name (default: ki-repo-plugins).
  --plugin <name>       Plugin name and directory (default: knowledge-islands).
  --dry-run             Print the complete projection without changing files.
  --json                Emit the complete pre-write manifest as JSON.
  -h, --help            Show this help and exit.
`

export type BuildPluginOptions = {
  outDir: string
  marketplace: string
  plugin: string
  dryRun: boolean
  json: boolean
  help: boolean
}

type ProjectedSource = {
  name: string
  source: string
  target: string
  sha256: string
}

export type BuildPluginManifest = {
  schemaVersion: 1
  outDir: string
  generatedPaths: {
    marketplace: string
    plugin: string
  }
  marketplaceManifest: {
    name: string
    owner: { name: string }
    plugins: { name: string; source: string; description: string }[]
  }
  pluginManifest: {
    name: string
    version: string
    description: string
    author: { name: string }
  }
  outputRoot: {
    path: string
    device: number
    inode: number
  }
  skills: ProjectedSource[]
  agents: ProjectedSource[]
}

export type BuildPluginTestHooks = {
  token?: string
  output?: (body: string) => void
  afterFinalRename?: (index: number, path: string) => void
  beforeFinalVerification?: (manifest: BuildPluginManifest) => void
}

type DirectoryState = { kind: 'absent' } | { kind: 'directory'; device: number; inode: number; sha256: string }

type OutputRoot = BuildPluginManifest['outputRoot']

type RunPath = { path: string; state: Extract<DirectoryState, { kind: 'directory' }> }

type PublicationPaths = {
  stageMarketplace: string
  stagePlugin: string
  backupMarketplace: string
  backupPlugin: string
}

const valueAfter = (argv: readonly string[], index: number, option: string): string => {
  const value = argv[index + 1]
  if (!value || value.startsWith('-')) throw new Error(`${option} requires a value`)
  return value
}

export const parseBuildPluginArgs = (argv: readonly string[]): BuildPluginOptions => {
  let outDir: string | undefined
  let marketplace = 'ki-repo-plugins'
  let plugin = 'knowledge-islands'
  let dryRun = false
  let json = false
  let help = false
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index] as string
    if (argument === '-h' || argument === '--help') help = true
    else if (argument === '--dry-run') dryRun = true
    else if (argument === '--json') json = true
    else if (argument === '--marketplace') marketplace = valueAfter(argv, index++, argument)
    else if (argument === '--plugin') plugin = valueAfter(argv, index++, argument)
    else if (argument.startsWith('-')) throw new Error(`unknown option: ${argument}`)
    else if (outDir) throw new Error(`unexpected positional argument: ${argument}`)
    else outDir = argument
  }
  if (!NAME.test(marketplace)) throw new Error(`invalid marketplace name: ${marketplace}`)
  if (!NAME.test(plugin)) throw new Error(`invalid plugin name: ${plugin}`)
  return { outDir: resolve(outDir ?? DEFAULT_OUTPUT), marketplace, plugin, dryRun, json, help }
}

const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error))

const lstatOrAbsent = (path: string): Stats | undefined => {
  try {
    return lstatSync(path)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
}

const sortedEntries = (path: string): string[] => readdirSync(path).sort((left, right) => left.localeCompare(right))

const digestPath = (path: string): string => {
  const hash = createHash('sha256')
  const visit = (current: string, relativePath: string): void => {
    const metadata = lstatSync(current)
    if (metadata.isDirectory()) {
      hash.update(`directory\0${relativePath}\0`)
      for (const entry of sortedEntries(current)) visit(join(current, entry), join(relativePath, entry))
      return
    }
    if (metadata.isFile()) {
      hash.update(`file\0${relativePath}\0`)
      hash.update(readFileSync(current))
      hash.update('\0')
      return
    }
    if (metadata.isSymbolicLink()) {
      hash.update(`symlink\0${relativePath}\0${readlinkSync(current)}\0`)
      return
    }
    throw new Error(`unsupported filesystem entry in generated tree: ${current}`)
  }
  visit(path, '.')
  return hash.digest('hex')
}

const directoryState = (path: string, label = 'generated path'): DirectoryState => {
  const metadata = lstatOrAbsent(path)
  if (!metadata) return { kind: 'absent' }
  if (metadata.isSymbolicLink()) throw new Error(`refusing ${label} symlink: ${path}`)
  if (!metadata.isDirectory()) throw new Error(`refusing ${label} that is not a directory: ${path}`)
  return { kind: 'directory', device: metadata.dev, inode: metadata.ino, sha256: digestPath(path) }
}

const assertState = (path: string, expected: DirectoryState, label: string): void => {
  const actual = directoryState(path, label)
  if (expected.kind === 'absent') {
    if (actual.kind !== 'absent') throw new Error(`${label} changed after preflight (expected absent): ${path}`)
    return
  }
  if (
    actual.kind !== 'directory' ||
    actual.device !== expected.device ||
    actual.inode !== expected.inode ||
    actual.sha256 !== expected.sha256
  ) {
    throw new Error(`${label} changed after preflight: ${path}`)
  }
}

const assertDirectoryIdentity = (
  path: string,
  expected: Extract<DirectoryState, { kind: 'directory' }>,
  label: string
): void => {
  const metadata = lstatOrAbsent(path)
  if (!metadata) throw new Error(`${label} is absent: ${path}`)
  if (metadata.isSymbolicLink() || !metadata.isDirectory())
    throw new Error(`${label} is not the run-owned directory: ${path}`)
  if (metadata.dev !== expected.device || metadata.ino !== expected.inode)
    throw new Error(`${label} identity changed: ${path}`)
}

const assertOutputRoot = (root: OutputRoot): void => {
  const metadata = lstatOrAbsent(root.path)
  if (!metadata || metadata.isSymbolicLink() || !metadata.isDirectory())
    throw new Error(`output root identity changed or is no longer a physical directory: ${root.path}`)
  if (metadata.dev !== root.device || metadata.ino !== root.inode || realpathSync(root.path) !== root.path)
    throw new Error(`output root identity changed: ${root.path}`)
}

const assertSafeOutput = (outDir: string, plugin: string): OutputRoot => {
  const requestedRoot = resolve(outDir)
  const rootMetadata = lstatOrAbsent(requestedRoot)
  if (!rootMetadata) throw new Error(`output root must already exist as a physical directory: ${requestedRoot}`)
  if (rootMetadata.isSymbolicLink() || !rootMetadata.isDirectory())
    throw new Error(`output root must be a physical directory: ${requestedRoot}`)
  const root = realpathSync(requestedRoot)
  const protectedPaths = new Set([realpathSync('/'), realpathSync(homedir()), realpathSync(HARNESS_ROOT)])
  if (protectedPaths.has(root)) throw new Error(`refusing broad output directory: ${root}`)
  const fromHarness = relative(realpathSync(HARNESS_ROOT), root)
  if (!fromHarness.startsWith('..') && !isAbsolute(fromHarness))
    throw new Error(`refusing output inside the source harness: ${root}`)
  const pluginRoot = resolve(root, plugin)
  const fromRoot = relative(root, pluginRoot)
  if (fromRoot.startsWith('..') || isAbsolute(fromRoot))
    throw new Error(`plugin path escapes output directory: ${pluginRoot}`)
  directoryState(join(root, '.claude-plugin'))
  directoryState(pluginRoot)
  const physicalMetadata = lstatSync(root)
  const outputRoot = { path: root, device: physicalMetadata.dev, inode: physicalMetadata.ino }
  assertOutputRoot(outputRoot)
  return outputRoot
}

const supportsClaude = (skillPath: string): boolean => {
  const body = readFileSync(join(skillPath, 'SKILL.md'), 'utf8')
  const runtimes = body.match(/^ki-supported-runtimes:\s*\[([^\]]*)\]\s*$/m)?.[1]
  return runtimes === undefined || runtimes.split(',').some((runtime) => runtime.trim() === 'claude-code')
}

export const createBuildPluginManifest = ({ outDir, marketplace, plugin }: BuildPluginOptions): BuildPluginManifest => {
  const outputRoot = assertSafeOutput(outDir, plugin)
  const root = outputRoot.path
  const pkg = JSON.parse(readFileSync(join(HARNESS_ROOT, 'package.json'), 'utf8')) as { version?: string }
  const version = pkg.version ?? '0.0.0'
  const description =
    'Knowledge Islands governance skills and agents — the ki-* house standards (AUDIT / CONFORM / REFRESH) and the governance agents, generated from the ki-agentic-harness. Skills and agents only; host-local MCP servers are deferred (they do not run in Cowork’s sandbox).'
  const skillSources = readdirSync(SKILLS_DIR)
    .flatMap((group) => {
      const groupPath = join(SKILLS_DIR, group)
      if (!statSync(groupPath).isDirectory()) return []
      return readdirSync(groupPath)
        .map((name) => ({ name, source: join(groupPath, name) }))
        .filter(
          ({ source }) =>
            statSync(source).isDirectory() &&
            lstatOrAbsent(join(source, 'SKILL.md')) !== undefined &&
            supportsClaude(source)
        )
    })
    .sort(({ name: left }, { name: right }) => left.localeCompare(right))
  for (let index = 1; index < skillSources.length; index++) {
    if (skillSources[index - 1]?.name === skillSources[index]?.name)
      throw new Error(`duplicate projected skill name: ${skillSources[index]?.name}`)
  }
  const agentSources = lstatOrAbsent(AGENTS_DIR)
    ? readdirSync(AGENTS_DIR)
        .filter((file) => file.endsWith('.md'))
        .sort()
        .map((name) => ({ name, source: join(AGENTS_DIR, name) }))
    : []
  const pluginRoot = join(root, plugin)
  return {
    schemaVersion: 1,
    outDir: root,
    generatedPaths: { marketplace: join(root, '.claude-plugin'), plugin: pluginRoot },
    marketplaceManifest: {
      name: marketplace,
      owner: { name: OWNER },
      plugins: [{ name: plugin, source: `./${plugin}`, description }]
    },
    pluginManifest: { name: plugin, version, description, author: { name: OWNER } },
    outputRoot,
    skills: skillSources.map(({ name, source }) => ({
      name,
      source,
      target: join(pluginRoot, 'skills', name),
      sha256: digestPath(source)
    })),
    agents: agentSources.map(({ name, source }) => ({
      name,
      source,
      target: join(pluginRoot, 'agents', name),
      sha256: digestPath(source)
    }))
  }
}

const expectedJson = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`

const assertEntries = (path: string, expected: readonly string[], label: string): void => {
  const actual = sortedEntries(path)
  const sortedExpected = [...expected].sort((left, right) => left.localeCompare(right))
  if (JSON.stringify(actual) !== JSON.stringify(sortedExpected))
    throw new Error(
      `${label} entries differ: expected ${sortedExpected.join(', ') || '(none)'}, found ${actual.join(', ') || '(none)'}`
    )
}

const assertPhysicalDirectory = (path: string, label: string): void => {
  const metadata = lstatOrAbsent(path)
  if (!metadata || metadata.isSymbolicLink() || !metadata.isDirectory())
    throw new Error(`${label} is missing or not a physical directory: ${path}`)
}

const assertFile = (path: string, expected: string, label: string): void => {
  const metadata = lstatOrAbsent(path)
  if (!metadata || metadata.isSymbolicLink() || !metadata.isFile())
    throw new Error(`${label} is missing or not a physical file: ${path}`)
  if (readFileSync(path, 'utf8') !== expected) throw new Error(`${label} differs from the pre-write manifest: ${path}`)
}

const verifyProjection = (
  manifest: BuildPluginManifest,
  marketplaceRoot: string,
  pluginRoot: string,
  label: string
): void => {
  directoryState(marketplaceRoot, `${label} marketplace path`)
  directoryState(pluginRoot, `${label} plugin path`)
  assertEntries(marketplaceRoot, ['marketplace.json'], `${label} marketplace`)
  assertFile(
    join(marketplaceRoot, 'marketplace.json'),
    expectedJson(manifest.marketplaceManifest),
    `${label} marketplace manifest`
  )
  assertEntries(pluginRoot, ['.claude-plugin', 'agents', 'skills'], `${label} plugin`)
  assertPhysicalDirectory(join(pluginRoot, '.claude-plugin'), `${label} plugin metadata directory`)
  assertPhysicalDirectory(join(pluginRoot, 'skills'), `${label} skills directory`)
  assertPhysicalDirectory(join(pluginRoot, 'agents'), `${label} agents directory`)
  assertEntries(join(pluginRoot, '.claude-plugin'), ['plugin.json'], `${label} plugin metadata`)
  assertFile(
    join(pluginRoot, '.claude-plugin', 'plugin.json'),
    expectedJson(manifest.pluginManifest),
    `${label} plugin manifest`
  )
  assertEntries(
    join(pluginRoot, 'skills'),
    manifest.skills.map(({ name }) => name),
    `${label} skills`
  )
  assertEntries(
    join(pluginRoot, 'agents'),
    manifest.agents.map(({ name }) => name),
    `${label} agents`
  )
  for (const source of manifest.skills) {
    const target = join(pluginRoot, 'skills', source.name)
    if (digestPath(target) !== source.sha256) throw new Error(`${label} projected skill differs: ${source.name}`)
  }
  for (const source of manifest.agents) {
    const target = join(pluginRoot, 'agents', source.name)
    if (digestPath(target) !== source.sha256) throw new Error(`${label} projected agent differs: ${source.name}`)
  }
  const pluginEntry = manifest.marketplaceManifest.plugins[0]
  if (
    !pluginEntry ||
    pluginEntry.name !== manifest.pluginManifest.name ||
    pluginEntry.source !== `./${basename(manifest.generatedPaths.plugin)}` ||
    manifest.generatedPaths.marketplace !== join(manifest.outDir, '.claude-plugin') ||
    manifest.generatedPaths.plugin !== join(manifest.outDir, manifest.pluginManifest.name)
  ) {
    throw new Error(`${label} marketplace-to-plugin relationship differs from the pre-write manifest`)
  }
}

/**
 * Node exposes these operations only through pathnames, not *at syscalls bound to a
 * pinned directory descriptor. Revalidating immediately before every mutation and
 * after every callback closes all cooperative/test-hook swaps; a fully hostile process
 * can still race the validation-to-syscall gap and is outside this command's boundary.
 */
const mutateAtOutputRoot = <Result>(root: OutputRoot, mutation: () => Result): Result => {
  assertOutputRoot(root)
  return mutation()
}

const writeProjection = (manifest: BuildPluginManifest, marketplaceRoot: string, pluginRoot: string): void => {
  const root = manifest.outputRoot
  mutateAtOutputRoot(root, () => mkdirSync(join(pluginRoot, '.claude-plugin')))
  mutateAtOutputRoot(root, () => mkdirSync(join(pluginRoot, 'skills')))
  mutateAtOutputRoot(root, () => mkdirSync(join(pluginRoot, 'agents')))
  mutateAtOutputRoot(root, () =>
    writeFileSync(join(marketplaceRoot, 'marketplace.json'), expectedJson(manifest.marketplaceManifest))
  )
  mutateAtOutputRoot(root, () =>
    writeFileSync(join(pluginRoot, '.claude-plugin', 'plugin.json'), expectedJson(manifest.pluginManifest))
  )
  for (const source of manifest.skills)
    mutateAtOutputRoot(root, () =>
      cpSync(source.source, join(pluginRoot, 'skills', source.name), { recursive: true, verbatimSymlinks: true })
    )
  for (const source of manifest.agents)
    mutateAtOutputRoot(root, () =>
      cpSync(source.source, join(pluginRoot, 'agents', source.name), { verbatimSymlinks: true })
    )
}

const publicationPaths = (manifest: BuildPluginManifest, token: string): PublicationPaths => {
  if (!TOKEN.test(token)) throw new Error(`invalid publication token: ${token}`)
  const prefix = `.${manifest.pluginManifest.name}.build-${token}`
  return {
    stageMarketplace: join(manifest.outDir, `${prefix}.stage-marketplace`),
    stagePlugin: join(manifest.outDir, `${prefix}.stage-plugin`),
    backupMarketplace: join(manifest.outDir, `${prefix}.backup-marketplace`),
    backupPlugin: join(manifest.outDir, `${prefix}.backup-plugin`)
  }
}

const assertRunPathsAbsent = (manifest: BuildPluginManifest, paths: PublicationPaths): void => {
  for (const path of Object.values(paths)) {
    if (dirname(path) !== manifest.outDir)
      throw new Error(`publication path is not a direct child of output root: ${path}`)
    const state = directoryState(path, 'token-scoped publication path')
    if (state.kind !== 'absent') throw new Error(`token-scoped publication path already exists: ${path}`)
  }
}

const removeOwnedPath = (root: OutputRoot, owned: RunPath, label: string): void => {
  assertOutputRoot(root)
  if (!lstatOrAbsent(owned.path)) return
  assertDirectoryIdentity(owned.path, owned.state, label)
  mutateAtOutputRoot(root, () => rmSync(owned.path, { recursive: true, force: false }))
}

const cleanupOwnedPaths = (root: OutputRoot, ownedPaths: readonly RunPath[]): string[] => {
  const failures: string[] = []
  for (const owned of [...ownedPaths].reverse()) {
    try {
      removeOwnedPath(root, owned, 'run-owned cleanup path')
    } catch (error) {
      failures.push(`${owned.path}: ${errorMessage(error)}`)
    }
  }
  return failures
}

const invokeAndRevalidateRoot = (root: OutputRoot, callback: () => void, label: string): void => {
  assertOutputRoot(root)
  let callbackError: unknown
  try {
    callback()
  } catch (error) {
    callbackError = error
  }
  try {
    assertOutputRoot(root)
  } catch (rootError) {
    if (callbackError) throw new Error(`${label} failed: ${errorMessage(callbackError)}; ${errorMessage(rootError)}`)
    throw rootError
  }
  if (callbackError) throw callbackError
}

const recoveryArtifactReport = (root: OutputRoot, paths: PublicationPaths): string => {
  const artifactBasenames = Object.values(paths)
    .map((path) => basename(path))
    .join(', ')
  try {
    assertOutputRoot(root)
    return `possible recovery artifacts remain as direct children of the pinned output root ${root.path}; token-scoped basenames: ${artifactBasenames}`
  } catch {
    return (
      `pinned output root pathname ${root.path} no longer resolves to its original directory; ` +
      `run-owned paths were retained rather than accessed through that pathname; token-scoped artifact basenames: ${artifactBasenames}`
    )
  }
}

const presentManifest = (
  manifest: BuildPluginManifest,
  options: BuildPluginOptions,
  output: (body: string) => void
): void => {
  if (options.json) {
    output(`${JSON.stringify(manifest, null, 2)}\n`)
    return
  }
  output(
    `ki-binding-claude — build-plugin${options.dryRun ? ' dry-run' : ''}\n` +
      `  out:         ${manifest.outDir}\n` +
      `  marketplace: ${manifest.marketplaceManifest.name}\n` +
      `  plugin:      ${manifest.pluginManifest.name}@${manifest.marketplaceManifest.name} (v${manifest.pluginManifest.version})\n` +
      `  generated:   ${manifest.generatedPaths.marketplace}\n` +
      `               ${manifest.generatedPaths.plugin}\n` +
      `  skills (${manifest.skills.length}): ${manifest.skills.map(({ name }) => name).join(', ') || '(none)'}\n` +
      `  agents (${manifest.agents.length}): ${manifest.agents.map(({ name }) => name).join(', ') || '(none)'}\n` +
      (options.dryRun ? `  dry-run — no files changed\n` : '')
  )
}

export const runBuildPlugin = (options: BuildPluginOptions, hooks: BuildPluginTestHooks = {}): BuildPluginManifest => {
  const manifest = createBuildPluginManifest(options)
  const root = manifest.outputRoot
  const initialStates = [
    directoryState(manifest.generatedPaths.marketplace),
    directoryState(manifest.generatedPaths.plugin)
  ] as const
  const output = hooks.output ?? ((body: string) => process.stdout.write(body))
  invokeAndRevalidateRoot(root, () => presentManifest(manifest, options, output), 'output callback')
  if (options.dryRun) return manifest

  const paths = publicationPaths(manifest, hooks.token ?? randomUUID())
  assertRunPathsAbsent(manifest, paths)
  const stagePaths = [paths.stageMarketplace, paths.stagePlugin] as const
  const backupPaths = [paths.backupMarketplace, paths.backupPlugin] as const
  const finalPaths = [manifest.generatedPaths.marketplace, manifest.generatedPaths.plugin] as const
  const stagedOwned: RunPath[] = []

  try {
    mutateAtOutputRoot(root, () => mkdirSync(stagePaths[0]))
    stagedOwned.push({
      path: stagePaths[0],
      state: directoryState(stagePaths[0], 'staged marketplace path') as RunPath['state']
    })
    mutateAtOutputRoot(root, () => mkdirSync(stagePaths[1]))
    stagedOwned.push({
      path: stagePaths[1],
      state: directoryState(stagePaths[1], 'staged plugin path') as RunPath['state']
    })
    writeProjection(manifest, stagePaths[0], stagePaths[1])
    stagedOwned[0] = {
      path: stagePaths[0],
      state: directoryState(stagePaths[0], 'staged marketplace path') as RunPath['state']
    }
    stagedOwned[1] = {
      path: stagePaths[1],
      state: directoryState(stagePaths[1], 'staged plugin path') as RunPath['state']
    }
    verifyProjection(manifest, stagePaths[0], stagePaths[1], 'staged projection')
  } catch (error) {
    const cleanupFailures = cleanupOwnedPaths(root, stagedOwned)
    throw new Error(
      `staging failed: ${errorMessage(error)}${cleanupFailures.length > 0 ? `; staging cleanup failed: ${cleanupFailures.join('; ')}` : ''}`
    )
  }

  try {
    assertOutputRoot(root)
    for (let index = 0; index < finalPaths.length; index++)
      assertState(finalPaths[index], initialStates[index], 'generated path')
  } catch (error) {
    const cleanupFailures = cleanupOwnedPaths(root, stagedOwned)
    throw new Error(
      `publication preflight failed: ${errorMessage(error)}${cleanupFailures.length > 0 ? `; staging cleanup failed: ${cleanupFailures.join('; ')}` : ''}`
    )
  }

  const captured = [false, false]
  const publishedOwned: RunPath[] = []
  try {
    for (let index = 0; index < finalPaths.length; index++) {
      if (initialStates[index].kind === 'directory') {
        mutateAtOutputRoot(root, () => renameSync(finalPaths[index], backupPaths[index]))
        captured[index] = true
        assertState(backupPaths[index], initialStates[index], 'captured backup')
      }
    }
    for (let index = 0; index < finalPaths.length; index++) {
      const stage = stagedOwned[index]
      if (!stage) throw new Error(`missing staged path identity for ${finalPaths[index]}`)
      mutateAtOutputRoot(root, () => renameSync(stagePaths[index], finalPaths[index]))
      publishedOwned.push({ path: finalPaths[index], state: stage.state })
      const afterFinalRename = hooks.afterFinalRename
      if (afterFinalRename)
        invokeAndRevalidateRoot(root, () => afterFinalRename(index, finalPaths[index]), 'after-final-rename hook')
    }
    const beforeFinalVerification = hooks.beforeFinalVerification
    if (beforeFinalVerification)
      invokeAndRevalidateRoot(root, () => beforeFinalVerification(manifest), 'before-final-verification hook')
    verifyProjection(manifest, finalPaths[0], finalPaths[1], 'published projection')
    for (let index = 0; index < finalPaths.length; index++) {
      const stage = stagedOwned[index]
      if (!stage) throw new Error(`missing staged path identity for ${finalPaths[index]}`)
      assertState(finalPaths[index], stage.state, 'published projection root')
    }
  } catch (primaryError) {
    const restorationFailures: string[] = []
    for (const published of [...publishedOwned].reverse()) {
      try {
        removeOwnedPath(root, published, 'published path')
      } catch (error) {
        restorationFailures.push(`remove ${published.path}: ${errorMessage(error)}`)
      }
    }
    for (let index = finalPaths.length - 1; index >= 0; index--) {
      if (!captured[index]) continue
      try {
        assertOutputRoot(root)
        assertState(backupPaths[index], initialStates[index], 'captured backup')
        if (lstatOrAbsent(finalPaths[index])) throw new Error(`restore destination is occupied: ${finalPaths[index]}`)
        mutateAtOutputRoot(root, () => renameSync(backupPaths[index], finalPaths[index]))
      } catch (error) {
        restorationFailures.push(`restore ${finalPaths[index]}: ${errorMessage(error)}`)
      }
    }
    for (let index = 0; index < finalPaths.length; index++) {
      try {
        assertOutputRoot(root)
        assertState(finalPaths[index], initialStates[index], 'restored generated path')
      } catch (error) {
        restorationFailures.push(`verify ${finalPaths[index]}: ${errorMessage(error)}`)
      }
    }
    if (restorationFailures.length === 0) restorationFailures.push(...cleanupOwnedPaths(root, stagedOwned))
    if (restorationFailures.length > 0) {
      throw new Error(
        `publication failed: ${errorMessage(primaryError)}; restoration failed: ${restorationFailures.join('; ')}; ${recoveryArtifactReport(root, paths)}`
      )
    }
    throw new Error(
      `publication failed: ${errorMessage(primaryError)}; exact pre-run generated paths restored and verified`
    )
  }

  const backupCleanupFailures: string[] = []
  for (let index = 0; index < backupPaths.length; index++) {
    if (!captured[index]) continue
    try {
      assertOutputRoot(root)
      assertState(backupPaths[index], initialStates[index], 'verified backup')
      mutateAtOutputRoot(root, () => rmSync(backupPaths[index], { recursive: true, force: false }))
    } catch (error) {
      backupCleanupFailures.push(`${backupPaths[index]}: ${errorMessage(error)}`)
    }
  }
  if (backupCleanupFailures.length > 0)
    throw new Error(
      `publication succeeded and verified, but backup cleanup failed: ${backupCleanupFailures.join('; ')}; ` +
        `the generated pair is current and unrelated scaffold was not changed`
    )
  return manifest
}

export const main = (argv = process.argv.slice(2)): number => {
  try {
    const options = parseBuildPluginArgs(argv)
    if (options.help) {
      process.stdout.write(HELP)
      return 0
    }
    runBuildPlugin(options)
    return 0
  } catch (error) {
    process.stderr.write(`build-plugin: ${errorMessage(error)}\n`)
    return 1
  }
}

if (import.meta.main) process.exitCode = main()
