import { judgment, type RubricFamily } from '../../shared/rubric.ts'
import type { GranolaRubricContext } from '../contexts/granola.ts'

export const ACQUIRE = {
  code: 'ACQUIRE',
  title: 'Granola acquisition fidelity',
  standard: 'standards-granola-acquisition.md',
  description: 'Complete enumeration, faithful source projections, immutable checkpoints.',
  selectContext: (context) => context,
  items: [
    {
      code: 'ACQUIRE-1',
      title: 'complete identity enumeration',
      description:
        'Global and every folder history use saturation-aware date-window splitting, UUID reconciliation, and fail-closed completeness evidence.',
      sources: ['standards-granola-acquisition.md#complete-identity-enumeration'],
      judgment: judgment(
        'Does the evidence prove every global and folder window complete, unsaturated, deduplicated, and resumable?'
      )
    },
    {
      code: 'ACQUIRE-2',
      title: 'faithful read and checkpoint',
      description:
        'Exact meeting-detail and transcript projections are hashed separately from identity evidence, retained immutably, and accompanied by explicit omissions.',
      sources: ['standards-granola-acquisition.md#acquisition-fidelity', 'standards-granola-acquisition.md#checkpoint'],
      judgment: judgment(
        'Does runtime evidence preserve exact returned projections, content hashes, immutable versions, provenance, and explicit omissions?'
      )
    },
    {
      code: 'ACQUIRE-3',
      title: 'amendment revalidation honest',
      description:
        'Routine and exhaustive content revalidation are distinguished because identity listing cannot prove existing notes or transcripts unchanged.',
      sources: ['standards-granola-acquisition.md#incremental-acquisition-and-amendments'],
      judgment: judgment(
        'Does the checkpoint evidence name its revalidation coverage and avoid claiming unchanged content from identity listing alone?'
      )
    }
  ]
} satisfies RubricFamily<GranolaRubricContext, GranolaRubricContext>
