import { expect, test } from 'bun:test'
import catalogue from './index.ts'

test('publishes the interactive website rubric', () => {
  expect(catalogue.name).toBe('ki-repo-website-app')
  expect(catalogue.families.map((family) => family.code)).toEqual(['RUBRIC', 'APP'])
  expect(catalogue.families[1]?.items.map((item) => item.code)).toEqual(
    Array.from({ length: 10 }, (_, index) => `APP-${index + 1}`)
  )
})
