import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { HomebrewTapRubricContext } from '../contexts/homebrew-tap.ts'

export const RUBRIC = createRubricPublicationFamily<HomebrewTapRubricContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
