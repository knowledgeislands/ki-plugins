import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { ClaudeBindingContext } from '../contexts/claude.ts'

export const RUBRIC = createRubricPublicationFamily<ClaudeBindingContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
