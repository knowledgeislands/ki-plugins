import { afterEach, describe, expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import type { RubricContextOptions } from '../../shared/rubric.ts'
import { FILES } from '../items/files.ts'
import { RUNTIMES } from '../items/runtimes.ts'
import { WORK } from '../items/working-areas.ts'
import { collectAuditFindings, detectedCoverageSkills, KI_CONFIGURATION_HEADER, localTreePaths } from './audit.ts'
import { createRepoSession, type FilesRubricContext, type WorkingAreasRubricContext } from './repository.ts'

const roots: string[] = []

test('ki-detects registry exactly matches executable coverage targets', () => {
  const text = readFileSync(join(import.meta.dir, '../../../SKILL.md'), 'utf8')
  const document = text.match(/^---\n([\s\S]*?)\n---/)?.[1]
  if (!document) throw new Error('ki-repo SKILL.md has no frontmatter')
  const frontmatter = Bun.YAML.parse(document) as Record<string, unknown>
  expect(frontmatter['ki-detects']).toEqual(detectedCoverageSkills())
})

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

const repository = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'ki-repo-session-'))
  roots.push(root)
  execFileSync('git', ['init', '--quiet', root])
  return root
}

const options = (root: string, mode: 'audit' | 'conform'): RubricContextOptions => ({
  mode,
  repository: root,
  userHome: root,
  configuration: {}
})

const inspect = (root: string) => ({
  target: root,
  findings: [
    { level: 'FAIL' as const, code: 'FILES-1', message: 'required files are absent' },
    { level: 'FAIL' as const, code: 'FILES-2', message: 'repository identity is absent' },
    { level: 'FAIL' as const, code: 'FILES-3', message: 'authoring marker is absent' },
    { level: 'FAIL' as const, code: 'FILES-4', message: 'runtime skill ignore rules are absent' },
    { level: 'FAIL' as const, code: 'FILES-5', message: 'configuration header is absent' }
  ]
})

const runFilesConform = (context: FilesRubricContext): void => {
  for (const item of FILES.items) item.mechanical?.conform?.run(context)
}

const filesContext = (session: Awaited<ReturnType<typeof createRepoSession>>): FilesRubricContext => {
  const [subject] = session.subjects
  if (!subject) throw new Error('ki-repo session did not expose its repository subject')
  return FILES.selectContext(subject.context())
}

const workingAreasContext = (session: Awaited<ReturnType<typeof createRepoSession>>): WorkingAreasRubricContext => {
  const [subject] = session.subjects
  if (!subject) throw new Error('ki-repo session did not expose its repository subject')
  return WORK.selectContext(subject.context())
}

const runWorkingAreasConform = (context: WorkingAreasRubricContext): void => {
  for (const item of WORK.items) item.mechanical?.conform?.run(context)
}

const runtimesContext = (session: Awaited<ReturnType<typeof createRepoSession>>) => {
  const subject = session.subjects.find(({ families }) => families.includes('RUNTIMES'))
  if (!subject) throw new Error('ki-repo session did not expose its runtime subject')
  return RUNTIMES.selectContext(subject.context())
}

const runRuntimeCoverageConform = (session: Awaited<ReturnType<typeof createRepoSession>>): void => {
  const item = RUNTIMES.items.find(({ code }) => code === 'RUNTIMES-2')
  item?.mechanical?.conform?.run(runtimesContext(session))
}

const applyWrites = (
  root: string,
  writes: ReturnType<Awaited<ReturnType<typeof createRepoSession>>['proposal']>['writes']
): void => {
  for (const write of writes) {
    const path = join(root, write.path)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, write.content)
  }
}

