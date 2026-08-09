import { expect, test } from 'bun:test'
import definition from './index.ts'

test('the catalogue exposes the complete ordered Activity family', () => {
  expect(definition.contract).toBe(1)
  expect(definition.name).toBe('ki-repo-kb-activities')
  expect(definition.createSession).toBeFunction()
  expect(definition.families.map((family) => family.code)).toEqual(['RUBRIC', 'ACT'])
  expect(definition.families[1]?.items.map((item) => item.code)).toEqual([
    'ACT-S-1',
    'ACT-S-2',
    'ACT-S-3',
    'ACT-F-1',
    'ACT-F-2',
    'ACT-F-3',
    'ACT-F-4',
    'ACT-R-1',
    'ACT-R-2',
    'ACT-R-3',
    'ACT-R-4',
    'ACT-J-1',
    'ACT-J-2',
    'ACT-J-3',
    'ACT-J-4',
    'ACT-J-5'
  ])
})

test('the catalogue entrypoint and family module keep their public surfaces narrow', async () => {
  expect(Object.keys(await import('./index.ts'))).toEqual(['default'])
  expect(Object.keys(await import('./activities.ts'))).toEqual(['ACT'])
})

test('criteria expose complete v1 remediation and review metadata', () => {
  const families = definition.families as unknown as readonly {
    items: readonly {
      mechanical?: { remediation?: unknown }
      judgment?: { scope?: string; outcomes?: readonly string[]; guidance?: string }
    }[]
  }[]
  const items = families.flatMap((family) => family.items)
  const mechanical = items.filter((item) => item.mechanical)
  const judgment = items.filter((item) => item.judgment)

  expect(mechanical).toHaveLength(12)
  expect(mechanical.every((item) => item.mechanical?.remediation)).toBe(true)
  expect(judgment).toHaveLength(6)
  expect(
    judgment.every((item) => item.judgment?.scope && item.judgment.outcomes?.length && item.judgment.guidance)
  ).toBe(true)
})
