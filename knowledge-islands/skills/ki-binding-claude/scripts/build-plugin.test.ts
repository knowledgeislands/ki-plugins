import { afterEach, describe, expect, test } from 'bun:test'
import type { Stats } from 'node:fs'
import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  type BuildPluginOptions,
  type BuildPluginTestHooks,
  parseBuildPluginArgs,
  runBuildPlugin
} from './build-plugin.ts'

const temporaryDirectories: string[] = []
const noOutput = { output: () => {} }

const lstatOrAbsent = (path: string): Stats | undefined => {
  try {
    return lstatSync(path)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
}

const expectPathAbsent = (path: string): void => expect(lstatOrAbsent(path)).toBeUndefined()

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

const temporaryOutput = (): string => {
  const outDir = realpathSync(mkdtempSync(join(tmpdir(), 'ki-binding-plugin-')))
  temporaryDirectories.push(outDir)
  return outDir
}

const optionsFor = (outDir: string, overrides: Partial<BuildPluginOptions> = {}): BuildPluginOptions => ({
  outDir,
  marketplace: 'test-marketplace',
  plugin: 'test-plugin',
  dryRun: false,
  json: true,
  help: false,
  ...overrides
})

const createPreviousPair = (outDir: string): void => {
  mkdirSync(join(outDir, '.claude-plugin'))
  writeFileSync(join(outDir, '.claude-plugin', 'previous-marketplace.txt'), 'previous marketplace\n')
  mkdirSync(join(outDir, 'test-plugin'))
  writeFileSync(join(outDir, 'test-plugin', 'previous-plugin.txt'), 'previous plugin\n')
}

const expectPreviousPair = (outDir: string): void => {
  expect(readFileSync(join(outDir, '.claude-plugin', 'previous-marketplace.txt'), 'utf8')).toBe(
    'previous marketplace\n'
  )
  expect(readFileSync(join(outDir, 'test-plugin', 'previous-plugin.txt'), 'utf8')).toBe('previous plugin\n')
  expectPathAbsent(join(outDir, '.claude-plugin', 'marketplace.json'))
  expectPathAbsent(join(outDir, 'test-plugin', '.claude-plugin', 'plugin.json'))
}

const expectNoRunArtifacts = (outDir: string): void => {
  expect(readdirSync(outDir).filter((entry) => entry.startsWith('.test-plugin.build-'))).toEqual([])
}

test('the plugin builder has strict help and argument handling', () => {
  expect(parseBuildPluginArgs(['--help']).help).toBe(true)
  expect(parseBuildPluginArgs(['--dry-run']).dryRun).toBe(true)
  expect(() => parseBuildPluginArgs(['--unknown'])).toThrow('unknown option')
  expect(() => parseBuildPluginArgs(['--marketplace'])).toThrow('requires a value')
  expect(() => parseBuildPluginArgs(['--plugin', '../escape'])).toThrow('invalid plugin name')
  expect(() => runBuildPlugin(optionsFor(import.meta.dir), noOutput)).toThrow('inside the source harness')
})

test('dry run emits the complete manifest without mutating the output root', () => {
  const outDir = temporaryOutput()
  createPreviousPair(outDir)
  const marker = join(outDir, 'README.md')
  writeFileSync(marker, 'keep\n')
  const before = readdirSync(outDir).sort()
  let output = ''

  const manifest = runBuildPlugin(optionsFor(outDir, { dryRun: true }), {
    token: 'dry-run-must-not-use-token',
    output: (body) => {
      output += body
    }
  })

  expect(JSON.parse(output)).toEqual(manifest)
  expect(manifest.generatedPaths).toEqual({
    marketplace: join(outDir, '.claude-plugin'),
    plugin: join(outDir, 'test-plugin')
  })
  expect(manifest.skills.map(({ name }) => name)).toEqual([...manifest.skills.map(({ name }) => name)].sort())
  expect(manifest.agents.map(({ name }) => name)).toEqual([...manifest.agents.map(({ name }) => name)].sort())
  expect(readdirSync(outDir).sort()).toEqual(before)
  expectPreviousPair(outDir)
  expect(readFileSync(marker, 'utf8')).toBe('keep\n')
  expectNoRunArtifacts(outDir)
})

test('successful publication replaces both generated paths and preserves repo scaffold', () => {
  const outDir = temporaryOutput()
  createPreviousPair(outDir)
  const marker = join(outDir, 'README.md')
  writeFileSync(marker, 'keep\n')

  const manifest = runBuildPlugin(optionsFor(outDir), { ...noOutput, token: 'success' })

  const marketplace = JSON.parse(readFileSync(join(outDir, '.claude-plugin', 'marketplace.json'), 'utf8')) as {
    plugins: { name: string }[]
  }
  expect(marketplace).toEqual(manifest.marketplaceManifest)
  expect(marketplace.plugins[0]?.name).toBe('test-plugin')
  expect(lstatSync(join(outDir, 'test-plugin', 'skills', 'ki-binding', 'SKILL.md')).isFile()).toBe(true)
  expect(lstatSync(join(outDir, 'test-plugin', 'skills', 'ki-binding-claude', 'SKILL.md')).isFile()).toBe(true)
  expectPathAbsent(join(outDir, 'test-plugin', 'skills', 'ki-binding-codex'))
  expectPathAbsent(join(outDir, '.claude-plugin', 'previous-marketplace.txt'))
  expectPathAbsent(join(outDir, 'test-plugin', 'previous-plugin.txt'))
  expect(readFileSync(marker, 'utf8')).toBe('keep\n')
  expectNoRunArtifacts(outDir)
})

describe.each([
  [0, 'first'],
  [1, 'second']
] as const)('failure after a final rename', (renameIndex, label) => {
  test(`restores both previous generated paths after the ${label} rename`, () => {
    const outDir = temporaryOutput()
    createPreviousPair(outDir)

    expect(() =>
      runBuildPlugin(optionsFor(outDir), {
        ...noOutput,
        token: `failure-${label}`,
        afterFinalRename: (index) => {
          if (index === renameIndex) throw new Error(`injected failure after ${label} rename`)
        }
      })
    ).toThrow(
      `publication failed: injected failure after ${label} rename; exact pre-run generated paths restored and verified`
    )

    expectPreviousPair(outDir)
    expectNoRunArtifacts(outDir)
  })
})

test('post-publish verification failure restores the exact previous pair', () => {
  const outDir = temporaryOutput()
  createPreviousPair(outDir)

  expect(() =>
    runBuildPlugin(optionsFor(outDir), {
      ...noOutput,
      token: 'verification-failure',
      beforeFinalVerification: (manifest) => {
        writeFileSync(join(manifest.generatedPaths.marketplace, 'marketplace.json'), '{}\n')
      }
    })
  ).toThrow('published projection marketplace manifest differs from the pre-write manifest')

  expectPreviousPair(outDir)
  expectNoRunArtifacts(outDir)
})

test('nested container symlink substitution fails structural verification and restores the previous pair', () => {
  const outDir = temporaryOutput()
  const linkedSkills = temporaryOutput()
  createPreviousPair(outDir)
  writeFileSync(join(linkedSkills, 'outside.txt'), 'outside\n')

  expect(() =>
    runBuildPlugin(optionsFor(outDir), {
      ...noOutput,
      token: 'nested-symlink',
      beforeFinalVerification: (manifest) => {
        const skills = join(manifest.generatedPaths.plugin, 'skills')
        rmSync(skills, { recursive: true, force: false })
        symlinkSync(linkedSkills, skills)
      }
    })
  ).toThrow('published projection skills directory is missing or not a physical directory')

  expectPreviousPair(outDir)
  expect(readFileSync(join(linkedSkills, 'outside.txt'), 'utf8')).toBe('outside\n')
  expectNoRunArtifacts(outDir)
})

test('publication handles initially absent generated paths without inventing backups', () => {
  const outDir = temporaryOutput()

  expect(() =>
    runBuildPlugin(optionsFor(outDir), {
      ...noOutput,
      token: 'initially-absent-failure',
      afterFinalRename: () => {
        throw new Error('injected absent-path failure')
      }
    })
  ).toThrow('exact pre-run generated paths restored and verified')
  expectPathAbsent(join(outDir, '.claude-plugin'))
  expectPathAbsent(join(outDir, 'test-plugin'))
  expectNoRunArtifacts(outDir)

  runBuildPlugin(optionsFor(outDir), { ...noOutput, token: 'initially-absent' })

  expect(lstatSync(join(outDir, '.claude-plugin', 'marketplace.json')).isFile()).toBe(true)
  expect(lstatSync(join(outDir, 'test-plugin', '.claude-plugin', 'plugin.json')).isFile()).toBe(true)
  expectNoRunArtifacts(outDir)
})

test('initially absent rollback detects a dangling restore destination without following or removing it', () => {
  const outDir = temporaryOutput()
  const danglingPlugin = join(outDir, 'test-plugin')

  expect(() =>
    runBuildPlugin(optionsFor(outDir), {
      ...noOutput,
      token: 'absent-dangling-rollback',
      afterFinalRename: (index) => {
        if (index !== 0) return
        symlinkSync(join(outDir, 'missing-plugin-target'), danglingPlugin)
        throw new Error('injected failure with dangling restore destination')
      }
    })
  ).toThrow('publication failed: injected failure with dangling restore destination; restoration failed:')

  expectPathAbsent(join(outDir, '.claude-plugin'))
  expect(lstatSync(danglingPlugin).isSymbolicLink()).toBe(true)
  expectPathAbsent(join(outDir, 'missing-plugin-target'))
  expect(lstatSync(join(outDir, '.test-plugin.build-absent-dangling-rollback.stage-plugin')).isDirectory()).toBe(true)
})

test('a swapped output-root pathname is rejected before any alternate-root mutation', () => {
  const outDir = temporaryOutput()
  const alternateRoot = temporaryOutput()
  const movedRoot = `${outDir}-pinned-root`
  createPreviousPair(outDir)
  writeFileSync(join(alternateRoot, 'alternate-marker.txt'), 'alternate\n')

  try {
    expect(() =>
      runBuildPlugin(optionsFor(outDir), {
        token: 'root-swap',
        output: () => {
          renameSync(outDir, movedRoot)
          symlinkSync(alternateRoot, outDir)
        }
      })
    ).toThrow('output root identity changed or is no longer a physical directory')

    expect(readdirSync(alternateRoot).sort()).toEqual(['alternate-marker.txt'])
    expectPreviousPair(movedRoot)
    expect(lstatSync(outDir).isSymbolicLink()).toBe(true)
  } finally {
    if (lstatOrAbsent(outDir)?.isSymbolicLink()) unlinkSync(outDir)
    if (lstatOrAbsent(movedRoot)?.isDirectory()) renameSync(movedRoot, outDir)
  }
})

test('a callback does not execute when its pinned root is already invalid', () => {
  const outDir = temporaryOutput()
  const alternateRoot = temporaryOutput()
  const movedRoot = `${outDir}-pinned-root`
  createPreviousPair(outDir)
  writeFileSync(join(alternateRoot, 'alternate-marker.txt'), 'alternate\n')
  let callbackRan = false
  const hooks: BuildPluginTestHooks = { token: 'invalid-before-callback' }
  Object.defineProperty(hooks, 'output', {
    get: () => {
      renameSync(outDir, movedRoot)
      symlinkSync(alternateRoot, outDir)
      return () => {
        callbackRan = true
      }
    }
  })

  try {
    expect(() => runBuildPlugin(optionsFor(outDir), hooks)).toThrow(
      'output root identity changed or is no longer a physical directory'
    )
    expect(callbackRan).toBe(false)
    expect(readdirSync(alternateRoot).sort()).toEqual(['alternate-marker.txt'])
    expectPreviousPair(movedRoot)
  } finally {
    if (lstatOrAbsent(outDir)?.isSymbolicLink()) unlinkSync(outDir)
    if (lstatOrAbsent(movedRoot)?.isDirectory()) renameSync(movedRoot, outDir)
  }
})

test('a root swap during publication refuses unsafe rollback and retains recovery artifacts off the alternate root', () => {
  const outDir = temporaryOutput()
  const alternateRoot = temporaryOutput()
  const movedRoot = `${outDir}-pinned-root`
  const token = 'root-swap-recovery'
  createPreviousPair(outDir)
  writeFileSync(join(alternateRoot, 'alternate-marker.txt'), 'alternate\n')

  try {
    let failure = ''
    try {
      runBuildPlugin(optionsFor(outDir), {
        ...noOutput,
        token,
        afterFinalRename: (index) => {
          if (index !== 0) return
          renameSync(outDir, movedRoot)
          symlinkSync(alternateRoot, outDir)
        }
      })
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error)
    }

    expect(failure).toContain('publication failed: output root identity changed or is no longer a physical directory')
    expect(failure).toContain('restoration failed:')
    expect(failure).toContain(`pinned output root pathname ${outDir} no longer resolves to its original directory`)
    expect(failure).toContain(`.test-plugin.build-${token}.backup-marketplace`)
    expect(failure).not.toContain(`recovery artifacts retained beneath ${outDir}`)
    expect(readdirSync(alternateRoot).sort()).toEqual(['alternate-marker.txt'])
    expect(lstatSync(outDir).isSymbolicLink()).toBe(true)
    expect(
      readFileSync(
        join(movedRoot, `.test-plugin.build-${token}.backup-marketplace`, 'previous-marketplace.txt'),
        'utf8'
      )
    ).toBe('previous marketplace\n')
    expect(
      readFileSync(join(movedRoot, `.test-plugin.build-${token}.backup-plugin`, 'previous-plugin.txt'), 'utf8')
    ).toBe('previous plugin\n')
    expect(lstatSync(join(movedRoot, `.test-plugin.build-${token}.stage-plugin`)).isDirectory()).toBe(true)
  } finally {
    if (lstatOrAbsent(outDir)?.isSymbolicLink()) unlinkSync(outDir)
    if (lstatOrAbsent(movedRoot)?.isDirectory()) renameSync(movedRoot, outDir)
  }
})

