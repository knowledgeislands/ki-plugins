import type { RubricFamily } from '../../shared/rubric.ts'
import type { PaperclipCoordinationContext } from '../contexts/coordination.ts'

export const ORG: RubricFamily<PaperclipCoordinationContext, PaperclipCoordinationContext['organisation']> = {
  code: 'ORG',
  title: 'Paperclip organisation identity',
  description: 'Each repository explicitly declares its owning Paperclip organisation code.',
  standard: 'standards-agent-coordination-paperclip.md',
  selectContext: (context) => context.organisation,
  items: [
    {
      code: 'ORG-1',
      title: 'Required organisation code',
      description: 'The skill declaration requires one stable uppercase organisation_code and no unknown keys.',
      sources: ['standards-agent-coordination-paperclip.md#organisation-identity'],
      mechanical: {
        level: 'FAIL',
        remediation: {
          class: 'diagnostic',
          guidance: 'Set organisation_code to the repository’s owning Paperclip company code in .ki.toml.'
        },
        audit: { phase: 'INSPECT', run: ({ outcomes }) => outcomes }
      }
    }
  ]
}
