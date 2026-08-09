import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { CheckpointsRubricContext } from '../contexts/checkpoints.ts'

export const RUBRIC = createRubricPublicationFamily<CheckpointsRubricContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
