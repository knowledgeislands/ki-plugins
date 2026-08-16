import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { HomebrewTapRubricContext, TapConfigContext } from '../contexts/homebrew-tap.ts'

const STANDARD = 'standards-homebrew-tap.md'
const SOURCE = [STANDARD] as const

const CONFIG_1: RubricItem<TapConfigContext> = {
  code: 'CONFIG-1',
  title: 'identity marker',
  description: '`.ki-config.toml` contains a keyless `[skills.ki-repo-homebrew-tap]` marker with no unknown keys.',
  sources: SOURCE,
  mechanical: {
    level: 'WARN',
    overrideLevels: ['FAIL'],
    remediation: {
      class: 'diagnostic',
      guidance: 'Declare the selected standard through the repository configuration owner.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        if (!context.targetExists)
          return [{ status: 'VIOLATION', level: 'FAIL', message: 'Audit target must be an existing directory.' }]
        if (!context.applicable)
          return [
            {
              status: 'NOT_APPLICABLE',
              message: 'The tap declaration is absent; detected Formula/ shape is handled by ki-repo coverage.'
            }
          ]
        if (context.config === 'unsafe')
          return [
            {
              status: 'VIOLATION',
              message: '.ki-config.toml is not a regular file; marker repair remains report-only.',
              subject: '.ki-config.toml'
            }
          ]
        if (context.config === 'malformed')
          return [{ status: 'VIOLATION', message: '.ki-config.toml is malformed.', subject: '.ki-config.toml' }]
        if (context.config !== 'present')
          return [
            {
              status: 'VIOLATION',
              message: '[skills.ki-repo-homebrew-tap] is absent from .ki-config.toml.',
              subject: '.ki-config.toml'
            }
          ]
        return [
          context.configKeys.length === 0
            ? {
                status: 'PASS',
                message: 'The keyless [skills.ki-repo-homebrew-tap] marker is present.',
                subject: '.ki-config.toml'
              }
            : {
                status: 'VIOLATION',
                message: `The keyless marker contains unknown keys: ${context.configKeys.join(', ')}.`,
                subject: '.ki-config.toml'
              }
        ]
      }
    }
  }
}

export const CONFIG: RubricFamily<HomebrewTapRubricContext, TapConfigContext> = {
  code: 'CONFIG',
  title: 'configuration',
  description: 'The repository declares the keyless Homebrew-tap governance marker.',
  standard: STANDARD,
  selectContext: (context) => context.config,
  items: [CONFIG_1]
}
