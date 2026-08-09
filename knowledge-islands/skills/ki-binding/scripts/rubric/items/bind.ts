import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { type BindingRubricContext, RECOGNISED } from '../contexts/binding.ts'

const BIND_1: RubricItem<BindingRubricContext> = {
  code: 'BIND-1',
  title: 'mcporter agrees with the source',
  description: 'The vendor-neutral mcporter target contains exactly the KI servers targeting `mcporter`.',
  sources: ['standards-cross-surface-binding.md'],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Reconcile the canonical source and mcporter target through the binding workflow; do not infer client exposure from the target alone.'
    },
    audit: {
      phase: 'INSPECT',
      run: ({ sourceState, mcporterPath, mcporterServerKeys }) => {
        if (sourceState.kind !== 'valid')
          return [{ status: 'NOT_APPLICABLE', message: 'The source could not be read, so mcporter was not compared.' }]
        if (mcporterServerKeys === null)
          return [
            {
              status: 'INFO',
              message: 'The mcporter configuration is absent or unreadable; it was not compared.',
              subject: mcporterPath
            }
          ]
        const universe = new Set(sourceState.entries.flatMap((entry) => (entry.name ? [entry.name] : [])))
        const expected = new Set(
          sourceState.entries.flatMap((entry) =>
            entry.name && entry.clients?.includes('mcporter') ? [entry.name] : []
          )
        )
        const present = new Set([...mcporterServerKeys].filter((name) => universe.has(name)))
        const missing = [...expected].filter((name) => !present.has(name)).sort()
        const stray = [...present].filter((name) => !expected.has(name)).sort()
        if (!missing.length && !stray.length)
          return [
            {
              status: 'PASS',
              message: `mcporter agrees with the source (${expected.size} server(s)).`,
              subject: mcporterPath
            }
          ]
        return [
          ...missing.map((name) => ({
            status: 'VIOLATION' as const,
            message: `mcporter is missing expected server ${name}.`,
            subject: mcporterPath
          })),
          ...stray.map((name) => ({
            status: 'VIOLATION' as const,
            message: `mcporter has stray KI-governed server ${name}.`,
            subject: mcporterPath
          }))
        ]
      }
    }
  }
}
const BIND_2: RubricItem<BindingRubricContext> = {
  code: 'BIND-2',
  title: 'Single MCP source is valid',
  description: 'The canonical source exists, parses, and gives each entry a valid client target.',
  sources: ['standards-cross-surface-binding.md'],
  mechanical: {
    level: 'FAIL',
    overrideLevels: ['WARN'],
    remediation: {
      class: 'diagnostic',
      guidance:
        'Correct the canonical MCP source so every server has one transport and valid, intentional client targets before regenerating bindings.'
    },
    audit: {
      phase: 'PREPARE',
      run: ({ source, sourceState }) => {
        if (sourceState.kind === 'absent')
          return [
            {
              status: 'VIOLATION',
              message: 'The canonical MCP source is absent; create it or set KI_MCP_SOURCE.',
              subject: source
            }
          ]
        if (sourceState.kind === 'invalid')
          return [
            {
              status: 'VIOLATION',
              message: `The canonical MCP source cannot be parsed: ${sourceState.message}`,
              subject: source
            }
          ]
        const names = new Set<string>()
        const outcomes: AuditOutcome[] = sourceState.entries.flatMap((entry, index) => {
          const label = entry.name ? `Server ${JSON.stringify(entry.name)}` : `Entry ${index + 1}`
          const duplicate = entry.name ? names.has(entry.name) : false
          if (entry.name) names.add(entry.name)
          return [
            ...(!entry.name
              ? [
                  {
                    status: 'VIOLATION' as const,
                    level: 'WARN' as const,
                    message: `${label} has no name.`,
                    subject: source
                  }
                ]
              : []),
            ...(duplicate
              ? [
                  {
                    status: 'VIOLATION' as const,
                    level: 'WARN' as const,
                    message: `${label} repeats an existing name.`,
                    subject: source
                  }
                ]
              : []),
            ...((entry.clients ?? []).length === 0
              ? [
                  {
                    status: 'VIOLATION' as const,
                    level: 'WARN' as const,
                    message: `${label} targets no client.`,
                    subject: source
                  }
                ]
              : []),
            ...(Boolean(entry.command) === Boolean(entry.url)
              ? [
                  {
                    status: 'VIOLATION' as const,
                    level: 'WARN' as const,
                    message: `${label} must define exactly one command or URL.`,
                    subject: source
                  }
                ]
              : []),
            ...(entry.clients ?? [])
              .filter((client) => !RECOGNISED.has(client))
              .map((client) => ({
                status: 'VIOLATION' as const,
                level: 'WARN' as const,
                message: `${label} names unrecognised client ${JSON.stringify(client)}.`,
                subject: source
              }))
          ]
        })
        return outcomes.length
          ? outcomes
          : [
              {
                status: 'PASS',
                message: `The source is valid with ${sourceState.entries.length} declared server(s).`,
                subject: source
              }
            ]
      }
    }
  }
}
const BIND_J1: RubricItem<BindingRubricContext> = {
  code: 'BIND-J1',
  title: 'Client targeting is right for use',
  description: 'The clients set reflects intended, least-surprising client availability.',
  sources: ['standards-cross-surface-binding.md'],
  judgment: {
    scope: 'Every canonical MCP server and its intended client availability.',
    prompt: 'Does each server target the clients that need it, without exposing it on clients that do not?',
    outcomes: ['conforming', 'target adjustment required', 'authority decision required'],
    guidance:
      'Adjust the canonical clients set to the least-surprising intended availability, or record the owning authority decision before changing exposure.'
  }
}
export const BIND: RubricFamily<BindingRubricContext, BindingRubricContext> = {
  code: 'BIND',
  title: 'Canonical MCP binding',
  description: 'Portable source validity, client targeting, and mcporter drift evidence.',
  standard: 'standards-cross-surface-binding.md',
  selectContext: (context) => context,
  items: [BIND_1, BIND_2, BIND_J1]
}
