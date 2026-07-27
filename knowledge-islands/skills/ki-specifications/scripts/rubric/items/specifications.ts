import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { SpecificationsContext } from '../contexts/specifications.ts'

const SOURCE = ['standards-specifications.md'] as const

const SPEC_1: RubricItem<SpecificationsContext> = {
  code: 'SPEC-1',
  title: 'Repository identity marker',
  description: '`.ki-config.toml` declares a keyless `[ki-specifications]` table. Unknown keys WARN because the marker has no options yet.',
  sources: SOURCE,
  mechanical: {
    level: 'WARN',
    overrideLevels: ['FAIL'],
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
              message: 'ki-specifications is not applicable: no declaration or core structural marker is present.'
            }
          ]
        if (context.malformed)
          return [{ status: 'VIOLATION', message: '.ki-config.toml is malformed or unsafe.', subject: '.ki-config.toml' }]
        if (!context.table)
          return [{ status: 'VIOLATION', message: '[ki-specifications] is absent from .ki-config.toml.', subject: '.ki-config.toml' }]
        const keys = Object.keys(context.table)
        return [
          keys.length === 0
            ? { status: 'PASS', message: 'The keyless [ki-specifications] marker is present.', subject: '.ki-config.toml' }
            : { status: 'VIOLATION', message: `The keyless marker contains unknown keys: ${keys.join(', ')}.`, subject: '.ki-config.toml' }
        ]
      }
    },
    conform: {
      phase: 'NORMALISE',
      run: (context): void => context.addMarker?.()
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
    audit: {
      phase: 'INSPECT',
      run: (context): readonly AuditOutcome[] => {
        if (!context.targetExists)
          return [{ status: 'VIOLATION', message: `Audit target must be an existing physical directory: ${context.target}.` }]
        if (!context.applicable) return [{ status: 'NOT_APPLICABLE', message: 'ki-specifications is not applicable.' }]
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
    audit: {
      phase: 'INSPECT',
      run: (context): readonly AuditOutcome[] => {
        if (!context.applicable) return [{ status: 'NOT_APPLICABLE', message: 'ki-specifications is not applicable.' }]
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
  description: 'Every asserted structure has proved stable enough to govern across time.',
  sources: SOURCE,
  judgment: { prompt: 'Has every asserted structure proved stable enough to govern across time?' }
}

const SPEC_J2: RubricItem<SpecificationsContext> = {
  code: 'SPEC-J2',
  title: 'Authority boundary',
  description: 'The skill checks repository shape without claiming canonical ownership of normative specification meaning.',
  sources: SOURCE,
  judgment: { prompt: 'Does the skill preserve the authority boundary around normative specification meaning?' }
}

export const SPEC: RubricFamily<SpecificationsContext, SpecificationsContext> = {
  code: 'SPEC',
  title: 'Repository structure',
  description: 'Repository identity and stable top-level seams.',
  standard: 'standards-specifications.md',
  selectContext: (context: SpecificationsContext) => context,
  items: [SPEC_1, SPEC_2, SPEC_3, SPEC_J1, SPEC_J2]
}
