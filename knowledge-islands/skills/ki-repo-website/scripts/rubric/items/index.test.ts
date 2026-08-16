import { expect, test } from 'bun:test'
import catalogue from './index.ts'

test('publishes the website core rubric', () => {
  expect(catalogue.name).toBe('ki-repo-website')
  expect(catalogue.families.map((family) => family.code)).toEqual(['RUBRIC', 'SITE'])
  expect(catalogue.families[1]?.items.map((item) => item.code)).toEqual(
    Array.from({ length: 7 }, (_, index) => `SITE-${index + 1}`)
  )
})
