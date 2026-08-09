import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { StreamsRubricContext } from '../contexts/streams.ts'

export const RUBRIC = createRubricPublicationFamily<StreamsRubricContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
