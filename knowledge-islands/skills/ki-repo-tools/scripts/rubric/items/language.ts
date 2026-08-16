import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { LanguageToolsContext, ToolsRubricContext } from '../contexts/tools.ts'

const STANDARD = 'standards-tool-repositories.md'

const LANG_DEFER: RubricItem<LanguageToolsContext> = {
  code: 'LANG-DEFER',
  title: 'JavaScript toolchain deferral',
  description: 'A package.json-bearing tool defers lint and test to ki-engineering.',
  sources: [STANDARD],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Route package toolchain concerns to ki-engineering; this tool rubric does not infer language-specific lint or test changes.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        if (!context.applicable)
          return [
            {
              status: 'NOT_APPLICABLE',
              message: 'ki-repo-tools is not applicable: its repository declaration is absent.'
            }
          ]
        if (context.packageJson === 'unsafe')
          return [
            { status: 'VIOLATION', message: 'package.json is not a physical regular file.', subject: 'package.json' }
          ]
        return context.packageJson === 'physical'
          ? [
              {
                status: 'INFO',
                message: 'package.json is present; lint and test defer to ki-engineering.',
                subject: 'package.json'
              }
            ]
          : [{ status: 'NOT_APPLICABLE', message: 'package.json is absent.' }]
      }
    }
  }
}

export const LANG: RubricFamily<ToolsRubricContext, LanguageToolsContext> = {
  code: 'LANG',
  title: 'language capabilities',
  description: 'Language toolchain deferral.',
  standard: STANDARD,
  selectContext: (context) => context.language,
  items: [LANG_DEFER]
}
