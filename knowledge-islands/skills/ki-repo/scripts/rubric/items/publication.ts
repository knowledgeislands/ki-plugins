import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { RepoRubricContext } from '../contexts/repository.ts'

export const RUBRIC = createRubricPublicationFamily<RepoRubricContext>(
  ({ rubric }) => rubric,
  '../../ki-skills/references/standards-rubric-authoring.md',
  ['../../ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
