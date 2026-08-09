import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { ClaudeRubricContext } from '../contexts/claude.ts'

export const RUBRIC = createRubricPublicationFamily<ClaudeRubricContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