test('backup tampering reports primary and restoration failures and retains recovery artifacts', () => {
  const outDir = temporaryOutput()
  const token = 'restoration-failure'
  const backupPlugin = join(outDir, `.test-plugin.build-${token}.backup-plugin`)
  const stagedPlugin = join(outDir, `.test-plugin.build-${token}.stage-plugin`)
  createPreviousPair(outDir)

  const publish = () =>
    runBuildPlugin(optionsFor(outDir), {
      ...noOutput,
      token,
      afterFinalRename: (index) => {
        if (index !== 0) return
        writeFileSync(join(backupPlugin, 'previous-plugin.txt'), 'tampered backup\n')
        throw new Error('injected primary publication failure')
      }
    })
  let failure = ''
  try {
    publish()
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error)
  }
  expect(failure).toContain('publication failed: injected primary publication failure; restoration failed:')
  expect(failure).toContain('captured backup changed after preflight')

  expect(readFileSync(join(outDir, '.claude-plugin', 'previous-marketplace.txt'), 'utf8')).toBe(
    'previous marketplace\n'
  )
  expectPathAbsent(join(outDir, 'test-plugin'))
  expect(readFileSync(join(backupPlugin, 'previous-plugin.txt'), 'utf8')).toBe('tampered backup\n')
  expect(lstatSync(stagedPlugin).isDirectory()).toBe(true)
})

