import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { type ClaudeBindingContext, targetMatches } from '../contexts/claude.ts'

const source = ['standards-claude-binding.md'] as const
const CLAUDEBIND_1: RubricItem<ClaudeBindingContext> = {
  code: 'CLAUDEBIND-1',
  title: 'Claude Code and Desktop definition agreement',
  description:
    'Configured Claude JSON surfaces have the complete non-secret source definition for each targeted server.',
  sources: source,
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Reconcile the affected Claude JSON surface with the canonical targeted definitions, then rerun the audit.'
    },
    audit: {
      phase: 'INSPECT',
      run: ({ sourceState, code, desktop }) => {
        if (sourceState.kind !== 'valid')
          return [
            {
              status: 'NOT_APPLICABLE',
              message: 'The canonical source is unavailable, so Claude targets were not compared.'
            }
          ]
        return [
          [code, 'claude-code', 'Claude Code'],
          [desktop, 'claude-desktop', 'Claude Desktop']
        ].map(([state, client, label]) => {
          const target = state as typeof code,
            mismatches = targetMatches(sourceState, client as 'claude-code' | 'claude-desktop', target)
          if (target.kind === 'unavailable')
            return {
              status: 'INFO' as const,
              message: `${label} target evidence is unavailable; definition and runtime parity are unavailable.`,
              subject: target.path
            }
          if (target.kind === 'invalid')
            return {
              status: 'VIOLATION' as const,
              message: `${label} target is malformed or unsupported for definition comparison.`,
              subject: target.path
            }
          return mismatches?.length
            ? {
                status: 'VIOLATION' as const,
                message: `${label} does not match every targeted full non-secret definition.`,
                subject: target.path
              }
            : {
                status: 'PASS' as const,
                message: `${label} matches all targeted full non-secret definitions.`,
                subject: target.path
              }
        })
      }
    }
  }
}
const CLAUDEBIND_2: RubricItem<ClaudeBindingContext> = {
  code: 'CLAUDEBIND-2',
  title: 'Cowork registration remains unavailable without product-specific evidence',
  description: 'Cowork registration is recorded separately from source projection, activation, and runtime health.',
  sources: source,
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Obtain a product-specific Cowork external-edit and next-launch evidence contract before automating settings changes.'
    },
    audit: {
      phase: 'INSPECT',
      run: ({ cowork, coworkBase }) =>
        !cowork.length
          ? [
              {
                status: 'INFO',
                message:
                  'No Cowork workspace settings were found; registration, activation, and runtime health are unavailable.',
                subject: coworkBase
              }
            ]
          : cowork.map((file) => ({
              status: file.status === 'unsafe' ? ('VIOLATION' as const) : ('INFO' as const),
              message:
                file.status === 'unsafe'
                  ? 'Cowork settings are unsafe or unreadable.'
                  : file.status === 'already'
                    ? 'Cowork registration is present; activation and runtime health remain unavailable.'
                    : 'Cowork registration is absent; automatic repair is unsupported without product-specific authority.',
              subject: file.subject
            }))
    }
  }
}
const CLAUDEBIND_J1: RubricItem<ClaudeBindingContext> = {
  code: 'CLAUDEBIND-J1',
  title: 'Web convention is intentional',
  description: 'claude.ai web use is documented as a convention rather than a local render target.',
  sources: source,
  judgment: {
    scope: 'The documented claude.ai web convention and every claimed Claude runtime surface.',
    prompt: 'Is the web convention explicit without claiming a local file or renderer exists?',
    outcomes: ['conforming', 'documentation revision', 'route to binding owner'],
    guidance:
      'Clarify the convention or route a claimed renderer to its owning binding; do not invent a local web configuration surface.'
  }
}
export const CLAUDEBIND: RubricFamily<ClaudeBindingContext, ClaudeBindingContext> = {
  code: 'CLAUDEBIND',
  title: 'Claude binding',
  description: 'Claude-native JSON definition, Cowork-registration, and unavailable-runtime evidence.',
  standard: 'standards-claude-binding.md',
  selectContext: (context) => context,
  items: [CLAUDEBIND_1, CLAUDEBIND_2, CLAUDEBIND_J1]
}
