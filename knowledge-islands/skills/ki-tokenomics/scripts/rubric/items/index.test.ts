import { describe, expect, test } from 'bun:test'
import definition from './index.ts'

describe('ki-tokenomics rubric catalogue', () => {
  test('owns only portable policy', () => {
    expect(definition.families.map((family) => family.code)).toEqual(['CFG', 'POL', 'RUBRIC'])
    expect(Object.keys(definition)).not.toContain('scope')
  })

  test('keeps policy findings diagnostic and publication automatic', () => {
    const items = definition.families.flatMap((family) => family.items as readonly unknown[]) as readonly {
      code: string
      mechanical?: { remediation: { class: string } }
    }[]
    expect(
      items.filter((item) => item.mechanical?.remediation.class === 'diagnostic').map((item) => item.code)
    ).toEqual(['CFG-1', 'POL-1', 'POL-2', 'POL-3'])
    expect(items.filter((item) => item.mechanical?.remediation.class === 'automatic').map((item) => item.code)).toEqual(
      ['RUBRIC-1']
    )
  })
})
