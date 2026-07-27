#!/usr/bin/env bun
/**
 * Generate the KI Cowork marketplace projection from this harness.
 *
 * This is intentionally a public command rather than a rubric action: its target is a
 * separate repository, outside the rubric host's repository/user-home transaction.
 */

import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SELF = fileURLToPath(import.meta.url)
const HARNESS_ROOT = resolve(dirname(SELF), '..', '..', '..', '..')
const SKILLS_DIR = join(HARNESS_ROOT, 'skills')
const AGENTS_DIR = join(HARNESS_ROOT, 'subagents', 'governance')
const DEFAULT_OUTPUT = join(homedir(), 'kis', 'knowledgeislands', 'ki-plugins')
const OWNER = 'Knowledge Islands'
const NAME = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

const HELP = `Usage: bun scripts/build-plugin.ts [out-dir] [options]

Generate the KI Cowork plugin marketplace projection in a separate repository.

Options:
  --marketplace <name>  Marketplace name (default: ki-plugins).
  --plugin <name>       Plugin name and directory (default: knowledge-islands).
  --json                Emit the generation summary as JSON.
  -h, --help            Show this help and exit.
`

type Options = {
  outDir: string
  marketplace: string
  plugin: string
  json: boolean
  help: boolean
}

const valueAfter = (argv: readonly string[], index: number, option: string): string => {
  const value = argv[index + 1]
  if (!value || value.startsWith('-')) throw new Error(`${option} requires a value`)
  return value
}

export const parseBuildPluginArgs = (argv: readonly string[]): Options => {
  let outDir: string | undefined
  let marketplace = 'ki-plugins'
  let plugin = 'knowledge-islands'
  let json = false
  let help = false
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index] as string
    if (argument === '-h' || argument === '--help') help = true
    else if (argument === '--json') json = true
    else if (argument === '--marketplace') marketplace = valueAfter(argv, index++, argument)
    else if (argument === '--plugin') plugin = valueAfter(argv, index++, argument)
    else if (argument.startsWith('-')) throw new Error(`unknown option: ${argument}`)
    else if (outDir) throw new Error(`unexpected positional argument: ${argument}`)
    else outDir = argument
  }
  if (!NAME.test(marketplace)) throw new Error(`invalid marketplace name: ${marketplace}`)
  if (!NAME.test(plugin)) throw new Error(`invalid plugin name: ${plugin}`)
  return { outDir: resolve(outDir ?? DEFAULT_OUTPUT), marketplace, plugin, json, help }
}

const assertSafeOutput = (outDir: string, plugin: string): void => {
  const root = resolve(outDir)
  const protectedPaths = new Set([resolve('/'), resolve(homedir()), HARNESS_ROOT])
  if (protectedPaths.has(root)) throw new Error(`refusing broad output directory: ${root}`)
  const fromHarness = relative(HARNESS_ROOT, root)
  if (!fromHarness.startsWith('..') && !isAbsolute(fromHarness)) throw new Error(`refusing output inside the source harness: ${root}`)
  const pluginRoot = resolve(root, plugin)
  if (relative(root, pluginRoot).startsWith('..') || isAbsolute(relative(root, pluginRoot)))
    throw new Error(`plugin path escapes output directory: ${pluginRoot}`)
  for (const path of [join(root, '.claude-plugin'), pluginRoot]) {
    if (existsSync(path) && lstatSync(path).isSymbolicLink()) throw new Error(`refusing generated symlink target: ${path}`)
  }
}

const resetGeneratedPath = (path: string): void => {
  if (!existsSync(path)) return
  const metadata = lstatSync(path)
  if (metadata.isSymbolicLink()) throw new Error(`refusing generated symlink target: ${path}`)
  rmSync(path, { recursive: metadata.isDirectory(), force: false })
}

export const runBuildPlugin = ({ outDir, marketplace, plugin, json }: Options): void => {
  assertSafeOutput(outDir, plugin)
  const pkg = JSON.parse(readFileSync(join(HARNESS_ROOT, 'package.json'), 'utf8')) as { version?: string }
  const version = pkg.version ?? '0.0.0'
  const description =
    'Knowledge Islands governance skills and agents — the ki-* house standards (AUDIT / CONFORM / REFRESH) and the governance agents, generated from the ki-agentic-harness. Skills and agents only; host-local MCP servers are deferred (they do not run in Cowork’s sandbox).'
  const skillDirs = readdirSync(SKILLS_DIR)
    .flatMap((group) => {
      const groupPath = join(SKILLS_DIR, group)
      if (!statSync(groupPath).isDirectory()) return []
      return readdirSync(groupPath)
        .map((name) => ({ name, path: join(groupPath, name) }))
        .filter(({ path }) => statSync(path).isDirectory() && existsSync(join(path, 'SKILL.md')))
    })
    .sort(({ name: left }, { name: right }) => left.localeCompare(right))
  const agentFiles = existsSync(AGENTS_DIR)
    ? readdirSync(AGENTS_DIR)
        .filter((file) => file.endsWith('.md'))
        .sort()
    : []
  const pluginRoot = join(outDir, plugin)
  resetGeneratedPath(join(outDir, '.claude-plugin'))
  resetGeneratedPath(pluginRoot)
  mkdirSync(join(outDir, '.claude-plugin'), { recursive: true })
  mkdirSync(join(pluginRoot, '.claude-plugin'), { recursive: true })
  mkdirSync(join(pluginRoot, 'skills'), { recursive: true })
  mkdirSync(join(pluginRoot, 'agents'), { recursive: true })
  const marketplaceManifest = {
    name: marketplace,
    owner: { name: OWNER },
    plugins: [{ name: plugin, source: `./${plugin}`, description }]
  }
  writeFileSync(join(outDir, '.claude-plugin', 'marketplace.json'), `${JSON.stringify(marketplaceManifest, null, 2)}\n`)
  const pluginManifest = { name: plugin, version, description, author: { name: OWNER } }
  writeFileSync(join(pluginRoot, '.claude-plugin', 'plugin.json'), `${JSON.stringify(pluginManifest, null, 2)}\n`)
  for (const { name, path } of skillDirs) cpSync(path, join(pluginRoot, 'skills', name), { recursive: true })
  for (const file of agentFiles) cpSync(join(AGENTS_DIR, file), join(pluginRoot, 'agents', file))
  const summary = { outDir, marketplace, plugin, version, skills: skillDirs.length, agents: agentFiles.length }
  if (json) {
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)
    return
  }
  process.stdout.write(
    `ki-binding — build-plugin\n` +
      `  out:         ${outDir}\n` +
      `  marketplace: ${marketplace}\n` +
      `  plugin:      ${plugin}@${marketplace} (v${version})\n` +
      `  skills:      ${skillDirs.length}\n` +
      `  agents:      ${agentFiles.length}\n` +
      `  generated — repo scaffold left untouched\n`
  )
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
    process.stderr.write(`build-plugin: ${error instanceof Error ? error.message : String(error)}\n`)
    return 1
  }
}

if (import.meta.main) process.exitCode = main()