describe('ki-repo session', () => {
  test('coalesces two item actions into one explicit config create plus one gitignore create', async () => {
    const root = repository()
    const session = await createRepoSession(options(root, 'conform'), inspect)
    const context = filesContext(session)
    runFilesConform(context)

    const proposal = session.proposal()
    expect(proposal.writes.map((write) => write.path)).toEqual(['.ki.toml', '.gitignore'])
    expect(proposal.writes[0]?.create).toBe(true)
    expect(
      proposal.writes[0]?.content.startsWith(
        '# Knowledge Islands repository configuration.\n# Its presence declares conformance with the Knowledge Islands repository standard.\n\n'
      )
    ).toBe(true)
    expect(proposal.writes[0]?.content).toContain('[skills.ki-repo]')
    expect(proposal.writes[0]?.content).toContain('[skills.ki-authoring]')
  })

  test('adds only the header and missing exact root markers while preserving original bytes', async () => {
    const root = repository()
    const original = '# retained\n[skills.ki-repo.checks]\nwiki = false\n'
    writeFileSync(join(root, '.ki.toml'), original)
    const session = await createRepoSession(options(root, 'conform'), inspect)
    runFilesConform(filesContext(session))

    const config = session.proposal().writes.find((write) => write.path === '.ki.toml')
    expect(config?.create).toBeUndefined()
    expect(
      config?.content.startsWith(
        '# Knowledge Islands repository configuration.\n# Its presence declares conformance with the Knowledge Islands repository standard.\n\n'
      )
    ).toBe(true)
    expect(config?.content).toContain(original)
    expect(config?.content).toContain('\n[skills.ki-repo]\n')
    expect(config?.content).toContain('\n[skills.ki-authoring]\n')
  })

  test('replaces legacy runtime-skill ignores with the canonical ki-self exception', async () => {
    const root = repository()
    writeFileSync(join(root, '.ki.toml'), '[skills.ki-repo]\nsupported_runtimes = ["claude-code", "chatgpt-codex"]\n')
    mkdirSync(join(root, '.agents', 'skills', 'ki-self'), { recursive: true })
    writeFileSync(join(root, '.agents', 'skills', 'ki-self', 'SKILL.md'), '# KI Self\n')
    writeFileSync(join(root, '.gitignore'), 'node_modules/\n.claude/skills/*\n.agents/skills/\n')
    const session = await createRepoSession(options(root, 'conform'), inspect)
    runFilesConform(filesContext(session))

    const gitignore = session.proposal().writes.find((write) => write.path === '.gitignore')
    expect(gitignore?.create).toBeUndefined()
    expect(gitignore?.content).toContain('# ki-repo:ignore:ki-repo:start')
    expect(gitignore?.content).toContain('reports/')
    expect(gitignore?.content).toContain('.claude/skills/*')
    expect(gitignore?.content).toContain('!.agents/skills/ki-self/**')
    expect(gitignore?.content).toContain('# Unmanaged repository-specific ignores')
    expect(gitignore?.content).toEndWith('\nnode_modules/\n')
    expect(gitignore?.content).not.toContain('.agents/skills/\n')
  })

  test('accepts only the exact predecessor tools-ki ignore generation during the v0.4.0 bridge', async () => {
    const root = repository()
    writeFileSync(
      join(root, '.ki.toml'),
      '[skills.ki-repo]\nsupported_runtimes = ["claude-code", "chatgpt-codex"]\n\n[skills.ki-engineering]\n'
    )
    const previous = `# Knowledge Islands managed ignores.
# Edit the owning skill contract, not the marker-bounded blocks below.

# ki-repo:ignore:ki-repo:start
# Generated reports, local metadata, logs, and runtime projections.
reports/
.DS_Store
Thumbs.db
.idea/
*.swp
*.swo
*~
.claude/settings.local.json
*.log
.claude/skills/*
.agents/skills/*
!.agents/skills/ki-self/
!.agents/skills/ki-self/**
# ki-repo:ignore:ki-repo:end

# ki-repo:ignore:ki-engineering:start
# TypeScript/Bun dependencies, build output, caches, logs, and real environment files.
node_modules/
dist/
*.tsbuildinfo
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.env
.env.*
!.env*.example
# ki-repo:ignore:ki-engineering:end

# Unmanaged repository-specific ignores
# These rules are preserved but are not currently reconciled by a KI skill.

# KI-managed repository skill projections are machine-local.
.claude/agents/
`
    writeFileSync(join(root, '.gitignore'), previous)
    expect((await collectAuditFindings([root])).findings).not.toContainEqual(
      expect.objectContaining({ code: 'FILES-6' })
    )

    writeFileSync(join(root, '.gitignore'), previous.replace('node_modules/', 'node-modules/'))
    expect((await collectAuditFindings([root])).findings).toContainEqual(expect.objectContaining({ code: 'FILES-6' }))
  })

  test('derives runtime-skill ignores from supported runtimes while reserving ki-self', async () => {
    const root = repository()
    writeFileSync(join(root, '.ki.toml'), '[skills.ki-repo]\nsupported_runtimes = ["claude-code"]\n')
    writeFileSync(join(root, '.gitignore'), '.agents/skills/*\n')

    expect((await collectAuditFindings([root])).findings).toContainEqual(
      expect.objectContaining({ code: 'FILES-4', message: expect.stringContaining('.claude/skills/*') })
    )

    writeFileSync(join(root, '.gitignore'), '.claude/skills/*\n')
    expect((await collectAuditFindings([root])).findings).toContainEqual(
      expect.objectContaining({ code: 'FILES-4', message: expect.stringContaining('!.agents/skills/ki-self/') })
    )

    writeFileSync(join(root, '.gitignore'), '.claude/skills/*\n!.agents/skills/ki-self/\n!.agents/skills/ki-self/**\n')
    expect((await collectAuditFindings([root])).findings).not.toContainEqual(
      expect.objectContaining({ code: 'FILES-4' })
    )

    writeFileSync(join(root, '.ki.toml'), '[skills.ki-repo]\nsupported_runtimes = ["chatgpt-codex"]\n')
    writeFileSync(join(root, '.gitignore'), '.agents/skills/*\n!.agents/skills/ki-self/\n!.agents/skills/ki-self/**\n')
    expect((await collectAuditFindings([root])).findings).not.toContainEqual(
      expect.objectContaining({ code: 'FILES-4' })
    )
  }, 10_000)

  test('audits the exact opening configuration conformance header', async () => {
    const root = repository()
    const configuration = '[skills.ki-repo]\nsupported_runtimes = ["chatgpt-codex"]\n'
    writeFileSync(join(root, '.ki.toml'), configuration)

    expect((await collectAuditFindings([root])).findings).toContainEqual(expect.objectContaining({ code: 'FILES-5' }))

    writeFileSync(
      join(root, '.ki.toml'),
      `# Knowledge Islands repository configuration.\n# Its presence declares conformance with the Knowledge Islands repository standard.\n\n${configuration}`
    )
    expect((await collectAuditFindings([root])).findings).not.toContainEqual(
      expect.objectContaining({ code: 'FILES-5' })
    )
  })

  // Emission is observational: a rubric that reported differently when watched would make
  // progress part of the contract under audit, and a finding that turned on whether a display
  // was attached could not be defended. The inspector is recorded rather than asserted on
  // directly, because the emitter must also reach the evidence gathering, not just the session.
  test('surfaces substantial configuration presentation drift through FILES-9', async () => {
    const root = repository()
    writeFileSync(
      join(root, '.ki.toml'),
      `${KI_CONFIGURATION_HEADER}[repo]\n\n[skills.ki-repo]\n\n[skills.ki-authoring]\n\n[skills.ki-engineering]\n\n[skills.ki-binding]\n\n[skills.ki-work]\n`
    )

    expect((await collectAuditFindings([root])).findings).toContainEqual(
      expect.objectContaining({
        code: 'FILES-9',
        message: expect.stringContaining('substantial .ki.toml must use Foundation')
      })
    )
  })

  test('a recording emitter changes no outcome and still observes the evidence stage', async () => {
    const root = repository()
    const events: unknown[] = []
    const seen: (unknown | undefined)[] = []
    const recording = (target: string, emit?: unknown) => {
      seen.push(emit)
      return inspect(target)
    }

    const silent = await createRepoSession(options(root, 'audit'), recording)
    const watched = await createRepoSession({ ...options(root, 'audit'), emit: (e) => void events.push(e) }, recording)

    const outcomes = (session: Awaited<ReturnType<typeof createRepoSession>>) =>
      session.subjects.flatMap((subject) =>
        FILES.items.map((item) => item.mechanical?.audit.run(FILES.selectContext(subject.context())))
      )
    expect(outcomes(watched)).toEqual(outcomes(silent))
    expect(watched.proposal()).toEqual(silent.proposal())

    expect(seen[0]).toBeUndefined()
    expect(seen[1]).toBeInstanceOf(Function)
    expect(events).toEqual([
      { kind: 'stage', edge: 'start', label: 'repository evidence' },
      { kind: 'stage', edge: 'end', label: 'repository evidence' }
    ])
  })

  test('audit is read-only and unsafe configuration leaves expose no write capability', async () => {
    const root = repository()
    writeFileSync(join(root, 'outside.toml'), '[skills.ki-repo]\n')
    symlinkSync('outside.toml', join(root, '.ki.toml'))

    const audit = await createRepoSession(options(root, 'audit'), inspect)
    expect(audit.proposal()).toEqual({ writes: [] })

    const conform = await createRepoSession(options(root, 'conform'), inspect)
    const context = filesContext(conform)
    expect(context.ensureRepoConfiguration).toBeUndefined()
    expect(context.ensureAuthoringConfiguration).toBeUndefined()
    expect(context.ensureConfigurationHeader).toBeUndefined()
  })

  test('conforms only the generic inbound and outbound working-area scaffold', async () => {
    const root = repository()
    const session = await createRepoSession(options(root, 'conform'), inspect)
    runWorkingAreasConform(workingAreasContext(session))

    const writes = session.proposal().writes
    expect(writes.map((write) => write.path)).toEqual(['+/README.md', '-/README.md'])
    expect(writes.every((write) => write.create)).toBe(true)

    applyWrites(root, writes)
    const audit = await createRepoSession(options(root, 'audit'), inspect)
    const [item] = WORK.items
    expect(item?.mechanical?.audit.run(workingAreasContext(audit))).toEqual([
      { status: 'PASS', message: 'working-area scaffold is present and conformed' }
    ])
  })

  test('accepts the exact predecessor working-area README transition', async () => {
    const root = repository()
    const initial = await createRepoSession(options(root, 'conform'), inspect)
    runWorkingAreasConform(workingAreasContext(initial))
    applyWrites(root, initial.proposal().writes)

    writeFileSync(
      join(root, '+', 'README.md'),
      `# Incoming working area

\`+\` is this repository's top-level working area for temporary material received from another repository or external source that needs local triage.

For material prepared here to send elsewhere, use [the matching outbound working area](../-/README.md).

It is not a canonical roadmap, plan, decision record, or knowledge-base destination. Triage each item into its durable home, or remove it when it has no value to retain.
`
    )
    writeFileSync(
      join(root, '-', 'README.md'),
      `# Outgoing working area

\`-\` is this repository's top-level working area for temporary material prepared here for another repository or external recipient.

For material received here to triage, use [the matching inbound working area](../+/README.md).

It is not a canonical roadmap, plan, decision record, or knowledge-base destination. Remove each item after delivery or when it no longer has value to retain.
`
    )

    const audit = await createRepoSession(options(root, 'audit'), inspect)
    const [item] = WORK.items
    expect(item?.mechanical?.audit.run(workingAreasContext(audit))).toEqual([
      { status: 'PASS', message: 'working-area scaffold is present and conformed' }
    ])
  })

  test('repairs a drifted working-area README without recreating it', async () => {
    const root = repository()
    const initial = await createRepoSession(options(root, 'conform'), inspect)
    runWorkingAreasConform(workingAreasContext(initial))
    applyWrites(root, initial.proposal().writes)
    writeFileSync(join(root, '+', 'README.md'), '# drift\n')

    const session = await createRepoSession(options(root, 'conform'), inspect)
    runWorkingAreasConform(workingAreasContext(session))
    const [write] = session.proposal().writes

    expect(session.proposal().writes).toHaveLength(1)
    expect(write?.path).toBe('+/README.md')
    expect(write?.create).toBeUndefined()
    expect(write?.content).toContain('[the matching outbound working area](../-/README.md)')
    expect(write?.content).toContain('inputs to further repository work')
    expect(write?.content).toContain('whether received from elsewhere or created locally')
    expect(write?.content).not.toContain('_TRADES')
  })

  test('does not write a working-area scaffold through an unsafe directory', async () => {
    const root = repository()
    const outside = join(root, 'outside')
    mkdirSync(outside)
    symlinkSync(outside, join(root, '+'), 'dir')

    const session = await createRepoSession(options(root, 'conform'), inspect)
    runWorkingAreasConform(workingAreasContext(session))

    expect(session.proposal().writes).toEqual([])
  })
})

