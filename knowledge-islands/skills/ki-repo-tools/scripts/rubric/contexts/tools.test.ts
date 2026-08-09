import { afterEach, expect, test } from 'bun:test'
import { chmodSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricContextOptions } from '../../shared/rubric.ts'
import { CONFIG } from '../items/config.ts'
import { MAN } from '../items/manual.ts'
import { TOOL } from '../items/tool.ts'
import { createToolsSession } from './tools.ts'

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

const temporaryDirectory = (prefix: string): string => {
  const directory = mkdtempSync(join(tmpdir(), prefix))
  temporaryDirectories.push(directory)
  return directory
}

const options = (repository: string, mode: 'audit' | 'conform'): RubricContextOptions => ({
  mode,
  repository,
  userHome: tmpdir(),
  configuration: {}
})

const fixture = (): {
  readonly repository: string
  readonly config: string
  readonly executable: string
  readonly install: string
} => {
  const repository = temporaryDirectory('tools-demo-')
  mkdirSync(join(repository, 'bin'))
  const executable = join(repository, 'bin', 'demo')
  writeFileSync(executable, '#!/bin/sh\ncase "$1" in --version) echo demo 0.1.0;; esac\n')
  chmodSync(executable, 0o644)
  const install = join(repository, 'install.sh')
  writeFileSync(install, '#!/bin/sh\n')
  chmodSync(install, 0o644)
  writeFileSync(join(repository, 'CHANGELOG.md'), '# Changelog\n')
  mkdirSync(join(repository, '.github', 'workflows'), { recursive: true })
  writeFileSync(join(repository, '.github', 'workflows', 'ci.yml'), 'run: shellcheck bin/demo\nrun: bats tests/\n')
  mkdirSync(join(repository, 'tests'))
  writeFileSync(join(repository, 'tests', 'demo.bats'), '@test "version" { run bin/demo --version; }\n')
  const config = join(repository, '.ki-config.toml')
  writeFileSync(config, '[skills.ki-repo]\n')
  return { repository, config, executable, install }
}

const toolItem = (code: string) => {
  const candidate = TOOL.items.find((entry) => entry.code === code)
  if (!candidate?.mechanical) throw new Error(`${code} mechanical item is missing`)
  return candidate.mechanical
}

const configItem = () => {
  const candidate = CONFIG.items.find((entry) => entry.code === 'CONFIG-1')
  if (!candidate?.mechanical) throw new Error('CONFIG-1 mechanical item is missing')
  return candidate.mechanical
}

const manualItem = () => {
  const candidate = MAN.items.find((entry) => entry.code === 'MAN-LINT')
  if (!candidate?.mechanical) throw new Error('MAN-LINT mechanical item is missing')
  return candidate.mechanical
}

test('audit is read-only and prepares one stable focused repository context', () => {
  const { repository, config, executable, install } = fixture()
  const session = createToolsSession(options(repository, 'audit'))
  const subject = session.subjects[0]
  if (!subject) throw new Error('ki-repo-tools session has no repository subject')
  const context = subject.context()

  expect(subject.context()).toBe(context)
  expect(context.tool.requestBinExecutables).toBeUndefined()
  expect(context.tool.requestInstallExecutable).toBeUndefined()
  expect(context.config.requestMarker).toBeUndefined()
  expect(toolItem('TOOL-BIN').audit.run(TOOL.selectContext(context))[0]?.status).toBe('PASS')
  expect(configItem().audit.run(CONFIG.selectContext(context))[0]?.status).toBe('VIOLATION')
  expect(session.proposal()).toEqual({ writes: [] })
  expect(lstatSync(executable).mode & 0o111).toBe(0)
  expect(lstatSync(install).mode & 0o111).toBe(0)
  expect(readFileSync(config, 'utf8')).toBe('[skills.ki-repo]\n')
})

test('item-owned actions coalesce bounded chmod commands and one marker draft', () => {
  const { repository, config, executable, install } = fixture()
  const session = createToolsSession(options(repository, 'conform'))
  const context = session.subjects[0]?.context()
  if (!context) throw new Error('ki-repo-tools session has no repository context')

  for (const code of ['TOOL-EXEC', 'TOOL-INSTALL']) {
    const action = toolItem(code).conform
    action?.run(TOOL.selectContext(context))
    action?.run(TOOL.selectContext(context))
  }
  configItem().conform?.run(CONFIG.selectContext(context))
  configItem().conform?.run(CONFIG.selectContext(context))

  expect(session.proposal()).toEqual({
    writes: [
      {
        path: '.ki-config.toml',
        content: '[skills.ki-repo]\n\n[skills.ki-repo-tools]\n'
      }
    ],
    commands: [
      { program: 'chmod', arguments: ['+x', 'bin/demo'] },
      { program: 'chmod', arguments: ['+x', 'install.sh'] }
    ]
  })
  expect(lstatSync(executable).mode & 0o111).toBe(0)
  expect(lstatSync(install).mode & 0o111).toBe(0)
  expect(readFileSync(config, 'utf8')).toBe('[skills.ki-repo]\n')
})

