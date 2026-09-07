import { describe, expect, test } from 'bun:test'
import { gitignoreUnmanagedHeader, inspectGitignore, managedGitignoreBlocks } from './gitignore.ts'

const runtimeRules = ['.claude/skills/*', '.agents/skills/*', '!.agents/skills/ki-self/', '!.agents/skills/ki-self/**']

describe('compositional .gitignore', () => {
  test('renders declared skill blocks in stable ownership order', () => {
    const blocks = managedGitignoreBlocks(
      ['ki-repo-website-cloudflare', 'ki-engineering', 'ki-repo', 'ki-repo-website'],
      runtimeRules
    )
    const inspection = inspectGitignore('', blocks)

    expect(blocks.map(({ owner }) => owner)).toEqual([
      'ki-repo',
      'ki-engineering',
      'ki-repo-website',
      'ki-repo-website-cloudflare'
    ])
    expect(inspection.content).toContain('reports/')
    expect(inspection.content).toContain('# ki-repo:ignore:ki-engineering:start')
    expect(inspection.content).toContain('# ki-repo:ignore:ki-repo-website:start')
    expect(inspection.content.match(/^dist\/$/gm)).toHaveLength(1)
    expect(inspection.content).toContain('.wrangler/')
    expect(inspection.content).toContain('.dev.vars')
    expect(inspection.content).toContain(gitignoreUnmanagedHeader)
  })

  test('preserves repository-specific rules below terminal unmanaged header', () => {
    const source = `node_modules/
.ki/audits/
.ki/conform/
.claude/skills/
.agents/skills/
.vscode/
coverage/
custom-output/
`
    const inspection = inspectGitignore(source, managedGitignoreBlocks(['ki-repo', 'ki-engineering'], runtimeRules))

    expect(inspection.malformed).toBeUndefined()
    expect(inspection.unmanagedRules).toEqual(['.vscode/', 'custom-output/'])
    expect(inspection.content).not.toContain('.ki/audits/')
    expect(inspection.content).not.toContain('.ki/conform/')
    expect(inspection.content).not.toContain('.claude/skills/\n')
    expect(inspection.content).not.toContain('\ncoverage/\n')
    expect(inspection.content).toEndWith(`${gitignoreUnmanagedHeader}\n\n.vscode/\ncustom-output/\n`)
  })

  test('is idempotent after reconciliation', () => {
    const blocks = managedGitignoreBlocks(['ki-repo'], runtimeRules)
    const first = inspectGitignore('.vscode/\n', blocks)
    const second = inspectGitignore(first.content, blocks)

    expect(first.conforming).toBe(false)
    expect(second.conforming).toBe(true)
    expect(second.content).toBe(first.content)
    expect(second.unmanagedRules).toEqual(['.vscode/'])
  })

  test('fails closed on malformed managed markers', () => {
    const source = '# ki-repo:ignore:ki-repo:start\nreports/\ncustom-output/\n'
    const inspection = inspectGitignore(source, managedGitignoreBlocks(['ki-repo'], runtimeRules))

    expect(inspection.conforming).toBe(false)
    expect(inspection.malformed).toBe('managed block ki-repo has no end marker')
    expect(inspection.content).toBe(source)
  })
})
