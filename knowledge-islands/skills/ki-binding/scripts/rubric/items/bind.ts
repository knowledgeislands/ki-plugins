import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { type BindingRubricContext, mcporterMatches } from '../contexts/binding.ts'

const BIND_1: RubricItem<BindingRubricContext> = {
  code: 'BIND-1',
  title: 'mcporter agrees with source definitions',
  description:
    'An explicitly selected mcporter target has the complete non-secret definitions for each mcporter-targeted server.',
  sources: ['standards-cross-surface-binding.md'],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Select an authoritative mcporter config through MCPORTER_CONFIG, then reconcile its full non-secret targeted definitions through the binding workflow.'
    },
    audit: {
      phase: 'INSPECT',
      run: ({ sourceState, mcporter }) => {
        if (sourceState.kind !== 'valid')
          return [{ status: 'NOT_APPLICABLE', message: 'The source could not be read, so mcporter was not compared.' }]
        if (mcporter.kind === 'unavailable')
          return [
            {
              status: 'INFO',
              message:
                'No explicit readable mcporter target is available; definition and runtime parity are unavailable.',
              ...(mcporter.path ? { subject: mcporter.path } : {})
            }
          ]
        if (mcporter.kind === 'invalid')
          return [
            {
              status: 'VIOLATION',
              message: 'The explicit mcporter target is malformed or unsupported for non-secret comparison.',
              subject: mcporter.path
            }
          ]
        const expected = sourceState.entries.filter((entry) => entry.clients.includes('mcporter'))
        const outcomes: AuditOutcome[] = []
        for (const entry of expected)
          outcomes.push(
            mcporterMatches(entry, mcporter.servers[entry.name])
              ? {
                  status: 'PASS',
                  message: `mcporter matches the full non-secret definition for ${entry.name}.`,
                  subject: mcporter.path
                }
              : {
                  status: 'VIOLATION',
                  message: `mcporter does not match the full non-secret definition for ${entry.name}.`,
                  subject: mcporter.path
                }
          )
        return outcomes.length
          ? outcomes
          : [{ status: 'PASS', message: 'No server targets mcporter.', subject: mcporter.path }]
      }
    }
  }
}

const BIND_2: RubricItem<BindingRubricContext> = {
  code: 'BIND-2',
  title: 'Single MCP source is valid',
  description: 'The resolved canonical source is a physical file with a closed, portable server schema.',
  sources: ['standards-cross-surface-binding.md'],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Correct the canonical MCP source so every server has one valid transport definition and current, intentional client targets.'
    },
    audit: {
      phase: 'PREPARE',
      run: ({ source, sourceState }) =>
        sourceState.kind === 'absent'
          ? [
              {
                status: 'VIOLATION',
                message: 'The canonical MCP source is absent; create it or set KI_MCP_SOURCE.',
                subject: source
              }
            ]
          : sourceState.kind === 'invalid'
            ? [
                {
                  status: 'VIOLATION',
                  message: `The canonical MCP source is invalid: ${sourceState.message}`,
                  subject: source
                }
              ]
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
  description: 'Portable source validity, client targeting, and non-secret mcporter definition evidence.',
  standard: 'standards-cross-surface-binding.md',
  selectContext: (context) => context,
  items: [BIND_1, BIND_2, BIND_J1]
}