describe('runtime environment coverage', () => {
  const runtimeFindings = async (configuration: string) => {
    const root = repository()
    writeFileSync(join(root, '.ki.toml'), configuration)
    return (await collectAuditFindings([root])).findings.filter(
      ({ code }) => code === 'RUNTIMES-1' || code === 'RUNTIMES-2' || code === 'RUNTIMES-3'
    )
  }

  test('requires the portable and runtime-specific environment tables', async () => {
    expect(await runtimeFindings('[skills.ki-repo]\nsupported_runtimes = ["claude-code", "chatgpt-codex"]\n')).toEqual([
      {
        level: 'FAIL',
        code: 'RUNTIMES-2',
        message:
          'supported runtime coverage requires missing table(s): [skills.ki-housekeeping-claude], [skills.ki-tokenomics], [skills.ki-tokenomics-claude], [skills.ki-tokenomics-codex]',
        subject: expect.any(String)
      }
    ])
  })

  test('requests one exact host-native activation group for missing both-runtime coverage', async () => {
    const root = repository()
    const inspected: string[][] = []
    const requested: string[][] = []
    writeFileSync(join(root, '.ki.toml'), '[skills.ki-repo]\nsupported_runtimes = ["claude-code", "chatgpt-codex"]\n')

    const session = await createRepoSession({
      ...options(root, 'conform'),
      repositorySkills: {
        inspect: (names) => {
          inspected.push([...names])
          return names.map((name) => ({ name, status: 'missing' as const, message: 'not activated' }))
        },
        propose: (names) => requested.push([...names])
      }
    })
    runRuntimeCoverageConform(session)

    const expected = ['ki-housekeeping-claude', 'ki-tokenomics', 'ki-tokenomics-claude', 'ki-tokenomics-codex']
    expect(inspected).toEqual([expected])
    expect(requested).toEqual([expected])
    expect(session.proposal()).toEqual({ writes: [] })
  })

  test('does not request active, blocked, unavailable, or invalid runtime coverage', async () => {
    const complete = `[skills.ki-repo]
supported_runtimes = ["claude-code", "chatgpt-codex"]

[skills.ki-housekeeping-claude]

[skills.ki-tokenomics]

[skills.ki-tokenomics-claude]

[skills.ki-tokenomics-codex]
`
    const activeRoot = repository()
    const activeRequests: string[][] = []
    writeFileSync(join(activeRoot, '.ki.toml'), complete)
    const active = await createRepoSession({
      ...options(activeRoot, 'conform'),
      repositorySkills: {
        inspect: (names) => names.map((name) => ({ name, status: 'active' as const, message: 'activated' })),
        propose: (names) => activeRequests.push([...names])
      }
    })
    runRuntimeCoverageConform(active)
    expect(activeRequests).toEqual([])
    expect(RUNTIMES.items[1]?.mechanical?.audit.run(runtimesContext(active))).toEqual([
      { status: 'PASS', message: 'criterion satisfied' }
    ])

    const blockedRoot = repository()
    const blockedRequests: string[][] = []
    writeFileSync(join(blockedRoot, '.ki.toml'), complete)
    const blocked = await createRepoSession({
      ...options(blockedRoot, 'conform'),
      repositorySkills: {
        inspect: (names) =>
          names.map((name, index) => ({
            name,
            status: index === 0 ? ('blocked' as const) : ('active' as const),
            message: index === 0 ? 'provider is ambiguous' : 'activated'
          })),
        propose: (names) => blockedRequests.push([...names])
      }
    })
    runRuntimeCoverageConform(blocked)
    expect(blockedRequests).toEqual([])

    const unavailableRoot = repository()
    writeFileSync(join(unavailableRoot, '.ki.toml'), complete)
    const unavailable = await createRepoSession(options(unavailableRoot, 'conform'))
    expect(runtimesContext(unavailable).requestRuntimeSkills).toBeUndefined()

    const invalidRoot = repository()
    let invalidInspected = false
    writeFileSync(join(invalidRoot, '.ki.toml'), '[skills.ki-repo]\nsupported_runtimes = ["unknown"]\n')
    await createRepoSession({
      ...options(invalidRoot, 'conform'),
      repositorySkills: {
        inspect: () => {
          invalidInspected = true
          return []
        },
        propose: () => {}
      }
    })
    expect(invalidInspected).toBe(false)
  }, 10_000)

  test('accepts the complete environment matrix when Claude Desktop is declared', async () => {
    expect(
      await runtimeFindings(`[skills.ki-repo]
supported_runtimes = ["claude-code", "claude-desktop", "chatgpt-codex"]

[skills.ki-tokenomics]

[skills.ki-housekeeping-claude]

[skills.ki-tokenomics-claude]

[skills.ki-tokenomics-codex]
`)
    ).toEqual([])
  })

  test('rejects the retired Codex runtime identifier with recovery guidance', async () => {
    expect(await runtimeFindings('[skills.ki-repo]\nsupported_runtimes = ["codex"]\n')).toEqual([
      {
        level: 'FAIL',
        code: 'RUNTIMES-1',
        message: '[skills.ki-repo] supported_runtimes uses retired runtime(s): codex; use chatgpt-codex',
        subject: expect.any(String)
      }
    ])
  })

  test('accepts a canonical ki-self with the Claude projection for declared runtimes', async () => {
    const root = repository()
    mkdirSync(join(root, '.agents', 'skills', 'ki-self'), { recursive: true })
    writeFileSync(join(root, '.agents', 'skills', 'ki-self', 'SKILL.md'), '# KI Self\n')
    mkdirSync(join(root, '.claude', 'skills'), { recursive: true })
    symlinkSync('../../.agents/skills/ki-self', join(root, '.claude', 'skills', 'ki-self'), 'dir')
    writeFileSync(join(root, '.ki.toml'), '[skills.ki-repo]\nsupported_runtimes = ["claude-code", "chatgpt-codex"]\n')

    expect((await collectAuditFindings([root])).findings.filter(({ code }) => code === 'RUNTIMES-3')).toEqual([])
  })

  test('requires a Claude projection only when Claude Code is declared', async () => {
    const root = repository()
    mkdirSync(join(root, '.agents', 'skills', 'ki-self'), { recursive: true })
    writeFileSync(join(root, '.agents', 'skills', 'ki-self', 'SKILL.md'), '# KI Self\n')
    writeFileSync(join(root, '.ki.toml'), '[skills.ki-repo]\nsupported_runtimes = ["claude-code"]\n')

    expect((await collectAuditFindings([root])).findings).toContainEqual(
      expect.objectContaining({
        code: 'RUNTIMES-3',
        message: expect.stringContaining('declares claude-code but lacks')
      })
    )
  })

  test('rejects copied and undeclared Claude projections', async () => {
    const root = repository()
    mkdirSync(join(root, '.agents', 'skills', 'ki-self'), { recursive: true })
    mkdirSync(join(root, '.claude', 'skills', 'ki-self'), { recursive: true })
    writeFileSync(join(root, '.agents', 'skills', 'ki-self', 'SKILL.md'), '# KI Self\n')
    writeFileSync(join(root, '.claude', 'skills', 'ki-self', 'SKILL.md'), '# KI Self\n')
    writeFileSync(join(root, '.ki.toml'), '[skills.ki-repo]\nsupported_runtimes = ["claude-code"]\n')

    expect((await collectAuditFindings([root])).findings).toContainEqual(
      expect.objectContaining({
        code: 'RUNTIMES-3',
        message: expect.stringContaining('must be a relative symbolic link')
      })
    )

    rmSync(join(root, '.claude'), { recursive: true, force: true })
    mkdirSync(join(root, '.claude', 'skills'), { recursive: true })
    symlinkSync('../../.agents/skills/ki-self', join(root, '.claude', 'skills', 'ki-self'), 'dir')
    writeFileSync(join(root, '.ki.toml'), '[skills.ki-repo]\nsupported_runtimes = ["chatgpt-codex"]\n')

    expect((await collectAuditFindings([root])).findings).toContainEqual(
      expect.objectContaining({ code: 'RUNTIMES-3', message: expect.stringContaining('claude-code is not declared') })
    )
  })
})

