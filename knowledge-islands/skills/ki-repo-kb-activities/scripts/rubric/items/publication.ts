import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { ActivitiesRubricContext } from '../contexts/activities.ts'

export const RUBRIC = createRubricPublicationFamily<ActivitiesRubricContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
