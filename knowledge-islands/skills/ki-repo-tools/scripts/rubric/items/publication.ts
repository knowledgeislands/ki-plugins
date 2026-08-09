import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { ToolsRubricContext } from '../contexts/tools.ts'

export const RUBRIC = createRubricPublicationFamily<ToolsRubricContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