describe('root runtime orientation', () => {
  const findings = async (
    runtimes: string,
    agents?: string,
    claude?: string
  ): Promise<readonly { code: string; level: string; message: string; subject?: string }[]> => {
    const root = repository()
    writeFileSync(join(root, '.ki.toml'), `[skills.ki-repo]\nsupported_runtimes = ${runtimes}\n`)
    if (agents !== undefined) writeFileSync(join(root, 'AGENTS.md'), agents)
    if (claude !== undefined) writeFileSync(join(root, 'CLAUDE.md'), claude)
    return (await collectAuditFindings([root])).findings.filter(({ code }) => code === 'RUNTIMES-4')
  }

  test('requires a physical root AGENTS.md only for multi-runtime repositories', async () => {
    expect(await findings('["claude-code", "chatgpt-codex"]')).toEqual([
      expect.objectContaining({
        code: 'RUNTIMES-4',
        level: 'WARN',
        message: expect.stringContaining('requires a physical root AGENTS.md'),
        subject: expect.stringContaining('AGENTS.md')
      })
    ])
    expect(await findings('["claude-code"]')).toEqual([])
  })

  test('requires a bare Claude import and rejects reverse orientation', async () => {
    expect(await findings('["claude-code", "chatgpt-codex"]', '# Shared\n\nUseful guidance.\n', '# Claude\n')).toEqual([
      expect.objectContaining({
        code: 'RUNTIMES-4',
        message: expect.stringContaining('bare @AGENTS.md import line')
      })
    ])
    expect(
      await findings(
        '["claude-code", "chatgpt-codex"]',
        '# Orientation\n\nRead `CLAUDE.md` for repository orientation.\n',
        '@AGENTS.md\n'
      )
    ).toEqual([
      expect.objectContaining({
        code: 'RUNTIMES-4',
        message: expect.stringContaining('redirects shared orientation')
      })
    ])
  })

  test('accepts substantive shared orientation and a thin Claude import', async () => {
    expect(
      await findings(
        '["claude-code", "chatgpt-codex"]',
        '# Orientation\n\nShared repository guidance.\n\n`CLAUDE.md` may add Claude-only notes.\n',
        '@AGENTS.md\n\n# Claude-only notes\n'
      )
    ).toEqual([])
  })
})

