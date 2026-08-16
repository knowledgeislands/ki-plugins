import type { RubricFamily } from '../../shared/rubric.ts'
import type { DelegationRubricContext } from '../types.ts'

export const PACKET: RubricFamily<DelegationRubricContext, DelegationRubricContext['packets']> = {
  code: 'PACKET',
  title: 'delegation packets',
  description: 'Opted-in durable delegation-packet structure and governance quality.',
  standard: 'standards-delegation-packets.md',
  selectContext: (context) => context.packets,
  items: [
    {
      code: 'PACKET-1',
      title: 'durable packet structure and governance quality',
      description:
        'An opted-in durable delegation packet in either roadmap adapter has the exact brief structure; its worker scope, authority, isolation, escalation, return contract, and verification gates are fit for the high-risk handoff.',
      sources: ['standards-delegation-packets.md'],
      mechanical: {
        level: 'FAIL',
        remediation: {
          class: 'guarded',
          guidance:
            'Supply the missing packet evidence or revise the worker brief only through the planner with the relevant delegation authority.'
        },
        audit: { phase: 'INSPECT', run: ({ outcomes }) => outcomes }
      },
      judgment: {
        scope:
          'Every opted-in durable delegation packet, its activation rationale, worker briefs, and referenced approved governing work record.',
        prompt:
          'Does the work need a durable packet rather than ordinary runtime delegation, and are the worker inputs, scope, authority, isolation, locked decisions, escalation boundaries, return contract, and verification gates appropriate for that high-risk handoff?',
        outcomes: ['conforming', 'revise packet', 'escalate to planner'],
        guidance:
          'Use a packet only when its durable authority and audit evidence add value beyond the runtime brief. Record a packet revision only after the responsible authority chooses the worker scope, isolation, locked decisions, escalation boundary, return evidence, and verification gate; leave worker selection, model choice, scheduling, and integration to the active process and runtime.'
      }
    }
  ]
}
