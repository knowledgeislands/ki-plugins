import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { BindingChezMoiContext } from '../contexts/binding-chezmoi.ts'

export const RUBRIC = createRubricPublicationFamily<BindingChezMoiContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