describe('repository kind and Knowledge Base stores', () => {
  const kindFindings = async (configuration: string) => {
    const root = repository()
    writeFileSync(join(root, '.ki.toml'), configuration)
    return (await collectAuditFindings([root])).findings.filter(({ code }) => code === 'KIND-1' || code === 'KIND-2')
  }

  test('accepts a KB with the canonical notes role and KB structure', async () => {
    expect(
      await kindFindings(`[skills.ki-repo]
repo_type = "kb"
store_roles = ["notes", "sources"]

[skills.ki-repo-kb]
`)
    ).toEqual([])
  })

  test('rejects invalid roles and incompatible structures', async () => {
    expect(
      await kindFindings(`[skills.ki-repo]
repo_type = "kb"
store_roles = ["sources"]
`)
    ).toContainEqual(
      expect.objectContaining({ code: 'KIND-1', message: expect.stringContaining('must include notes') })
    )
    expect(
      await kindFindings(`[skills.ki-repo]
repo_type = "repository"

[skills.ki-repo-kb]
`)
    ).toContainEqual(
      expect.objectContaining({ code: 'KIND-2', message: expect.stringContaining('requires repo_type = "kb"') })
    )
  })

  test('does not accept a legacy kind declaration outside ki-repo', async () => {
    expect(
      await kindFindings(`[skills.ki-repo]

[skills.ki-repo-kb]

[skills.ki-decision-records]
repo_type = "kb"
`)
    ).toContainEqual(
      expect.objectContaining({ code: 'KIND-2', message: expect.stringContaining('requires repo_type = "kb"') })
    )
  })
})

