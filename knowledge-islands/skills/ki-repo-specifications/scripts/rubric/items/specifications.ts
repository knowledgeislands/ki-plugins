import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { SpecificationsContext } from '../contexts/specifications.ts'

const SOURCE = ['standards-specifications.md'] as const

const SPEC_1: RubricItem<SpecificationsContext> = {
  code: 'SPEC-1',
  title: 'Repository identity marker',
  description:
    '`.ki-config.toml` declares a keyless `[skills.ki-repo-specifications]` table. Unknown keys WARN because the marker has no options yet.',
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
      run: (context): readonly AuditOutcome[] => {
        if (!context.targetExists)
          return [
            {
              status: 'NOT_APPLICABLE',
              message: `The marker cannot be inspected because the target is not a physical directory: ${context.target}.`
            }
          ]
        if (!context.applicable)
          return [
            {
              status: 'NOT_APPLICABLE',
              message: 'ki-repo-specifications is not applicable: its repository declaration is absent.'
            }
          ]
        if (context.malformed)
          return [
            { status: 'VIOLATION', message: '.ki-config.toml is malformed or unsafe.', subject: '.ki-config.toml' }
          ]
        if (!context.table)
          return [
            {
              status: 'VIOLATION',
              message: '[skills.ki-repo-specifications] is absent from .ki-config.toml.',
              subject: '.ki-config.toml'
            }
          ]
        const keys = Object.keys(context.table)
        return [
          keys.length === 0
            ? {
                status: 'PASS',
                message: 'The keyless [skills.ki-repo-specifications] marker is present.',
                subject: '.ki-config.toml'
              }
            : {
                status: 'VIOLATION',
                message: `The keyless marker contains unknown keys: ${keys.join(', ')}.`,
                subject: '.ki-config.toml'
              }
        ]
      }
    }
  }
}

const SPEC_2: RubricItem<SpecificationsContext> = {
  code: 'SPEC-2',
  title: 'Authority areas',
  description: '`proposals/`, `specifications/`, and `schemas/` exist as directories. Their absence FAILs.',
  sources: SOURCE,
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Create the missing authority area only after confirming that the repository is intended to carry this specification responsibility.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context): readonly AuditOutcome[] => {
        if (!context.targetExists)
          return [
            { status: 'VIOLATION', message: `Audit target must be an existing physical directory: ${context.target}.` }
          ]
        if (!context.applicable)
          return [{ status: 'NOT_APPLICABLE', message: 'ki-repo-specifications is not applicable.' }]
        return context.core.map(({ path, exists }) =>
          exists
            ? { status: 'PASS', message: `${path}/ is present.`, subject: path }
            : { status: 'VIOLATION', message: `${path}/ is absent.`, subject: path }
        )
      }
    }
  }
}

const SPEC_3: RubricItem<SpecificationsContext> = {
  code: 'SPEC-3',
  title: 'Supporting areas',
  description: '`templates/`, `examples/`, `docs/`, and `tooling/` exist as directories. Their absence WARNs.',
  sources: SOURCE,
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Create the missing supporting area when its documented responsibility applies, or record why the repository intentionally omits it.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context): readonly AuditOutcome[] => {
        if (!context.applicable)
          return [{ status: 'NOT_APPLICABLE', message: 'ki-repo-specifications is not applicable.' }]
        return context.supporting.map(({ path, exists }) =>
          exists
            ? { status: 'PASS', message: `${path}/ is present.`, subject: path }
            : { status: 'VIOLATION', message: `${path}/ is absent.`, subject: path }
        )
      }
    }
  }
}

const SPEC_J1: RubricItem<SpecificationsContext> = {
  code: 'SPEC-J1',
  title: 'Minimal floor',
  description:
    'Every asserted structure has proved stable enough to govern; this audit observes only the current source tree.',
  sources: SOURCE,
  judgment: {
    scope: 'Each asserted repository structure and the evidence of its sustained use.',
    prompt: 'Has every asserted structure proved stable enough to govern across time?',
    outcomes: ['conforming', 'reduce the floor', 'stability evidence required'],
    guidance:
      'Remove speculative structure from the governed floor, or record sustained evidence separately; a clean structural audit is not longitudinal evidence.'
  }
}

const SPEC_J2: RubricItem<SpecificationsContext> = {
  code: 'SPEC-J2',
  title: 'Authority boundary',
  description:
    'The skill checks repository shape without claiming canonical ownership of normative specification meaning.',
  sources: SOURCE,
  judgment: {
    scope: 'The skill guidance, rubric criteria, and any proposed repository changes.',
    prompt: 'Does the skill preserve the authority boundary around normative specification meaning?',
    outcomes: ['conforming', 'boundary correction required', 'authority decision required'],
    guidance:
      'Limit this skill to repository structure and route normative specification meaning to its canonical authority; record an authority decision where the boundary is disputed.'
  }
}

export const SPEC: RubricFamily<SpecificationsContext, SpecificationsContext> = {
  code: 'SPEC',
  title: 'Repository structure',
  description: 'Repository identity and stable top-level seams.',
  standard: 'standards-specifications.md',
  selectContext: (context: SpecificationsContext) => context,
  items: [SPEC_1, SPEC_2, SPEC_3, SPEC_J1, SPEC_J2]
}
