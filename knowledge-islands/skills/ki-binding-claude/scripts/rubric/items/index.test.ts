import { expect, test } from 'bun:test'
import catalogue from './index.ts'

test('the Claude catalogue is independently complete', () => {
  expect(catalogue.contract).toBe(1)
  expect(catalogue.name).toBe('ki-binding-claude')
  expect(catalogue.families[0]?.items.map((item) => item.code)).toEqual([
    'CLAUDEBIND-1',
    'CLAUDEBIND-2',
    'CLAUDEBIND-J1'
  ])
})

test('only safe Cowork settings repair is automatic', () => {
  const items = catalogue.families.flatMap((family) => family.items as readonly unknown[]) as readonly {
    code: string
    mechanical?: { remediation: { class: string } }
    judgment?: { scope: string; prompt: string; outcomes: readonly string[]; guidance: string }
  }[]
  expect(items.filter((item) => item.mechanical?.remediation.class === 'automatic').map((item) => item.code)).toEqual([
    'CLAUDEBIND-2',
    'RUBRIC-1'
  ])
  expect(items.find((item) => item.code === 'CLAUDEBIND-1')?.mechanical?.remediation.class).toBe('diagnostic')
  expect(items.find((item) => item.code === 'CLAUDEBIND-J1')?.judgment).toMatchObject({
    scope: expect.any(String),
    outcomes: expect.any(Array),
    guidance: expect.any(String)
  })
})
