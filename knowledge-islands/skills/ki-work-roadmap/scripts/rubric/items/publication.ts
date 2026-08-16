import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { RoadmapRubricContext } from '../contexts/roadmap.ts'

export const RUBRIC = createRubricPublicationFamily<RoadmapRubricContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
