import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { ShellToolsContext, ToolsRubricContext } from '../contexts/tools.ts'

const STANDARD = 'standards-tool-repositories.md'
const SOURCE = [STANDARD] as const
const one = (outcome: AuditOutcome): readonly AuditOutcome[] => [outcome]

const unavailable = (context: ShellToolsContext): readonly AuditOutcome[] | null =>
  context.applicable
    ? null
    : one({
        status: 'NOT_APPLICABLE',
        message: 'No qualified ki-repo-tools declaration or bin/ structural marker is present.'
      })

const SHELL_LINT: RubricItem<ShellToolsContext> = {
  code: 'SHELL-LINT',
  title: 'Shell lint CI',
  description: 'Shell entrypoints have a physical CI workflow that references shellcheck.',
  sources: SOURCE,
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance: 'Add or correct the shellcheck CI evidence through the repository’s maintained workflow.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skipped = unavailable(context)
        if (skipped) return skipped
        if (!context.primary || !context.shell)
          return one({ status: 'NOT_APPLICABLE', message: 'Primary executable is not a shell entrypoint.' })
        if (context.workflows === 'unsafe' || context.unsafeWorkflowEntries.length > 0)
          return one({
            status: 'VIOLATION',
            message: 'CI workflow evidence is unsafe or unreadable.',
            subject: '.github/workflows/'
          })
        return /shellcheck/i.test(context.workflowText)
          ? one({ status: 'PASS', message: 'A CI workflow references shellcheck.', subject: `bin/${context.primary}` })
          : one({
              status: 'VIOLATION',
              message: 'Shell entrypoint has no CI shellcheck reference.',
              subject: `bin/${context.primary}`
            })
      }
    }
  }
}

const SHELL_TEST: RubricItem<ShellToolsContext> = {
  code: 'SHELL-TEST',
  title: 'Shell test CI',
  description: 'Shell entrypoints have a physical Bats suite referenced by CI.',
  sources: SOURCE,
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance: 'Add or correct the Bats suite and CI evidence through the repository’s maintained test workflow.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skipped = unavailable(context)
        if (skipped) return skipped
        if (!context.primary || !context.shell)
          return one({ status: 'NOT_APPLICABLE', message: 'Primary executable is not a shell entrypoint.' })
        if (context.tests === 'unsafe' || context.unsafeTestEntries.length > 0)
          return one({ status: 'VIOLATION', message: 'Bats test evidence is unsafe or unreadable.', subject: 'tests/' })
        if (!context.bats)
          return one({
            status: 'VIOLATION',
            message: 'Shell entrypoint has no physical *.bats suite.',
            subject: 'tests/'
          })
        return /\bbats\b/i.test(context.workflowText)
          ? one({ status: 'PASS', message: 'A *.bats suite is referenced by CI.', subject: 'tests/' })
          : one({ status: 'VIOLATION', message: '*.bats suite is not referenced by CI.', subject: 'tests/' })
      }
    }
  }
}

export const SHELL: RubricFamily<ToolsRubricContext, ShellToolsContext> = {
  code: 'SHELL',
  title: 'shell capabilities',
  description: 'Shell-specific CI requirements.',
  standard: STANDARD,
  selectContext: (context) => context.shell,
  items: [SHELL_LINT, SHELL_TEST]
}
