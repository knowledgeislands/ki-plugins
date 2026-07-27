import { describe, expect, test } from 'bun:test'
import definition from './index.ts'

describe('ki-tokenomics rubric catalogue', () => {
  test('exports one complete ordered user-home definition', () => {
    expect(definition.contract).toBe(1)
    expect(definition.name).toBe('ki-tokenomics')
    expect(definition.scope).toEqual({ kind: 'user-home', paths: ['.claude', '.claude.json'] })
    expect(definition.families.map((family) => family.code)).toEqual(['COMP', 'SURF', 'MCP', 'BUDG', 'RUN', 'TOOL', 'CFG'])
    const codes = definition.families.flatMap((family) => family.items.map((item) => item.code))
    expect(codes).toHaveLength(28)
    expect(new Set(codes).size).toBe(codes.length)
  })

  test('the catalogue entrypoint and family modules expose narrow public surfaces', async () => {
    expect(Object.keys(await import('./index.ts'))).toEqual(['default'])
    expect(Object.keys(await import('./composition.ts'))).toEqual(['COMP'])
    expect(Object.keys(await import('./surface.ts'))).toEqual(['SURF'])
    expect(Object.keys(await import('./mcp.ts'))).toEqual(['MCP'])
    expect(Object.keys(await import('./budgets.ts'))).toEqual(['BUDG'])
    expect(Object.keys(await import('./runtime.ts'))).toEqual(['RUN'])
    expect(Object.keys(await import('./tooling.ts'))).toEqual(['TOOL'])
    expect(Object.keys(await import('./config.ts'))).toEqual(['CFG'])
  })
})
