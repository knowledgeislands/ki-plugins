import { describe, expect, test } from 'bun:test'
import { githubIssuesPolicy } from './audit.ts'

describe('GitHub Issues policy', () => {
  test('disables Issues and omits bug metadata by default', () => {
    expect(githubIssuesPolicy('[skills.ki-work]\nadapter = "roadmap"\n', 'owner/repository')).toEqual({
      enabled: false,
      bugsUrl: null
    })
  })

  test('enables Issues and exposes the canonical bug URL when the adapter skill is declared', () => {
    expect(
      githubIssuesPolicy(
        '[skills.ki-work]\nadapter = "github-issues"\n\n[skills.ki-work-github-issues]\n',
        'owner/repository'
      )
    ).toEqual({
      enabled: true,
      bugsUrl: 'https://github.com/owner/repository/issues'
    })
  })

  test('does not treat a child table as the required adapter declaration', () => {
    expect(
      githubIssuesPolicy('[skills.ki-work-github-issues.lifecycle]\nqueue = "Backlog"\n', 'owner/repository')
    ).toEqual({
      enabled: false,
      bugsUrl: null
    })
  })
})
