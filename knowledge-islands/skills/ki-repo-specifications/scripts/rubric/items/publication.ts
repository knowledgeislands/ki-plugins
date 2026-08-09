import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { SpecificationsContext } from '../contexts/specifications.ts'

export const RUBRIC = createRubricPublicationFamily<SpecificationsContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
