import { expect, test } from 'bun:test'
import catalogue from './index.ts'

test('the housekeeping catalogue declares v1 diagnostic remediation', () => {
  expect(catalogue.contract).toBe(1)
  expect(catalogue.families.map((family) => family.code)).toEqual(['HOUSE'])
  const item = catalogue.families[0]?.items[0] as {
    mechanical?: { remediation?: { class?: string; guidance?: string } }
  }
  expect(item.mechanical?.remediation?.class).toBe('diagnostic')
  expect(item.mechanical?.remediation?.guidance).not.toBe('')
})
