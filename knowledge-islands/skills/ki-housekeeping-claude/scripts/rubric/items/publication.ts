import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { HousekeepingRubricContext } from '../contexts/housekeeping.ts'

export const RUBRIC = createRubricPublicationFamily<HousekeepingRubricContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
