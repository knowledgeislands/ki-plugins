import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type GhRubricContext, type RepoRubricContext } from '../contexts/repository.ts'

const SOURCE = 'standards-repository.md'

const item = (
  code: string,
  title: string,
  description: string,
  evidence: (context: GhRubricContext) => GhRubricContext['gh1']
): RubricItem<GhRubricContext> => ({
  code,
  title,
  description,
  sources: [SOURCE],
  mechanical: { level: 'FAIL', audit: { phase: 'INSPECT', run: (context) => auditEvidence(evidence(context), 'FAIL') } }
})

export const GH: RubricFamily<RepoRubricContext, GhRubricContext> = {
  code: 'GH',
  title: 'Core GitHub settings',
  description: 'Default branch, licensing, and repository description.',
  standard: SOURCE,
  selectContext: (context) => context.gh,
  items: [
    item('GH-1', 'Default branch', 'The default branch is main.', (context) => context.gh1),
    item('GH-2', 'Declared license alignment', 'The declared license agrees with GitHub and package.json.', (context) => context.gh2),
    item(
      'GH-3',
      'Description presence and synchronisation',
      'The GitHub description is non-empty and matches package.json when that source exists.',
      (context) => context.gh3
    )
  ]
}
