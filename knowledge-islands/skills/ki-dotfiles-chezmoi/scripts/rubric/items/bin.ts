import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { type BinContext, type ChezmoiRubricContext, hasRecognisedPrefix } from '../contexts/chezmoi.ts'

const BIN_1: RubricItem<BinContext> = {
  code: 'BIN-1',
  title: 'Bin source-attribute prefix',
  description: 'Every direct physical file in `bin/` carries a recognised chezmoi source-attribute prefix.',
  sources: ['standards-chezmoi-dotfiles.md'],
  mechanical: {
    level: 'WARN',
    audit: {
      phase: 'INSPECT',
      run: ({ repositoryState, entries }) => {
        if (repositoryState !== 'physical')
          return [{ status: 'NOT_APPLICABLE', message: 'The target repository is not safely inspectable.' }]
        if (entries === null) return [{ status: 'NOT_APPLICABLE', message: 'No bin/ directory exists in the source tree.' }]
        if (!entries.length) return [{ status: 'NOT_APPLICABLE', message: 'The bin/ directory contains no direct files.' }]
        const outcomes: AuditOutcome[] = entries.map((entry) => {
          if (!entry.physical)
            return {
              status: 'VIOLATION',
              message: 'The bin source entry is not a physical regular file.',
              subject: `bin/${entry.name}`
            }
          return hasRecognisedPrefix(entry.name)
            ? { status: 'PASS', message: 'The file uses a recognised chezmoi source-attribute prefix.', subject: `bin/${entry.name}` }
            : {
                status: 'VIOLATION',
                message: 'The file has no recognised chezmoi source-attribute prefix.',
                subject: `bin/${entry.name}`
              }
        })
        return outcomes
      }
    }
  }
}

export const BIN: RubricFamily<ChezmoiRubricContext, BinContext> = {
  code: 'BIN',
  title: 'Bin source naming',
  description: 'Chezmoi source-attribute naming for direct bin files.',
  standard: 'standards-chezmoi-dotfiles.md',
  selectContext: (context) => context.bin,
  items: [BIN_1]
}
