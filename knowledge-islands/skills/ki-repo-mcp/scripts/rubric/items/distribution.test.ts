import { expect, test } from 'bun:test'
import type { AuditOutcome } from '../../shared/rubric.ts'
import type { McpDistributionContext } from '../contexts/mcp.ts'
import { DIST } from './distribution.ts'

const distributionItem = () => {
  const item = DIST.items.find((candidate) => candidate.code === 'DIST-1')
  if (!item?.mechanical) throw new Error('DIST-1 mechanical item is missing')
  return item.mechanical
}

const validContext = (overrides: Partial<McpDistributionContext> = {}): McpDistributionContext => ({
  packageJson: { version: '1.2.3', scripts: { build: 'tsc' } },
  lockfile: { path: 'bun.lock', tracked: true },
  repositoryIdentity: 'knowledgeislands/mcp-example',
  headCommit: '0123456789abcdef0123456789abcdef01234567',
  releaseTag: null,
  releaseTagAnnotated: false,
  ...overrides
})

const audit = (context: McpDistributionContext): readonly AuditOutcome[] => distributionItem().audit.run(context)

const tagOutcome = (outcomes: readonly AuditOutcome[]): AuditOutcome | undefined =>
  outcomes.find((outcome) => outcome.subject === 'refs/tags/v1.2.3')

test('reports an otherwise valid development HEAD as neutral information', () => {
  expect(tagOutcome(audit(validContext()))).toEqual({
    status: 'INFO',
    message:
      'HEAD is valid development source without release tag v1.2.3; release readiness still requires the matching annotated tag.',
    subject: 'refs/tags/v1.2.3'
  })
})

test('passes a matching annotated release tag', () => {
  expect(tagOutcome(audit(validContext({ releaseTag: 'v1.2.3', releaseTagAnnotated: true })))).toEqual({
    status: 'PASS',
    message: 'HEAD carries annotated release tag v1.2.3.',
    subject: 'refs/tags/v1.2.3'
  })
})

test('keeps malformed release and invalid source evidence on the WARN criterion', () => {
  const lightweight = tagOutcome(audit(validContext({ releaseTag: 'v1.2.3', releaseTagAnnotated: false })))
  expect(distributionItem().level).toBe('WARN')
  expect(lightweight?.status).toBe('VIOLATION')

  const invalid = audit(
    validContext({
      packageJson: { version: 'invalid', scripts: {} },
      lockfile: null,
      repositoryIdentity: null,
      headCommit: null
    })
  )
  expect(invalid.filter((outcome) => outcome.status === 'VIOLATION').map((outcome) => outcome.subject)).toEqual(
    expect.arrayContaining(['package.json', 'bun.lock', '.git/config', 'HEAD'])
  )
})
