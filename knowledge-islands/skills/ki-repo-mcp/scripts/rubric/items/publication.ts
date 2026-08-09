import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { McpRubricContext } from '../contexts/mcp.ts'

export const RUBRIC = createRubricPublicationFamily<McpRubricContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
