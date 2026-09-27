import { afterEach, expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { chmodSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricContextOptions } from '../../shared/rubric.ts'
import { CONFIG } from '../items/config.ts'
import { MAN } from '../items/manual.ts'
import { SHARED } from '../items/shared-code.ts'
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
  const config = join(repository, '.ki.toml')
  writeFileSync(config, '[skills.ki-repo]\n[skills.ki-repo-tools]\n')
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

const manualStyleItem = () => {
  const candidate = MAN.items.find((entry) => entry.code === 'MAN-STYLE')
  if (!candidate?.mechanical) throw new Error('MAN-STYLE mechanical item is missing')
  return candidate.mechanical
}

const sharedItem = () => {
  const candidate = SHARED.items.find((entry) => entry.code === 'SHARED-1')
  if (!candidate?.mechanical) throw new Error('SHARED-1 mechanical item is missing')
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
  expect(configItem().audit.run(CONFIG.selectContext(context))[0]?.status).toBe('PASS')
  expect(session.proposal()).toEqual({ writes: [] })
  expect(lstatSync(executable).mode & 0o111).toBe(0)
  expect(lstatSync(install).mode & 0o111).toBe(0)
  expect(readFileSync(config, 'utf8')).toBe('[skills.ki-repo]\n[skills.ki-repo-tools]\n')
})

test('developer delivery guides are required as regular files without prescribing content', () => {
  const { repository } = fixture()
  const item = toolItem('TOOL-DEVELOPER-GUIDES')
  const audit = () => {
    const context = createToolsSession(options(repository, 'audit')).subjects[0]?.context()
    if (!context) throw new Error('ki-repo-tools session has no repository context')
    return item.audit.run(TOOL.selectContext(context))
  }

  expect(audit().map(({ status, subject }) => ({ status, subject }))).toEqual([
    { status: 'VIOLATION', subject: 'docs/guides/developer/definition-of-done.md' },
    { status: 'VIOLATION', subject: 'docs/guides/developer/releasing.md' }
  ])

  const developerGuides = join(repository, 'docs', 'guides', 'developer')
  mkdirSync(developerGuides, { recursive: true })
  writeFileSync(join(developerGuides, 'definition-of-done.md'), '')
  writeFileSync(join(developerGuides, 'releasing.md'), '')

  expect(audit().map(({ status, subject }) => ({ status, subject }))).toEqual([
    { status: 'PASS', subject: 'docs/guides/developer/definition-of-done.md' },
    { status: 'PASS', subject: 'docs/guides/developer/releasing.md' }
  ])

  rmSync(join(developerGuides, 'releasing.md'))
  mkdirSync(join(developerGuides, 'releasing.md'))
  expect(audit()[1]).toMatchObject({
    status: 'VIOLATION',
    subject: 'docs/guides/developer/releasing.md'
  })
})

test('item-owned actions coalesce bounded chmod commands without changing declaration ownership', () => {
  const { repository, config, executable, install } = fixture()
  const session = createToolsSession(options(repository, 'conform'))
  const context = session.subjects[0]?.context()
  if (!context) throw new Error('ki-repo-tools session has no repository context')

  for (const code of ['TOOL-EXEC', 'TOOL-INSTALL']) {
    const action = toolItem(code).conform
    action?.run(TOOL.selectContext(context))
    action?.run(TOOL.selectContext(context))
  }
  expect(session.proposal()).toEqual({
    writes: [],
    commands: [
      { program: 'chmod', arguments: ['+x', 'bin/demo'] },
      { program: 'chmod', arguments: ['+x', 'install.sh'] }
    ]
  })
  expect(lstatSync(executable).mode & 0o111).toBe(0)
  expect(lstatSync(install).mode & 0o111).toBe(0)
  expect(readFileSync(config, 'utf8')).toBe('[skills.ki-repo]\n[skills.ki-repo-tools]\n')
})

