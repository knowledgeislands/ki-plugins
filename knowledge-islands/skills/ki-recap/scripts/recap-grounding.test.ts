#!/usr/bin/env bun
import { describe, expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const helper = join(dirname(fileURLToPath(import.meta.url)), 'recap-grounding.ts')
const fixture = () => mkdtempSync(join(tmpdir(), 'ki-work-recap-'))
const claudeToolUse = (name: string, input: unknown) =>
  JSON.stringify({ message: { content: [{ type: 'tool_use', name, input }] } })
const claudeToolResult = (text: string) =>
  JSON.stringify({ message: { content: [{ type: 'tool_result', content: text }] } })
const codexMeta = (cwd: string) => JSON.stringify({ type: 'session_meta', payload: { cwd } })
const codexFunction = (name: string, arguments_: unknown) =>
  JSON.stringify({
    type: 'response_item',
    payload: { type: 'function_call', name, arguments: JSON.stringify(arguments_) }
  })
const codexCustom = (name: string, input: unknown) =>
  JSON.stringify({ type: 'response_item', payload: { type: 'custom_tool_call', name, input } })
const codexOutput = (text: string) =>
  JSON.stringify({
    type: 'response_item',
    payload: { type: 'custom_tool_call_output', output: [{ type: 'input_text', text }] }
  })
const evidence = (repo: string, head: string | null, worktree: 'clean' | 'dirty') =>
  JSON.stringify({ 'ki-work-recap-repository-evidence/v1': { repo, head, worktree } })

const physical = (path: string): string => realpathSync(resolve(path))

const run = (repo: string, transcripts: string, args: readonly string[] = []) => {
  const result = spawnSync('bun', [helper, repo, '--json', '--transcripts-dir', transcripts, ...args], {
    encoding: 'utf8'
  })
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`
  }
}

const git = (repository: string, args: readonly string[]): string => {
  const result = spawnSync('git', ['-C', repository, ...args], { encoding: 'utf8' })
  expect(result.status).toBe(0)
  return result.stdout.trim()
}

const initialiseRepository = (repository: string): string => {
  mkdirSync(repository, { recursive: true })
  git(repository, ['init', '--quiet'])
  writeFileSync(join(repository, 'evidence.txt'), 'initial\n')
  git(repository, ['add', 'evidence.txt'])
  git(repository, ['-c', 'user.email=test@example.com', '-c', 'user.name=Test', 'commit', '--quiet', '-m', 'initial'])
  return git(repository, ['rev-parse', 'HEAD'])
}

describe('recap grounding runtime selection', () => {
  test('detect chooses the newest eligible Claude or Codex transcript and normalizes Codex calls', () => {
    const root = fixture()
    const repo = join(root, 'repo')
    const otherRepo = join(root, 'other-repo')
    const transcripts = join(root, 'transcripts')
    const claude = join(transcripts, 'claude.jsonl')
    const codex = join(transcripts, '2026', '07', 'codex.jsonl')
    const irrelevant = join(transcripts, '2026', '07', 'other.jsonl')
    try {
      initialiseRepository(repo)
      initialiseRepository(otherRepo)
      mkdirSync(dirname(codex), { recursive: true })
      writeFileSync(claude, `${claudeToolUse('Read', { file_path: '/x/claude.md' })}\n`)
      writeFileSync(
        codex,
        `${codexMeta(physical(repo))}\nmalformed JSON\n${codexFunction('Bash', { command: 'pwd' })}\n${codexCustom('Read', { file_path: '/x/codex.md' })}\n`
      )
      writeFileSync(
        irrelevant,
        `${codexMeta(physical(otherRepo))}\n${codexFunction('Edit', { file_path: '/x/other.md' })}\n`
      )
      const now = Date.now() / 1000
      utimesSync(claude, now - 20, now - 20)
      utimesSync(codex, now, now)
      utimesSync(irrelevant, now + 20, now + 20)

      const result = run(repo, transcripts)
      const grounded = JSON.parse(result.stdout) as {
        runtime: string
        transcript: string
        toolTally: Record<string, number>
      }
      expect(result.status).toBe(0)
      expect(grounded.runtime).toBe('codex')
      expect(grounded.transcript).toBe(codex)
      expect(grounded.toolTally).toEqual({ Bash: 1, Read: 1 })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('forced runtime selects only that runtime and explicit basename selects only eligible candidates', () => {
    const root = fixture()
    const repo = join(root, 'repo')
    const transcripts = join(root, 'transcripts')
    const claude = join(transcripts, 'claude.jsonl')
    const codexOld = join(transcripts, 'sessions', 'codex-old.jsonl')
    const codexNew = join(transcripts, 'sessions', 'codex-new.jsonl')
    try {
      initialiseRepository(repo)
      mkdirSync(dirname(codexOld), { recursive: true })
      writeFileSync(claude, `${claudeToolUse('Read', { file_path: '/x/claude.md' })}\n`)
      writeFileSync(codexOld, `${codexMeta(physical(repo))}\n${codexFunction('Bash', { command: 'old' })}\n`)
      writeFileSync(codexNew, `${codexMeta(physical(repo))}\n${codexFunction('Bash', { command: 'new' })}\n`)
      const now = Date.now() / 1000
      utimesSync(claude, now - 30, now - 30)
      utimesSync(codexOld, now - 20, now - 20)
      utimesSync(codexNew, now, now)

      const forcedClaude = JSON.parse(run(repo, transcripts, ['--runtime', 'claude']).stdout) as {
        runtime: string
        transcript: string
      }
      expect(forcedClaude.runtime).toBe('claude')
      expect(forcedClaude.transcript).toBe(claude)

      const explicitCodex = run(repo, transcripts, ['--runtime', 'codex', '--transcript', 'codex-old.jsonl'])
      const grounded = JSON.parse(explicitCodex.stdout) as { runtime: string; transcript: string }
      expect(explicitCodex.status).toBe(0)
      expect(grounded.runtime).toBe('codex')
      expect(grounded.transcript).toBe(codexOld)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('Codex filtering selects only transcripts whose session metadata names the requested repository', () => {
    const root = fixture()
    const repo = join(root, 'repo')
    const otherRepo = join(root, 'other-repo')
    const transcripts = join(root, 'transcripts')
    const matching = join(transcripts, 'matching.jsonl')
    const other = join(transcripts, 'other.jsonl')
    try {
      initialiseRepository(repo)
      initialiseRepository(otherRepo)
      mkdirSync(transcripts, { recursive: true })
      writeFileSync(
        matching,
        `${codexMeta(physical(repo))}\n${codexFunction('Read', { file_path: '/x/matching.md' })}\n`
      )
      writeFileSync(
        other,
        `${codexMeta(physical(otherRepo))}\n${codexFunction('Read', { file_path: '/x/other.md' })}\n`
      )
      const result = run(repo, transcripts, ['--runtime', 'codex'])
      const grounded = JSON.parse(result.stdout) as { runtime: string; transcript: string }
      expect(result.status).toBe(0)
      expect(grounded.runtime).toBe('codex')
      expect(grounded.transcript).toBe(matching)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('rejects unsafe or ineligible explicit selectors', () => {
    const root = fixture()
    const repo = join(root, 'repo')
    const transcripts = join(root, 'transcripts')
    const valid = join(transcripts, 'valid.jsonl')
    try {
      mkdirSync(repo, { recursive: true })
      mkdirSync(transcripts, { recursive: true })
      writeFileSync(valid, `${claudeToolUse('Read', { file_path: '/x/valid.md' })}\n`)
      mkdirSync(join(transcripts, 'directory.jsonl'))
      symlinkSync(valid, join(transcripts, 'linked.jsonl'))
      for (const selector of ['../valid.jsonl', valid, 'valid.txt', 'missing.jsonl', 'directory.jsonl', 'linked.jsonl'])
        expect(run(repo, transcripts, ['--transcript', selector]).status).not.toBe(0)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('help and no-transcript paths remain successful', () => {
    const root = fixture()
    const repo = join(root, 'repo')
    const transcripts = join(root, 'transcripts')
    try {
      mkdirSync(repo, { recursive: true })
      mkdirSync(transcripts, { recursive: true })
      const help = spawnSync('bun', [helper, '--help'], { encoding: 'utf8' })
      expect(help.status).toBe(0)
      expect(help.stdout).toContain('--runtime detect|claude|codex')
      const result = run(repo, transcripts)
      const grounded = JSON.parse(result.stdout) as { runtime: null; transcript: null }
      expect(result.status).toBe(0)
      expect(grounded.runtime).toBeNull()
      expect(grounded.transcript).toBeNull()
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('emits and compares an exact Codex repository-evidence marker', () => {
    const root = fixture()
    const repo = join(root, 'repo')
    const transcripts = join(root, 'transcripts')
    const codex = join(transcripts, 'codex.jsonl')
    try {
      const baseline = initialiseRepository(repo)
      mkdirSync(transcripts, { recursive: true })
      writeFileSync(codex, [codexMeta(repo), codexOutput(evidence(physical(repo), baseline, 'clean')), ''].join('\n'))

      const unchanged = JSON.parse(run(repo, transcripts, ['--runtime', 'codex']).stdout) as {
        'ki-work-recap-repository-evidence/v1': { repo: string; head: string; worktree: string }
        transcriptEvidence: { status: string; baseline: { head: string } }
      }
      expect(unchanged['ki-work-recap-repository-evidence/v1']).toEqual({
        repo: physical(repo),
        head: baseline,
        worktree: 'clean'
      })
      expect(unchanged.transcriptEvidence).toMatchObject({ status: 'unchanged', baseline: { head: baseline } })

      writeFileSync(join(repo, 'evidence.txt'), 'changed\n')
      git(repo, ['add', 'evidence.txt'])
      git(repo, ['-c', 'user.email=test@example.com', '-c', 'user.name=Test', 'commit', '--quiet', '-m', 'changed'])
      const changed = JSON.parse(run(repo, transcripts, ['--runtime', 'codex']).stdout) as {
        transcriptEvidence: { status: string; commitRange?: string; changedPaths?: string[] }
      }
      expect(changed.transcriptEvidence.status).toBe('changed')
      expect(changed.transcriptEvidence.commitRange).toStartWith(`${baseline}..`)
      expect(changed.transcriptEvidence.changedPaths).toEqual(['evidence.txt'])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('rejects malformed, foreign, and uncertain transcript evidence', () => {
    const root = fixture()
    const repo = join(root, 'repo')
    const otherRepo = join(root, 'other-repo')
    const transcripts = join(root, 'transcripts')
    const claude = join(transcripts, 'claude.jsonl')
    try {
      const baseline = initialiseRepository(repo)
      mkdirSync(otherRepo, { recursive: true })
      mkdirSync(transcripts, { recursive: true })
      writeFileSync(
        claude,
        [
          claudeToolResult('{not json}'),
          claudeToolResult(evidence(physical(otherRepo), baseline, 'clean')),
          claudeToolResult(evidence(physical(repo), baseline, 'dirty')),
          ''
        ].join('\n')
      )
      writeFileSync(join(repo, 'uncommitted.txt'), 'current dirty state\n')
      const uncertain = JSON.parse(run(repo, transcripts, ['--runtime', 'claude']).stdout) as {
        transcriptEvidence: { status: string; baseline: { head: string; worktree: string } }
      }
      expect(uncertain.transcriptEvidence).toMatchObject({
        status: 'unavailable',
        baseline: { head: baseline, worktree: 'dirty' }
      })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('grounds the physical Git root and separates staged, unstaged, and untracked changes', () => {
    const root = fixture()
    const repo = join(root, 'repo')
    const nested = join(repo, 'nested')
    const transcripts = join(root, 'transcripts')
    try {
      initialiseRepository(repo)
      mkdirSync(nested)
      writeFileSync(join(repo, 'evidence.txt'), 'staged\n')
      git(repo, ['add', 'evidence.txt'])
      writeFileSync(join(repo, 'unstaged.txt'), 'unstaged\n')
      writeFileSync(join(repo, 'untracked.txt'), 'untracked\n')
      mkdirSync(transcripts)

      const grounded = JSON.parse(run(nested, transcripts).stdout) as {
        repo: string
        repository: { status: string; root: string }
        stagedFiles: string[]
        unstagedFiles: string[]
        untrackedFiles: string[]
        diffStat: string
      }
      expect(grounded.repo).toBe(physical(repo))
      expect(grounded.repository).toMatchObject({ status: 'available', root: physical(repo) })
      expect(grounded.stagedFiles).toEqual(['evidence.txt'])
      expect(grounded.unstagedFiles).toEqual([])
      expect(grounded.untrackedFiles).toEqual(['unstaged.txt', 'untracked.txt'])
      expect(grounded.diffStat).toContain('evidence.txt')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('reports Git failure as unavailable rather than clean', () => {
    const root = fixture()
    const transcripts = join(root, 'transcripts')
    try {
      mkdirSync(transcripts, { recursive: true })
      const grounded = JSON.parse(run(root, transcripts).stdout) as {
        repository: { status: string; root: null; reason: string }
        filesTouched: string[]
        'ki-work-recap-repository-evidence/v1': null
        transcriptEvidence: { status: string; current: null }
      }
      expect(grounded.repository).toMatchObject({ status: 'unavailable', root: null })
      expect(grounded.filesTouched).toEqual([])
      expect(grounded['ki-work-recap-repository-evidence/v1']).toBeNull()
      expect(grounded.transcriptEvidence).toMatchObject({ status: 'unavailable', current: null })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
