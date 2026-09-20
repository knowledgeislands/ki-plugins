import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { AgenticRadarRubricContext } from '../contexts/radar.ts'

export const RUBRIC = createRubricPublicationFamily<AgenticRadarRubricContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
