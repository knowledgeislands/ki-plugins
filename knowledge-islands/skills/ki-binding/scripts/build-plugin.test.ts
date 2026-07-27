import { afterEach, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseBuildPluginArgs, runBuildPlugin } from './build-plugin.ts'

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

test('the plugin builder has strict help and argument handling', () => {
  expect(parseBuildPluginArgs(['--help']).help).toBe(true)
  expect(() => parseBuildPluginArgs(['--unknown'])).toThrow('unknown option')
  expect(() => parseBuildPluginArgs(['--marketplace'])).toThrow('requires a value')
  expect(() => parseBuildPluginArgs(['--plugin', '../escape'])).toThrow('invalid plugin name')
  expect(() =>
    runBuildPlugin({
      outDir: join(import.meta.dir, 'generated'),
      marketplace: 'test-marketplace',
      plugin: 'test-plugin',
      json: true,
      help: false
    })
  ).toThrow('inside the source harness')
})

test('the plugin builder creates the generated projection and preserves repo scaffold', () => {
  const outDir = mkdtempSync(join(tmpdir(), 'ki-binding-plugin-'))
  temporaryDirectories.push(outDir)
  const marker = join(outDir, 'README.md')
  writeFileSync(marker, 'keep\n')

  runBuildPlugin({
    outDir,
    marketplace: 'test-marketplace',
    plugin: 'test-plugin',
    json: true,
    help: false
  })

  const marketplace = JSON.parse(readFileSync(join(outDir, '.claude-plugin', 'marketplace.json'), 'utf8')) as {
    plugins: { name: string }[]
  }
  expect(marketplace.plugins[0]?.name).toBe('test-plugin')
  expect(existsSync(join(outDir, 'test-plugin', 'skills', 'ki-binding', 'SKILL.md'))).toBe(true)
  expect(readFileSync(marker, 'utf8')).toBe('keep\n')
})
