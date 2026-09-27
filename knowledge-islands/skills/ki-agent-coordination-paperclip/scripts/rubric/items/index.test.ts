import { expect, test } from 'bun:test'
import type { RubricItem } from '../../shared/rubric.ts'
import catalogue from './index.ts'

const items = catalogue.families.flatMap((family) => family.items as readonly RubricItem<unknown>[])

test('Paperclip coordination keeps relationship criteria judgment-led', () => {
  expect(catalogue.name).toBe('ki-agent-coordination-paperclip')
  expect(items.map((item) => item.code)).toEqual([
    'COORD-1',
    'COORD-2',
    'COORD-3',
    'COORD-4',
    'COORD-5',
    'COORD-6',
    'COORD-7',
    'COORD-8',
    'COORD-9',
    'ORG-1',
    'RUBRIC-1'
  ])
  expect(items.every((item) => !item.mechanical || ['ORG-1', 'RUBRIC-1'].includes(item.code))).toBe(true)
})

test('the roadmap write locus is assessed separately from workspace isolation', () => {
  const locus = items.find((candidate) => candidate.code === 'COORD-8')
  const metadata = `${locus?.description}\n${locus?.judgment?.prompt}`

  expect(locus?.sources).toContain('standards-agent-coordination-paperclip.md#roadmap-records-are-the-exception')
  expect(metadata).toContain('designated primary checkout')
  expect(metadata).toContain('isolated worktree')
  expect(metadata).toContain('both write boundaries')
})

test('workspace retirement distinguishes the automatic sweep from warned early close', () => {
  const retirement = items.find((candidate) => candidate.code === 'COORD-9')
  const metadata = `${retirement?.description}\n${retirement?.judgment?.prompt}`

  expect(retirement?.sources).toContain('standards-agent-coordination-paperclip.md#workspace-retirement')
  expect(metadata).toContain('automatic sweep')
  expect(metadata).toContain('early close')
  expect(metadata).toContain('explicit authority')
})
