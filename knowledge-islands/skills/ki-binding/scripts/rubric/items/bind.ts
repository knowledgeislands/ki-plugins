import type { AuditOutcome, RubricFamily, RubricItem, RubricOutcomes } from '../../shared/rubric.ts'
import { type BindingRubricContext, RECOGNISED } from '../contexts/binding.ts'

const BIND_1: RubricItem<BindingRubricContext> = {
  code: 'BIND-1',
  title: 'File-editable surfaces agree with the source',
  description: 'Every rendered surface contains exactly the KI-governed servers that target it.',
  sources: ['standards-cross-surface-binding.md'],
  mechanical: {
    level: 'WARN',
    audit: {
      phase: 'INSPECT',
      run: ({ sourceState, surfaces }) => {
        if (sourceState.kind !== 'valid')
          return [{ status: 'NOT_APPLICABLE', message: 'The source could not be read, so surfaces were not compared.' }]
        const universe = new Set(sourceState.entries.flatMap((entry) => (entry.name ? [entry.name] : [])))
        return surfaces.flatMap<AuditOutcome>(({ surface, serverKeys }): RubricOutcomes<AuditOutcome> => {
          if (serverKeys === null)
            return [
              {
                status: 'INFO',
                message: `${surface.label} configuration is absent or unreadable; this surface was not compared.`,
                subject: surface.path
              }
            ]
          const expected = new Set(
            sourceState.entries.flatMap((entry) => (entry.name && entry.clients?.includes(surface.token) ? [entry.name] : []))
          )
          const present = new Set([...serverKeys].filter((name) => universe.has(name)))
          const missing = [...expected].filter((name) => !present.has(name)).sort()
          const stray = [...present].filter((name) => !expected.has(name)).sort()
          if (!missing.length && !stray.length)
            return [
              {
                status: 'PASS',
                message: `${surface.label} agrees with the source (${expected.size} server(s)).`,
                subject: surface.path
              }
            ]
          return [
            ...missing.map((name) => ({
              status: 'VIOLATION' as const,
              message: `${surface.label} is missing expected server ${name}.`,
              subject: surface.path
            })),
            ...stray.map((name) => ({
              status: 'VIOLATION' as const,
              message: `${surface.label} has stray KI-governed server ${name}.`,
              subject: surface.path
            }))
          ]
        })
      }
    }
  }
}

const BIND_2: RubricItem<BindingRubricContext> = {
  code: 'BIND-2',
  title: 'Single MCP source is valid',
  description: 'The source exists, parses, and names supported surfaces.',
  sources: ['standards-cross-surface-binding.md'],
  mechanical: {
    level: 'FAIL',
    overrideLevels: ['WARN'],
    audit: {
      phase: 'PREPARE',
      run: ({ source, sourceState }) => {
        if (sourceState.kind === 'absent')
          return [{ status: 'VIOLATION', message: 'The single MCP source is absent; create it or set KI_MCP_SOURCE.', subject: source }]
        if (sourceState.kind === 'invalid')
          return [{ status: 'VIOLATION', message: `The single MCP source cannot be parsed: ${sourceState.message}`, subject: source }]
        const outcomes: AuditOutcome[] = sourceState.entries.flatMap((entry, index) => {
          const location = entry.name ? `Server ${JSON.stringify(entry.name)}` : `Entry ${index + 1}`
          return [
            ...(!entry.name
              ? [{ status: 'VIOLATION' as const, level: 'WARN' as const, message: `${location} has no name.`, subject: source }]
              : []),
            ...((entry.clients ?? []).length === 0
              ? [{ status: 'VIOLATION' as const, level: 'WARN' as const, message: `${location} targets no surface.`, subject: source }]
              : []),
            ...(entry.clients ?? [])
              .filter((client) => !RECOGNISED.has(client))
              .map((client) => ({
                status: 'VIOLATION' as const,
                level: 'WARN' as const,
                message: `${location} names unrecognised surface ${JSON.stringify(client)}.`,
                subject: source
              }))
          ]
        })
        return outcomes.length
          ? outcomes
          : [{ status: 'PASS', message: `The source is valid with ${sourceState.entries.length} declared server(s).`, subject: source }]
      }
    }
  }
}

const BIND_3: RubricItem<BindingRubricContext> = {
  code: 'BIND-3',
  title: 'Project-local skill links are wired',
  description: 'Declared governance skills are present for each repository-supported runtime.',
  sources: ['standards-cross-surface-binding.md'],
  mechanical: {
    level: 'WARN',
    audit: {
      phase: 'DERIVED',
      run: ({ repository }) => {
        if (!repository.runtimeRoots.length)
          return [
            { status: 'INFO', message: 'No supported project runtime skill roots were declared or discovered.', subject: repository.path }
          ]
        if (repository.missingSkills.length)
          return [
            {
              status: 'VIOLATION',
              message: `Project-local skill delivery is missing ${repository.missingSkills.join(', ')}; run ki-bootstrap CONFORM.`,
              subject: repository.path
            }
          ]
        return [
          {
            status: 'PASS',
            message: `${repository.declaredSkills.length} declared skill(s) are present across ${repository.runtimeRoots.length} runtime root(s).`,
            subject: repository.path
          }
        ]
      }
    }
  }
}

const BIND_4: RubricItem<BindingRubricContext> = {
  code: 'BIND-4',
  title: 'Cowork plugin integrity',
  description: 'Cowork settings register and enable the KI plugin.',
  sources: ['standards-cross-surface-binding.md'],
  mechanical: {
    level: 'WARN',
    audit: {
      phase: 'INSPECT',
      run: ({ cowork }) => {
        if (!cowork.files.length)
          return [
            {
              status: 'INFO',
              message: 'No Cowork settings were found; the Cowork surface is not present on this machine.',
              subject: cowork.base
            }
          ]
        const unsafe = cowork.files.filter((file) => file.status === 'unsafe' || file.status === 'unreadable')
        if (unsafe.length)
          return unsafe.map((file) => ({
            status: 'VIOLATION' as const,
            message: `Cowork settings are ${file.status}; the file cannot be conformed safely.`,
            subject: file.subject
          }))
        const pending = cowork.files.filter((file) => file.status === 'pending')
        return pending.length
          ? pending.map((file) => ({
              status: 'VIOLATION' as const,
              message: 'The KI plugin is not registered and enabled; run CONFORM then relaunch Cowork.',
              subject: file.subject
            }))
          : [{ status: 'PASS', message: `The Cowork plugin is registered and enabled in all ${cowork.files.length} workspace(s).` }]
      }
    },
    conform: {
      phase: 'PRIMARY',
      run: ({ cowork }) => {
        for (const file of cowork.files) if (file.status === 'pending') file.enable?.()
      }
    }
  }
}

const BIND_5: RubricItem<BindingRubricContext> = {
  code: 'BIND-5',
  title: 'Client targeting is right for project use',
  description: 'The clients set reflects intended surface use.',
  sources: ['standards-cross-surface-binding.md'],
  judgment: { prompt: 'Does each server target the surfaces the project needs, without carrying surfaces it should not?' }
}

export const BIND: RubricFamily<BindingRubricContext, BindingRubricContext> = {
  code: 'BIND',
  title: 'Cross-surface agreement',
  description: 'Agreement between the canonical source, repository delivery, and enabled run surfaces.',
  standard: 'standards-cross-surface-binding.md',
  selectContext: (context) => context,
  items: [BIND_1, BIND_2, BIND_3, BIND_4, BIND_5]
}