test('declared source profile renders a missing installer and becomes idempotent', () => {
  const { repository, config, install } = fixture()
  mkdirSync(join(repository, 'man'))
  writeFileSync(join(repository, 'man', 'demo.1'), '.TH demo 1\n')
  writeFileSync(
    config,
    [
      '[skills.ki-repo]',
      '[skills.ki-repo-tools]',
      'profile = "source-script-v1"',
      'tool = "demo"',
      'repository = "knowledgeislands/tools-demo"',
      'env_prefix = "DEMO"',
      'manual_path = "man/demo.1"',
      ''
    ].join('\n')
  )
  rmSync(install)
  const session = createToolsSession(options(repository, 'conform'))
  const context = session.subjects[0]?.context()
  if (!context) throw new Error('ki-repo-tools session has no repository context')

  sharedItem().conform?.run(SHARED.selectContext(context))
  const proposal = session.proposal()
  expect(proposal.writes.map((write) => write.path)).toEqual(['install.sh'])
  expect(proposal.commands).toEqual([{ program: 'chmod', arguments: ['+x', 'install.sh'] }])
  const installer = proposal.writes[0]
  if (!installer) throw new Error('installer proposal is missing')
  writeFileSync(join(repository, installer.path), installer.content)
  chmodSync(join(repository, installer.path), 0o755)
  execFileSync('bash', ['-n', join(repository, installer.path)])

  const repeated = createToolsSession(options(repository, 'conform'))
  const repeatedContext = repeated.subjects[0]?.context()
  if (!repeatedContext) throw new Error('ki-repo-tools session has no repository context')
  sharedItem().conform?.run(SHARED.selectContext(repeatedContext))
  expect(repeated.proposal()).toEqual({ writes: [] })
  expect(sharedItem().audit.run(SHARED.selectContext(repeatedContext))).toEqual(
    expect.arrayContaining([expect.objectContaining({ status: 'PASS', subject: 'install.sh' })])
  )
})

test('declared profile refuses modified or obsolete managed scripts', () => {
  const { repository, config, install } = fixture()
  mkdirSync(join(repository, 'man'))
  mkdirSync(join(repository, 'release'))
  writeFileSync(join(repository, 'man', 'demo.1'), '.TH demo 1\n')
  writeFileSync(
    config,
    [
      '[skills.ki-repo]',
      '[skills.ki-repo-tools]',
      'profile = "source-script-v1"',
      'tool = "demo"',
      'repository = "knowledgeislands/tools-demo"',
      'env_prefix = "DEMO"',
      'manual_path = "man/demo.1"',
      ''
    ].join('\n')
  )
  writeFileSync(install, '#!/bin/sh\nmodified\n')
  writeFileSync(
    join(repository, 'release', 'package.sh'),
    '#!/bin/sh\n# @ki-managed ki-repo-tools profile=retired template=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n'
  )
  const session = createToolsSession(options(repository, 'conform'))
  const context = session.subjects[0]?.context()
  if (!context) throw new Error('ki-repo-tools session has no repository context')

  sharedItem().conform?.run(SHARED.selectContext(context))
  expect(session.proposal()).toEqual({ writes: [] })
  expect(sharedItem().audit.run(SHARED.selectContext(context))).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ status: 'VIOLATION', subject: 'install.sh' }),
      expect.objectContaining({ status: 'VIOLATION', subject: 'release/package.sh' })
    ])
  )
})

test('profile configuration rejects parameters outside the selected profile', () => {
  const { repository, config } = fixture()
  mkdirSync(join(repository, 'man'))
  mkdirSync(join(repository, 'release'))
  writeFileSync(join(repository, 'man', 'demo.1'), '.TH demo 1\n')
  writeFileSync(
    join(repository, 'release', 'signing-public.pem'),
    '-----BEGIN PUBLIC KEY-----\nZmFrZQ==\n-----END PUBLIC KEY-----\n'
  )
  writeFileSync(
    config,
    [
      '[skills.ki-repo]',
      '[skills.ki-repo-tools]',
      'profile = "source-script-v1"',
      'tool = "demo"',
      'repository = "knowledgeislands/tools-demo"',
      'env_prefix = "DEMO"',
      'manual_path = "man/demo.1"',
      'public_key_path = "release/signing-public.pem"',
      ''
    ].join('\n')
  )
  const context = createToolsSession(options(repository, 'audit')).subjects[0]?.context()
  if (!context) throw new Error('ki-repo-tools session has no repository context')

  expect(configItem().audit.run(CONFIG.selectContext(context))).toContainEqual({
    status: 'VIOLATION',
    message: 'The marker contains unknown keys: public_key_path.',
    subject: '.ki.toml'
  })
  expect(sharedItem().audit.run(SHARED.selectContext(context))).toContainEqual({
    status: 'VIOLATION',
    message: 'Invalid or missing profile parameters: public_key_path.',
    subject: '.ki.toml'
  })
})

