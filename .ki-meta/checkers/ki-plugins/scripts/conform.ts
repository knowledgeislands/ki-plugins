#!/usr/bin/env bun
/**
 * Mechanically conform a plugin-marketplace repo where the repair is
 * deterministic. Every invocation emits canonical checker-reporter JSONL;
 * `--dry-run` suppresses writes only.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  type CheckerFinding,
  checkerReporterExitCode,
  emitCheckerReporter,
  judgmentFindingsFromRubric
} from './vendored/ki-skills/checker-reporter.ts'

const ORG = 'Knowledge Islands'
const STD = 'references/standards.md'
const RUBRIC = 'references/rubric.md'
const LOCAL_RUBRIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'references', 'rubric.md')
const MKT_FILE = '.claude-plugin/marketplace.json'
type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'

function harnessPackageVersion(): string | null {
  try {
    const here = dirname(fileURLToPath(import.meta.url))
    const pkg = JSON.parse(readFileSync(join(here, '..', '..', '..', 'package.json'), 'utf8')) as Record<string, unknown>
    return typeof pkg.version === 'string' ? pkg.version : null
  } catch {
    return null
  }
}

const canonicalize = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`

function main(): void {
  const argv = process.argv.slice(2)
  const dryRun = argv.includes('--dry-run')
  const target = resolve(argv.find((arg) => !arg.startsWith('-')) ?? '.')
  const at = (...parts: string[]) => join(target, ...parts)
  const findings: CheckerFinding[] = []
  const add = (level: Level, code: string, message: string, ref?: string, file?: string): void => {
    findings.push({ type: 'M', level, code, message, ...(ref ? { ref } : {}), ...(file ? { file } : {}) })
  }
  const finish = (): never => {
    findings.push(...judgmentFindingsFromRubric(LOCAL_RUBRIC, RUBRIC))
    emitCheckerReporter({ mode: 'conform', concern: 'plugins', target, findings })
    process.exit(checkerReporterExitCode(findings))
  }

  const mktPath = at('.claude-plugin', 'marketplace.json')
  if (!existsSync(mktPath)) {
    add('FAIL', 'PLUG-1', 'Marketplace manifest is absent; scaffold the repo with EDUCATE.', STD, MKT_FILE)
    finish()
  }

  const mktRaw = readFileSync(mktPath, 'utf8')
  let marketplace: Record<string, unknown> = {}
  try {
    marketplace = JSON.parse(mktRaw) as Record<string, unknown>
  } catch {
    add('FAIL', 'PLUG-1', 'Marketplace manifest cannot be parsed as JSON; fix it by hand.', STD, MKT_FILE)
    finish()
  }

  let marketplaceChanged = false
  const owner = (marketplace.owner ?? {}) as Record<string, unknown>
  if (owner.name !== ORG) {
    marketplace.owner = { ...owner, name: ORG }
    marketplaceChanged = true
    add('POLISH', 'PLUG-2', `owner.name ${dryRun ? 'would be set' : 'set'} to ${JSON.stringify(ORG)}`, STD, MKT_FILE)
  } else {
    add('PASS', 'PLUG-2', `owner.name already equals ${JSON.stringify(ORG)}`, STD, MKT_FILE)
  }

  const plugins = Array.isArray(marketplace.plugins) ? (marketplace.plugins as Record<string, unknown>[]) : null
  if (!plugins) add('ADVISORY', 'PLUG-2', 'The plugins field is absent or not an array; author its membership by hand.', STD, MKT_FILE)
  else if (plugins.length !== 1)
    add('ADVISORY', 'PLUG-2', `Expected one plugin entry but found ${plugins.length}; decide the correct entry by hand.`, STD, MKT_FILE)

  let pluginName = ''
  let marketplaceDescription = ''
  if (plugins?.length === 1) {
    const plugin = plugins[0]
    if (typeof plugin.name === 'string') pluginName = plugin.name
    if (typeof plugin.description === 'string') marketplaceDescription = plugin.description
    if (!pluginName) add('ADVISORY', 'PLUG-3', 'The single plugin entry has no name; author it by hand.', STD, MKT_FILE)
    if (!marketplaceDescription) add('ADVISORY', 'PLUG-3', 'The single plugin entry has no description; author it by hand.', STD, MKT_FILE)
  }

  const canonicalMarketplace = canonicalize(marketplace)
  if (marketplaceChanged || mktRaw !== canonicalMarketplace) {
    add(
      'POLISH',
      'PLUG-4',
      `Manifest formatting ${dryRun ? 'would be normalized' : 'normalized'} to two spaces with a trailing newline.`,
      STD,
      MKT_FILE
    )
    if (!dryRun) writeFileSync(mktPath, canonicalMarketplace)
  } else {
    add('PASS', 'PLUG-4', 'Manifest already uses two-space JSON with a trailing newline.', STD, MKT_FILE)
  }

  if (!pluginName) finish()
  if (!existsSync(at(pluginName))) {
    add('ADVISORY', 'PLUG-3', 'The declared plugin source directory is absent; regenerate with ki-binding.', STD, pluginName)
    finish()
  }

  const pluginFile = `${pluginName}/.claude-plugin/plugin.json`
  const pluginPath = at(pluginName, '.claude-plugin', 'plugin.json')
  if (!existsSync(pluginPath)) {
    add('ADVISORY', 'PLUG-5', 'Plugin manifest is absent; regenerate with ki-binding.', STD, pluginFile)
    finish()
  }

  const pluginRaw = readFileSync(pluginPath, 'utf8')
  let plugin: Record<string, unknown> = {}
  try {
    plugin = JSON.parse(pluginRaw) as Record<string, unknown>
  } catch {
    add('ADVISORY', 'PLUG-5', 'Plugin manifest cannot be parsed as JSON; fix it by hand.', STD, pluginFile)
    finish()
  }

  let pluginChanged = false
  const version = typeof plugin.version === 'string' ? plugin.version : ''
  if (!/^\d+\.\d+\.\d+/.test(version)) {
    const harnessVersion = harnessPackageVersion()
    if (harnessVersion) {
      plugin.version = harnessVersion
      pluginChanged = true
      add('POLISH', 'PLUG-7', `Version ${dryRun ? 'would be set' : 'set'} from the harness package version.`, STD, pluginFile)
    } else {
      add('ADVISORY', 'PLUG-7', 'Version is missing or invalid and the harness package version is unavailable.', STD, pluginFile)
    }
  } else {
    add('PASS', 'PLUG-7', 'Version is semver.', STD, pluginFile)
  }

  if (marketplaceDescription && plugin.description !== marketplaceDescription) {
    plugin.description = marketplaceDescription
    pluginChanged = true
    add('POLISH', 'PLUG-7', `Description ${dryRun ? 'would be synchronized' : 'synchronized'} with the marketplace entry.`, STD, pluginFile)
  } else if (marketplaceDescription) {
    add('PASS', 'PLUG-7', 'Description already matches the marketplace entry.', STD, pluginFile)
  }

  const author = (plugin.author ?? {}) as Record<string, unknown>
  if (author.name !== ORG)
    add(
      'ADVISORY',
      'PLUG-6',
      'Author identity differs from the projection contract; regenerate with ki-binding rather than hand-editing.',
      STD,
      pluginFile
    )

  const canonicalPlugin = canonicalize(plugin)
  if (pluginChanged || pluginRaw !== canonicalPlugin) {
    add(
      'POLISH',
      'PLUG-4',
      `Plugin manifest formatting ${dryRun ? 'would be normalized' : 'normalized'} to two spaces with a trailing newline.`,
      STD,
      pluginFile
    )
    if (!dryRun) writeFileSync(pluginPath, canonicalPlugin)
  } else {
    add('PASS', 'PLUG-4', 'Plugin manifest already uses two-space JSON with a trailing newline.', STD, pluginFile)
  }

  finish()
}

main()
