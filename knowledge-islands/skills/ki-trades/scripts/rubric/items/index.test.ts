import { expect, test } from 'bun:test'
import definition from './index.ts'

test('the catalogue exposes the complete ordered trade contract', () => {
  expect(definition.contract).toBe(1)
  expect(definition.name).toBe('ki-trades')
  expect(definition.createSession).toBeFunction()
  expect(definition.families.map((family) => family.code)).toEqual([
    'RUBRIC',
    'CONFIG',
    'ROUTE',
    'SCAFFOLD',
    'RECORD',
    'AUTH',
    'STATUS',
    'RELEASE',
    'ADOPTION'
  ])
  expect(definition.families.flatMap((family) => family.items.map((item) => item.code))).toEqual([
    'RUBRIC-1',
    'CONFIG-1',
    'ROUTE-1',
    'SCAFFOLD-1',
    'RECORD-1',
    'RECORD-2',
    'RECORD-3',
    'AUTH-1',
    'STATUS-1',
    'RELEASE-1',
    'ADOPTION-1'
  ])
})

test('the catalogue and family modules keep narrow public surfaces', async () => {
  expect(Object.keys(await import('./index.ts'))).toEqual(['default'])
  for (const file of [
    'adoption',
    'authority',
    'configuration',
    'publication',
    'records',
    'release',
    'routes',
    'scaffold',
    'status'
  ]) {
    const module = (await import(`./${file}.ts`)) as Record<string, unknown>
    expect(Object.keys(module)).toHaveLength(1)
  }
})

test('only owned scaffold and derived publication use automatic remediation', () => {
  const items = definition.families.flatMap(
    (family) =>
      family.items as unknown as readonly {
        code: string
        mechanical?: { remediation: { class: string } }
        judgment?: { scope: string; prompt: string; outcomes: readonly string[]; guidance: string }
      }[]
  )
  const mechanical = items.filter((item) => item.mechanical)

  expect(
    mechanical.filter((item) => item.mechanical?.remediation.class === 'automatic').map((item) => item.code)
  ).toEqual(['RUBRIC-1', 'SCAFFOLD-1'])
  expect(
    mechanical.filter((item) => item.mechanical?.remediation.class === 'guarded').map((item) => item.code)
  ).toEqual(['STATUS-1', 'RELEASE-1'])

  for (const item of mechanical.filter((item) => item.mechanical?.remediation.class === 'guarded')) {
    expect(item.judgment).toMatchObject({
      scope: expect.any(String),
      prompt: expect.any(String),
      outcomes: expect.any(Array),
      guidance: expect.any(String)
    })
  }
})
