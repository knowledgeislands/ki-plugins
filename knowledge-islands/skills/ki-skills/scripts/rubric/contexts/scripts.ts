import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ScriptHelpEvidence } from './contexts.ts'

/** Collect read-only evidence that public script entry points declare useful help. */
export const scriptHelpEvidence = (skillDirectory: string): readonly ScriptHelpEvidence[] => {
  const scriptsDirectory = join(skillDirectory, 'scripts')
  if (!existsSync(scriptsDirectory)) return []

  return readdirSync(scriptsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.sh')) && !entry.name.endsWith('.test.ts'))
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((entry) => {
      const source = readFileSync(join(scriptsDirectory, entry.name), 'utf8')
      return {
        subject: `scripts/${entry.name}`,
        declaresShortHelp: /['"]-h['"]|(^|[|(\s])-h(?=[|)\s])/m.test(source),
        declaresLongHelp: /['"]--help['"]|(^|[|(\s])--help(?=[|)\s])/m.test(source),
        declaresUsageText: /\busage\s*:/i.test(source)
      }
    })
}
