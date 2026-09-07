import { judgment, type RubricFamily } from '../../shared/rubric.ts'
import type { GranolaRubricContext } from '../contexts/granola.ts'

export const ROUTING = {
  code: 'ROUTING',
  title: 'Granola receiver routing',
  standard: 'standards-granola-acquisition.md',
  description: 'Folder evidence, inferred unfoldered coverage, visible receiver conflicts.',
  selectContext: (context) => context,
  items: [
    {
      code: 'ROUTING-1',
      title: 'folder evidence reconciled',
      description:
        'Folder membership comes from complete query context and unfoldered identity is inferred only from the complete global-minus-folder union.',
      sources: ['standards-granola-acquisition.md#folder-unfoldered-and-receiver-evidence'],
      judgment: judgment(
        'Does the routing evidence distinguish provider fields from query-derived folder and unfoldered inference?'
      )
    },
    {
      code: 'ROUTING-2',
      title: 'receiver conflicts fail closed',
      description:
        'Conflicting folder mappings require human selection; multi-repository acquisition requires explicit intentional duplication.',
      sources: ['standards-granola-acquisition.md#folder-unfoldered-and-receiver-evidence'],
      judgment: judgment(
        'Are unmatched, overlapping, excluded, and conflicting identities visible without silent precedence or duplication?'
      )
    }
  ]
} satisfies RubricFamily<GranolaRubricContext, GranolaRubricContext>
