import { afterEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { scriptHelpEvidence } from './scripts.ts'

const roots: string[] = []

const skill = (source: string): string => {
  const root = mkdtempSync(join(tmpdir(), 'ki-skills-scripts-'))
  roots.push(root)
  const scripts = join(root, 'skill', 'scripts')
  mkdirSync(scripts, { recursive: true })
  writeFileSync(join(scripts, 'command.ts'), source)
  return join(root, 'skill')
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe('public script evidence', () => {
  test('recognises the complete public command header and help surface', () => {
    const [evidence] = scriptHelpEvidence(
      skill(`/**
 * Purpose: Demonstrate a bounded command.
 * Run: bun scripts/command.ts --help
 * Boundary: Read-only.
 */
const help = ['-h', '--help', 'Usage: command.ts']
void help
`)
    )

    expect(evidence).toEqual({
      subject: 'scripts/command.ts',
      declaresPurpose: true,
      declaresCanonicalRun: true,
      declaresBoundary: true,
      declaresShortHelp: true,
      declaresLongHelp: true,
      declaresUsageText: true
    })
  })

  test('does not accept a generic help surface in place of the command header', () => {
    const [evidence] = scriptHelpEvidence(skill(`const help = ['-h', '--help', 'Usage: command.ts']\nvoid help\n`))

    expect(evidence?.declaresPurpose).toBeFalse()
    expect(evidence?.declaresCanonicalRun).toBeFalse()
    expect(evidence?.declaresBoundary).toBeFalse()
  })
})
