import type { RubricFamily } from '../../shared/rubric.ts'
import type { DelegationRubricContext } from '../types.ts'

export const PACKET: RubricFamily<DelegationRubricContext, DelegationRubricContext['packets']> = {
  code: 'PACKET',
  title: 'delegation packets',
  description: 'Opted-in delegation-packet structure and delegation quality.',
  standard: 'standards-delegation-packets.md',
  selectContext: (context) => context.packets,
  items: [
    {
      code: 'PACKET-1',
      title: 'packet structure and delegation quality',
      description:
        'An opted-in delegation packet has the required durable brief structure; its worker boundaries, model choices, and gates are fit for the work.',
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
          'Every opted-in delegation packet, its rounds, worker briefs, rolling replenishment plan, and referenced governing work record.',
        prompt:
          'Are the worker boundaries, model choices, locked decisions, escalation boundaries, genuine dependency rounds, rolling replenishment, and verification gates appropriate for the delegated work?',
        outcomes: ['conforming', 'revise packet', 'escalate to planner'],
        guidance:
          'Keep execution authority with the planner. Record a packet revision only after the responsible authority chooses the worker scope, model purpose, escalation boundary, and any genuine dependency gate; replenish completed independent workers without treating the work as a batch.'
      }
    }
  ]
}
