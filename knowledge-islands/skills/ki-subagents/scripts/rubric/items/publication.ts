import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { PortableContext } from '../contexts/portable.ts'

export const RUBRIC = createRubricPublicationFamily<PortableContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
