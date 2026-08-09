import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { HarnessConfigContext, HarnessRubricContext } from '../contexts/harness.ts'

const STANDARD = ['standards-compatible-harness.md#harness-declaration'] as const

const CONFIG_1: RubricItem<HarnessConfigContext> = {
  code: 'CONFIG-1',
  title: 'Harness declaration',
  description: 'A physical .ki-config.toml contains the keyless ki-repo-harness root table.',
  sources: STANDARD,
  mechanical: {
    level: 'FAIL',
    remediation: { class: 'automatic' },
    audit: {
      phase: 'INSPECT',
      run: ({ state, hasHarnessTable }) => {
        if (state === 'missing')
          return [
            {
              status: 'NOT_APPLICABLE',
              message: 'KI configuration is absent; LAY-5 owns its presence.',
              subject: '.ki-config.toml'
            }
          ]
        if (state === 'unsafe')
          return [
            {
              status: 'VIOLATION',
              message: 'KI configuration is not a safely readable physical regular file.',
              subject: '.ki-config.toml'
            }
          ]
        return [
          hasHarnessTable
            ? {
                status: 'PASS',
                message: 'The [skills.ki-repo-harness] declaration is present.',
                subject: '.ki-config.toml'
              }
            : {
                status: 'VIOLATION',
                message: 'The [skills.ki-repo-harness] declaration is missing.',
                subject: '.ki-config.toml'
              }
        ]
      }
    },
    conform: {
      phase: 'PRIMARY',
      run: ({ requestHarnessMarker }) => {
        requestHarnessMarker?.()
      }
    }
  }
}

const CONFIG_2: RubricItem<HarnessConfigContext> = {
  code: 'CONFIG-2',
  title: 'Repository governance declaration',
  description: 'A physical .ki-config.toml contains the ki-repo root table.',
  sources: STANDARD,
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance: 'Declare the ki-repo governance root in the physical configuration, then rerun the audit.'
    },
    audit: {
      phase: 'INSPECT',
      run: ({ state, hasRepositoryTable }) => {
        if (state !== 'physical')
          return [
            { status: 'NOT_APPLICABLE', message: 'KI configuration is absent or unsafe.', subject: '.ki-config.toml' }
          ]
        return [
          hasRepositoryTable
            ? {
                status: 'PASS',
                message: 'The [skills.ki-repo] declaration is present.',
                subject: '.ki-config.toml'
              }
            : {
                status: 'VIOLATION',
                message: 'The [skills.ki-repo] declaration is missing.',
                subject: '.ki-config.toml'
              }
        ]
      }
    }
  }
}

const CONFIG_3: RubricItem<HarnessConfigContext> = {
  code: 'CONFIG-3',
  title: 'Skill governance declaration',
  description: 'A source harness with populated skills declares ki-skills.',
  sources: STANDARD,
  judgment: {
    scope: 'The physical .ki-config.toml and the source harness skills shelf.',
    prompt: 'When skills/ is populated, does .ki-config.toml declare the ki-skills governance root?',
    outcomes: ['conforming', 'configuration revision', 'not applicable'],
    guidance:
      'Add or correct the declaration only through the repository owner’s configuration decision; do not infer activation scope from shelf contents alone.'
  }
}

export const CONFIG: RubricFamily<HarnessRubricContext, HarnessConfigContext> = {
  code: 'CONFIG',
  title: 'Harness declaration',
  description: 'Knowledge Islands source-harness governance declarations.',
  standard: 'standards-compatible-harness.md',
  selectContext: (context) => context.config,
  items: [CONFIG_1, CONFIG_2, CONFIG_3]
}
