import { expect, test } from 'bun:test'
import definition from './index.ts'

test('the catalogue exposes the complete ordered Agora contract', () => {
  expect(definition.contract).toBe(1)
  expect(definition.name).toBe('ki-agora')
  expect(definition.createSession).toBeFunction()
  expect(definition.families.map((family) => family.code)).toEqual(['RUBRIC', 'CONFIG', 'MEMBERSHIP'])
  expect(definition.families.flatMap((family) => family.items.map((item) => item.code))).toEqual([
    'RUBRIC-1',
    'CONFIG-1',
    'MEMBERSHIP-1'
  ])
})

test('the catalogue and family modules keep narrow public surfaces', async () => {
  expect(Object.keys(await import('./index.ts'))).toEqual(['default'])
  for (const file of ['configuration', 'memberships', 'publication']) {
    const module = (await import(`./${file}.ts`)) as Record<string, unknown>
    expect(Object.keys(module)).toHaveLength(1)
  }
})

test('only derived publication has automatic remediation', () => {
  const items = definition.families.flatMap(
    (family) => family.items as unknown as readonly { code: string; mechanical?: { remediation: { class: string } } }[]
  )
  expect(items.filter((item) => item.mechanical?.remediation.class === 'automatic').map((item) => item.code)).toEqual([
    'RUBRIC-1'
  ])
})
