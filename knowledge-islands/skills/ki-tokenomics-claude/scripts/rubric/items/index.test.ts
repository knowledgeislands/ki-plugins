import { describe, expect, test } from 'bun:test'
import definition from './index.ts'

describe('Claude tokenomics catalogue', () => {
  test('owns only Claude evidence', () =>
    expect(definition.families.flatMap((family) => family.items.map((item) => item.code))).toEqual([
      'CLAUDE-SURF-1',
      'CLAUDE-RUN-1',
      'RUBRIC-1'
    ]))

  test('mechanical criteria expose v1 diagnostic remediation', () => {
    const mechanical = (
      definition.families as unknown as readonly {
        items: readonly { code: string; mechanical?: { remediation: { class: string } } }[]
      }[]
    )
      .flatMap((family) => family.items)
      .filter((item) => item.mechanical)

    expect(mechanical).toHaveLength(3)
    expect(
      mechanical
        .filter((item) => item.code !== 'RUBRIC-1')
        .every((item) => item.mechanical?.remediation.class === 'diagnostic')
    ).toBe(true)
    expect(mechanical.find((item) => item.code === 'RUBRIC-1')?.mechanical?.remediation.class).toBe('automatic')
  })
})
