import { expect, test } from 'bun:test'
import definition from './index.ts'

test('the catalogue contains one guarded delegation-packet criterion', () => {
  const items = definition.families.flatMap((family) => family.items as readonly unknown[]) as readonly {
    code: string
    mechanical?: { remediation: { class: string } }
  }[]
  expect(items.map((item) => item.code)).toEqual(['PACKET-1'])
  expect(items[0]?.mechanical?.remediation.class).toBe('guarded')
})