test('archive profiles render packaging and preserve explicit release extensions', () => {
  for (const profile of ['archive-sha256-v1', 'signed-archive-v1']) {
    const { repository, config, install } = fixture()
    mkdirSync(join(repository, 'man'))
    mkdirSync(join(repository, 'release'))
    writeFileSync(join(repository, 'man', 'demo.1'), '.TH demo 1\n')
    writeFileSync(join(repository, 'release', 'package.test.sh'), '#!/bin/sh\n')
    const profileLines = [
      '[skills.ki-repo]',
      '[skills.ki-repo-tools]',
      `profile = "${profile}"`,
      'tool = "demo"',
      'repository = "knowledgeislands/tools-demo"',
      'env_prefix = "DEMO"',
      'manual_path = "man/demo.1"'
    ]
    if (profile === 'signed-archive-v1') {
      writeFileSync(
        join(repository, 'release', 'signing-public.pem'),
        '-----BEGIN PUBLIC KEY-----\nZmFrZQ==\n-----END PUBLIC KEY-----\n'
      )
      profileLines.push('public_key_path = "release/signing-public.pem"')
    }
    profileLines.push('')
    writeFileSync(config, profileLines.join('\n'))
    rmSync(install)
    const session = createToolsSession(options(repository, 'conform'))
    const context = session.subjects[0]?.context()
    if (!context) throw new Error('ki-repo-tools session has no repository context')

    sharedItem().conform?.run(SHARED.selectContext(context))

    expect(
      session
        .proposal()
        .writes.map((write) => write.path)
        .sort()
    ).toEqual(['install.sh', 'release/package.sh'])
    for (const write of session.proposal().writes) {
      const target = join(repository, write.path)
      writeFileSync(target, write.content)
      execFileSync('bash', ['-n', target])
    }
    expect(sharedItem().audit.run(SHARED.selectContext(context))).toEqual(
      expect.arrayContaining([expect.objectContaining({ status: 'INFO' })])
    )
  }
})

test('signed profile fails closed when the repository-owned public key is invalid', () => {
  const { repository, config, install } = fixture()
  mkdirSync(join(repository, 'man'))
  mkdirSync(join(repository, 'release'))
  writeFileSync(join(repository, 'man', 'demo.1'), '.TH demo 1\n')
  writeFileSync(join(repository, 'release', 'signing-public.pem'), 'not a public key\n')
  writeFileSync(
    config,
    [
      '[skills.ki-repo]',
      '[skills.ki-repo-tools]',
      'profile = "signed-archive-v1"',
      'tool = "demo"',
      'repository = "knowledgeislands/tools-demo"',
      'env_prefix = "DEMO"',
      'manual_path = "man/demo.1"',
      'public_key_path = "release/signing-public.pem"',
      ''
    ].join('\n')
  )
  rmSync(install)
  const session = createToolsSession(options(repository, 'conform'))
  const context = session.subjects[0]?.context()
  if (!context) throw new Error('ki-repo-tools session has no repository context')

  sharedItem().conform?.run(SHARED.selectContext(context))

  expect(session.proposal()).toEqual({ writes: [] })
  expect(sharedItem().audit.run(SHARED.selectContext(context))).toContainEqual({
    status: 'VIOLATION',
    message: 'Invalid or missing profile parameters: public_key_path.',
    subject: '.ki.toml'
  })
})

test('static audit never invokes the executable and accepts a physical src/tests directory', () => {
  const { repository, executable } = fixture()
  rmSync(join(repository, 'tests'), { recursive: true })
  mkdirSync(join(repository, 'src', 'tests'), { recursive: true })
  chmodSync(executable, 0o755)

  const session = createToolsSession(options(repository, 'audit'))
  const context = session.subjects[0]?.context()
  if (!context) throw new Error('ki-repo-tools session has no repository context')

  expect(context.tool.testDirectories).toEqual(['src/tests/'])
  expect(toolItem('TOOL-VERSION').audit.run(TOOL.selectContext(context))[0]?.status).toBe('INFO')
  expect(toolItem('TOOL-TESTS').audit.run(TOOL.selectContext(context))[0]?.status).toBe('PASS')
})

test('static version evidence remains unavailable even for a rejecting executable', () => {
  const { repository, executable } = fixture()
  writeFileSync(executable, '#!/bin/sh\nexit 1\n')
  chmodSync(executable, 0o755)

  const session = createToolsSession(options(repository, 'audit'))
  const context = session.subjects[0]?.context()
  if (!context) throw new Error('ki-repo-tools session has no repository context')

  expect(toolItem('TOOL-VERSION').audit.run(TOOL.selectContext(context))[0]?.status).toBe('INFO')
})

