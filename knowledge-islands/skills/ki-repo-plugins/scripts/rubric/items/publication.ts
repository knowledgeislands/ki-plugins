import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { PluginsContext } from '../contexts/plugins.ts'

export const RUBRIC = createRubricPublicationFamily<PluginsContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