test('unsafe roots, generated paths, and token-scoped run paths are rejected without mutation', () => {
  const outDir = temporaryOutput()
  const linkedRoot = join(temporaryOutput(), 'linked-root')
  symlinkSync(outDir, linkedRoot)
  expect(() => runBuildPlugin(optionsFor(linkedRoot), noOutput)).toThrow('output root must be a physical directory')

  const generatedFileRoot = temporaryOutput()
  writeFileSync(join(generatedFileRoot, '.claude-plugin'), 'unsafe\n')
  expect(() => runBuildPlugin(optionsFor(generatedFileRoot), noOutput)).toThrow(
    'generated path that is not a directory'
  )
  expect(readFileSync(join(generatedFileRoot, '.claude-plugin'), 'utf8')).toBe('unsafe\n')

  const generatedLinkRoot = temporaryOutput()
  const linkedDirectory = temporaryOutput()
  symlinkSync(linkedDirectory, join(generatedLinkRoot, 'test-plugin'))
  expect(() => runBuildPlugin(optionsFor(generatedLinkRoot), noOutput)).toThrow('generated path symlink')
  expect(lstatSync(join(generatedLinkRoot, 'test-plugin')).isSymbolicLink()).toBe(true)

  const danglingMarketplaceRoot = temporaryOutput()
  const danglingMarketplace = join(danglingMarketplaceRoot, '.claude-plugin')
  symlinkSync(join(danglingMarketplaceRoot, 'missing-marketplace'), danglingMarketplace)
  expect(() => runBuildPlugin(optionsFor(danglingMarketplaceRoot), noOutput)).toThrow('generated path symlink')
  expect(lstatSync(danglingMarketplace).isSymbolicLink()).toBe(true)

  const danglingPluginRoot = temporaryOutput()
  const danglingPlugin = join(danglingPluginRoot, 'test-plugin')
  symlinkSync(join(danglingPluginRoot, 'missing-plugin'), danglingPlugin)
  expect(() => runBuildPlugin(optionsFor(danglingPluginRoot), noOutput)).toThrow('generated path symlink')
  expect(lstatSync(danglingPlugin).isSymbolicLink()).toBe(true)

  const artifactRoot = temporaryOutput()
  const artifactPath = join(artifactRoot, '.test-plugin.build-unsafe.stage-marketplace')
  symlinkSync(join(artifactRoot, 'missing-token-target'), artifactPath)
  const hooks: BuildPluginTestHooks = { ...noOutput, token: 'unsafe' }
  expect(() => runBuildPlugin(optionsFor(artifactRoot), hooks)).toThrow('token-scoped publication path symlink')
  expect(lstatSync(artifactPath).isSymbolicLink()).toBe(true)
  expect(readdirSync(artifactRoot).sort()).toEqual(['.test-plugin.build-unsafe.stage-marketplace'])
})
