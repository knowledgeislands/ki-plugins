import { judgment, type RubricFamily } from '../../shared/rubric.ts'
import type { PortableContext } from '../contexts/portable.ts'

export const HOST: RubricFamily<PortableContext, PortableContext> = {
  code: 'HOST',
  title: 'Host/runtime boundary',
  description: 'No source-only false assurance.',
  standard: 'standards-portable-subagents.md',
  selectContext: (context) => context,
  items: [
    {
      code: 'HOST-1',
      title: 'No false runtime assurance',
      description: 'Source evidence is not activation or execution evidence.',
      sources: ['standards-portable-subagents.md#boundary'],
      judgment: judgment(
        'The role and adapters do not report source conformance as installation, publication, activation, effective settings, or execution.'
      )
    }
  ]
}
