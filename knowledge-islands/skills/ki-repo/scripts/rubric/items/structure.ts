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
  mechanical: {
    level,
    remediation: {
      class: 'diagnostic',
      guidance:
        'Align the repository structure declaration with the applicable standard or record an explicit exemption, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(evidence(context), level) }
  }
})

export const STRUCT: RubricFamily<RepoRubricContext, StructureRubricContext> = {
  code: 'STRUCT',
  title: 'Repository structure',
  description: 'Primary repository structure, with composable specialisations.',
  standard: SOURCE,
  selectContext: (context) => context.structure,
  items: [
    item(
      'STRUCT-1',
      'Single primary repository structure',
      'A repository declares at most one mutually exclusive Project or Knowledge Base primary.',
      'FAIL',
      (context) => context.structure1
    ),
    item(
      'STRUCT-2',
      'Primary repository structure presence',
      'A repository declares a Project or Knowledge Base primary structure.',
      'WARN',
      (context) => context.structure2
    )
  ]
}
