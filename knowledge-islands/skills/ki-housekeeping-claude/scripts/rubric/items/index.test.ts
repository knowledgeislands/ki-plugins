import { describe, expect, test } from 'bun:test'
import definition from './index.ts'

describe('ki-housekeeping-claude rubric catalogue', () => {
  test('exports one complete ordered user-home definition', () => {
    expect(definition.contract).toBe(1)
    expect(definition.name).toBe('ki-housekeeping-claude')
    expect(definition.scope).toEqual({ kind: 'user-home', paths: ['.claude/projects'] })
    expect(definition.families.map((family) => family.code)).toEqual(['IDX', 'FM', 'LINK', 'DOC', 'RUBRIC'])
    const codes = definition.families.flatMap((family) => family.items.map((item) => item.code))
    expect(codes).toHaveLength(19)
    expect(new Set(codes).size).toBe(codes.length)
  })

  test('the catalogue entrypoint and family modules expose narrow public surfaces', async () => {
    expect(Object.keys(await import('./index.ts'))).toEqual(['default'])
    expect(Object.keys(await import('./indexing.ts'))).toEqual(['INDEX'])
    expect(Object.keys(await import('./frontmatter.ts'))).toEqual(['FRONTMATTER'])
    expect(Object.keys(await import('./link.ts'))).toEqual(['LINK'])
    expect(Object.keys(await import('./doc.ts'))).toEqual(['DOC'])
    expect(Object.keys(await import('./publication.ts'))).toEqual(['RUBRIC'])
  })
})
