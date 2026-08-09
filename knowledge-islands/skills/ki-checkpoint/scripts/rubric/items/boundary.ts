import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { CheckpointsRubricContext, OutcomeContext } from '../contexts/checkpoints.ts'

const SOURCE = 'standards-checkpoints.md'

const BOUNDARY_1: RubricItem<OutcomeContext> = {
  code: 'BOUNDARY-1',
  title: 'checkpoint contains reconstruction state only',
  description:
    'A checkpoint has no vendor-session field, conversation locator, role-by-role transcript, or mechanically recognisable claim that a fresh agent can reopen the originating session. It is reconstruction state, not session continuity.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    heuristic: true,
    remediation: {
      class: 'guarded',
      guidance: 'Remove session-continuity material only through an explicit user-authorised checkpoint update.'
    },
    audit: { phase: 'INSPECT', run: ({ outcomes }) => outcomes }
  },
  judgment: {
    scope: 'Every active and retired checkpoint record and its reconstruction content.',
    prompt:
      'Would this checkpoint reconstruct the work for an agent with no transcript or vendor-session access, without implying that the originating conversation can be reopened?',
    outcomes: ['conforming', 'explicit update required', 'escalate to user'],
    guidance:
      'Do not edit checkpoint content without explicit authority; ask the user when reconstruction content or ownership is uncertain.'
  }
}

export const BOUNDARY: RubricFamily<CheckpointsRubricContext, OutcomeContext> = {
  code: 'BOUNDARY',
  title: 'Runtime-neutral reconstruction',
  description: 'Portable checkpoint content never depends on a transcript, vendor session, or private runtime state.',
  standard: SOURCE,
  selectContext: (context) => context.boundary,
  items: [BOUNDARY_1]
}
