import { describe, expect, test } from 'bun:test'
import { unqualifiedRuntimeAssumptions } from './portability.ts'

const findings = (markdown: string, overrides: Partial<Parameters<typeof unqualifiedRuntimeAssumptions>[0]> = {}) =>
  unqualifiedRuntimeAssumptions({
    markdown,
    subject: 'fixture.md',
    runtimeBinding: false,
    attributedSourceMaterial: false,
    ...overrides
  })

describe('runtime-portability evidence', () => {
  test('reports unqualified vendor and home-directory assumptions with line locations', () => {
    expect(findings('Use Claude Code.\nRead ~/.codex/sessions.')).toEqual([
      { line: 1, reference: 'Claude Code' },
      { line: 2, reference: '~/.codex' }
    ])
  })

  test('accepts a declared runtime-binding skill', () => {
    expect(findings('Use Claude Code and ~/.claude.', { runtimeBinding: true })).toEqual([])
  })

  test('accepts an explicitly bounded runtime-binding section only until its next peer heading', () => {
    expect(findings('## Runtime binding: Claude Code\nUse ~/.claude.\n\n## Portable behaviour\nUse Claude Code.')).toEqual([
      { line: 5, reference: 'Claude Code' }
    ])
  })

  test('accepts source material and a same-line multi-runtime comparison', () => {
    expect(findings('Claude Code uses one path while Codex uses another.')).toEqual([])
    expect(findings('Claude Code docs.', { attributedSourceMaterial: true })).toEqual([])
    expect(findings('> Source: Claude Code documentation\n> ~/.claude is the documented path.')).toEqual([])
  })

  test('accepts a clearly labelled runtime-only line and runtime overlay', () => {
    expect(findings('This Claude-Code-only extension is optional.')).toEqual([])
    expect(findings('## Runtime overlay: Claude Code\nUse ~/.claude.')).toEqual([])
  })
})
