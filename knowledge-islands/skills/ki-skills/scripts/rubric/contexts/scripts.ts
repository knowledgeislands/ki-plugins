import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ScriptHelpEvidence } from './contexts.ts'

/** Collect read-only evidence that public script entry points describe and expose their command boundary. */
export const scriptHelpEvidence = (skillDirectory: string): readonly ScriptHelpEvidence[] => {
  const scriptsDirectory = join(skillDirectory, 'scripts')
  if (!existsSync(scriptsDirectory)) return []

  return readdirSync(scriptsDirectory, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.sh')) && !entry.name.endsWith('.test.ts')
    )
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((entry) => {
      const source = readFileSync(join(scriptsDirectory, entry.name), 'utf8')
      const canonicalRun = new RegExp(
        `\\*\\s*Run:\\s*bun\\s+scripts/${entry.name.replace('.', '\\.')}\\s+--help\\.?\\s*$`,
        'm'
      )
      return {
        subject: `scripts/${entry.name}`,
        declaresPurpose: /^\s*\*\s*Purpose:\s*\S/m.test(source),
        declaresCanonicalRun: canonicalRun.test(source),
        declaresBoundary: /^\s*\*\s*Boundary:\s*\S/m.test(source),
        declaresShortHelp: /['"]-h['"]|(^|[|(\s])-h(?=[|)\s])/m.test(source),
        declaresLongHelp: /['"]--help['"]|(^|[|(\s])--help(?=[|)\s])/m.test(source),
        declaresUsageText: /\busage\s*:/i.test(source)
      }
    })
}
