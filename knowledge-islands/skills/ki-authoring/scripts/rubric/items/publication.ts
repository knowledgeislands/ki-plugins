import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { AuthoringRubricContext } from '../contexts/authoring.ts'

export const RUBRIC = createRubricPublicationFamily<AuthoringRubricContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
