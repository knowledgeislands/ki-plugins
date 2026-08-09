import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { GuidesRubricContext } from '../contexts/guides.ts'

export const RUBRIC = createRubricPublicationFamily<GuidesRubricContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
