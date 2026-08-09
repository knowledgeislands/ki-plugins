import { afterEach, describe, expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import type { RubricContextOptions } from '../../shared/rubric.ts'
import { FILES } from '../items/files.ts'
import { WORK } from '../items/working-areas.ts'
import { collectAuditFindings, localTreePaths } from './audit.ts'
import { createRepoSession, type FilesRubricContext, type WorkingAreasRubricContext } from './repository.ts'

const roots: string[] = []

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
    { level: 'FAIL' as const, code: 'FILES-4', message: 'runtime skill ignore rules are absent' }
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
    expect(proposal.writes.map((write) => write.path)).toEqual(['.ki-config.toml', '.gitignore'])
    expect(proposal.writes[0]?.create).toBe(true)
    expect(proposal.writes[0]?.content).toContain('[skills.ki-repo]')
    expect(proposal.writes[0]?.content).toContain('[skills.ki-authoring]')
  })

  test('appends only a missing exact root marker and preserves the original bytes', async () => {
    const root = repository()
    const original = '# retained\n[skills.ki-repo.checks]\nwiki = false\n'
    writeFileSync(join(root, '.ki-config.toml'), original)
    const session = await createRepoSession(options(root, 'conform'), inspect)
    runFilesConform(filesContext(session))

    const config = session.proposal().writes.find((write) => write.path === '.ki-config.toml')
    expect(config?.create).toBeUndefined()
    expect(config?.content.startsWith(original)).toBe(true)
    expect(config?.content).toContain('\n[skills.ki-repo]\n')
    expect(config?.content).toContain('\n[skills.ki-authoring]\n')
  })

  test('replaces legacy runtime-skill ignores with the canonical ki-self exception', async () => {
    const root = repository()
    writeFileSync(
      join(root, '.ki-config.toml'),
      '[skills.ki-repo]\nsupported_runtimes = ["claude-code", "chatgpt-codex"]\n'
    )
    mkdirSync(join(root, '.agents', 'skills', 'ki-self'), { recursive: true })
    writeFileSync(join(root, '.agents', 'skills', 'ki-self', 'SKILL.md'), '# KI Self\n')
    writeFileSync(join(root, '.gitignore'), 'node_modules/\n.claude/skills/*\n.agents/skills/\n')
    const session = await createRepoSession(options(root, 'conform'), inspect)
    runFilesConform(filesContext(session))

    const gitignore = session.proposal().writes.find((write) => write.path === '.gitignore')
    expect(gitignore?.create).toBeUndefined()
    expect(gitignore?.content).toBe(
      'node_modules/\n\n# Generated project-local runtime payloads (ki-bootstrap) — never committed\n.claude/skills/*\n.agents/skills/*\n!.agents/skills/ki-self/\n!.agents/skills/ki-self/**\n'
    )
  })

  test('derives runtime-skill ignores from supported runtimes while reserving ki-self', async () => {
    const root = repository()
    writeFileSync(join(root, '.ki-config.toml'), '[skills.ki-repo]\nsupported_runtimes = ["claude-code"]\n')
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

    writeFileSync(join(root, '.ki-config.toml'), '[skills.ki-repo]\nsupported_runtimes = ["chatgpt-codex"]\n')
    writeFileSync(join(root, '.gitignore'), '.agents/skills/*\n!.agents/skills/ki-self/\n!.agents/skills/ki-self/**\n')
    expect((await collectAuditFindings([root])).findings).not.toContainEqual(
      expect.objectContaining({ code: 'FILES-4' })
    )
  })

  // Emission is observational: a rubric that reported differently when watched would make
  // progress part of the contract under audit, and a finding that turned on whether a display
  // was attached could not be defended. The inspector is recorded rather than asserted on
  // directly, because the emitter must also reach the evidence gathering, not just the session.
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
    symlinkSync('outside.toml', join(root, '.ki-config.toml'))

    const audit = await createRepoSession(options(root, 'audit'), inspect)
    expect(audit.proposal()).toEqual({ writes: [] })

    const conform = await createRepoSession(options(root, 'conform'), inspect)
    const context = filesContext(conform)
    expect(context.ensureRepoConfiguration).toBeUndefined()
    expect(context.ensureAuthoringConfiguration).toBeUndefined()
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
    writeFileSync(join(root, '.ki-config.toml'), configuration)
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

  test('accepts the complete environment matrix for both runtimes', async () => {
    expect(
      await runtimeFindings(`[skills.ki-repo]
supported_runtimes = ["claude-code", "chatgpt-codex"]

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
    writeFileSync(
      join(root, '.ki-config.toml'),
      '[skills.ki-repo]\nsupported_runtimes = ["claude-code", "chatgpt-codex"]\n'
    )

    expect((await collectAuditFindings([root])).findings.filter(({ code }) => code === 'RUNTIMES-3')).toEqual([])
  })

  test('requires a Claude projection only when Claude Code is declared', async () => {
    const root = repository()
    mkdirSync(join(root, '.agents', 'skills', 'ki-self'), { recursive: true })
    writeFileSync(join(root, '.agents', 'skills', 'ki-self', 'SKILL.md'), '# KI Self\n')
    writeFileSync(join(root, '.ki-config.toml'), '[skills.ki-repo]\nsupported_runtimes = ["claude-code"]\n')

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
    writeFileSync(join(root, '.ki-config.toml'), '[skills.ki-repo]\nsupported_runtimes = ["claude-code"]\n')

    expect((await collectAuditFindings([root])).findings).toContainEqual(
      expect.objectContaining({
        code: 'RUNTIMES-3',
        message: expect.stringContaining('must be a relative symbolic link')
      })
    )

    rmSync(join(root, '.claude'), { recursive: true, force: true })
    mkdirSync(join(root, '.claude', 'skills'), { recursive: true })
    symlinkSync('../../.agents/skills/ki-self', join(root, '.claude', 'skills', 'ki-self'), 'dir')
    writeFileSync(join(root, '.ki-config.toml'), '[skills.ki-repo]\nsupported_runtimes = ["chatgpt-codex"]\n')

    expect((await collectAuditFindings([root])).findings).toContainEqual(
      expect.objectContaining({ code: 'RUNTIMES-3', message: expect.stringContaining('claude-code is not declared') })
    )
  })
})

describe('repository kind and Knowledge Base stores', () => {
  const kindFindings = async (configuration: string) => {
    const root = repository()
    writeFileSync(join(root, '.ki-config.toml'), configuration)
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
      join(root, '.ki-config.toml'),
      '[skills.ki-repo]\ntitle = "Configured title"\ndescription = "Configured description."\n\n[skills.ki-change-management-roadmap]\n'
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
    writeFileSync(join(root, '.ki-config.toml'), '[skills.ki-repo]\n')

    const findings = (await collectAuditFindings([root])).findings.filter((finding) => finding.code === 'COV-1')
    expect(findings).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining('looks governed by ki-checkpoint') })
    )

    writeFileSync(join(root, '.ki-config.toml'), '[skills.ki-repo]\n\n[skills.ki-checkpoint]\n')
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
