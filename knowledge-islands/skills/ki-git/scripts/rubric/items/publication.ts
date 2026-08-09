import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { GitRubricContext } from '../contexts/git.ts'

export const RUBRIC = createRubricPublicationFamily<GitRubricContext>(
  ({ rubric }) => rubric ?? {},
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
