import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { supportedToolSharedProfiles, toolSharedProfileParameters } from '../contexts/shared-code.ts'
import type { ToolsConfigContext, ToolsRubricContext } from '../contexts/tools.ts'

const STANDARD = 'standards-tool-repositories.md'
const TABLE = 'ki-repo-tools'

const CONFIG_1: RubricItem<ToolsConfigContext> = {
  code: 'CONFIG-1',
  title: 'Opt-in marker and delivery profile',
  description: 'A qualified `ki-repo-tools` marker is present and any delivery-profile keys are validated down.',
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
              message: `[skills.${TABLE}] declaration is absent; detected tool shape is handled by ki-repo coverage.`
            }
          ]
        if (context.config === 'unsafe')
          return [
            {
              status: 'VIOLATION',
              message: '.ki.toml is not a physical regular file.',
              subject: '.ki.toml'
            }
          ]
        if (context.config === 'missing')
          return [{ status: 'VIOLATION', message: '.ki.toml is absent.', subject: '.ki.toml' }]
        if (context.config === 'malformed')
          return [{ status: 'VIOLATION', message: '.ki.toml is malformed.', subject: '.ki.toml' }]
        if (context.config === 'absent')
          return [
            {
              status: 'VIOLATION',
              message: `[skills.${TABLE}] is absent from .ki.toml.`,
              subject: '.ki.toml'
            }
          ]
        const allowed = new Set([
          'profile',
          ...(typeof context.sharedProfile === 'string' ? toolSharedProfileParameters(context.sharedProfile) : [])
        ])
        const unknown = context.configKeys.filter((key) => !allowed.has(key))
        if (unknown.length > 0)
          return [
            {
              status: 'VIOLATION',
              message: `The marker contains unknown keys: ${unknown.join(', ')}.`,
              subject: '.ki.toml'
            }
          ]
        if (
          context.sharedProfile !== undefined &&
          (typeof context.sharedProfile !== 'string' || !supportedToolSharedProfiles().includes(context.sharedProfile))
        )
          return [
            {
              status: 'VIOLATION',
              message: `profile must be one of: ${supportedToolSharedProfiles().join(', ')}.`,
              subject: '.ki.toml'
            }
          ]
        const hasParameters = context.configKeys.some((key) => key !== 'profile')
        return [
          context.sharedProfile === undefined && !hasParameters
            ? {
                status: 'PASS',
                message: `The keyless [skills.${TABLE}] marker is present; installer files remain repository-owned.`,
                subject: '.ki.toml'
              }
            : context.sharedProfile !== undefined
              ? {
                  status: 'PASS',
                  message: `Configured tool delivery profile: ${String(context.sharedProfile)}.`,
                  subject: '.ki.toml'
                }
              : {
                  status: 'VIOLATION',
                  message: 'Delivery parameters require a profile.',
                  subject: '.ki.toml'
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
