import { describe, expect, test } from 'bun:test'
import definition from './index.ts'

describe('ki-repo-kb-streams rubric catalogue', () => {
  test('exports one complete ordered definition', () => {
    expect(definition.contract).toBe(1)
    expect(definition.name).toBe('ki-repo-kb-streams')
    expect(definition.families.map((family) => family.code)).toEqual(['RUBRIC', 'STREAM', 'ENACT', 'GATE', 'CONFIG'])
    const codes = definition.families
      .filter((family) => family.code !== 'RUBRIC')
      .flatMap((family) => family.items.map((item) => item.code))
    expect(new Set(codes).size).toBe(codes.length)
  })

  test('the catalogue entrypoint exposes only the default definition', async () => {
    expect(Object.keys(await import('./index.ts'))).toEqual(['default'])
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

    expect(mechanical).toHaveLength(11)
    expect(mechanical.every((item) => item.mechanical?.remediation)).toBe(true)
    expect(judgment).toHaveLength(6)
    expect(
      judgment.every((item) => item.judgment?.scope && item.judgment.outcomes?.length && item.judgment.guidance)
    ).toBe(true)
  })
})
