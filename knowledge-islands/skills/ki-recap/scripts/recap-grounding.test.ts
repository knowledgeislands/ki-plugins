#!/usr/bin/env bun
import { describe, expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const helper = join(dirname(fileURLToPath(import.meta.url)), 'recap-grounding.ts')
const fixture = () => mkdtempSync(join(tmpdir(), 'ki-recap-'))
const claudeToolUse = (name: string, input: unknown) => JSON.stringify({ message: { content: [{ type: 'tool_use', name, input }] } })
const codexMeta = (cwd: string) => JSON.stringify({ type: 'session_meta', payload: { cwd } })
const codexFunction = (name: string, arguments_: unknown) =>
  JSON.stringify({ type: 'response_item', payload: { type: 'function_call', name, arguments: JSON.stringify(arguments_) } })
const codexCustom = (name: string, input: unknown) =>
  JSON.stringify({ type: 'response_item', payload: { type: 'custom_tool_call', name, input } })

const run = (repo: string, transcripts: string, args: readonly string[] = []) => {
  const result = spawnSync('bun', [helper, repo, '--json', '--transcripts-dir', transcripts, ...args], { encoding: 'utf8' })
  return { status: result.status ?? 1, stdout: result.stdout ?? '', output: `${result.stdout ?? ''}${result.stderr ?? ''}` }
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
      mkdirSync(repo, { recursive: true })
      mkdirSync(otherRepo, { recursive: true })
      mkdirSync(dirname(codex), { recursive: true })
      writeFileSync(claude, `${claudeToolUse('Read', { file_path: '/x/claude.md' })}\n`)
      writeFileSync(
        codex,
        `${codexMeta(repo)}\nmalformed JSON\n${codexFunction('Bash', { command: 'pwd' })}\n${codexCustom('Read', { file_path: '/x/codex.md' })}\n`
      )
      writeFileSync(irrelevant, `${codexMeta(otherRepo)}\n${codexFunction('Edit', { file_path: '/x/other.md' })}\n`)
      const now = Date.now() / 1000
      utimesSync(claude, now - 20, now - 20)
      utimesSync(codex, now, now)
      utimesSync(irrelevant, now + 20, now + 20)

      const result = run(repo, transcripts)
      const grounded = JSON.parse(result.stdout) as { runtime: string; transcript: string; toolTally: Record<string, number> }
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
      mkdirSync(repo, { recursive: true })
      mkdirSync(dirname(codexOld), { recursive: true })
      writeFileSync(claude, `${claudeToolUse('Read', { file_path: '/x/claude.md' })}\n`)
      writeFileSync(codexOld, `${codexMeta(repo)}\n${codexFunction('Bash', { command: 'old' })}\n`)
      writeFileSync(codexNew, `${codexMeta(repo)}\n${codexFunction('Bash', { command: 'new' })}\n`)
      const now = Date.now() / 1000
      utimesSync(claude, now - 30, now - 30)
      utimesSync(codexOld, now - 20, now - 20)
      utimesSync(codexNew, now, now)

      const forcedClaude = JSON.parse(run(repo, transcripts, ['--runtime', 'claude']).stdout) as { runtime: string; transcript: string }
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
      mkdirSync(repo, { recursive: true })
      mkdirSync(otherRepo, { recursive: true })
      mkdirSync(transcripts, { recursive: true })
      writeFileSync(matching, `${codexMeta(repo)}\n${codexFunction('Read', { file_path: '/x/matching.md' })}\n`)
      writeFileSync(other, `${codexMeta(otherRepo)}\n${codexFunction('Read', { file_path: '/x/other.md' })}\n`)
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
})
