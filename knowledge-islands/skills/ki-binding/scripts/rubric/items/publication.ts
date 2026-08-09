import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { BindingRubricContext } from '../contexts/binding.ts'

export const RUBRIC = createRubricPublicationFamily<BindingRubricContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