test('version evidence invokes the executable and accepts a physical src/tests directory', () => {
  const { repository, executable } = fixture()
  rmSync(join(repository, 'tests'), { recursive: true })
  mkdirSync(join(repository, 'src', 'tests'), { recursive: true })
  chmodSync(executable, 0o755)

  const session = createToolsSession(options(repository, 'audit'))
  const context = session.subjects[0]?.context()
  if (!context) throw new Error('ki-repo-tools session has no repository context')

  expect(context.tool.version).toBe('passed')
  expect(context.tool.testDirectories).toEqual(['src/tests/'])
  expect(toolItem('TOOL-VERSION').audit.run(TOOL.selectContext(context))[0]?.status).toBe('PASS')
  expect(toolItem('TOOL-TESTS').audit.run(TOOL.selectContext(context))[0]?.status).toBe('PASS')
})

test('version evidence reports an executable that rejects --version', () => {
  const { repository, executable } = fixture()
  writeFileSync(executable, '#!/bin/sh\nexit 1\n')
  chmodSync(executable, 0o755)

  const session = createToolsSession(options(repository, 'audit'))
  const context = session.subjects[0]?.context()
  if (!context) throw new Error('ki-repo-tools session has no repository context')

  expect(context.tool.version).toBe('failed')
  expect(toolItem('TOOL-VERSION').audit.run(TOOL.selectContext(context))[0]?.status).toBe('VIOLATION')
})

test('a physical manual page requires a mandoc lint workflow gate', () => {
  const { repository } = fixture()
  const beforeManual = createToolsSession(options(repository, 'audit')).subjects[0]?.context()
  if (!beforeManual) throw new Error('ki-repo-tools session has no repository context')
  mkdirSync(join(repository, 'man'))
  writeFileSync(join(repository, beforeManual.manual.manualPath), '.TH demo 1\n')

  const missingGate = createToolsSession(options(repository, 'audit')).subjects[0]?.context()
  if (!missingGate) throw new Error('ki-repo-tools session has no repository context')
  expect(manualItem().audit.run(MAN.selectContext(missingGate))[0]?.status).toBe('VIOLATION')

  writeFileSync(
    join(repository, '.github', 'workflows', 'ci.yml'),
    `run: mandoc -T lint ${beforeManual.manual.manualPath}\n`
  )
  const gated = createToolsSession(options(repository, 'audit')).subjects[0]?.context()
  if (!gated) throw new Error('ki-repo-tools session has no repository context')
  expect(manualItem().audit.run(MAN.selectContext(gated))[0]?.status).toBe('PASS')

  writeFileSync(
    join(repository, 'package.json'),
    JSON.stringify({ scripts: { 'ki:tools:lint-man': `mandoc -T lint ${beforeManual.manual.manualPath}` } })
  )
  writeFileSync(join(repository, '.github', 'workflows', 'ci.yml'), 'run: bun run ki:tools:lint-man\n')
  const scripted = createToolsSession(options(repository, 'audit')).subjects[0]?.context()
  if (!scripted) throw new Error('ki-repo-tools session has no repository context')
  expect(manualItem().audit.run(MAN.selectContext(scripted))[0]?.status).toBe('PASS')
})

test('symlinked governed paths remain report-only and are never traversed', () => {
  const repository = temporaryDirectory('tools-unsafe-')
  const outside = temporaryDirectory('tools-outside-')
  mkdirSync(join(outside, 'bin'))
  writeFileSync(join(outside, 'bin', 'unsafe'), '#!/bin/sh\n')
  writeFileSync(join(outside, 'config.toml'), '[skills.ki-repo]\n')
  symlinkSync(join(outside, 'bin'), join(repository, 'bin'))
  symlinkSync(join(outside, 'config.toml'), join(repository, '.ki-config.toml'))
  symlinkSync(outside, join(repository, '.github'))

  const session = createToolsSession(options(repository, 'conform'))
  const context = session.subjects[0]?.context()
  if (!context) throw new Error('ki-repo-tools session has no repository context')
  toolItem('TOOL-EXEC').conform?.run(TOOL.selectContext(context))
  configItem().conform?.run(CONFIG.selectContext(context))

  expect(context.tool.binState).toBe('unsafe')
  expect(context.tool.workflows).toBe('unsafe')
  expect(context.config.config).toBe('unsafe')
  expect(context.tool.requestBinExecutables).toBeUndefined()
  expect(context.config.requestMarker).toBeUndefined()
  expect(session.proposal()).toEqual({ writes: [] })
  expect(readFileSync(join(outside, 'config.toml'), 'utf8')).toBe('[skills.ki-repo]\n')
})

test('an unrelated physical repository is not applicable', () => {
  const repository = temporaryDirectory('unrelated-')
  const session = createToolsSession(options(repository, 'audit'))
  const context = session.subjects[0]?.context()
  if (!context) throw new Error('ki-repo-tools session has no repository context')

  expect(toolItem('TOOL-BIN').audit.run(TOOL.selectContext(context))[0]?.status).toBe('NOT_APPLICABLE')
  expect(configItem().audit.run(CONFIG.selectContext(context))[0]?.status).toBe('NOT_APPLICABLE')
})