test('release-marker alignment starts at package version 1.0.0', () => {
  const { repository } = fixture()
  writeFileSync(join(repository, 'package.json'), JSON.stringify({ version: '0.2.20' }))
  writeFileSync(join(repository, 'CHANGELOG.md'), '# Changelog\n\n## [1.0.0] - in progress\n')

  const preOne = createToolsSession(options(repository, 'audit')).subjects[0]?.context()
  if (!preOne) throw new Error('ki-repo-tools session has no repository context')
  expect(toolItem('TOOL-RELEASE-MARKERS').audit.run(TOOL.selectContext(preOne))).toEqual([
    {
      status: 'NOT_APPLICABLE',
      message: 'Package 0.2.20 is pre-1.0; changelog release-marker alignment is not evaluated.'
    }
  ])

  writeFileSync(join(repository, 'package.json'), JSON.stringify({ version: '1.0.0' }))
  const aligned = createToolsSession(options(repository, 'audit')).subjects[0]?.context()
  if (!aligned) throw new Error('ki-repo-tools session has no repository context')
  expect(toolItem('TOOL-RELEASE-MARKERS').audit.run(TOOL.selectContext(aligned))[0]?.status).toBe('PASS')

  writeFileSync(join(repository, 'package.json'), JSON.stringify({ version: '1.0.1' }))
  const drifted = createToolsSession(options(repository, 'audit')).subjects[0]?.context()
  if (!drifted) throw new Error('ki-repo-tools session has no repository context')
  expect(toolItem('TOOL-RELEASE-MARKERS').audit.run(TOOL.selectContext(drifted))[0]?.status).toBe('VIOLATION')
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

test('manual heading spacing audits and conforms through one idempotent source write', () => {
  const { repository } = fixture()
  const beforeManual = createToolsSession(options(repository, 'audit')).subjects[0]?.context()
  if (!beforeManual) throw new Error('ki-repo-tools session has no repository context')
  const relativeManualPath = beforeManual.manual.manualPath
  const manualPath = join(repository, relativeManualPath)
  mkdirSync(join(repository, 'man'))
  writeFileSync(manualPath, '.TH demo 1\n.SH NAME\ndemo\n.SS COMMANDS\n\\&\n.PP\n.TP\n')

  const auditContext = createToolsSession(options(repository, 'audit')).subjects[0]?.context()
  if (!auditContext) throw new Error('ki-repo-tools session has no repository context')
  expect(manualStyleItem().audit.run(MAN.selectContext(auditContext))).toEqual([
    {
      status: 'VIOLATION',
      message: `${relativeManualPath} headings on lines 2, 4 need \\& separation and a non-empty .PP only before prose.`,
      subject: relativeManualPath
    }
  ])

  const conformSession = createToolsSession(options(repository, 'conform'))
  const conformContext = conformSession.subjects[0]?.context()
  if (!conformContext) throw new Error('ki-repo-tools session has no repository context')
  manualStyleItem().conform?.run(MAN.selectContext(conformContext))
  const first = conformSession.proposal().writes.find((write) => write.path === relativeManualPath)
  expect(first?.content).toBe('.TH demo 1\n.SH NAME\n\\&\n.PP\ndemo\n.SS COMMANDS\n\\&\n.TP\n')
  if (!first) throw new Error('manual spacing conform write is missing')
  writeFileSync(manualPath, first.content)

  const secondSession = createToolsSession(options(repository, 'conform'))
  const secondContext = secondSession.subjects[0]?.context()
  if (!secondContext) throw new Error('ki-repo-tools session has no repository context')
  expect(manualStyleItem().audit.run(MAN.selectContext(secondContext))[0]?.status).toBe('PASS')
  manualStyleItem().conform?.run(MAN.selectContext(secondContext))
  expect(secondSession.proposal().writes.find((write) => write.path === relativeManualPath)?.content).toBe(
    first.content
  )
})

test('symlinked governed paths remain report-only and are never traversed', () => {
  const repository = temporaryDirectory('tools-unsafe-')
  const outside = temporaryDirectory('tools-outside-')
  mkdirSync(join(outside, 'bin'))
  writeFileSync(join(outside, 'bin', 'unsafe'), '#!/bin/sh\n')
  writeFileSync(join(outside, 'config.toml'), '[skills.ki-repo]\n')
  symlinkSync(join(outside, 'bin'), join(repository, 'bin'))
  symlinkSync(join(outside, 'config.toml'), join(repository, '.ki.toml'))
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
