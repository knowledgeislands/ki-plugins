import { expect, test } from 'bun:test'
import definition, * as catalogueModule from './index.ts'
import * as familyModule from './wcf.ts'

test('the catalogue exposes the complete ordered Cloudflare hosting family', () => {
  expect(definition.families.map((family) => family.code)).toEqual(['RUBRIC', 'WCF'])
  expect(definition.families[1]?.items.map((item) => item.code)).toEqual([
    'WCF-1',
    'WCF-2',
    'WCF-3',
    'WCF-4',
    'WCF-6',
    'WCF-8',
    'WCF-9',
    'WCF-10',
    'WCF-13',
    'WCF-14',
    'WCF-19',
    'WCF-20',
    'WCF-21',
    'WCF-22'
  ])
  const families = definition.families as unknown as readonly {
    items: readonly {
      mechanical?: { remediation?: { class?: string }; conform?: unknown }
      judgment?: { scope?: string; outcomes?: readonly string[]; guidance?: string }
    }[]
  }[]
  for (const item of families.flatMap((family) => family.items)) {
    if (item.mechanical) {
      expect(item.mechanical.remediation?.class).toBeDefined()
      if (item.mechanical.conform) expect(item.mechanical.remediation?.class).toBe('automatic')
    }
    if (item.judgment) {
      expect(item.judgment.scope).not.toBe('')
      expect(item.judgment.outcomes?.length).toBeGreaterThan(0)
      expect(item.judgment.guidance).not.toBe('')
    }
  }
})

test('the catalogue and family module expose only the final public surfaces', () => {
  expect(Object.keys(catalogueModule)).toEqual(['default'])
  expect(Object.keys(familyModule)).toEqual(['WCF'])
})
