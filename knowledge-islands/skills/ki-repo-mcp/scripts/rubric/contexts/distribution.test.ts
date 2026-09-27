import { expect, test } from 'bun:test'
import { assessSourceInstallCandidate, normalizeGitHubRepository, type SourceInstallCandidate } from './distribution.ts'

const COMMIT = '1234567890abcdef1234567890abcdef12345678'

const candidate = (overrides: Partial<SourceInstallCandidate> = {}): SourceInstallCandidate => ({
  requestedRepository: 'knowledgeislands/mcp-example',
  requestedVersion: '1.2.3',
  origin: 'https://github.com/knowledgeislands/mcp-example.git',
  visibility: 'public',
  sourceAccessible: true,
  selectedRef: { kind: 'tag', name: 'v1.2.3' },
  selectedCommit: COMMIT,
  tagCommit: COMMIT,
  packageVersion: '1.2.3',
  entryPoint: 'dist/mcp-server/index.js',
  hasBuildScript: true,
  hasTrackedLockfile: true,
  ...overrides
})

test('normalises supported public and private GitHub origin forms', () => {
  expect(normalizeGitHubRepository('https://github.com/KnowledgeIslands/mcp-example.git')).toBe(
    'knowledgeislands/mcp-example'
  )
  expect(normalizeGitHubRepository('git@github.com:knowledgeislands/mcp-example.git')).toBe(
    'knowledgeislands/mcp-example'
  )
  expect(normalizeGitHubRepository('ssh://git@github.com/knowledgeislands/mcp-example.git')).toBe(
    'knowledgeislands/mcp-example'
  )
})

test('accepts an explicit public source release', () => {
  expect(assessSourceInstallCandidate(candidate())).toEqual({
    ok: true,
    repository: 'knowledgeislands/mcp-example',
    version: '1.2.3',
    tag: 'v1.2.3',
    commit: COMMIT,
    problems: []
  })
})

test('treats an accessible private repository by the same immutable contract', () => {
  const assessment = assessSourceInstallCandidate(
    candidate({
      visibility: 'private',
      origin: 'git@github.com:knowledgeislands/mcp-example.git'
    })
  )
  expect(assessment.ok).toBe(true)
})

test('resolves an omitted version only through a stable release tag', () => {
  const assessment = assessSourceInstallCandidate(
    candidate({
      requestedVersion: undefined,
      stableReleaseTag: 'v1.2.3'
    })
  )
  expect(assessment.ok).toBe(true)
  expect(assessment.version).toBe('1.2.3')

  expect(
    assessSourceInstallCandidate(
      candidate({
        requestedVersion: undefined,
        stableReleaseTag: undefined
      })
    ).problems
  ).toContain('An omitted version requires an owner-designated stable v<SemVer> release tag.')
})

test('rejects mutable revisions and build-contract drift', () => {
  const assessment = assessSourceInstallCandidate(
    candidate({
      selectedRef: { kind: 'branch', name: 'main' },
      tagCommit: 'abcdef1234567890abcdef1234567890abcdef12',
      packageVersion: '1.2.4',
      hasBuildScript: false,
      hasTrackedLockfile: false,
      entryPoint: 'dist/index.js'
    })
  )
  expect(assessment.ok).toBe(false)
  expect(assessment.problems).toEqual(
    expect.arrayContaining([
      'Installation must resolve a tag, not a mutable branch or bare commit.',
      'Release tag does not resolve to the selected immutable commit.',
      'package.json version 1.2.4 does not match release version 1.2.3.',
      'package.json has no governed build script.',
      'No committed Bun lockfile is available for the build.',
      'The declared MCP entry point is not dist/mcp-server/index.js.'
    ])
  )
})

test('rejects provenance that does not describe the selected release', () => {
  const assessment = assessSourceInstallCandidate(
    candidate({
      receipt: {
        schemaVersion: 1,
        repository: 'knowledgeislands/mcp-example',
        tag: 'v1.2.3',
        commit: 'abcdef1234567890abcdef1234567890abcdef12',
        packageVersion: '1.2.3',
        entryPoint: 'dist/mcp-server/index.js',
        installedAt: '2026-09-24T08:00:00Z',
        active: true
      }
    })
  )
  expect(assessment.problems).toContain('Recorded provenance does not match the selected source release.')
})
