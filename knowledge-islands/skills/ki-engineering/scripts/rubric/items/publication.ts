import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { EngineeringRubricContext } from '../contexts/engineering.ts'

export const RUBRIC = createRubricPublicationFamily<EngineeringRubricContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
