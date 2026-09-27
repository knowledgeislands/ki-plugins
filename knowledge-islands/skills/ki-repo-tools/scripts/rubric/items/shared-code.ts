import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { ToolSharedCodeContext } from '../contexts/shared-code.ts'
import type { ToolsRubricContext } from '../contexts/tools.ts'

const STANDARD = 'standards-tool-shared-code.md#managed-delivery-profile-contract'

const SHARED_1: RubricItem<ToolSharedCodeContext> = {
  code: 'SHARED-1',
  title: 'Declared tool delivery projection',
  description:
    'An optional declared delivery profile renders exact installer and packaging files from digested skill-owned templates while preserving repository-owned release seams.',
  sources: [STANDARD],
  mechanical: {
    level: 'FAIL',
    remediation: { class: 'automatic' },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        if (context.profile === undefined)
          return [{ status: 'NOT_APPLICABLE', message: 'No shared delivery profile is declared.' }]
        if (typeof context.profile !== 'string' || !context.supportedProfiles.includes(context.profile))
          return [
            {
              status: 'VIOLATION',
              message: `profile must be one of: ${context.supportedProfiles.join(', ')}.`,
              subject: '.ki.toml'
            }
          ]
        if (context.invalidParameters.length > 0)
          return [
            {
              status: 'VIOLATION',
              message: `Invalid or missing profile parameters: ${context.invalidParameters.join(', ')}.`,
              subject: '.ki.toml'
            }
          ]
        const outcomes: AuditOutcome[] = context.files.map((file) => ({
          status: file.state === 'exact' ? 'PASS' : 'VIOLATION',
          message:
            file.state === 'exact'
              ? `${file.destination} matches ${context.profile} (${file.renderedSha256}).`
              : `${file.destination} is ${file.state} for ${context.profile}; managed files are whole-file projections.`,
          subject: file.destination
        }))
        outcomes.push(
          ...context.obsoleteManagedFiles.map((path) => ({
            status: 'VIOLATION' as const,
            message: `Obsolete managed projection is outside ${context.profile}: ${path}.`,
            subject: path
          }))
        )
        if (context.localExtensions.length > 0)
          outcomes.push({
            status: 'INFO',
            message: `Repository-owned release extensions are preserved: ${context.localExtensions.join(', ')}.`
          })
        return outcomes
      }
    },
    conform: { phase: 'PRIMARY', run: (context) => context.conformMissing?.() }
  }
}

export const SHARED: RubricFamily<ToolsRubricContext, ToolSharedCodeContext> = {
  code: 'SHARED',
  title: 'Shared delivery projection',
  description: 'Optional digested installer and release-packaging profiles.',
  standard: STANDARD,
  selectContext: (context) => context.sharedCode,
  items: [SHARED_1]
}
