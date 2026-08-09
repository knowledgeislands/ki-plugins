import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { ToolsConfigContext, ToolsRubricContext } from '../contexts/tools.ts'

const STANDARD = 'standards-tool-repositories.md'
const TABLE = 'ki-repo-tools'

const CONFIG_1: RubricItem<ToolsConfigContext> = {
  code: 'CONFIG-1',
  title: 'Opt-in marker and keys',
  description: 'A keyless qualified `ki-repo-tools` marker is present and validated down.',
  sources: [STANDARD],
  mechanical: {
    level: 'WARN',
    overrideLevels: ['FAIL'],
    remediation: { class: 'automatic' },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        if (context.rootState === 'absent')
          return [{ status: 'VIOLATION', level: 'FAIL', message: 'Audit target does not exist.' }]
        if (context.rootState === 'unsafe')
          return [{ status: 'VIOLATION', level: 'FAIL', message: 'Audit target is not a physical directory.' }]
        if (!context.applicable)
          return [
            {
              status: 'NOT_APPLICABLE',
              message: `No [skills.${TABLE}] declaration or bin/ structural marker is present.`
            }
          ]
        if (context.config === 'unsafe')
          return [
            {
              status: 'VIOLATION',
              message: '.ki-config.toml is not a physical regular file.',
              subject: '.ki-config.toml'
            }
          ]
        if (context.config === 'missing')
          return [{ status: 'VIOLATION', message: '.ki-config.toml is absent.', subject: '.ki-config.toml' }]
        if (context.config === 'malformed')
          return [{ status: 'VIOLATION', message: '.ki-config.toml is malformed.', subject: '.ki-config.toml' }]
        if (context.config === 'absent')
          return [
            {
              status: 'VIOLATION',
              message: `[skills.${TABLE}] is absent from .ki-config.toml.`,
              subject: '.ki-config.toml'
            }
          ]
        return [
          context.configKeys.length === 0
            ? {
                status: 'PASS',
                message: `The keyless [skills.${TABLE}] marker is present.`,
                subject: '.ki-config.toml'
              }
            : {
                status: 'VIOLATION',
                message: `The keyless marker contains unknown keys: ${context.configKeys.join(', ')}.`,
                subject: '.ki-config.toml'
              }
        ]
      }
    },
    conform: {
      phase: 'PRIMARY',
      run: (context) => context.requestMarker?.()
    }
  }
}

export const CONFIG: RubricFamily<ToolsRubricContext, ToolsConfigContext> = {
  code: 'CONFIG',
  title: 'configuration',
  description: 'Applicability marker and validate-down keys.',
  standard: STANDARD,
  selectContext: (context) => context.config,
  items: [CONFIG_1]
}