describe('local repository evidence', () => {
  test('uses the checkout tree, including unpushed content and excluding ignored dependencies', async () => {
    const root = repository()
    mkdirSync(join(root, 'skills', 'ki-example'), { recursive: true })
    mkdirSync(join(root, 'node_modules', 'ignored'), { recursive: true })
    writeFileSync(join(root, '.gitignore'), 'node_modules/\n')
    writeFileSync(join(root, 'README.md'), '# Local\n')
    writeFileSync(join(root, 'skills', 'ki-example', 'SKILL.md'), '# Example\n')
    writeFileSync(join(root, 'node_modules', 'ignored', 'package.json'), '{}\n')

    expect(localTreePaths(root)).toEqual(new Set(['.gitignore', 'README.md', 'skills/ki-example/SKILL.md']))
  })

  test('labels local-content findings with their checkout source', async () => {
    const root = repository()
    writeFileSync(join(root, 'README.md'), '# Local\n')

    const findings = (await collectAuditFindings([root])).findings
    expect(findings.find((finding) => finding.code === 'FILES-1')?.subject).toContain('[local checkout]')
  })

  test('requires declared identity and keeps roadmap repo_code in the ki-repo table', async () => {
    const root = repository()
    writeFileSync(join(root, 'README.md'), '# Actual title\n')
    writeFileSync(
      join(root, '.ki.toml'),
      '[skills.ki-repo]\ntitle = "Configured title"\ndescription = "Configured description."\n\n[skills.ki-work-roadmap]\n'
    )

    const findings = (await collectAuditFindings([root])).findings.filter((finding) => finding.code === 'FILES-2')
    expect(findings).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining('README.md H1 must equal') })
    )
    expect(findings).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining('repo_code must be a stable uppercase identifier') })
    )
  })

  test('detects the optional checkpoints subarea without creating or interpreting it', async () => {
    const root = repository()
    mkdirSync(join(root, '+', '_CHECKPOINTS'), { recursive: true })
    writeFileSync(join(root, '+', '_CHECKPOINTS', 'Thread.md'), '# Thread\n')
    writeFileSync(join(root, '.ki.toml'), '[skills.ki-repo]\n')

    const findings = (await collectAuditFindings([root])).findings.filter((finding) => finding.code === 'COV-1')
    expect(findings).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining('looks governed by ki-checkpoint') })
    )

    writeFileSync(join(root, '.ki.toml'), '[skills.ki-repo]\n\n[skills.ki-checkpoint]\n')
    expect((await collectAuditFindings([root])).findings.filter((finding) => finding.code === 'COV-1')).toEqual([])
  })

  test('requires documentation skills for their governed roots or explicit coverage opt-outs', async () => {
    const root = repository()
    for (const path of [
      ['docs', 'decisions', 'README.md'],
      ['docs', 'specs', 'index.md'],
      ['docs', 'guides', 'README.md']
    ]) {
      mkdirSync(join(root, ...path.slice(0, -1)), { recursive: true })
      writeFileSync(join(root, ...path), '# Collection\n')
    }
    writeFileSync(join(root, '.ki.toml'), '[skills.ki-repo]\n')

    const missing = (await collectAuditFindings([root])).findings.filter(
      (finding) => finding.code === 'COV-1' && finding.level === 'FAIL'
    )
    for (const skill of ['ki-decision-records', 'ki-specs', 'ki-guides']) {
      expect(missing).toContainEqual(expect.objectContaining({ message: expect.stringContaining(skill) }))
    }

    writeFileSync(
      join(root, '.ki.toml'),
      `[skills.ki-repo]

[skills.ki-repo.checks]
coverage-decision-records = false
coverage-specs = false
coverage-guides = false
`
    )
    const optedOut = (await collectAuditFindings([root])).findings.filter((finding) => finding.code === 'COV-1')
    expect(optedOut).toHaveLength(3)
    expect(optedOut.every((finding) => finding.level === 'INFO')).toBe(true)
  })

  test('detects the Knowledge Base decision collection path', async () => {
    const root = repository()
    mkdirSync(join(root, 'Admin', 'Governance', 'Decisions'), { recursive: true })
    writeFileSync(join(root, 'Admin', 'Governance', 'Decisions', 'Decisions.md'), '# Decisions\n')
    writeFileSync(join(root, '.ki.toml'), '[skills.ki-repo]\n')

    const coverage = (await collectAuditFindings([root])).findings.filter((finding) => finding.code === 'COV-1')
    expect(coverage).toContainEqual(
      expect.objectContaining({
        level: 'FAIL',
        message: expect.stringContaining('ki-decision-records')
      })
    )
  })

  for (const fixture of [
    {
      name: 'legacy-only',
      dependencies: { '@modelcontextprotocol/sdk': '^1.0.0' },
      detected: true
    },
    {
      name: 'modern-only',
      dependencies: { '@modelcontextprotocol/server': '^2.0.0' },
      detected: true
    },
    { name: 'neither-package', dependencies: { hono: '^4.0.0' }, detected: false },
    {
      name: 'both-package',
      dependencies: {
        '@modelcontextprotocol/sdk': '^1.0.0',
        '@modelcontextprotocol/server': '^2.0.0'
      },
      detected: true
    }
  ]) {
    test(`detects MCP coverage for the ${fixture.name} fixture`, async () => {
      const root = repository()
      writeFileSync(join(root, 'package.json'), JSON.stringify({ dependencies: fixture.dependencies }))
      writeFileSync(join(root, '.ki.toml'), '[skills.ki-repo]\n\n[skills.ki-engineering]\n')

      const findings = (await collectAuditFindings([root])).findings.filter(
        (finding) => finding.code === 'COV-1' && finding.message.includes('[skills.ki-repo-mcp]')
      )

      if (!fixture.detected) {
        expect(findings).toEqual([])
        return
      }

      expect(findings).toEqual([
        expect.objectContaining({
          level: 'FAIL',
          message: expect.stringContaining('@modelcontextprotocol/sdk or @modelcontextprotocol/server dependency')
        })
      ])
    })
  }

  test('separates website coverage and enforces one purpose-specific implementation', async () => {
    const root = repository()
    mkdirSync(join(root, 'apps', 'site'), { recursive: true })
    writeFileSync(join(root, 'apps', 'site', 'vite.config.ts'), 'export default {}\n')
    writeFileSync(
      join(root, 'apps', 'site', 'package.json'),
      JSON.stringify({ dependencies: { react: '^19.0.0' }, devDependencies: { vite: '^7.0.0' } })
    )
    writeFileSync(join(root, '.ki.toml'), '[skills.ki-repo]\n')

    const coverage = (await collectAuditFindings([root])).findings.filter((finding) => finding.code === 'COV-1')
    expect(coverage).toContainEqual(expect.objectContaining({ message: expect.stringContaining('ki-website (') }))
    expect(coverage).toContainEqual(expect.objectContaining({ message: expect.stringContaining('ki-website-app') }))

    writeFileSync(
      join(root, '.ki.toml'),
      '[skills.ki-repo]\n\n[skills.ki-repo-website]\n\n[skills.ki-repo-website-content]\n\n[skills.ki-repo-website-app]\n'
    )
    const structure = (await collectAuditFindings([root])).findings.filter((finding) => finding.code === 'STRUCT-3')
    expect(structure).toContainEqual(
      expect.objectContaining({ level: 'FAIL', message: expect.stringContaining('choose content or app') })
    )
  })

  test('uses the website core site root to discover a nested app manifest', async () => {
    const root = repository()
    mkdirSync(join(root, 'web'), { recursive: true })
    writeFileSync(join(root, 'web', 'vite.config.ts'), 'export default {}\n')
    writeFileSync(
      join(root, 'web', 'package.json'),
      JSON.stringify({ dependencies: { react: '^19.0.0' }, devDependencies: { vite: '^7.0.0' } })
    )
    writeFileSync(join(root, '.ki.toml'), '[skills.ki-repo]\n\n[skills.ki-repo-website]\nsite-root = "web"\n')

    const coverage = (await collectAuditFindings([root])).findings.filter((finding) => finding.code === 'COV-1')
    expect(coverage).toContainEqual(expect.objectContaining({ message: expect.stringContaining('ki-website-app') }))
    expect(coverage).not.toContainEqual(expect.objectContaining({ message: expect.stringContaining('ki-website (') }))
  })

  test('requires the portable parent and Claude adapter for Markdown subagent projections', async () => {
    const root = repository()
    mkdirSync(join(root, 'subagents', 'governance'), { recursive: true })
    writeFileSync(join(root, 'subagents', 'governance', 'reviewer.md'), '# Reviewer\n')
    writeFileSync(join(root, '.ki.toml'), '[skills.ki-repo]\n')

    const findings = (await collectAuditFindings([root])).findings.filter((finding) => finding.code === 'COV-1')
    expect(findings).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining('looks governed by ki-subagents (') })
    )
    expect(findings).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining('looks governed by ki-subagents-claude') })
    )

    writeFileSync(join(root, '.ki.toml'), '[skills.ki-repo]\n\n[skills.ki-subagents]\n\n[skills.ki-subagents-claude]\n')
    expect((await collectAuditFindings([root])).findings.filter((finding) => finding.code === 'COV-1')).toEqual([])
  })

  test('requires the portable parent and Codex adapter for TOML subagent projections', async () => {
    const root = repository()
    mkdirSync(join(root, '.codex', 'agents'), { recursive: true })
    writeFileSync(join(root, '.codex', 'agents', 'reviewer.toml'), 'name = "reviewer"\n')
    writeFileSync(join(root, '.ki.toml'), '[skills.ki-repo]\n')

    const findings = (await collectAuditFindings([root])).findings.filter((finding) => finding.code === 'COV-1')
    expect(findings).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining('looks governed by ki-subagents (') })
    )
    expect(findings).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining('looks governed by ki-subagents-codex') })
    )

    writeFileSync(join(root, '.ki.toml'), '[skills.ki-repo]\n\n[skills.ki-subagents]\n\n[skills.ki-subagents-codex]\n')
    expect((await collectAuditFindings([root])).findings.filter((finding) => finding.code === 'COV-1')).toEqual([])
  })

  test('fails a selected local target rather than falling back to GitHub content', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ki-repo-broken-local-'))
    roots.push(root)
    writeFileSync(join(root, '.git'), 'not a git directory\n')

    expect((await collectAuditFindings([root])).findings).toContainEqual(
      expect.objectContaining({ level: 'FAIL', code: 'ACCESS-1', subject: expect.stringContaining('[local checkout]') })
    )
  })
})
