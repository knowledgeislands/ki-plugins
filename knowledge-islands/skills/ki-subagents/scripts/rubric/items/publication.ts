import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { AgentsRubricContext } from '../contexts/agents.ts'

export const RUBRIC = createRubricPublicationFamily<AgentsRubricContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
