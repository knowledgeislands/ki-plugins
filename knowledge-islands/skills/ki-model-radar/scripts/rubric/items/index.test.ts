import { expect, test } from 'bun:test'
import definition from './index.ts'

test('the catalogue exposes the complete ordered model-radar contract', () => {
  expect(definition.contract).toBe(1)
  expect(definition.name).toBe('ki-model-radar')
  expect(definition.createSession).toBeFunction()
  expect(definition.families.map((family) => family.code)).toEqual(['SCHEMA', 'EVIDENCE', 'LIFECYCLE', 'RUBRIC'])
  expect(definition.families.flatMap((family) => family.items.map((item) => item.code))).toEqual([
    'SCHEMA-1',
    'EVIDENCE-1',
    'EVIDENCE-2',
    'LIFECYCLE-1',
    'LIFECYCLE-2',
    'RUBRIC-1'
  ])
})

test('family modules keep narrow public surfaces', async () => {
  expect(Object.keys(await import('./index.ts'))).toEqual(['default'])
  for (const file of ['schema', 'evidence', 'lifecycle', 'publication']) {
    const module = (await import(`./${file}.ts`)) as Record<string, unknown>
    expect(Object.keys(module)).toHaveLength(1)
  }
})

test('only generated rubric publication has automatic remediation', () => {
  const items = definition.families.flatMap(
    (family) =>
      family.items as readonly {
        code: string
        mechanical?: { remediation: { class: string }; conform?: unknown }
      }[]
  )
  expect(items.filter((item) => item.mechanical?.remediation.class === 'automatic').map((item) => item.code)).toEqual([
    'RUBRIC-1'
  ])
  expect(
    items.filter((item) => item.code !== 'RUBRIC-1').every((item) => item.mechanical?.conform === undefined)
  ).toBeTrue()
})
