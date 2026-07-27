import { afterEach, expect, test } from 'bun:test'
import { mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricFamily } from '../../shared/rubric.ts'
import {
  type BiomeRubricContext,
  createEngineeringSession,
  type EngineeringRubricContext,
  type PackageRubricContext
} from '../contexts/engineering.ts'
import catalogue from './index.ts'

const temporaryDirectories: string[] = []
const familyModules = readdirSync(import.meta.dir)
  .filter((file) => file.endsWith('.ts') && file !== 'index.ts' && !file.endsWith('.test.ts'))
  .sort()

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

test('the structured catalogue preserves the engineering criteria', () => {
  expect(catalogue.contract).toBe(1)
  expect(catalogue.name).toBe('ki-engineering')
  expect(catalogue.createSession).toBeFunction()
  expect(catalogue.families.map((family) => family.code)).toEqual([
    'PKG',
    'MISE',
    'CI',
    'SCR',
    'BUN',
    'TSC',
    'BIO',
    'KNIP',
    'SYNC',
    'DEPS',
    'GEN',
    'TEST',
    'BUILD',
    'ENV',
    'TOML'
  ])
  const codes = catalogue.families.flatMap((family) => family.items.map((item) => item.code))
  expect(codes).toHaveLength(47)
  expect(new Set(codes).size).toBe(codes.length)
  expect(codes[0]).toBe('PKG-1')
  expect(codes.at(-1)).toBe('TOML-2')
})

test('each family module exports one complete family', async () => {
  for (const file of familyModules) {
    const module = (await import(`./${file}`)) as Record<string, unknown>
    expect(Object.keys(module)).toHaveLength(1)
    const family = Object.values(module)[0] as { code?: unknown; items?: unknown }
    expect(typeof family.code).toBe('string')
    expect(Array.isArray(family.items)).toBe(true)
  }
})

test('the session keeps stable focused context and coalesces package drafts', () => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-engineering-'))
  temporaryDirectories.push(repository)
  writeFileSync(join(repository, 'package.json'), '{"name":"example","scripts":{"ki:audit":"ki repo audit"}}\n')
  const session = createEngineeringSession({ mode: 'conform', repository, userHome: tmpdir(), configuration: {} }, () => [
    { level: 'FAIL', code: 'PKG-1', message: 'type missing', subject: 'package.json' },
    { level: 'FAIL', code: 'PKG-2', message: 'package manager missing', subject: 'package.json' }
  ])
  const root = session.subjects[0]?.context()
  expect(session.subjects[0]?.context()).toBe(root)

  const family = catalogue.families.find((candidate) => candidate.code === 'PKG') as RubricFamily<
    EngineeringRubricContext,
    PackageRubricContext
  >
  const context = family.selectContext(root as EngineeringRubricContext)
  expect(family.items[0]?.mechanical?.audit.run(context)[0]?.status).toBe('VIOLATION')
  family.items[0]?.mechanical?.conform?.run(context)
  family.items[1]?.mechanical?.conform?.run(context)

  const writes = session.proposal().writes
  expect(writes).toHaveLength(1)
  expect(writes[0]?.path).toBe('package.json')
  expect(writes[0]?.content).not.toContain('ki:audit')
  expect(JSON.parse(writes[0]?.content ?? '{}').type).toBe('module')
})

test('formatter commands are bounded arrays and coalesced', () => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-engineering-'))
  temporaryDirectories.push(repository)
  writeFileSync(join(repository, 'package.json'), '{}\n')
  const session = createEngineeringSession({ mode: 'conform', repository, userHome: tmpdir(), configuration: {} }, () => [
    { level: 'FAIL', code: 'BIO-1', message: 'formatting drift' }
  ])
  const root = session.subjects[0]?.context() as EngineeringRubricContext
  const family = catalogue.families.find((candidate) => candidate.code === 'BIO') as RubricFamily<
    EngineeringRubricContext,
    BiomeRubricContext
  >
  const context = family.selectContext(root)
  family.items[0]?.mechanical?.conform?.run(context)
  family.items[0]?.mechanical?.conform?.run(context)

  expect(session.proposal().commands).toEqual([
    { program: 'bunx', arguments: ['@biomejs/biome', 'check', '--write', '--unsafe'] },
    { program: 'bunx', arguments: ['@biomejs/biome', 'format', '--write'] }
  ])
})

test('conform never replaces a symlinked contributed package file', () => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-engineering-'))
  temporaryDirectories.push(repository)
  const source = join(repository, 'package-source.json')
  writeFileSync(source, '{}\n')
  symlinkSync(source, join(repository, 'package.json'))
  const session = createEngineeringSession({ mode: 'conform', repository, userHome: tmpdir(), configuration: {} }, () => [
    { level: 'FAIL', code: 'PKG-1', message: 'type missing' }
  ])
  const root = session.subjects[0]?.context() as EngineeringRubricContext
  root.package.synchronise?.()
  expect(session.proposal().writes).toEqual([])
  expect(readFileSync(source, 'utf8')).toBe('{}\n')
})
