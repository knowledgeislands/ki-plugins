import type { RubricFamily, RubricItem, ViolationLevel } from '../../shared/rubric.ts'
import { auditEvidence, type RepoRubricContext, type StructureRubricContext } from '../contexts/repository.ts'

const SOURCE = 'standards-repository.md'

const item = (
  code: string,
  title: string,
  description: string,
  level: ViolationLevel,
  evidence: (context: StructureRubricContext) => StructureRubricContext['structure1']
): RubricItem<StructureRubricContext> => ({
  code,
  title,
  description,
  sources: [SOURCE],
  mechanical: { level, audit: { phase: 'INSPECT', run: (context) => auditEvidence(evidence(context), level) } }
})

export const STRUCT: RubricFamily<RepoRubricContext, StructureRubricContext> = {
  code: 'STRUCT',
  title: 'Repository structure',
  description: 'Structural governance identity.',
  standard: SOURCE,
  selectContext: (context) => context.structure,
  items: [
    item(
      'STRUCT-1',
      'Single repository structure',
      'A repository declares at most one repo-structure governance table.',
      'FAIL',
      (context) => context.structure1
    ),
    item(
      'STRUCT-2',
      'Repository structure presence',
      'A repository normally declares one repo-structure table unless explicitly exempted.',
      'WARN',
      (context) => context.structure2
    )
  ]
}
