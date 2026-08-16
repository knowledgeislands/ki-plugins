import { expect, test } from 'bun:test'
import type { RubricItem } from '../../shared/rubric.ts'
import catalogue from './index.ts'

const items = catalogue.families.flatMap((family) => family.items as readonly RubricItem<unknown>[])

test('the portable parent owns semantic criteria without native fields', () => {
  expect(catalogue.name).toBe('ki-subagents')
  expect(items.map((item) => item.code)).toEqual(['PORTABLE-1', 'PORTABLE-2', 'PORTABLE-3', 'HOST-1', 'RUBRIC-1'])
  expect(items.every((item) => !item.mechanical || item.code === 'RUBRIC-1')).toBe(true)
})
